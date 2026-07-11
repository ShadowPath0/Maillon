import { LegalLayout, LegalSection, Placeholder } from "@/components/legal-layout";

export const metadata = { title: "Conditions générales — Maillon" };

export default function CguCgvPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation et de vente" updated="11 juillet 2026">
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service Maillon, une plateforme de
          gestion de sous-traitants pour agences, éditée par <Placeholder>[ton nom ou raison sociale]</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="2. Création de compte">
        <p>
          L&apos;accès au service nécessite la création d&apos;un compte agence. Le créateur du compte est responsable
          de l&apos;exactitude des informations fournies et de la confidentialité de son mot de passe.
        </p>
      </LegalSection>

      <LegalSection title="3. Forfaits et facturation">
        <p>Maillon propose un essai gratuit sans carte bancaire, puis deux forfaits payants (Starter, Pro) facturés mensuellement via Stripe.</p>
        <ul className="list-inside list-disc">
          <li>L&apos;abonnement se renouvelle automatiquement chaque mois, sauf résiliation avant la fin de la période en cours</li>
          <li>Le changement de forfait est possible à tout moment depuis les paramètres du compte</li>
          <li>Aucun remboursement au prorata n&apos;est effectué en cas de résiliation en cours de mois</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Obligations de l'utilisateur">
        <p>
          L&apos;utilisateur s&apos;engage à utiliser le service conformément à sa destination, à ne pas porter
          atteinte aux droits des tiers, et à respecter la réglementation applicable à la relation avec ses
          sous-traitants (droit du travail, droit commercial).
        </p>
      </LegalSection>

      <LegalSection title="5. Disponibilité et responsabilité">
        <p>
          Maillon met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantie
          d&apos;absence totale d&apos;interruption. Maillon ne saurait être tenu responsable des litiges entre une
          agence et ses sous-traitants — le service est un outil de gestion, pas une partie aux contrats conclus
          entre ses utilisateurs.
        </p>
      </LegalSection>

      <LegalSection title="6. Résiliation">
        <p>
          Chaque partie peut résilier à tout moment. L&apos;utilisateur peut supprimer son compte depuis les
          paramètres ; les données sont alors supprimées conformément à notre{" "}
          <a href="/confidentialite" className="text-primary underline underline-offset-2">
            politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Droit applicable">
        <p>Les présentes conditions sont soumises au droit français. Tout litige relève de la compétence des tribunaux français.</p>
      </LegalSection>
    </LegalLayout>
  );
}
