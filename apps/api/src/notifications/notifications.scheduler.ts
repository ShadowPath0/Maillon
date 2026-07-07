import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";
import { StatutFacture, TypeNotification } from "@gst/shared-types";

const DOCUMENT_EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringDocuments() {
    const warningDate = new Date(Date.now() + DOCUMENT_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
    const documents = await this.prisma.adminDocument.findMany({
      where: { dateExpiration: { lte: warningDate, gte: new Date() } },
      include: {
        contractorProfile: {
          include: { user: true, organizations: { include: { organization: true } } },
        },
      },
    });

    for (const doc of documents) {
      const contractorUser = doc.contractorProfile.user;
      await this.notifications.notify(
        contractorUser.id,
        TypeNotification.DOCUMENT_EXPIRE_BIENTOT,
        `Votre document ${doc.type} expire le ${doc.dateExpiration?.toLocaleDateString("fr-FR")}.`,
      );
      for (const link of doc.contractorProfile.organizations) {
        const admins = await this.prisma.user.findMany({
          where: { organizationId: link.organizationId, role: "ADMIN", deletedAt: null },
        });
        for (const admin of admins) {
          await this.notifications.notify(
            admin.id,
            TypeNotification.DOCUMENT_EXPIRE_BIENTOT,
            `Le document ${doc.type} de ${contractorUser.nom} expire le ${doc.dateExpiration?.toLocaleDateString("fr-FR")}.`,
          );
        }
      }
    }
    this.logger.log(`Vérification des documents expirants : ${documents.length} document(s) concerné(s).`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkOverdueInvoices() {
    const overdue = await this.prisma.invoice.findMany({
      where: {
        statut: StatutFacture.A_PAYER,
        datePaiementPrevue: { lt: new Date() },
      },
      include: { mission: true },
    });

    for (const invoice of overdue) {
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { statut: StatutFacture.EN_RETARD } });
      const admins = await this.prisma.user.findMany({
        where: { organizationId: invoice.mission.organizationId, role: "ADMIN", deletedAt: null },
      });
      for (const admin of admins) {
        await this.notifications.notify(
          admin.id,
          TypeNotification.FACTURE_EN_RETARD,
          `La facture de la mission "${invoice.mission.titre}" est en retard de paiement.`,
        );
      }
    }
    this.logger.log(`Vérification des factures en retard : ${overdue.length} facture(s) passée(s) en retard.`);
  }
}
