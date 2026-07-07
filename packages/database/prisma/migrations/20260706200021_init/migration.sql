-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBRE', 'SOUS_TRAITANT');

-- CreateEnum
CREATE TYPE "Disponibilite" AS ENUM ('DISPONIBLE', 'OCCUPE', 'INDISPONIBLE');

-- CreateEnum
CREATE TYPE "StatutSousTraitant" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "TypeDocumentAdministratif" AS ENUM ('KBIS', 'ATTESTATION_URSSAF', 'ATTESTATION_ASSURANCE', 'RIB', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutMission" AS ENUM ('BRIEF_ENVOYE', 'EN_COURS', 'LIVRE', 'EN_VALIDATION', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutContrat" AS ENUM ('BROUILLON', 'ENVOYE', 'SIGNE');

-- CreateEnum
CREATE TYPE "StatutLivrable" AS ENUM ('SOUMIS', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutFacture" AS ENUM ('RECUE', 'A_PAYER', 'PAYEE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('MISSION_ASSIGNEE', 'LIVRABLE_SOUMIS', 'LIVRABLE_VALIDE', 'LIVRABLE_REJETE', 'FACTURE_EN_RETARD', 'DOCUMENT_EXPIRE_BIENTOT', 'CONTRAT_ENVOYE', 'CONTRAT_SIGNE', 'INVITATION_MEMBRE', 'INVITATION_SOUS_TRAITANT');

-- CreateEnum
CREATE TYPE "PlanAbonnement" AS ENUM ('ESSAI', 'STARTER', 'PRO');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "planAbonnement" "PlanAbonnement" NOT NULL DEFAULT 'ESSAI',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeStatus" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organizationId" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competences" TEXT[],
    "tarifJour" DECIMAL(10,2),
    "tarifHeure" DECIMAL(10,2),
    "disponibilite" "Disponibilite" NOT NULL DEFAULT 'DISPONIBLE',
    "statut" "StatutSousTraitant" NOT NULL DEFAULT 'ACTIF',
    "noteMoyenne" DECIMAL(3,2),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contractor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_contractors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contractorProfileId" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_documents" (
    "id" TEXT NOT NULL,
    "contractorProfileId" TEXT NOT NULL,
    "type" "TypeDocumentAdministratif" NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3),
    "dateUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "descriptionBrief" TEXT,
    "sousTraitantId" TEXT,
    "clientFinal" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "statut" "StatutMission" NOT NULL DEFAULT 'BRIEF_ENVOYE',
    "budgetPrevu" DECIMAL(10,2),
    "tarifConvenu" DECIMAL(10,2),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "contenuTexte" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief_files" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,

    CONSTRAINT "brief_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_comments" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "templateUtilise" TEXT NOT NULL,
    "fichierPdfGenere" TEXT,
    "fichierSigneUrl" TEXT,
    "statut" "StatutContrat" NOT NULL DEFAULT 'BROUILLON',
    "dateEnvoi" TIMESTAMP(3),
    "dateSignature" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fichierOuLien" TEXT NOT NULL,
    "commentaireSousTraitant" TEXT,
    "statut" "StatutLivrable" NOT NULL DEFAULT 'SOUMIS',
    "commentaireValidation" TEXT,
    "dateSoumission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "sousTraitantId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "fichierFacture" TEXT NOT NULL,
    "statut" "StatutFacture" NOT NULL DEFAULT 'RECUE',
    "dateReception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datePaiementPrevue" TIMESTAMP(3),
    "datePaiementReel" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripeCustomerId_key" ON "organizations"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripeSubscriptionId_key" ON "organizations"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_profiles_userId_key" ON "contractor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_contractors_organizationId_contractorProfileId_key" ON "organization_contractors"("organizationId", "contractorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "missions_organizationId_statut_idx" ON "missions"("organizationId", "statut");

-- CreateIndex
CREATE INDEX "missions_sousTraitantId_idx" ON "missions"("sousTraitantId");

-- CreateIndex
CREATE UNIQUE INDEX "briefs_missionId_key" ON "briefs"("missionId");

-- CreateIndex
CREATE INDEX "mission_comments_missionId_idx" ON "mission_comments"("missionId");

-- CreateIndex
CREATE INDEX "contracts_missionId_idx" ON "contracts"("missionId");

-- CreateIndex
CREATE INDEX "deliverables_missionId_idx" ON "deliverables"("missionId");

-- CreateIndex
CREATE INDEX "invoices_missionId_idx" ON "invoices"("missionId");

-- CreateIndex
CREATE INDEX "invoices_sousTraitantId_idx" ON "invoices"("sousTraitantId");

-- CreateIndex
CREATE INDEX "notifications_utilisateurId_lu_idx" ON "notifications"("utilisateurId", "lu");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contractors" ADD CONSTRAINT "organization_contractors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contractors" ADD CONSTRAINT "organization_contractors_contractorProfileId_fkey" FOREIGN KEY ("contractorProfileId") REFERENCES "contractor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_documents" ADD CONSTRAINT "admin_documents_contractorProfileId_fkey" FOREIGN KEY ("contractorProfileId") REFERENCES "contractor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_files" ADD CONSTRAINT "brief_files_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_comments" ADD CONSTRAINT "mission_comments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_comments" ADD CONSTRAINT "mission_comments_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
