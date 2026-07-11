"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Paperclip } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { formatDate, formatMoney, fileUrl } from "@/lib/format";
import type { Contract, Deliverable, Invoice, MissionDetail, PaginatedResult } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function PortailMissionDetailPage() {
  return (
    <RequireAuth roles={[Role.SOUS_TRAITANT]}>
      <PortalShell>
        <PortailMissionDetailContent />
      </PortalShell>
    </RequireAuth>
  );
}

function PortailMissionDetailContent() {
  const params = useParams<{ id: string }>();
  const missionId = params.id;
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [lien, setLien] = useState("");
  const [deliverableComment, setDeliverableComment] = useState("");
  const [invoiceMontant, setInvoiceMontant] = useState("");

  const missionQuery = useQuery({
    queryKey: ["portal-mission", missionId],
    queryFn: () => apiClient.get<MissionDetail>(`/missions/${missionId}`),
  });
  const contractsQuery = useQuery({
    queryKey: ["portal-contracts", missionId],
    queryFn: () => apiClient.get<Contract[]>(`/contrats?missionId=${missionId}`),
  });
  const deliverablesQuery = useQuery({
    queryKey: ["portal-deliverables", missionId],
    queryFn: () => apiClient.get<Deliverable[]>(`/missions/${missionId}/livrables`),
  });
  const invoicesQuery = useQuery({
    queryKey: ["portal-invoices", missionId],
    queryFn: () => apiClient.get<PaginatedResult<Invoice>>(`/factures?missionId=${missionId}&pageSize=100`),
    select: (res) => res.data,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["portal-mission", missionId] });
    queryClient.invalidateQueries({ queryKey: ["portal-deliverables", missionId] });
    queryClient.invalidateQueries({ queryKey: ["portal-invoices", missionId] });
  };

  const addComment = useMutation({
    mutationFn: (contenu: string) => apiClient.post(`/missions/${missionId}/comments`, { contenu }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["portal-mission", missionId] });
    },
  });

  const submitDeliverable = useMutation({
    mutationFn: ({ file }: { file?: File }) => {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (lien) formData.append("lien", lien);
      if (deliverableComment) formData.append("commentaireSousTraitant", deliverableComment);
      return apiClient.upload(`/missions/${missionId}/livrables`, formData);
    },
    onSuccess: () => {
      toast.success("Livrable déposé.");
      setLien("");
      setDeliverableComment("");
      invalidateAll();
    },
  });

  const uploadInvoice = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("montant", invoiceMontant);
      return apiClient.upload(`/missions/${missionId}/factures`, formData);
    },
    onSuccess: () => {
      toast.success("Facture déposée.");
      setInvoiceMontant("");
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
        <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            échéance {formatDate(mission.dateEcheance)}
          </span>
          <span>tarif convenu {formatMoney(mission.tarifConvenu)}</span>
        </p>
      </div>

      <Tabs defaultValue="brief">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          {contractsQuery.data && contractsQuery.data.length > 0 && <TabsTrigger value="contrat">Contrat</TabsTrigger>}
          <TabsTrigger value="livrables">Livrables</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="commentaires">Commentaires ({mission.commentaires.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="brief">
          <Card>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{mission.brief?.contenuTexte ?? "Aucun brief texte."}</p>
              {mission.brief && mission.brief.fichiers.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-sm">
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
            </CardContent>
          </Card>
        </TabsContent>

        {contractsQuery.data && contractsQuery.data.length > 0 && (
          <TabsContent value="contrat">
            <Card>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {contractsQuery.data.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.statut} />
                        {c.fichierPdfGenere && (
                          <a href={fileUrl(c.fichierPdfGenere)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            Voir le PDF
                          </a>
                        )}
                      </div>
                      {c.statut !== "SIGNE" && (
                        <Button size="sm" variant="outline" asChild>
                          <label className="cursor-pointer">
                            Uploader signé
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append("file", file);
                                await apiClient.upload(`/contrats/${c.id}/signed`, formData);
                                toast.success("Contrat signé envoyé.");
                                queryClient.invalidateQueries({ queryKey: ["portal-contracts", missionId] });
                              }}
                            />
                          </label>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="livrables">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Déposer un livrable</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lien">Lien (Drive, Figma...)</Label>
                  <Input id="lien" placeholder="https://..." value={lien} onChange={(e) => setLien(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliv-comment">Commentaire (optionnel)</Label>
                  <Textarea id="deliv-comment" value={deliverableComment} onChange={(e) => setDeliverableComment(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliv-file">Ou joindre un fichier</Label>
                  <Input
                    id="deliv-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) submitDeliverable.mutate({ file });
                    }}
                    className="max-w-xs"
                  />
                </div>
                {!!lien && (
                  <Button onClick={() => submitDeliverable.mutate({})} disabled={submitDeliverable.isPending} className="w-fit">
                    Envoyer le lien
                  </Button>
                )}
              </div>
              <ul className="flex flex-col gap-2 border-t pt-4">
                {deliverablesQuery.data?.map((d) => (
                  <li key={d.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">v{d.version}</span>
                      <StatusBadge status={d.statut} />
                    </div>
                    {d.commentaireValidation && (
                      <p className="mt-1.5 italic text-muted-foreground">Retour agence : {d.commentaireValidation}</p>
                    )}
                  </li>
                ))}
                {deliverablesQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun livrable déposé pour l&apos;instant.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Déposer une facture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="montant">Montant (€)</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={invoiceMontant}
                    onChange={(e) => setInvoiceMontant(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="facture-file">Fichier</Label>
                  <Input
                    id="facture-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && invoiceMontant) uploadInvoice.mutate(file);
                    }}
                  />
                </div>
              </div>
              <ul className="flex flex-col gap-2 border-t pt-4">
                {invoicesQuery.data?.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{formatMoney(inv.montant)}</span>
                    <StatusBadge status={inv.statut} />
                  </li>
                ))}
                {invoicesQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune facture déposée pour l&apos;instant.</p>
                )}
              </ul>
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
