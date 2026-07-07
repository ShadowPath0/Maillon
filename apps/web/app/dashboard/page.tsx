"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, Briefcase, FileClock, FileWarning, Users } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { Role } from "@gst/shared-types";

interface DashboardSummary {
  missionsParStatut: Record<string, number>;
  sousTraitantsActifs: number;
  facturesEnAttente: number;
  facturesEnRetard: number;
  prochainesEcheances: { id: string; titre: string; dateEcheance: string | null; sousTraitantNom: string | null }[];
  documentsExpirantBientot: { id: string; type: string; dateExpiration: string | null; contractorNom: string }[];
}

const STATUT_LABELS: Record<string, string> = {
  BRIEF_ENVOYE: "Brief envoyé",
  EN_COURS: "En cours",
  LIVRE: "Livré",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
  REJETE: "Rejeté",
};

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

  const hasAlerts = data.facturesEnRetard > 0 || data.documentsExpirantBientot.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de l&apos;activité de votre agence.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(STATUT_LABELS).map(([key, label]) => (
          <Card key={key} className="py-4">
            <CardContent className="px-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{data.missionsParStatut[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
              <Users className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sous-traitants actifs</p>
              <p className="text-xl font-semibold">{data.sousTraitantsActifs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
              <FileClock className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Factures en attente</p>
              <p className="text-xl font-semibold">{data.facturesEnAttente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={data.facturesEnRetard > 0 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <FileWarning className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Factures en retard</p>
              <p className="text-xl font-semibold">{data.facturesEnRetard}</p>
            </div>
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
          <CardTitle className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4" />
            Prochaines échéances
          </CardTitle>
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
