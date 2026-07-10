import { BadRequestException, Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { StripeService } from "./stripe.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller()
export class BillingController {
  constructor(private readonly stripeService: StripeService) {}

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Get("billing/status")
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.stripeService.getStatus(user);
  }

  @Roles(Role.ADMIN)
  @Post("billing/checkout")
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCheckoutDto) {
    return this.stripeService.createCheckoutSession(user, dto.plan);
  }

  @Roles(Role.ADMIN)
  @Get("billing/portal")
  portal(@CurrentUser() user: AuthenticatedUser) {
    return this.stripeService.createPortalSession(user);
  }

  @Public()
  @Post("stripe/webhook")
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") signature: string) {
    if (!req.rawBody || !signature) {
      throw new BadRequestException("Requête webhook invalide.");
    }
    const event = this.stripeService.constructEvent(req.rawBody, signature);
    await this.stripeService.handleEvent(event);
    return { received: true };
  }
}
