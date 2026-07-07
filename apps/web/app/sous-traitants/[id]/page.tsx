"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney, fileUrl } from "@/lib/format";
import type { ContractorProfileDetail } from "@/lib/types";
import { Role } from "@gst/shared-types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function ContractorDetailPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <ContractorDetailContent />
      </AppShell>
    </RequireAuth>
  );
}

function ContractorDetailContent() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["sous-traitant", params.id],
    queryFn: () => apiClient.get<ContractorProfileDetail>(`/sous-traitants/${params.id}`),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarFallback className="text-base">{initials(data.user.nom)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.user.nom}</h1>
          <p className="text-sm text-muted-foreground">{data.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tarif jour</p>
            <p className="text-lg font-semibold">{formatMoney(data.tarifJour)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tarif heure</p>
            <p className="text-lg font-semibold">{formatMoney(data.tarifHeure)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Note moyenne</p>
            <p className="text-lg font-semibold">{data.noteMoyenne ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Disponibilité</p>
            <div className="mt-1">
              <StatusBadge status={data.disponibilite} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compétences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{data.competences.join(", ") || "Aucune compétence renseignée."}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4" />
            Documents administratifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document.</p>
          ) : (
            <ul className="divide-y text-sm">
              {data.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <a href={fileUrl(doc.fichierUrl)} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    {doc.type}
                  </a>
                  <span className="text-muted-foreground">
                    {doc.dateExpiration ? `expire le ${formatDate(doc.dateExpiration)}` : "sans expiration"}
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
