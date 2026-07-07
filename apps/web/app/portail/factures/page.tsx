"use client";

import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { PortalShell } from "@/components/portal-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function PortailFacturesPage() {
  return (
    <RequireAuth roles={[Role.SOUS_TRAITANT]}>
      <PortalShell>
        <PortailFacturesContent />
      </PortalShell>
    </RequireAuth>
  );
}

function PortailFacturesContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-invoices-all"],
    queryFn: () => apiClient.get<Invoice[]>("/factures"),
  });

  const columns: Column<Invoice>[] = [
    { key: "mission", label: "Mission", render: (i) => <span className="font-medium">{i.mission?.titre ?? "—"}</span> },
    { key: "montant", label: "Montant", render: (i) => formatMoney(i.montant) },
    { key: "statut", label: "Statut", render: (i) => <StatusBadge status={i.statut} /> },
    { key: "dateReception", label: "Envoyée le", render: (i) => formatDate(i.dateReception) },
    { key: "datePaiementPrevue", label: "Paiement prévu", render: (i) => formatDate(i.datePaiementPrevue) },
    { key: "datePaiementReel", label: "Payée le", render: (i) => formatDate(i.datePaiementReel) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes factures</h1>
        <p className="text-sm text-muted-foreground">Suivez le statut de paiement de vos factures.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <DataTable columns={columns} data={data ?? []} emptyMessage="Aucune facture déposée pour l'instant." />
      )}
    </div>
  );
}
