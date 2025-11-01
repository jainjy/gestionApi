/*
  Warnings:

  - You are about to drop the column `devis_demande` on the `Demande` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Demande" DROP CONSTRAINT "Demande_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Devis" DROP CONSTRAINT "Devis_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Devis" DROP CONSTRAINT "Devis_demandeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Devis" DROP CONSTRAINT "Devis_prestataireId_fkey";

-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "Demande" DROP COLUMN "devis_demande";

-- AlterTable
ALTER TABLE "Metier" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "embedding" vector;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "embedding" vector;

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "given" BOOLEAN NOT NULL,
    "givenAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancementDemande" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION,
    "duree" INTEGER,
    "estimation" DOUBLE PRECISION,
    "partenaireId" INTEGER,
    "assuranceId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancementDemande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancementPartenaire" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "avantages" TEXT[],
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancementPartenaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssuranceService" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "obligatoire" BOOLEAN NOT NULL DEFAULT false,
    "public" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssuranceService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancementDemande_userId_idx" ON "FinancementDemande"("userId");

-- CreateIndex
CREATE INDEX "FinancementDemande_type_idx" ON "FinancementDemande"("type");

-- CreateIndex
CREATE INDEX "FinancementDemande_status_idx" ON "FinancementDemande"("status");

-- CreateIndex
CREATE INDEX "FinancementDemande_createdAt_idx" ON "FinancementDemande"("createdAt");

-- CreateIndex
CREATE INDEX "FinancementPartenaire_type_idx" ON "FinancementPartenaire"("type");

-- CreateIndex
CREATE INDEX "FinancementPartenaire_isActive_idx" ON "FinancementPartenaire"("isActive");

-- CreateIndex
CREATE INDEX "AssuranceService_obligatoire_idx" ON "AssuranceService"("obligatoire");

-- CreateIndex
CREATE INDEX "AssuranceService_isActive_idx" ON "AssuranceService"("isActive");
