import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "@gst/shared-types";
import { StatutSupportMessage } from "@gst/database";

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, message: string) {
    return this.prisma.supportMessage.create({
      data: { userId: user.id, userEmail: user.email, userNom: user.nom, message },
    });
  }

  async listAll() {
    return this.prisma.supportMessage.findMany({ orderBy: { dateCreation: "desc" } });
  }

  async markTraite(id: string) {
    return this.prisma.supportMessage.update({ where: { id }, data: { statut: StatutSupportMessage.TRAITE } });
  }
}
