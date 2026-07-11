"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const STORAGE_KEY = "maillon_support_secret";

interface SupportMessage {
  id: string;
  userEmail: string;
  userNom: string;
  message: string;
  statut: "NOUVEAU" | "TRAITE";
  dateCreation: string;
}

async function fetchMessages(secret: string): Promise<SupportMessage[]> {
  const res = await fetch(`${API_URL}/api/support`, { headers: { "x-support-secret": secret } });
  if (!res.ok) throw new Error(res.status === 403 ? "Mot de passe incorrect." : "Erreur de chargement.");
  return res.json();
}

async function markTraite(secret: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/support/${id}/traiter`, {
    method: "PATCH",
    headers: { "x-support-secret": secret },
  });
  if (!res.ok) throw new Error("Erreur.");
}

export default function AdminSupportPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) setSecret(stored);
  }, []);

  if (!secret) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2">
              <LogoMark size={20} className="text-primary" />
              <span className="text-sm font-semibold tracking-tight">Panel support</span>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.sessionStorage.setItem(STORAGE_KEY, input);
                setSecret(input);
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="secret">Mot de passe admin</Label>
                <Input id="secret" type="password" value={input} onChange={(e) => setInput(e.target.value)} required />
              </div>
              <Button type="submit">Entrer</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <SupportInbox secret={secret} onInvalidSecret={() => { window.sessionStorage.removeItem(STORAGE_KEY); setSecret(null); }} />;
}

function SupportInbox({ secret, onInvalidSecret }: { secret: string; onInvalidSecret: () => void }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-support-messages"],
    queryFn: () => fetchMessages(secret),
    retry: false,
  });

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : "Erreur.");
      onInvalidSecret();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const traiter = useMutation({
    mutationFn: (id: string) => markTraite(secret, id),
    onSuccess: () => {
      toast.success("Marqué comme traité.");
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
    },
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center gap-2">
        <LogoMark size={20} className="text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Messages de support</h1>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-2 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.userNom}</p>
                    <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.statut} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.dateCreation).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                {m.statut === "NOUVEAU" && (
                  <Button size="sm" variant="outline" className="w-fit" onClick={() => traiter.mutate(m.id)}>
                    Marquer comme traité
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
