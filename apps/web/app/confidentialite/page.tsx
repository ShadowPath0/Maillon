import { LegalLayout, LegalSection, Placeholder } from "@/components/legal-layout";

export const metadata = { title: "Politique de confidentialité — Maillon" };

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="11 juillet 2026">
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement des données collectées via Maillon est{" "}
          <Placeholder>[ton nom ou la raison sociale de ton entreprise]</Placeholder>, contactable à{" "}
          <Placeholder>[ton email de contact]</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>Selon ton usage du service, nous collectons :</p>
        <ul className="list-inside list-disc">
          <li>Données de compte : nom, email, mot de passe (chiffré, jamais stocké en clair), rôle</li>
          <li>Données d&apos;agence : nom de l&apos;agence, missions, briefs, contrats</li>
          <li>Données de sous-traitant : compétences, tarifs, disponibilité, documents administratifs (Kbis, attestations), factures</li>
          <li>Données de facturation : gérées par notre prestataire de paiement Stripe (nous ne stockons jamais de numéro de carte bancaire)</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités et base légale">
        <p>Ces données sont traitées pour :</p>
        <ul className="list-inside list-disc">
          <li>Fournir le service (exécution du contrat qui te lie à Maillon)</li>
          <li>Gérer la facturation de ton abonnement (exécution du contrat)</li>
          <li>T&apos;envoyer les notifications liées à ton activité — missions, factures, documents (exécution du contrat)</li>
          <li>Assurer la sécurité du service et prévenir la fraude (intérêt légitime)</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Durée de conservation">
        <p>
          Les données sont conservées pendant toute la durée d&apos;utilisation du service, puis supprimées dans un
          délai de 12 mois après la clôture du compte, sauf obligation légale de conservation plus longue
          (documents comptables notamment).
        </p>
      </LegalSection>

      <LegalSection title="5. Destinataires">
        <p>
          Les données sont accessibles uniquement à l&apos;agence concernée et au sous-traitant propriétaire de ses
          propres données — jamais partagées entre agences différentes. Elles peuvent être transmises à nos
          sous-traitants techniques (hébergement : Vercel, Render, Neon ; paiement : Stripe ; emails : Resend),
          uniquement dans la mesure nécessaire à la fourniture du service.
        </p>
      </LegalSection>

      <LegalSection title="6. Tes droits">
        <p>Conformément au RGPD, tu disposes des droits suivants sur tes données :</p>
        <ul className="list-inside list-disc">
          <li>Droit d&apos;accès et de rectification</li>
          <li>Droit à l&apos;effacement (suppression de compte)</li>
          <li>Droit à la portabilité</li>
          <li>Droit d&apos;opposition et de limitation du traitement</li>
        </ul>
        <p>
          Pour exercer ces droits, contacte-nous à <Placeholder>[ton email de contact]</Placeholder>. Tu peux
          également introduire une réclamation auprès de la CNIL (cnil.fr).
        </p>
      </LegalSection>

      <LegalSection title="7. Sécurité">
        <p>
          Les mots de passe sont chiffrés (jamais stockés en clair), les connexions au site sont sécurisées (HTTPS),
          et l&apos;accès aux données est strictement cloisonné par agence.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
