import Link from "next/link";
import { Briefcase, FileSignature, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LogoMark size={30} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Maillon</h1>
        <p className="max-w-md text-muted-foreground">
          Chaque sous-traitant, un maillon fiable de votre agence : briefs, contrats, livrables et paiements, du
          premier brief au virement.
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/register">Créer mon agence</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
        {[
          { icon: Briefcase, label: "Missions & briefs" },
          { icon: FileSignature, label: "Contrats & signatures" },
          { icon: Receipt, label: "Factures & paiements" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            <Icon className="size-5" />
            {label}
          </div>
        ))}
      </div>
    </main>
  );
}
