import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@gst/database";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { UpdateContractorProfileDto } from "./dto/update-contractor-profile.dto";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { ListContractorsQueryDto } from "./dto/list-contractors-query.dto";

@Injectable()
export class ContractorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listForOrganization(organizationId: string, query: ListContractorsQueryDto) {
    const where: Prisma.OrganizationContractorWhereInput = {
      organizationId,
      contractorProfile: {
        ...(query.disponibilite ? { disponibilite: query.disponibilite } : {}),
        ...(query.competence ? { competences: { has: query.competence } } : {}),
        ...(query.tarifJourMax ? { tarifJour: { lte: Number(query.tarifJourMax) } } : {}),
      },
    };

    const links = await this.prisma.organizationContractor.findMany({
      where,
      include: { contractorProfile: { include: { user: true } } },
      orderBy: { dateAjout: "desc" },
    });

    return links.map((link) => this.toDirectoryEntry(link.contractorProfile));
  }

  private toDirectoryEntry(profile: {
    id: string;
    competences: string[];
    tarifJour: Prisma.Decimal | null;
    tarifHeure: Prisma.Decimal | null;
    disponibilite: string;
    statut: string;
    noteMoyenne: Prisma.Decimal | null;
    user: { id: string; nom: string; email: string };
  }) {
    return {
      id: profile.id,
      userId: profile.user.id,
      nom: profile.user.nom,
      email: profile.user.email,
      competences: profile.competences,
      tarifJour: profile.tarifJour,
      tarifHeure: profile.tarifHeure,
      disponibilite: profile.disponibilite,
      statut: profile.statut,
      noteMoyenne: profile.noteMoyenne,
    };
  }

  private async assertOrgLinked(organizationId: string, contractorProfileId: string) {
    const link = await this.prisma.organizationContractor.findUnique({
      where: { organizationId_contractorProfileId: { organizationId, contractorProfileId } },
    });
    if (!link) {
      throw new ForbiddenException("Ce sous-traitant n'est pas rattaché à votre agence.");
    }
  }

  async getDetailForOrganization(organizationId: string, contractorProfileId: string) {
    await this.assertOrgLinked(organizationId, contractorProfileId);
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { id: contractorProfileId },
      include: { user: true, documents: true },
    });
    if (!profile) {
      throw new NotFoundException("Sous-traitant introuvable.");
    }
    return profile;
  }

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { userId },
      include: { user: true, documents: true },
    });
    if (!profile) {
      throw new NotFoundException("Profil sous-traitant introuvable.");
    }
    return profile;
  }

  async updateOwnProfile(userId: string, dto: UpdateContractorProfileDto) {
    const profile = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profil sous-traitant introuvable.");
    }
    return this.prisma.contractorProfile.update({
      where: { userId },
      data: {
        competences: dto.competences,
        tarifJour: dto.tarifJour,
        tarifHeure: dto.tarifHeure,
        disponibilite: dto.disponibilite,
      },
    });
  }

  async uploadOwnDocument(userId: string, file: Express.Multer.File, dto: UploadDocumentDto) {
    const profile = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profil sous-traitant introuvable.");
    }
    const url = await this.storage.save(file.buffer, file.originalname, `contractors/${profile.id}`);
    return this.prisma.adminDocument.create({
      data: {
        contractorProfileId: profile.id,
        type: dto.type,
        fichierUrl: url,
        dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : null,
      },
    });
  }

  async deleteOwnDocument(userId: string, documentId: string) {
    const profile = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profil sous-traitant introuvable.");
    }
    const doc = await this.prisma.adminDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.contractorProfileId !== profile.id) {
      throw new NotFoundException("Document introuvable.");
    }
    await this.prisma.adminDocument.delete({ where: { id: documentId } });
    return { message: "Document supprimé." };
  }
}
