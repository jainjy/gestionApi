-- CreateEnum
CREATE TYPE "TypeVehicule" AS ENUM ('economique', 'compacte', 'berline', 'suv', 'luxe', 'utilitaire', 'camion', 'minibus', 'autre');

-- CreateEnum
CREATE TYPE "CarburantType" AS ENUM ('essence', 'diesel', 'electrique', 'hybride', 'gpl');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('manuelle', 'automatique', 'semi_automatique');

-- CreateEnum
CREATE TYPE "StatutReservationVehicule" AS ENUM ('en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee');

-- CreateEnum
CREATE TYPE "StatutPaiementLocation" AS ENUM ('en_attente', 'paye', 'annule', 'rembourse', 'echec');

-- CreateTable
CREATE TABLE "Vehicule" (
    "id" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "puissance" TEXT NOT NULL,
    "typeVehicule" TEXT NOT NULL,
    "carburant" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "places" INTEGER NOT NULL DEFAULT 5,
    "portes" INTEGER NOT NULL DEFAULT 5,
    "volumeCoffre" TEXT,
    "ville" TEXT NOT NULL,
    "adresse" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "prixJour" DOUBLE PRECISION NOT NULL,
    "prixSemaine" DOUBLE PRECISION,
    "prixMois" DOUBLE PRECISION,
    "kilometrageInclus" TEXT NOT NULL DEFAULT '300 km/jour',
    "caution" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "statut" TEXT NOT NULL DEFAULT 'active',
    "images" TEXT[],
    "equipements" JSONB,
    "caracteristiques" TEXT[],
    "description" TEXT,
    "agence" TEXT,
    "conditionsLocation" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nombreAvis" INTEGER NOT NULL DEFAULT 0,
    "nombreReservations" INTEGER NOT NULL DEFAULT 0,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibiliteVehicule" (
    "id" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "prixSpecial" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisponibiliteVehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationVehicule" (
    "id" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "datePrise" TIMESTAMP(3) NOT NULL,
    "dateRetour" TIMESTAMP(3) NOT NULL,
    "dateReservation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomClient" TEXT NOT NULL,
    "emailClient" TEXT NOT NULL,
    "telephoneClient" TEXT NOT NULL,
    "numeroPermis" TEXT,
    "adresseClient" TEXT,
    "lieuPrise" TEXT NOT NULL,
    "lieuRetour" TEXT NOT NULL,
    "nombreJours" INTEGER NOT NULL,
    "nombreConducteurs" INTEGER NOT NULL DEFAULT 1,
    "kilometrageOption" TEXT NOT NULL DEFAULT 'standard',
    "extras" JSONB,
    "prixVehicule" DOUBLE PRECISION NOT NULL,
    "prixExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fraisService" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "cautionBloquee" DOUBLE PRECISION NOT NULL,
    "statutPaiement" TEXT NOT NULL DEFAULT 'en_attente',
    "methodePaiement" TEXT,
    "referencePaiement" TEXT,
    "datePaiement" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'confirmee',
    "dateAnnulation" TIMESTAMP(3),
    "raisonAnnulation" TEXT,
    "kilometrageDepart" INTEGER,
    "kilometrageRetour" INTEGER,
    "carburantDepart" TEXT,
    "carburantRetour" TEXT,
    "etatDepart" JSONB,
    "etatRetour" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationVehicule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvisVehicule" (
    "id" TEXT NOT NULL,
    "vehiculeId" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "titre" TEXT,
    "commentaire" TEXT,
    "avantages" TEXT[],
    "inconvenients" TEXT[],
    "recommandation" BOOLEAN,
    "dateExperience" TIMESTAMP(3) NOT NULL,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisVehicule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicule_immatriculation_key" ON "Vehicule"("immatriculation");

-- CreateIndex
CREATE INDEX "Vehicule_prestataireId_idx" ON "Vehicule"("prestataireId");

-- CreateIndex
CREATE INDEX "Vehicule_typeVehicule_idx" ON "Vehicule"("typeVehicule");

-- CreateIndex
CREATE INDEX "Vehicule_carburant_idx" ON "Vehicule"("carburant");

-- CreateIndex
CREATE INDEX "Vehicule_transmission_idx" ON "Vehicule"("transmission");

-- CreateIndex
CREATE INDEX "Vehicule_ville_idx" ON "Vehicule"("ville");

-- CreateIndex
CREATE INDEX "Vehicule_prixJour_idx" ON "Vehicule"("prixJour");

-- CreateIndex
CREATE INDEX "Vehicule_disponible_idx" ON "Vehicule"("disponible");

-- CreateIndex
CREATE INDEX "Vehicule_rating_idx" ON "Vehicule"("rating");

-- CreateIndex
CREATE INDEX "Vehicule_publishedAt_idx" ON "Vehicule"("publishedAt");

-- CreateIndex
CREATE INDEX "DisponibiliteVehicule_vehiculeId_idx" ON "DisponibiliteVehicule"("vehiculeId");

-- CreateIndex
CREATE INDEX "DisponibiliteVehicule_dateDebut_idx" ON "DisponibiliteVehicule"("dateDebut");

-- CreateIndex
CREATE INDEX "DisponibiliteVehicule_dateFin_idx" ON "DisponibiliteVehicule"("dateFin");

-- CreateIndex
CREATE INDEX "DisponibiliteVehicule_disponible_idx" ON "DisponibiliteVehicule"("disponible");

-- CreateIndex
CREATE UNIQUE INDEX "DisponibiliteVehicule_vehiculeId_dateDebut_dateFin_key" ON "DisponibiliteVehicule"("vehiculeId", "dateDebut", "dateFin");

-- CreateIndex
CREATE INDEX "ReservationVehicule_vehiculeId_idx" ON "ReservationVehicule"("vehiculeId");

-- CreateIndex
CREATE INDEX "ReservationVehicule_clientId_idx" ON "ReservationVehicule"("clientId");

-- CreateIndex
CREATE INDEX "ReservationVehicule_prestataireId_idx" ON "ReservationVehicule"("prestataireId");

-- CreateIndex
CREATE INDEX "ReservationVehicule_datePrise_idx" ON "ReservationVehicule"("datePrise");

-- CreateIndex
CREATE INDEX "ReservationVehicule_dateRetour_idx" ON "ReservationVehicule"("dateRetour");

-- CreateIndex
CREATE INDEX "ReservationVehicule_statut_idx" ON "ReservationVehicule"("statut");

-- CreateIndex
CREATE INDEX "ReservationVehicule_statutPaiement_idx" ON "ReservationVehicule"("statutPaiement");

-- CreateIndex
CREATE INDEX "ReservationVehicule_createdAt_idx" ON "ReservationVehicule"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AvisVehicule_reservationId_key" ON "AvisVehicule"("reservationId");

-- CreateIndex
CREATE INDEX "AvisVehicule_vehiculeId_idx" ON "AvisVehicule"("vehiculeId");

-- CreateIndex
CREATE INDEX "AvisVehicule_clientId_idx" ON "AvisVehicule"("clientId");

-- CreateIndex
CREATE INDEX "AvisVehicule_rating_idx" ON "AvisVehicule"("rating");

-- CreateIndex
CREATE INDEX "AvisVehicule_verifie_idx" ON "AvisVehicule"("verifie");

-- CreateIndex
CREATE INDEX "AvisVehicule_createdAt_idx" ON "AvisVehicule"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AvisVehicule_vehiculeId_clientId_key" ON "AvisVehicule"("vehiculeId", "clientId");
