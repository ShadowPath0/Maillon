import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SubmitDeliverableDto } from "./dto/submit-deliverable.dto";
import { ReviewDeliverableDto } from "./dto/review-deliverable.dto";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role, StatutLivrable, StatutMission, TypeNotification } from "@gst/shared-types";

@Injectable()
export class DeliverablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertMissionAccessible(currentUser: AuthenticatedUser, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) {
      throw new NotFoundException("Mission introuvable.");
    }
    if (currentUser.role === Role.SOUS_TRAITANT) {
      if (mission.sousTraitantId !== currentUser.id) {
        throw new ForbiddenException("Cette mission ne vous est pas assignée.");
      }
    } else if (mission.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException("Cette mission n'appartient pas à votre agence.");
    }
    return mission;
  }

  async listForMission(currentUser: AuthenticatedUser, missionId: string) {
    await this.assertMissionAccessible(currentUser, missionId);
    return this.prisma.deliverable.findMany({
      where: { missionId },
      orderBy: { version: "desc" },
    });
  }

  async submit(currentUser: AuthenticatedUser, missionId: string, dto: SubmitDeliverableDto, file?: Express.Multer.File) {
    if (currentUser.role !== Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seul le sous-traitant assigné peut déposer un livrable.");
    }
    const mission = await this.assertMissionAccessible(currentUser, missionId);

    if (!file && !dto.lien) {
      throw new BadRequestException("Veuillez fournir un fichier ou un lien.");
    }

    const fichierOuLien = file
      ? await this.storage.save(file.buffer, file.originalname, `deliverables/${missionId}`)
      : dto.lien!;

    const last = await this.prisma.deliverable.findFirst({
      where: { missionId },
      orderBy: { version: "desc" },
    });

    const deliverable = await this.prisma.deliverable.create({
      data: {
        missionId,
        version: (last?.version ?? 0) + 1,
        fichierOuLien,
        commentaireSousTraitant: dto.commentaireSousTraitant,
        statut: StatutLivrable.SOUMIS,
      },
    });

    await this.prisma.mission.update({ where: { id: missionId }, data: { statut: StatutMission.LIVRE } });

    const admins = await this.prisma.user.findMany({
      where: { organizationId: mission.organizationId, role: { in: [Role.ADMIN, Role.MEMBRE] }, deletedAt: null },
    });
    for (const admin of admins) {
      await this.notifications.notify(
        admin.id,
        TypeNotification.LIVRABLE_SOUMIS,
        `Un livrable (v${deliverable.version}) a été soumis pour la mission "${mission.titre}".`,
      );
    }

    return deliverable;
  }

  private async findAccessibleDeliverable(currentUser: AuthenticatedUser, deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { mission: true },
    });
    if (!deliverable) {
      throw new NotFoundException("Livrable introuvable.");
    }
    if (currentUser.role === Role.SOUS_TRAITANT) {
      if (deliverable.mission.sousTraitantId !== currentUser.id) {
        throw new ForbiddenException("Ce livrable ne vous concerne pas.");
      }
    } else if (deliverable.mission.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException("Ce livrable n'appartient pas à votre agence.");
    }
    return deliverable;
  }

  async validate(currentUser: AuthenticatedUser, deliverableId: string, dto: ReviewDeliverableDto) {
    const deliverable = await this.findAccessibleDeliverable(currentUser, deliverableId);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut valider un livrable.");
    }
    const updated = await this.prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { statut: StatutLivrable.VALIDE, commentaireValidation: dto.commentaireValidation },
    });
    await this.prisma.mission.update({ where: { id: deliverable.missionId }, data: { statut: StatutMission.VALIDE } });
    if (deliverable.mission.sousTraitantId) {
      await this.notifications.notify(
        deliverable.mission.sousTraitantId,
        TypeNotification.LIVRABLE_VALIDE,
        `Votre livrable (v${deliverable.version}) pour "${deliverable.mission.titre}" a été validé.`,
      );
    }
    return updated;
  }

  async reject(currentUser: AuthenticatedUser, deliverableId: string, dto: ReviewDeliverableDto) {
    const deliverable = await this.findAccessibleDeliverable(currentUser, deliverableId);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut rejeter un livrable.");
    }
    const updated = await this.prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { statut: StatutLivrable.REJETE, commentaireValidation: dto.commentaireValidation },
    });
    await this.prisma.mission.update({ where: { id: deliverable.missionId }, data: { statut: StatutMission.REJETE } });
    if (deliverable.mission.sousTraitantId) {
      await this.notifications.notify(
        deliverable.mission.sousTraitantId,
        TypeNotification.LIVRABLE_REJETE,
        `Votre livrable (v${deliverable.version}) pour "${deliverable.mission.titre}" a été rejeté : ${
          dto.commentaireValidation ?? "aucun commentaire"
        }`,
      );
    }
    return updated;
  }
}
