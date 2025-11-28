-- AlterTable
ALTER TABLE "FinancementDemande" ADD COLUMN     "serviceFinancierId" TEXT;

-- AlterTable
ALTER TABLE "FinancementPartenaire" ADD COLUMN     "address" TEXT,
ADD COLUMN     "conditions" TEXT,
ADD COLUMN     "dureeMax" INTEGER,
ADD COLUMN     "dureeMin" INTEGER,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "montantMax" DOUBLE PRECISION,
ADD COLUMN     "montantMin" DOUBLE PRECISION,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tauxMax" DOUBLE PRECISION,
ADD COLUMN     "tauxMin" DOUBLE PRECISION,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "ServiceFinancier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "partenaireId" INTEGER NOT NULL,
    "conditions" TEXT,
    "avantages" TEXT[],
    "taux" DOUBLE PRECISION,
    "dureeMin" INTEGER,
    "dureeMax" INTEGER,
    "montantMin" DOUBLE PRECISION,
    "montantMax" DOUBLE PRECISION,
    "fraisDossier" DOUBLE PRECISION,
    "assuranceObligatoire" BOOLEAN NOT NULL DEFAULT false,
    "documentsRequises" TEXT[],
    "delaiTraitement" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ordreAffichage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceFinancier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceFinancier_partenaireId_idx" ON "ServiceFinancier"("partenaireId");

-- CreateIndex
CREATE INDEX "ServiceFinancier_type_idx" ON "ServiceFinancier"("type");

-- CreateIndex
CREATE INDEX "ServiceFinancier_categorie_idx" ON "ServiceFinancier"("categorie");

-- CreateIndex
CREATE INDEX "ServiceFinancier_isActive_idx" ON "ServiceFinancier"("isActive");

-- CreateIndex
CREATE INDEX "ServiceFinancier_ordreAffichage_idx" ON "ServiceFinancier"("ordreAffichage");

-- CreateIndex
CREATE INDEX "FinancementDemande_serviceFinancierId_idx" ON "FinancementDemande"("serviceFinancierId");

-- CreateIndex
CREATE INDEX "FinancementPartenaire_website_idx" ON "FinancementPartenaire"("website");
