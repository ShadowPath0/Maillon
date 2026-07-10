import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { PlanAbonnement } from "@gst/shared-types";
import type { AuthenticatedUser } from "@gst/shared-types";

type PaidPlan = typeof PlanAbonnement.STARTER | typeof PlanAbonnement.PRO;

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = apiKey ? new Stripe(apiKey) : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException("La facturation n'est pas encore configurée (STRIPE_SECRET_KEY manquant).");
    }
    return this.stripe;
  }

  async getStatus(currentUser: AuthenticatedUser) {
    const org = await this.prisma.organization.findUnique({ where: { id: currentUser.organizationId! } });
    if (!org) {
      throw new NotFoundException("Agence introuvable.");
    }
    return {
      planAbonnement: org.planAbonnement,
      stripeStatus: org.stripeStatus,
      hasStripeCustomer: Boolean(org.stripeCustomerId),
    };
  }

  private priceIdForPlan(plan: PaidPlan): string {
    const id = plan === PlanAbonnement.STARTER ? process.env.STRIPE_PRICE_ID_STARTER : process.env.STRIPE_PRICE_ID_PRO;
    if (!id) {
      throw new BadRequestException("Ce forfait n'est pas encore configuré côté paiement.");
    }
    return id;
  }

  async createCheckoutSession(currentUser: AuthenticatedUser, plan: PaidPlan) {
    const org = await this.prisma.organization.findUnique({ where: { id: currentUser.organizationId! } });
    if (!org) {
      throw new NotFoundException("Agence introuvable.");
    }

    const session = await this.requireStripe().checkout.sessions.create({
      mode: "subscription",
      customer: org.stripeCustomerId ?? undefined,
      customer_email: org.stripeCustomerId ? undefined : currentUser.email,
      line_items: [{ price: this.priceIdForPlan(plan), quantity: 1 }],
      success_url: `${process.env.WEB_URL}/parametres?checkout=success`,
      cancel_url: `${process.env.WEB_URL}/parametres?checkout=cancel`,
      client_reference_id: org.id,
      metadata: { organizationId: org.id, plan },
      subscription_data: { metadata: { organizationId: org.id, plan } },
    });

    if (!session.url) {
      throw new BadRequestException("Impossible de créer la session de paiement.");
    }
    return { url: session.url };
  }

  async createPortalSession(currentUser: AuthenticatedUser) {
    const org = await this.prisma.organization.findUnique({ where: { id: currentUser.organizationId! } });
    if (!org?.stripeCustomerId) {
      throw new BadRequestException("Aucun abonnement actif pour votre agence.");
    }
    const session = await this.requireStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.WEB_URL}/parametres`,
    });
    return { url: session.url };
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException("Webhook Stripe non configuré.");
    }
    return this.requireStripe().webhooks.constructEvent(payload, signature, secret);
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId ?? session.client_reference_id ?? undefined;
        const plan = session.metadata?.plan as PaidPlan | undefined;
        if (!organizationId || !session.customer) break;
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: session.subscription ? String(session.subscription) : undefined,
            stripeStatus: "active",
            planAbonnement: plan ?? undefined,
          },
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await this.prisma.organization.findFirst({ where: { stripeSubscriptionId: subscription.id } });
        if (!org) break;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const plan = (subscription.metadata?.plan as PaidPlan | undefined) ?? org.planAbonnement;
        await this.prisma.organization.update({
          where: { id: org.id },
          data: {
            stripeStatus: subscription.status,
            planAbonnement: isActive ? plan : PlanAbonnement.ESSAI,
          },
        });
        break;
      }
      default:
        this.logger.debug(`Événement Stripe ignoré : ${event.type}`);
    }
  }
}
