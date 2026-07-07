import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type Variant = VariantProps<typeof badgeVariants>["variant"];

const VARIANTS: Record<string, Variant> = {
  BRIEF_ENVOYE: "muted",
  EN_COURS: "secondary",
  LIVRE: "secondary",
  EN_VALIDATION: "warning",
  VALIDE: "success",
  REJETE: "destructive",
  BROUILLON: "muted",
  ENVOYE: "secondary",
  SIGNE: "success",
  SOUMIS: "warning",
  RECUE: "muted",
  A_PAYER: "secondary",
  PAYEE: "success",
  EN_RETARD: "destructive",
  DISPONIBLE: "success",
  OCCUPE: "warning",
  INDISPONIBLE: "destructive",
  ACTIF: "success",
  INACTIF: "muted",
  ADMIN: "secondary",
  MEMBRE: "muted",
};

const LABELS: Record<string, string> = {
  BRIEF_ENVOYE: "Brief envoyé",
  EN_COURS: "En cours",
  LIVRE: "Livré",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  SIGNE: "Signé",
  SOUMIS: "Soumis",
  RECUE: "Reçue",
  A_PAYER: "À payer",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
  DISPONIBLE: "Disponible",
  OCCUPE: "Occupé",
  INDISPONIBLE: "Indisponible",
  ACTIF: "Actif",
  INACTIF: "Inactif",
  ADMIN: "Admin",
  MEMBRE: "Membre",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "outline"}>{LABELS[status] ?? status}</Badge>;
}
