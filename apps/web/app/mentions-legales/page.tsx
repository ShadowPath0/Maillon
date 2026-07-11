import { LegalLayout, LegalSection, Placeholder } from "@/components/legal-layout";

export const metadata = { title: "Mentions légales — Maillon" };

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updated="11 juillet 2026">
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site Maillon (accessible à l&apos;adresse maillon-agence.vercel.app) est édité par{" "}
          <Placeholder>[ton nom ou la raison sociale de ton entreprise]</Placeholder>, immatriculé sous le numéro{" "}
          <Placeholder>[numéro SIRET, si tu as un statut d&apos;auto-entrepreneur ou de société]</Placeholder>, dont
          le siège est situé à <Placeholder>[ton adresse]</Placeholder>.
        </p>
        <p>
          Adresse email de contact : <Placeholder>[ton email de contact]</Placeholder>
        </p>
        <p>
          Directeur de la publication : <Placeholder>[ton nom]</Placeholder>
        </p>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>Le site (partie visible) est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>
        <p>
          L&apos;application et les données sont hébergées par Render Services, Inc. (hébergement du programme) et
          Neon Inc. (base de données), tous deux basés aux États-Unis. Les transferts de données hors de l&apos;Union
          européenne s&apos;appuient sur les clauses contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site Maillon (textes, logo, charte graphique, code source) est protégé par
          le droit d&apos;auteur. Toute reproduction, représentation ou exploitation, totale ou partielle, sans
          autorisation préalable est interdite.
        </p>
      </LegalSection>

      <LegalSection title="4. Données personnelles">
        <p>
          Le traitement des données personnelles est détaillé dans notre{" "}
          <a href="/confidentialite" className="text-primary underline underline-offset-2">
            politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement (maintien de la
          connexion). Aucun cookie de mesure d&apos;audience ou publicitaire n&apos;est déposé sans ton consentement.
        </p>
      </LegalSection>

      <LegalSection title="6. Droit applicable">
        <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français sont seuls compétents.</p>
      </LegalSection>
    </LegalLayout>
  );
}
