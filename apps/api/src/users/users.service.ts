import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role, Disponibilite } from "@gst/shared-types";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, email: true, nom: true, role: true, dateCreation: true },
      orderBy: { dateCreation: "asc" },
    });
  }

  async deactivateMember(currentUser: AuthenticatedUser, memberId: string) {
    if (memberId === currentUser.id) {
      throw new BadRequestException("Vous ne pouvez pas désactiver votre propre compte.");
    }
    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.organizationId !== currentUser.organizationId) {
      throw new NotFoundException("Membre introuvable dans votre agence.");
    }
    return this.prisma.user.update({
      where: { id: memberId },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, nom: true, role: true },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nom: dto.nom },
      select: { id: true, email: true, nom: true, role: true, organizationId: true },
    });
  }

  async deleteOwnAccount(currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.ADMIN) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          organizationId: currentUser.organizationId,
          role: Role.ADMIN,
          deletedAt: null,
          id: { not: currentUser.id },
        },
      });
      if (otherAdmins === 0) {
        throw new BadRequestException(
          "Vous êtes le seul administrateur de votre agence. Nommez un autre administrateur ou supprimez l'agence avant de supprimer votre compte.",
        );
      }
    }

    const anonymizedEmail = `compte-supprime-${randomUUID()}@maillon.invalid`;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          email: anonymizedEmail,
          nom: "Utilisateur supprimé",
          motDePasseHash: randomUUID(),
          deletedAt: new Date(),
        },
      });

      if (currentUser.role === Role.SOUS_TRAITANT) {
        const profile = await tx.contractorProfile.findUnique({ where: { userId: currentUser.id } });
        if (profile) {
          await tx.adminDocument.deleteMany({ where: { contractorProfileId: profile.id } });
          await tx.contractorProfile.update({
            where: { userId: currentUser.id },
            data: {
              competences: [],
              tarifJour: null,
              tarifHeure: null,
              disponibilite: Disponibilite.INDISPONIBLE,
              noteMoyenne: null,
            },
          });
        }
      }

      await tx.passwordResetToken.deleteMany({ where: { userId: currentUser.id } });
      await tx.notification.deleteMany({ where: { utilisateurId: currentUser.id } });
    });

    return { message: "Votre compte a été supprimé." };
  }

  async assertSameOrganizationOrThrow(currentUser: AuthenticatedUser, targetOrganizationId: string | null) {
    if (currentUser.organizationId !== targetOrganizationId) {
      throw new ForbiddenException("Accès refusé : ressource hors de votre agence.");
    }
  }
}
