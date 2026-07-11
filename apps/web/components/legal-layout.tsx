import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={20} className="text-primary" />
            <span className="text-sm font-semibold tracking-tight">Maillon</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        <div className="prose-legal mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-warning/20 px-1 py-0.5 font-medium text-warning-foreground">{children}</span>;
}
