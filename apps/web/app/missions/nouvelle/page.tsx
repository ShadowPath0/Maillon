"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, ApiError } from "@/lib/api-client";
import type { ContractorDirectoryEntry } from "@/lib/types";
import { Role } from "@gst/shared-types";

export default function NewMissionPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <NewMissionForm />
      </AppShell>
    </RequireAuth>
  );
}

function NewMissionForm() {
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [briefTexte, setBriefTexte] = useState("");
  const [sousTraitantId, setSousTraitantId] = useState("none");
  const [clientFinal, setClientFinal] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [budgetPrevu, setBudgetPrevu] = useState("");
  const [tarifConvenu, setTarifConvenu] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: contractors } = useQuery({
    queryKey: ["sous-traitants"],
    queryFn: () => apiClient.get<ContractorDirectoryEntry[]>("/sous-traitants"),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const mission = await apiClient.post<{ id: string }>("/missions", {
        titre,
        briefTexte: briefTexte || undefined,
        sousTraitantId: sousTraitantId !== "none" ? sousTraitantId : undefined,
        clientFinal: clientFinal || undefined,
        dateEcheance: dateEcheance ? new Date(dateEcheance).toISOString() : undefined,
        budgetPrevu: budgetPrevu ? Number(budgetPrevu) : undefined,
        tarifConvenu: tarifConvenu ? Number(tarifConvenu) : undefined,
      });
      router.push(`/missions/${mission.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de créer la mission.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Nouvelle mission</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Détails de la mission</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brief">Brief (description)</Label>
              <Textarea id="brief" value={briefTexte} onChange={(e) => setBriefTexte(e.target.value)} rows={5} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sous-traitant assigné</Label>
              <Select value={sousTraitantId} onValueChange={setSousTraitantId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assignée pour l&apos;instant</SelectItem>
                  {contractors?.map((c) => (
                    <SelectItem key={c.userId} value={c.userId}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientFinal">Client final (optionnel)</Label>
              <Input id="clientFinal" value={clientFinal} onChange={(e) => setClientFinal(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="echeance">Échéance</Label>
                <Input id="echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="budget">Budget prévu (€)</Label>
                <Input id="budget" type="number" value={budgetPrevu} onChange={(e) => setBudgetPrevu(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarif">Tarif convenu (€)</Label>
                <Input id="tarif" type="number" value={tarifConvenu} onChange={(e) => setTarifConvenu(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="mt-1 w-fit">
              {submitting ? "Création..." : "Créer la mission"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
