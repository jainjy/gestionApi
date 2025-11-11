-- CreateTable
CREATE TABLE "ProfessionalSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "horairesLundi" JSONB,
    "horairesMardi" JSONB,
    "horairesMercredi" JSONB,
    "horairesJeudi" JSONB,
    "horairesVendredi" JSONB,
    "horairesSamedi" JSONB,
    "horairesDimanche" JSONB,
    "joursFermes" JSONB,
    "delaiReponseEmail" INTEGER DEFAULT 24,
    "delaiReponseTelephone" INTEGER DEFAULT 2,
    "delaiReponseUrgence" INTEGER DEFAULT 4,
    "delaiAnnulationGratuit" INTEGER DEFAULT 48,
    "fraisAnnulationPourcent" INTEGER DEFAULT 15,
    "conditionsAnnulation" TEXT,
    "acomptePourcentage" INTEGER DEFAULT 30,
    "montantMinimum" DOUBLE PRECISION DEFAULT 100,
    "conditionsPaiement" TEXT,
    "nomEntreprise" TEXT,
    "emailContact" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,

    CONSTRAINT "ProfessionalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalSettings_userId_key" ON "ProfessionalSettings"("userId");

-- CreateIndex
CREATE INDEX "ProfessionalSettings_userId_idx" ON "ProfessionalSettings"("userId");
