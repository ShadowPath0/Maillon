import Link from "next/link";
import {
  Briefcase,
  FileSignature,
  Receipt,
  Users,
  LayoutDashboard,
  UserCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/logo";
import { PRICING_PLANS } from "@/lib/pricing";

const FEATURES = [
  {
    icon: Users,
    title: "Annuaire des sous-traitants",
    description: "Compétences, tarifs, disponibilité et documents administratifs, toujours à jour.",
  },
  {
    icon: Briefcase,
    title: "Missions & briefs",
    description: "Créez une mission, assignez un freelance, suivez l'avancement sur un Kanban.",
  },
  {
    icon: FileSignature,
    title: "Contrats",
    description: "Générez un bon de commande en un clic et suivez sa signature.",
  },
  {
    icon: Receipt,
    title: "Livrables & factures",
    description: "Validez ou renvoyez en révision, suivez chaque paiement jusqu'au virement.",
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    description: "Missions par statut, encaissé sur 6 mois, alertes automatiques — en un coup d'œil.",
  },
  {
    icon: UserCircle,
    title: "Portail sous-traitant",
    description: "Un espace dédié pour chaque freelance, pensé pour le mobile.",
  },
];

const FAQS = [
  {
    q: "Mes données sont-elles partagées entre agences ?",
    a: "Non. Chaque agence n'accède qu'à ses propres missions, sous-traitants et factures. Un même freelance peut travailler avec plusieurs agences sans qu'aucune ne voie les données des autres.",
  },
  {
    q: "Y a-t-il un essai gratuit ?",
    a: "Oui, la création d'une agence démarre automatiquement en essai gratuit — aucune carte bancaire requise pour commencer.",
  },
  {
    q: "Puis-je changer de forfait à tout moment ?",
    a: "Oui, directement depuis les paramètres de votre agence, sans passer par le support.",
  },
  {
    q: "Que se passe-t-il si je dépasse le nombre de sous-traitants de mon forfait ?",
    a: "On vous préviendra avant toute limite bloquante — l'objectif est de vous laisser travailler, pas de vous interrompre en pleine mission.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <LogoMark size={22} className="text-primary" />
            <span className="text-sm font-semibold tracking-tight">Maillon</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Essai gratuit</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LogoMark size={30} />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Chaque sous-traitant, un maillon fiable de votre agence
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Fini les briefs perdus dans Slack et les factures oubliées sur un Google Sheet. Un seul outil pour piloter
          vos freelances du brief au virement.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Créer mon agence — essai gratuit</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Aucune carte bancaire requise pour démarrer.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-secondary">
                  <Icon className="size-4" />
                </div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Un tarif simple, deux forfaits</h2>
          <p className="mt-2 text-muted-foreground">Changez de forfait à tout moment depuis vos paramètres.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id} className={plan.highlighted ? "border-2 border-primary" : ""}>
              <CardContent className="flex flex-col gap-4">
                {plan.highlighted && (
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                    Le plus populaire
                  </span>
                )}
                <div>
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </div>
                <p className="text-3xl font-semibold">
                  {plan.price} €<span className="text-base font-normal text-muted-foreground">/mois</span>
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-2" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href="/register">Commencer avec {plan.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
        <div className="flex flex-col divide-y rounded-lg border bg-background">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="p-5">
              <p className="font-medium">{q}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark size={16} className="text-primary" />
            <span>Maillon</span>
          </div>
          <p>© {new Date().getFullYear()} Maillon. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
