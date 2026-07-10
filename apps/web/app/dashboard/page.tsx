"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, Briefcase, FileClock, FileWarning, TrendingUp, Users } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionStatusBar } from "@/components/charts/mission-status-bar";
import { RevenueBarChart } from "@/components/charts/revenue-bar-chart";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { Role } from "@gst/shared-types";

interface DashboardSummary {
  missionsParStatut: Record<string, number>;
  facturesParMois: { key: string; label: string; total: number }[];
  sousTraitantsActifs: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  prochainesEcheances: { id: string; titre: string; dateEcheance: string | null; sousTraitantNom: string | null }[];
  documentsExpirantBientot: { id: string; type: string; dateExpiration: string | null; contractorNom: string }[];
}

export default function DashboardPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </RequireAuth>
  );
}

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-resume"],
    queryFn: () => apiClient.get<DashboardSummary>("/dashboard/resume"),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  const totalMissionsActives = Object.entries(data.missionsParStatut)
    .filter(([key]) => key !== "VALIDE" && key !== "REJETE")
    .reduce((sum, [, count]) => sum + count, 0);
  const hasAlerts = data.facturesEnRetard > 0 || data.documentsExpirantBientot.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de l&apos;activité de votre agence.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile icon={Briefcase} label="Missions actives" value={totalMissionsActives} />
        <StatTile icon={Users} label="Sous-traitants actifs" value={data.sousTraitantsActifs} />
        <StatTile icon={FileClock} label="Factures en attente" value={data.facturesEnAttente} />
        <StatTile
          icon={FileWarning}
          label="Factures en retard"
          value={data.facturesEnRetard}
          tone={data.facturesEnRetard > 0 ? "danger" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Répartition des missions</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionStatusBar counts={data.missionsParStatut} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" />
              Encaissé sur 6 mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={data.facturesParMois} />
          </CardContent>
        </Card>
      </div>

      {hasAlerts && (
        <Card className="border-warning/40 bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {data.facturesEnRetard > 0 && <li>{data.facturesEnRetard} facture(s) en retard de paiement.</li>}
              {data.documentsExpirantBientot.map((doc) => (
                <li key={doc.id}>
                  Le document {doc.type} de {doc.contractorNom} expire le {formatDate(doc.dateExpiration)}.
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prochaines échéances</CardTitle>
        </CardHeader>
        <CardContent>
          {data.prochainesEcheances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune échéance dans les 14 prochains jours.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.prochainesEcheances.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <Link href={`/missions/${m.id}`} className="font-medium hover:underline">
                    {m.titre}
                  </Link>
                  <span className="text-muted-foreground">
                    {m.sousTraitantNom ?? "Non assignée"} · échéance {formatDate(m.dateEcheance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "danger";
}) {
  return (
    <Card className={tone === "danger" ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardContent className="flex items-center gap-3">
        <div
          className={`flex size-9 items-center justify-center rounded-md ${
            tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-secondary"
          }`}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
