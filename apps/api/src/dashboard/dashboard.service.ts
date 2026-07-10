import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StatutFacture, StatutMission, StatutSousTraitant } from "@gst/shared-types";

const UPCOMING_DEADLINE_DAYS = 14;
const DOCUMENT_EXPIRY_WARNING_DAYS = 30;
const REVENUE_MONTHS = 6;

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildLastMonths(count: number): { key: string; label: string; total: number }[] {
  const months: { key: string; label: string; total: number }[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: MOIS_COURTS[d.getMonth()], total: 0 });
  }
  return months;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const revenueStart = new Date();
    revenueStart.setMonth(revenueStart.getMonth() - (REVENUE_MONTHS - 1));
    revenueStart.setDate(1);
    revenueStart.setHours(0, 0, 0, 0);

    const [
      missionsParStatutRaw,
      sousTraitantsActifs,
      facturesEnAttente,
      facturesEnRetard,
      prochainesEcheances,
      documentsExpirantBientot,
      facturesPayeesRecentes,
    ] = await Promise.all([
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
        this.prisma.invoice.findMany({
          where: {
            mission: { organizationId },
            statut: StatutFacture.PAYEE,
            datePaiementReel: { gte: revenueStart },
          },
          select: { montant: true, datePaiementReel: true },
        }),
      ]);

    const missionsParStatut: Record<string, number> = {};
    for (const row of missionsParStatutRaw) {
      missionsParStatut[row.statut] = row._count._all;
    }

    const facturesParMois = buildLastMonths(REVENUE_MONTHS);
    for (const inv of facturesPayeesRecentes) {
      if (!inv.datePaiementReel) continue;
      const key = monthKey(inv.datePaiementReel);
      const bucket = facturesParMois.find((m) => m.key === key);
      if (bucket) bucket.total += Number(inv.montant);
    }

    return {
      missionsParStatut,
      facturesParMois,
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
