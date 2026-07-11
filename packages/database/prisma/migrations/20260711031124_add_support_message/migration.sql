-- CreateEnum
CREATE TYPE "StatutSupportMessage" AS ENUM ('NOUVEAU', 'TRAITE');

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userNom" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "StatutSupportMessage" NOT NULL DEFAULT 'NOUVEAU',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_messages_statut_idx" ON "support_messages"("statut");
