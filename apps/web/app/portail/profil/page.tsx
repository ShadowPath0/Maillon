"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { apiClient } from "@/lib/api-client";
import { formatDate, fileUrl } from "@/lib/format";
import type { ContractorProfileDetail } from "@/lib/types";
import { Disponibilite, Role, TypeDocumentAdministratif } from "@gst/shared-types";

export default function PortailProfilPage() {
  return (
    <RequireAuth roles={[Role.SOUS_TRAITANT]}>
      <PortalShell>
        <PortailProfilContent />
      </PortalShell>
    </RequireAuth>
  );
}

function PortailProfilContent() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["own-profile"],
    queryFn: () => apiClient.get<ContractorProfileDetail>("/sous-traitants/me"),
  });

  const [competences, setCompetences] = useState("");
  const [tarifJour, setTarifJour] = useState("");
  const [tarifHeure, setTarifHeure] = useState("");
  const [disponibilite, setDisponibilite] = useState<string>(Disponibilite.DISPONIBLE);
  const [docType, setDocType] = useState<string>(TypeDocumentAdministratif.KBIS);
  const [docExpiry, setDocExpiry] = useState("");

  useEffect(() => {
    if (data) {
      setCompetences(data.competences.join(", "));
      setTarifJour(data.tarifJour ?? "");
      setTarifHeure(data.tarifHeure ?? "");
      setDisponibilite(data.disponibilite);
    }
  }, [data]);

  const updateProfile = useMutation({
    mutationFn: () =>
      apiClient.patch("/sous-traitants/me", {
        competences: competences
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        tarifJour: tarifJour ? Number(tarifJour) : undefined,
        tarifHeure: tarifHeure ? Number(tarifHeure) : undefined,
        disponibilite,
      }),
    onSuccess: () => {
      toast.success("Profil mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
  });

  const uploadDocument = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);
      if (docExpiry) formData.append("dateExpiration", new Date(docExpiry).toISOString());
      return apiClient.upload("/sous-traitants/me/documents", formData);
    },
    onSuccess: () => {
      toast.success("Document ajouté.");
      setDocExpiry("");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sous-traitants/me/documents/${id}`),
    onSuccess: () => {
      toast.success("Document supprimé.");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Statut du compte : <StatusBadge status={data.statut} />
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="competences">Compétences (séparées par des virgules)</Label>
              <Input id="competences" value={competences} onChange={(e) => setCompetences(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarifJour">Tarif jour (€)</Label>
                <Input id="tarifJour" type="number" value={tarifJour} onChange={(e) => setTarifJour(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarifHeure">Tarif heure (€)</Label>
                <Input id="tarifHeure" type="number" value={tarifHeure} onChange={(e) => setTarifHeure(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Disponibilité</Label>
              <Select value={disponibilite} onValueChange={setDisponibilite}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Disponibilite.DISPONIBLE}>Disponible</SelectItem>
                  <SelectItem value={Disponibilite.OCCUPE}>Occupé</SelectItem>
                  <SelectItem value={Disponibilite.INDISPONIBLE}>Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-fit">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Documents administratifs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <a href={fileUrl(doc.fichierUrl)} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                    {doc.type}
                  </a>
                  <span className="text-muted-foreground">
                    {doc.dateExpiration ? `expire le ${formatDate(doc.dateExpiration)}` : "sans expiration"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteDocument.mutate(doc.id)}
                >
                  Supprimer
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TypeDocumentAdministratif.KBIS}>Kbis</SelectItem>
                  <SelectItem value={TypeDocumentAdministratif.ATTESTATION_URSSAF}>Attestation URSSAF</SelectItem>
                  <SelectItem value={TypeDocumentAdministratif.ATTESTATION_ASSURANCE}>Attestation assurance</SelectItem>
                  <SelectItem value={TypeDocumentAdministratif.RIB}>RIB</SelectItem>
                  <SelectItem value={TypeDocumentAdministratif.AUTRE}>Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="docExpiry">Date d&apos;expiration (optionnel)</Label>
              <Input id="docExpiry" type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="docFile">Fichier</Label>
              <Input
                id="docFile"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocument.mutate(file);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Zone de danger</CardTitle>
          <CardDescription>Supprimez définitivement votre compte et vos données personnelles.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
