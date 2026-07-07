"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { PortalShell } from "@/components/portal-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney } from "@/lib/format";
import type { MissionListItem } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function PortailMissionsPage() {
  return (
    <RequireAuth roles={[Role.SOUS_TRAITANT]}>
      <PortalShell>
        <PortailMissionsContent />
      </PortalShell>
    </RequireAuth>
  );
}

function PortailMissionsContent() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["portal-missions"],
    queryFn: () => apiClient.get<MissionListItem[]>("/missions"),
  });

  const columns: Column<MissionListItem>[] = [
    { key: "titre", label: "Mission", render: (m) => <span className="font-medium">{m.titre}</span> },
    { key: "agence", label: "Agence", render: (m) => m.organization?.nom ?? "—" },
    { key: "statut", label: "Statut", render: (m) => <StatusBadge status={m.statut} /> },
    { key: "echeance", label: "Échéance", render: (m) => formatDate(m.dateEcheance) },
    { key: "tarif", label: "Tarif convenu", render: (m) => formatMoney(m.tarifConvenu) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes missions</h1>
        <p className="text-sm text-muted-foreground">Toutes les missions qui vous ont été confiées.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          onRowClick={(m) => router.push(`/portail/missions/${m.id}`)}
          emptyMessage="Aucune mission assignée pour l'instant."
        />
      )}
    </div>
  );
}
