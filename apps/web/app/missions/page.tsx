"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, List, Plus } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { KanbanBoard } from "@/components/kanban-board";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney } from "@/lib/format";
import type { MissionListItem } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function MissionsPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <MissionsContent />
      </AppShell>
    </RequireAuth>
  );
}

function MissionsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [statutFilter, setStatutFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["missions", statutFilter],
    queryFn: () =>
      apiClient.get<MissionListItem[]>(`/missions${statutFilter !== "all" ? `?statut=${statutFilter}` : ""}`),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: string }) => apiClient.patch(`/missions/${id}`, { statut }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["missions"] }),
  });

  const columns: Column<MissionListItem>[] = [
    { key: "titre", label: "Titre", render: (m) => <span className="font-medium">{m.titre}</span> },
    { key: "sousTraitant", label: "Sous-traitant", render: (m) => m.sousTraitant?.nom ?? "Non assigné" },
    { key: "statut", label: "Statut", render: (m) => <StatusBadge status={m.statut} /> },
    { key: "echeance", label: "Échéance", render: (m) => formatDate(m.dateEcheance) },
    { key: "budget", label: "Budget prévu", render: (m) => formatMoney(m.budgetPrevu) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Missions</h1>
          <p className="text-sm text-muted-foreground">Pilotez le cycle de vie de vos missions freelances.</p>
        </div>
        <Button asChild>
          <Link href="/missions/nouvelle">
            <Plus className="size-4" />
            Nouvelle mission
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "kanban" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
            Kanban
          </button>
          <button
            onClick={() => setView("liste")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "liste" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <List className="size-4" />
            Liste
          </button>
        </div>
        {view === "liste" && (
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="BRIEF_ENVOYE">Brief envoyé</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="LIVRE">Livré</SelectItem>
              <SelectItem value="EN_VALIDATION">En validation</SelectItem>
              <SelectItem value="VALIDE">Validé</SelectItem>
              <SelectItem value="REJETE">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : view === "kanban" ? (
        <KanbanBoard missions={data ?? []} onStatusChange={(id, statut) => updateStatus.mutate({ id, statut })} />
      ) : (
        <DataTable columns={columns} data={data ?? []} onRowClick={(m) => router.push(`/missions/${m.id}`)} />
      )}
    </div>
  );
}
