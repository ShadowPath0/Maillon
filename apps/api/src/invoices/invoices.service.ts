import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { MarkToPayDto } from "./dto/mark-to-pay.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role, StatutFacture } from "@gst/shared-types";

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
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

  async create(currentUser: AuthenticatedUser, missionId: string, dto: CreateInvoiceDto, file: Express.Multer.File) {
    if (currentUser.role !== Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seul le sous-traitant assigné peut déposer une facture.");
    }
    if (!file) {
      throw new BadRequestException("Le fichier de facture est obligatoire.");
    }
    await this.assertMissionAccessible(currentUser, missionId);
    const url = await this.storage.save(file.buffer, file.originalname, `invoices/${missionId}`);

    return this.prisma.invoice.create({
      data: {
        missionId,
        sousTraitantId: currentUser.id,
        montant: dto.montant,
        fichierFacture: url,
        statut: StatutFacture.RECUE,
      },
    });
  }

  async list(currentUser: AuthenticatedUser, query: ListInvoicesQueryDto) {
    if (currentUser.role === Role.SOUS_TRAITANT) {
      return this.prisma.invoice.findMany({
        where: { missionId: query.missionId, sousTraitantId: currentUser.id, statut: query.statut },
        include: { mission: { select: { titre: true } } },
        orderBy: { dateReception: "desc" },
      });
    }
    return this.prisma.invoice.findMany({
      where: {
        missionId: query.missionId,
        mission: { organizationId: currentUser.organizationId! },
        statut: query.statut,
        sousTraitantId: query.sousTraitantId,
      },
      include: { mission: { select: { titre: true } }, sousTraitant: { select: { nom: true, email: true } } },
      orderBy: { dateReception: "desc" },
    });
  }

  private async findAccessibleInvoice(currentUser: AuthenticatedUser, id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { mission: true } });
    if (!invoice) {
      throw new NotFoundException("Facture introuvable.");
    }
    if (currentUser.role === Role.SOUS_TRAITANT) {
      if (invoice.sousTraitantId !== currentUser.id) {
        throw new ForbiddenException("Cette facture ne vous concerne pas.");
      }
    } else if (invoice.mission.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException("Cette facture n'appartient pas à votre agence.");
    }
    return invoice;
  }

  async getDetail(currentUser: AuthenticatedUser, id: string) {
    return this.findAccessibleInvoice(currentUser, id);
  }

  async markToPay(currentUser: AuthenticatedUser, id: string, dto: MarkToPayDto) {
    const invoice = await this.findAccessibleInvoice(currentUser, id);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut planifier un paiement.");
    }
    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { statut: StatutFacture.A_PAYER, datePaiementPrevue: new Date(dto.datePaiementPrevue) },
    });
  }

  async markPaid(currentUser: AuthenticatedUser, id: string) {
    const invoice = await this.findAccessibleInvoice(currentUser, id);
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Seule l'agence peut confirmer un paiement.");
    }
    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { statut: StatutFacture.PAYEE, datePaiementReel: new Date() },
    });
  }

  async exportCsv(currentUser: AuthenticatedUser): Promise<string> {
    if (currentUser.role === Role.SOUS_TRAITANT) {
      throw new ForbiddenException("Export réservé à l'agence.");
    }
    const invoices = await this.prisma.invoice.findMany({
      where: { mission: { organizationId: currentUser.organizationId! } },
      include: { mission: { select: { titre: true } }, sousTraitant: { select: { nom: true, email: true } } },
      orderBy: { dateReception: "desc" },
    });

    const header = "Mission,Sous-traitant,Email,Montant,Statut,Date reception,Date paiement prevue,Date paiement reel";
    const rows = invoices.map((inv) =>
      [
        csvEscape(inv.mission.titre),
        csvEscape(inv.sousTraitant.nom),
        csvEscape(inv.sousTraitant.email),
        inv.montant.toString(),
        inv.statut,
        inv.dateReception.toISOString().slice(0, 10),
        inv.datePaiementPrevue?.toISOString().slice(0, 10) ?? "",
        inv.datePaiementReel?.toISOString().slice(0, 10) ?? "",
      ].join(","),
    );
    return [header, ...rows].join("\n");
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
