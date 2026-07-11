"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, FileText, Paperclip, Send } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney, fileUrl } from "@/lib/format";
import type { Contract, Deliverable, Invoice, MissionDetail, PaginatedResult } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function MissionDetailPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <MissionDetailContent />
      </AppShell>
    </RequireAuth>
  );
}

function MissionDetailContent() {
  const params = useParams<{ id: string }>();
  const missionId = params.id;
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const missionQuery = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => apiClient.get<MissionDetail>(`/missions/${missionId}`),
  });
  const contractsQuery = useQuery({
    queryKey: ["contracts", missionId],
    queryFn: () => apiClient.get<Contract[]>(`/contrats?missionId=${missionId}`),
  });
  const deliverablesQuery = useQuery({
    queryKey: ["deliverables", missionId],
    queryFn: () => apiClient.get<Deliverable[]>(`/missions/${missionId}/livrables`),
  });
  const invoicesQuery = useQuery({
    queryKey: ["invoices", missionId],
    queryFn: () => apiClient.get<PaginatedResult<Invoice>>(`/factures?missionId=${missionId}&pageSize=100`),
    select: (res) => res.data,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    queryClient.invalidateQueries({ queryKey: ["contracts", missionId] });
    queryClient.invalidateQueries({ queryKey: ["deliverables", missionId] });
    queryClient.invalidateQueries({ queryKey: ["invoices", missionId] });
  };

  const addComment = useMutation({
    mutationFn: (contenu: string) => apiClient.post(`/missions/${missionId}/comments`, { contenu }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    },
  });

  const uploadBriefFiles = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      return apiClient.upload(`/missions/${missionId}/brief/files`, formData);
    },
    onSuccess: () => {
      toast.success("Fichiers ajoutés au brief.");
      queryClient.invalidateQueries({ queryKey: ["mission", missionId] });
    },
  });

  const generateContract = useMutation({
    mutationFn: () => apiClient.post(`/contrats/missions/${missionId}`),
    onSuccess: () => {
      toast.success("Contrat généré.");
      invalidateAll();
    },
  });

  const sendContract = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/contrats/${id}/send`),
    onSuccess: () => {
      toast.success("Contrat envoyé.");
      invalidateAll();
    },
  });

  const uploadSignedContract = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.upload(`/contrats/${id}/signed`, formData);
    },
    onSuccess: () => {
      toast.success("Contrat signé enregistré.");
      invalidateAll();
    },
  });

  const validateDeliverable = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/livrables/${id}/valider`, {}),
    onSuccess: () => {
      toast.success("Livrable validé.");
      invalidateAll();
    },
  });

  const rejectDeliverable = useMutation({
    mutationFn: ({ id, commentaireValidation }: { id: string; commentaireValidation: string }) =>
      apiClient.patch(`/livrables/${id}/rejeter`, { commentaireValidation }),
    onSuccess: () => {
      toast.success("Livrable rejeté.");
      invalidateAll();
    },
  });

  const markInvoiceToPay = useMutation({
    mutationFn: ({ id, datePaiementPrevue }: { id: string; datePaiementPrevue: string }) =>
      apiClient.patch(`/factures/${id}/a-payer`, { datePaiementPrevue }),
    onSuccess: () => {
      toast.success("Facture marquée à payer.");
      invalidateAll();
    },
  });

  const markInvoicePaid = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/factures/${id}/payee`),
    onSuccess: () => {
      toast.success("Facture marquée payée.");
      invalidateAll();
    },
  });

  if (missionQuery.isLoading || !missionQuery.data) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }
  const mission = missionQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{mission.titre}</h1>
          <StatusBadge status={mission.statut} />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{mission.sousTraitant?.nom ?? "Non assignée"}</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            échéance {formatDate(mission.dateEcheance)}
          </span>
          <span>budget {formatMoney(mission.budgetPrevu)}</span>
          <span>tarif convenu {formatMoney(mission.tarifConvenu)}</span>
          {mission.clientFinal && <span>client final : {mission.clientFinal}</span>}
        </p>
      </div>

      <Tabs defaultValue="brief">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="contrats">Contrats ({contractsQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="livrables">Livrables ({deliverablesQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="factures">Factures ({invoicesQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="commentaires">Commentaires ({mission.commentaires.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="brief">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-sm">{mission.brief?.contenuTexte ?? "Aucun brief texte."}</p>
              {mission.brief && mission.brief.fichiers.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {mission.brief.fichiers.map((f) => (
                    <li key={f.id} className="flex items-center gap-1.5">
                      <Paperclip className="size-3.5 text-muted-foreground" />
                      <a href={fileUrl(f.fichierUrl)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {f.nomFichier}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Ajouter des pièces jointes au brief</p>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && uploadBriefFiles.mutate(e.target.files)}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrats">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Contrats</CardTitle>
              <Button
                size="sm"
                onClick={() => generateContract.mutate()}
                disabled={!mission.sousTraitant || generateContract.isPending}
              >
                Générer un contrat
              </Button>
            </CardHeader>
            <CardContent>
              {(contractsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun contrat généré.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {contractsQuery.data!.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.statut} />
                        {c.fichierPdfGenere && (
                          <a
                            href={fileUrl(c.fichierPdfGenere)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <FileText className="size-3.5" />
                            PDF généré
                          </a>
                        )}
                        {c.fichierSigneUrl && (
                          <a href={fileUrl(c.fichierSigneUrl)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            PDF signé
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.statut === "BROUILLON" && (
                          <Button size="sm" variant="outline" onClick={() => sendContract.mutate(c.id)}>
                            <Send className="size-3.5" />
                            Envoyer
                          </Button>
                        )}
                        {c.statut !== "SIGNE" && (
                          <Button size="sm" variant="outline" asChild>
                            <label className="cursor-pointer">
                              Uploader signé
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadSignedContract.mutate({ id: c.id, file });
                                }}
                              />
                            </label>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="livrables">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Livrables</CardTitle>
            </CardHeader>
            <CardContent>
              {(deliverablesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun livrable soumis.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {deliverablesQuery.data!.map((d) => (
                    <li key={d.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{d.version}</span>
                          <StatusBadge status={d.statut} />
                          <a href={fileUrl(d.fichierOuLien)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            Voir le livrable
                          </a>
                        </div>
                        {d.statut === "SOUMIS" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => validateDeliverable.mutate(d.id)}>
                              Valider
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                const commentaireValidation = window.prompt("Motif du rejet ?") ?? "";
                                rejectDeliverable.mutate({ id: d.id, commentaireValidation });
                              }}
                            >
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </div>
                      {d.commentaireSousTraitant && <p className="mt-1.5 text-muted-foreground">{d.commentaireSousTraitant}</p>}
                      {d.commentaireValidation && (
                        <p className="mt-1.5 italic text-muted-foreground">Retour agence : {d.commentaireValidation}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {(invoicesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture reçue.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {invoicesQuery.data!.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={inv.statut} />
                        <span className="font-medium">{formatMoney(inv.montant)}</span>
                        <a href={fileUrl(inv.fichierFacture)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Voir la facture
                        </a>
                      </div>
                      <div className="flex gap-2">
                        {inv.statut === "RECUE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const date = window.prompt("Date de paiement prévue (AAAA-MM-JJ) ?");
                              if (date) markInvoiceToPay.mutate({ id: inv.id, datePaiementPrevue: new Date(date).toISOString() });
                            }}
                          >
                            Marquer à payer
                          </Button>
                        )}
                        {(inv.statut === "A_PAYER" || inv.statut === "EN_RETARD") && (
                          <Button size="sm" variant="outline" onClick={() => markInvoicePaid.mutate(inv.id)}>
                            Marquer payée
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commentaires">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2">
                {mission.commentaires.map((c) => (
                  <li key={c.id} className="rounded-md bg-muted/60 p-3 text-sm">
                    <p className="font-medium">{c.auteur.nom}</p>
                    <p>{c.contenu}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(c.dateCreation)}</p>
                  </li>
                ))}
                {mission.commentaires.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun commentaire pour l&apos;instant.</p>
                )}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (comment.trim()) addComment.mutate(comment);
                }}
                className="flex gap-2"
              >
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire" />
                <Button type="submit">Envoyer</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
