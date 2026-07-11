import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { UpdateMissionDto } from "./dto/update-mission.dto";
import { ListMissionsQueryDto } from "./dto/list-missions-query.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { resolvePagination, toPaginatedResult } from "../common/pagination";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role, TypeNotification } from "@gst/shared-types";

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertContractorLinkedToOrg(organizationId: string, sousTraitantId: string) {
    const contractorProfile = await this.prisma.contractorProfile.findUnique({ where: { userId: sousTraitantId } });
    if (!contractorProfile) {
      throw new BadRequestException("Cet utilisateur n'est pas un sous-traitant.");
    }
    const link = await this.prisma.organizationContractor.findUnique({
      where: { organizationId_contractorProfileId: { organizationId, contractorProfileId: contractorProfile.id } },
    });
    if (!link) {
      throw new BadRequestException("Ce sous-traitant n'est pas rattaché à votre agence.");
    }
  }

  async create(currentUser: AuthenticatedUser, dto: CreateMissionDto) {
    if (dto.sousTraitantId) {
      await this.assertContractorLinkedToOrg(currentUser.organizationId!, dto.sousTraitantId);
    }

    const mission = await this.prisma.mission.create({
      data: {
        organizationId: currentUser.organizationId!,
        titre: dto.titre,
        sousTraitantId: dto.sousTraitantId,
        clientFinal: dto.clientFinal,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : undefined,
        budgetPrevu: dto.budgetPrevu,
        tarifConvenu: dto.tarifConvenu,
        brief: dto.briefTexte ? { create: { contenuTexte: dto.briefTexte } } : undefined,
      },
      include: { brief: { include: { fichiers: true } } },
    });

    if (dto.sousTraitantId) {
      await this.notifications.notify(
        dto.sousTraitantId,
        TypeNotification.MISSION_ASSIGNEE,
        `Une nouvelle mission "${mission.titre}" vous a été assignée.`,
      );
    }

    return mission;
  }

  async list(currentUser: AuthenticatedUser, query: ListMissionsQueryDto) {
    const { skip, take, page, pageSize } = resolvePagination(query);

    if (currentUser.role === Role.SOUS_TRAITANT) {
      const where = { sousTraitantId: currentUser.id, statut: query.statut };
      const [data, total] = await this.prisma.$transaction([
        this.prisma.mission.findMany({
          where,
          include: { organization: { select: { nom: true } } },
          orderBy: { dateCreation: "desc" },
          skip,
          take,
        }),
        this.prisma.mission.count({ where }),
      ]);
      return toPaginatedResult(data, total, page, pageSize);
    }

    const where = {
      organizationId: currentUser.organizationId!,
      statut: query.statut,
      sousTraitantId: query.sousTraitantId,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.mission.findMany({
        where,
        include: { sousTraitant: { select: { id: true, nom: true, email: true } } },
        orderBy: { dateCreation: "desc" },
        skip,
        take,
      }),
      this.prisma.mission.count({ where }),
    ]);
    return toPaginatedResult(data, total, page, pageSize);
  }

  private async findAccessible(currentUser: AuthenticatedUser, missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        brief: { include: { fichiers: true } },
        sousTraitant: { select: { id: true, nom: true, email: true } },
        commentaires: { include: { auteur: { select: { id: true, nom: true, role: true } } }, orderBy: { dateCreation: "asc" } },
      },
    });
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

  async getDetail(currentUser: AuthenticatedUser, missionId: string) {
    return this.findAccessible(currentUser, missionId);
  }

  async update(currentUser: AuthenticatedUser, missionId: string, dto: UpdateMissionDto) {
    const mission = await this.findAccessible(currentUser, missionId);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut modifier une mission.");
    }
    if (dto.sousTraitantId) {
      await this.assertContractorLinkedToOrg(currentUser.organizationId!, dto.sousTraitantId);
    }

    const updated = await this.prisma.mission.update({
      where: { id: mission.id },
      data: {
        titre: dto.titre,
        sousTraitantId: dto.sousTraitantId,
        clientFinal: dto.clientFinal,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
        dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : undefined,
        budgetPrevu: dto.budgetPrevu,
        tarifConvenu: dto.tarifConvenu,
        statut: dto.statut,
      },
    });

    if (dto.sousTraitantId && dto.sousTraitantId !== mission.sousTraitantId) {
      await this.notifications.notify(
        dto.sousTraitantId,
        TypeNotification.MISSION_ASSIGNEE,
        `Une mission "${updated.titre}" vous a été assignée.`,
      );
    }

    return updated;
  }

  async delete(currentUser: AuthenticatedUser, missionId: string) {
    const mission = await this.findAccessible(currentUser, missionId);
    await this.prisma.mission.delete({ where: { id: mission.id } });
    return { message: "Mission supprimée." };
  }

  async addBriefFiles(currentUser: AuthenticatedUser, missionId: string, files: Express.Multer.File[]) {
    const mission = await this.findAccessible(currentUser, missionId);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut compléter le brief.");
    }
    const brief =
      mission.brief ?? (await this.prisma.brief.create({ data: { missionId: mission.id } }));

    const created = await Promise.all(
      files.map(async (file) => {
        const url = await this.storage.save(file.buffer, file.originalname, `missions/${mission.id}/brief`);
        return this.prisma.briefFile.create({
          data: { briefId: brief.id, fichierUrl: url, nomFichier: file.originalname },
        });
      }),
    );
    return created;
  }

  async addComment(currentUser: AuthenticatedUser, missionId: string, dto: CreateCommentDto) {
    const mission = await this.findAccessible(currentUser, missionId);
    return this.prisma.missionComment.create({
      data: { missionId: mission.id, auteurId: currentUser.id, contenu: dto.contenu },
      include: { auteur: { select: { id: true, nom: true, role: true } } },
    });
  }
}
