-- CreateTable
CREATE TABLE "locations_saisonniere" (
    "id" SERIAL NOT NULL,
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "prixTotal" DOUBLE PRECISION NOT NULL,
    "nombreAdultes" INTEGER NOT NULL DEFAULT 1,
    "nombreEnfants" INTEGER NOT NULL DEFAULT 0,
    "remarques" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_saisonniere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements_location" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "methode" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_saisonniere_propertyId_idx" ON "locations_saisonniere"("propertyId");

-- CreateIndex
CREATE INDEX "locations_saisonniere_clientId_idx" ON "locations_saisonniere"("clientId");

-- CreateIndex
CREATE INDEX "locations_saisonniere_statut_idx" ON "locations_saisonniere"("statut");

-- CreateIndex
CREATE INDEX "locations_saisonniere_dateDebut_idx" ON "locations_saisonniere"("dateDebut");

-- CreateIndex
CREATE INDEX "locations_saisonniere_dateFin_idx" ON "locations_saisonniere"("dateFin");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_location_reference_key" ON "paiements_location"("reference");

-- CreateIndex
CREATE INDEX "paiements_location_locationId_idx" ON "paiements_location"("locationId");

-- CreateIndex
CREATE INDEX "paiements_location_statut_idx" ON "paiements_location"("statut");

-- CreateIndex
CREATE INDEX "paiements_location_reference_idx" ON "paiements_location"("reference");
