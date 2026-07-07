import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ContractsPdfService } from "./contracts-pdf.service";
import { ListContractsQueryDto } from "./dto/list-contracts-query.dto";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role, StatutContrat, TypeNotification } from "@gst/shared-types";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly pdf: ContractsPdfService,
  ) {}

  private async findAccessibleContract(currentUser: AuthenticatedUser, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { mission: true },
    });
    if (!contract) {
      throw new NotFoundException("Contrat introuvable.");
    }
    if (currentUser.role === Role.SOUS_TRAITANT) {
      if (contract.mission.sousTraitantId !== currentUser.id) {
        throw new ForbiddenException("Ce contrat ne vous concerne pas.");
      }
    } else if (contract.mission.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException("Ce contrat n'appartient pas à votre agence.");
    }
    return contract;
  }

  async createForMission(currentUser: AuthenticatedUser, missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { organization: true, sousTraitant: true, brief: true },
    });
    if (!mission || mission.organizationId !== currentUser.organizationId) {
      throw new NotFoundException("Mission introuvable.");
    }
    if (!mission.sousTraitant) {
      throw new BadRequestException("Impossible de générer un contrat : aucun sous-traitant assigné.");
    }

    const pdfBuffer = await this.pdf.generate({
      organizationName: mission.organization.nom,
      contractorName: mission.sousTraitant.nom,
      missionTitre: mission.titre,
      briefTexte: mission.brief?.contenuTexte,
      montant: mission.tarifConvenu?.toString(),
      dateEcheance: mission.dateEcheance,
      clientFinal: mission.clientFinal,
    });
    const url = await this.storage.save(pdfBuffer, `contrat-${mission.id}.pdf`, `contracts/${mission.id}`);

    return this.prisma.contract.create({
      data: {
        missionId: mission.id,
        templateUtilise: "standard-v1",
        fichierPdfGenere: url,
        statut: StatutContrat.BROUILLON,
      },
    });
  }

  async list(currentUser: AuthenticatedUser, query: ListContractsQueryDto) {
    if (currentUser.role === Role.SOUS_TRAITANT) {
      return this.prisma.contract.findMany({
        where: { missionId: query.missionId, mission: { sousTraitantId: currentUser.id } },
        include: { mission: { select: { titre: true, organizationId: true } } },
        orderBy: { dateCreation: "desc" },
      });
    }
    return this.prisma.contract.findMany({
      where: {
        missionId: query.missionId,
        mission: { organizationId: currentUser.organizationId!, sousTraitantId: query.sousTraitantId },
      },
      include: { mission: { select: { titre: true, sousTraitantId: true } } },
      orderBy: { dateCreation: "desc" },
    });
  }

  async getDetail(currentUser: AuthenticatedUser, id: string) {
    return this.findAccessibleContract(currentUser, id);
  }

  async markSent(currentUser: AuthenticatedUser, id: string) {
    const contract = await this.findAccessibleContract(currentUser, id);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut envoyer un contrat.");
    }
    const updated = await this.prisma.contract.update({
      where: { id: contract.id },
      data: { statut: StatutContrat.ENVOYE, dateEnvoi: new Date() },
    });
    if (contract.mission.sousTraitantId) {
      await this.notifications.notify(
        contract.mission.sousTraitantId,
        TypeNotification.CONTRAT_ENVOYE,
        `Un contrat pour la mission "${contract.mission.titre}" vous a été envoyé.`,
      );
    }
    return updated;
  }

  async uploadSigned(currentUser: AuthenticatedUser, id: string, file: Express.Multer.File) {
    const contract = await this.findAccessibleContract(currentUser, id);
    const url = await this.storage.save(file.buffer, file.originalname, `contracts/${contract.missionId}/signed`);
    const updated = await this.prisma.contract.update({
      where: { id: contract.id },
      data: { statut: StatutContrat.SIGNE, dateSignature: new Date(), fichierSigneUrl: url },
    });

    const mission = await this.prisma.mission.findUnique({ where: { id: contract.missionId } });
    if (mission) {
      const admins = await this.prisma.user.findMany({
        where: { organizationId: mission.organizationId, role: Role.ADMIN, deletedAt: null },
      });
      for (const admin of admins) {
        await this.notifications.notify(
          admin.id,
          TypeNotification.CONTRAT_SIGNE,
          `Le contrat de la mission "${mission.titre}" a été signé.`,
        );
      }
    }
    return updated;
  }
}
