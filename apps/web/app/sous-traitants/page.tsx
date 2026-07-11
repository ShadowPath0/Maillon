"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import type { ContractorDirectoryEntry, PaginatedResult } from "@/lib/types";
import { Role, Disponibilite } from "@gst/shared-types";

export default function SousTraitantsPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <SousTraitantsContent />
      </AppShell>
    </RequireAuth>
  );
}

function SousTraitantsContent() {
  const router = useRouter();
  const [competence, setCompetence] = useState("");
  const [disponibilite, setDisponibilite] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["sous-traitants", competence, disponibilite, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (competence) params.set("competence", competence);
      if (disponibilite !== "all") params.set("disponibilite", disponibilite);
      return apiClient.get<PaginatedResult<ContractorDirectoryEntry>>(`/sous-traitants?${params.toString()}`);
    },
  });

  const columns: Column<ContractorDirectoryEntry>[] = [
    { key: "nom", label: "Nom", render: (c) => <span className="font-medium">{c.nom}</span> },
    { key: "email", label: "Email", render: (c) => <span className="text-muted-foreground">{c.email}</span> },
    { key: "competences", label: "Compétences", render: (c) => c.competences.join(", ") || "—" },
    { key: "tarifJour", label: "Tarif jour", render: (c) => formatMoney(c.tarifJour) },
    { key: "disponibilite", label: "Disponibilité", render: (c) => <StatusBadge status={c.disponibilite} /> },
    { key: "statut", label: "Statut", render: (c) => <StatusBadge status={c.statut} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sous-traitants</h1>
        <p className="text-sm text-muted-foreground">L&apos;annuaire des freelances de votre agence.</p>
      </div>
      <div className="flex gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Filtrer par compétence"
            value={competence}
            onChange={(e) => {
              setCompetence(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={disponibilite}
          onValueChange={(value) => {
            setDisponibilite(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Disponibilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toute disponibilité</SelectItem>
            <SelectItem value={Disponibilite.DISPONIBLE}>Disponible</SelectItem>
            <SelectItem value={Disponibilite.OCCUPE}>Occupé</SelectItem>
            <SelectItem value={Disponibilite.INDISPONIBLE}>Indisponible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            onRowClick={(c) => router.push(`/sous-traitants/${c.id}`)}
            emptyMessage="Aucun sous-traitant dans votre annuaire pour l'instant."
          />
          {data && (
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
