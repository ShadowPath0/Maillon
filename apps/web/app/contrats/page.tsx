"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Contract } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function ContractsPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <ContractsContent />
      </AppShell>
    </RequireAuth>
  );
}

function ContractsContent() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => apiClient.get<Contract[]>("/contrats"),
  });

  const columns: Column<Contract>[] = [
    { key: "mission", label: "Mission", render: (c) => <span className="font-medium">{c.mission?.titre ?? "—"}</span> },
    { key: "statut", label: "Statut", render: (c) => <StatusBadge status={c.statut} /> },
    { key: "dateEnvoi", label: "Envoyé le", render: (c) => formatDate(c.dateEnvoi) },
    { key: "dateSignature", label: "Signé le", render: (c) => formatDate(c.dateSignature) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contrats</h1>
        <p className="text-sm text-muted-foreground">Suivi des bons de commande générés pour vos missions.</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          onRowClick={(c) => router.push(`/missions/${c.missionId}`)}
          emptyMessage="Aucun contrat pour l'instant. Générez-en un depuis une mission."
        />
      )}
    </div>
  );
}
