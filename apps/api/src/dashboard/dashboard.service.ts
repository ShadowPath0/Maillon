import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StatutFacture, StatutMission, StatutSousTraitant } from "@gst/shared-types";

const UPCOMING_DEADLINE_DAYS = 14;
const DOCUMENT_EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const [missionsParStatutRaw, sousTraitantsActifs, facturesEnAttente, facturesEnRetard, prochainesEcheances, documentsExpirantBientot] =
      await Promise.all([
        this.prisma.mission.groupBy({
          by: ["statut"],
          where: { organizationId },
          _count: { _all: true },
        }),
        this.prisma.organizationContractor.count({
          where: { organizationId, contractorProfile: { statut: StatutSousTraitant.ACTIF } },
        }),
        this.prisma.invoice.count({
          where: {
            mission: { organizationId },
            statut: { in: [StatutFacture.RECUE, StatutFacture.A_PAYER] },
          },
        }),
        this.prisma.invoice.count({
          where: { mission: { organizationId }, statut: StatutFacture.EN_RETARD },
        }),
        this.prisma.mission.findMany({
          where: {
            organizationId,
            statut: { notIn: [StatutMission.VALIDE, StatutMission.REJETE] },
            dateEcheance: {
              lte: new Date(Date.now() + UPCOMING_DEADLINE_DAYS * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
          },
          include: { sousTraitant: { select: { nom: true } } },
          orderBy: { dateEcheance: "asc" },
          take: 10,
        }),
        this.prisma.adminDocument.findMany({
          where: {
            dateExpiration: {
              lte: new Date(Date.now() + DOCUMENT_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
            contractorProfile: { organizations: { some: { organizationId } } },
          },
          include: { contractorProfile: { include: { user: { select: { nom: true } } } } },
        }),
      ]);

    const missionsParStatut: Record<string, number> = {};
    for (const row of missionsParStatutRaw) {
      missionsParStatut[row.statut] = row._count._all;
    }

    return {
      missionsParStatut,
      sousTraitantsActifs,
      facturesEnAttente,
      facturesEnRetard,
      prochainesEcheances: prochainesEcheances.map((m) => ({
        id: m.id,
        titre: m.titre,
        dateEcheance: m.dateEcheance,
        sousTraitantNom: m.sousTraitant?.nom ?? null,
      })),
      documentsExpirantBientot: documentsExpirantBientot.map((d) => ({
        id: d.id,
        type: d.type,
        dateExpiration: d.dateExpiration,
        contractorNom: d.contractorProfile.user.nom,
      })),
    };
  }
}
