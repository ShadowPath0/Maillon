import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { TypeNotification } from "@gst/shared-types";

const EMAIL_SUBJECTS: Record<TypeNotification, string> = {
  MISSION_ASSIGNEE: "Une nouvelle mission vous a été assignée",
  LIVRABLE_SOUMIS: "Un livrable a été soumis",
  LIVRABLE_VALIDE: "Votre livrable a été validé",
  LIVRABLE_REJETE: "Votre livrable a été rejeté",
  FACTURE_EN_RETARD: "Une facture est en retard de paiement",
  DOCUMENT_EXPIRE_BIENTOT: "Un document administratif expire bientôt",
  CONTRAT_ENVOYE: "Un contrat vous a été envoyé",
  CONTRAT_SIGNE: "Un contrat a été signé",
  INVITATION_MEMBRE: "Invitation à rejoindre une agence",
  INVITATION_SOUS_TRAITANT: "Invitation à collaborer",
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async notify(utilisateurId: string, type: TypeNotification, contenu: string, sendEmail = true) {
    const notification = await this.prisma.notification.create({
      data: { utilisateurId, type, contenu },
    });

    if (sendEmail) {
      const user = await this.prisma.user.findUnique({ where: { id: utilisateurId } });
      if (user) {
        await this.email.send(user.email, EMAIL_SUBJECTS[type], `<p>${contenu}</p>`);
      }
    }

    return notification;
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { utilisateurId: userId },
      orderBy: { dateCreation: "desc" },
      take: 100,
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.utilisateurId !== userId) {
      throw new NotFoundException("Notification introuvable.");
    }
    return this.prisma.notification.update({ where: { id: notificationId }, data: { lu: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { utilisateurId: userId, lu: false }, data: { lu: true } });
    return { message: "Toutes les notifications ont été marquées comme lues." };
  }
}
