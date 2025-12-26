/*
  Warnings:

  - You are about to drop the column `agence` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `caracteristiques` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `conditionsLocation` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `equipements` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `kilometrageInclus` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `puissance` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `volumeCoffre` on the `Vehicule` table. All the data in the column will be lost.
  - You are about to drop the column `vues` on the `Vehicule` table. All the data in the column will be lost.
  - The `carburant` column on the `Vehicule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `transmission` column on the `Vehicule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `categorie` to the `Vehicule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategorieVehicule" AS ENUM ('voiture', 'camion', 'moto', 'velo');

-- DropIndex
DROP INDEX "Vehicule_carburant_idx";

-- DropIndex
DROP INDEX "Vehicule_disponible_idx";

-- DropIndex
DROP INDEX "Vehicule_prestataireId_idx";

-- DropIndex
DROP INDEX "Vehicule_publishedAt_idx";

-- DropIndex
DROP INDEX "Vehicule_rating_idx";

-- DropIndex
DROP INDEX "Vehicule_transmission_idx";

-- DropIndex
DROP INDEX "Vehicule_typeVehicule_idx";

-- AlterTable
ALTER TABLE "Vehicule" DROP COLUMN "agence",
DROP COLUMN "caracteristiques",
DROP COLUMN "conditionsLocation",
DROP COLUMN "equipements",
DROP COLUMN "kilometrageInclus",
DROP COLUMN "publishedAt",
DROP COLUMN "puissance",
DROP COLUMN "volumeCoffre",
DROP COLUMN "vues",
ADD COLUMN     "assistanceElec" BOOLEAN,
ADD COLUMN     "categorie" "CategorieVehicule" NOT NULL,
ADD COLUMN     "cylindree" INTEGER,
ADD COLUMN     "poids" DOUBLE PRECISION,
ADD COLUMN     "typeVelo" TEXT,
ALTER COLUMN "marque" DROP NOT NULL,
ALTER COLUMN "modele" DROP NOT NULL,
ALTER COLUMN "annee" DROP NOT NULL,
ALTER COLUMN "immatriculation" DROP NOT NULL,
ALTER COLUMN "couleur" DROP NOT NULL,
ALTER COLUMN "typeVehicule" DROP NOT NULL,
DROP COLUMN "carburant",
ADD COLUMN     "carburant" "CarburantType",
DROP COLUMN "transmission",
ADD COLUMN     "transmission" "TransmissionType",
ALTER COLUMN "places" DROP NOT NULL,
ALTER COLUMN "places" DROP DEFAULT,
ALTER COLUMN "portes" DROP NOT NULL,
ALTER COLUMN "portes" DROP DEFAULT,
ALTER COLUMN "caution" DROP NOT NULL,
ALTER COLUMN "caution" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Vehicule_categorie_idx" ON "Vehicule"("categorie");
