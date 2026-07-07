import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { AuthenticatedUser } from "@gst/shared-types";

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

  async assertSameOrganizationOrThrow(currentUser: AuthenticatedUser, targetOrganizationId: string | null) {
    if (currentUser.organizationId !== targetOrganizationId) {
      throw new ForbiddenException("Accès refusé : ressource hors de votre agence.");
    }
  }
}
