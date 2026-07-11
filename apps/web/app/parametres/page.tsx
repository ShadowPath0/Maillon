"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { PRICING_PLANS } from "@/lib/pricing";
import type { OrgMember } from "@/lib/types";
import { PlanAbonnement, Role } from "@gst/shared-types";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  return (
    <RequireAuth roles={[Role.ADMIN, Role.MEMBRE]}>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </RequireAuth>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === Role.ADMIN;

  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient.get<OrgMember[]>("/users/members"),
  });

  const deactivateMember = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/members/${id}`),
    onSuccess: () => {
      toast.success("Membre désactivé.");
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez les membres de votre agence et vos sous-traitants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Membres de l&apos;agence</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="divide-y">
            {membersQuery.data?.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(m.nom)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.nom}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={m.role} />
                  {isAdmin && m.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deactivateMember.mutate(m.id)}
                    >
                      Désactiver
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {isAdmin && <InviteMemberForm />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Inviter un sous-traitant</CardTitle>
          <CardDescription>Un email est envoyé pour créer ou rattacher son compte à votre agence.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteContractorForm />
        </CardContent>
      </Card>

      {isAdmin && <BillingSection />}

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

interface BillingStatus {
  planAbonnement: string;
  stripeStatus: string | null;
  hasStripeCustomer: boolean;
}

function BillingSection() {
  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") toast.success("Abonnement activé.");
    if (checkout === "cancel") toast.info("Paiement annulé.");
  }, []);

  const statusQuery = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => apiClient.get<BillingStatus>("/billing/status"),
  });

  const checkout = useMutation({
    mutationFn: (plan: string) => apiClient.post<{ url: string }>("/billing/checkout", { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Impossible de démarrer le paiement."),
  });

  const portal = useMutation({
    mutationFn: () => apiClient.get<{ url: string }>("/billing/portal"),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Impossible d'ouvrir la gestion d'abonnement."),
  });

  const currentPlan = statusQuery.data?.planAbonnement;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Abonnement</CardTitle>
            <CardDescription>
              Forfait actuel :{" "}
              {currentPlan === PlanAbonnement.ESSAI ? "essai gratuit" : currentPlan ?? "…"}
            </CardDescription>
          </div>
          {statusQuery.data?.hasStripeCustomer && (
            <Button variant="outline" size="sm" onClick={() => portal.mutate()} disabled={portal.isPending}>
              Gérer mon abonnement
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col gap-3 rounded-lg border p-4 ${plan.highlighted ? "border-primary" : ""}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-sm text-muted-foreground">{plan.price} €/mois</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || checkout.isPending}
                  onClick={() => checkout.mutate(plan.id)}
                  className="mt-auto"
                >
                  {isCurrent ? "Forfait actuel" : "Choisir ce forfait"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteMemberForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(Role.MEMBRE);

  const invite = useMutation({
    mutationFn: () => apiClient.post("/auth/invite-member", { email, role }),
    onSuccess: () => {
      toast.success("Invitation envoyée.");
      setEmail("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'invitation."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        invite.mutate();
      }}
      className="flex flex-wrap items-end gap-3 border-t pt-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-email">Email</Label>
        <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-56" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Rôle</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Role.MEMBRE}>Membre</SelectItem>
            <SelectItem value={Role.ADMIN}>Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={invite.isPending}>
        Inviter
      </Button>
    </form>
  );
}

function InviteContractorForm() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");

  const invite = useMutation({
    mutationFn: () => apiClient.post("/auth/invite-contractor", { email, nom: nom || undefined }),
    onSuccess: () => {
      toast.success("Invitation envoyée.");
      setEmail("");
      setNom("");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'invitation."),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        invite.mutate();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contractor-email">Email</Label>
        <Input id="contractor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-56" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contractor-nom">Nom (optionnel)</Label>
        <Input id="contractor-nom" value={nom} onChange={(e) => setNom(e.target.value)} className="w-56" />
      </div>
      <Button type="submit" disabled={invite.isPending}>
        Inviter
      </Button>
    </form>
  );
}
