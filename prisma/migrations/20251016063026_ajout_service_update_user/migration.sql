/*
  Warnings:

  - You are about to drop the column `vendorId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Product_vendorId_idx";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "vendorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "companyName" TEXT;

-- DropTable
DROP TABLE "public"."Vendor";

-- CreateTable
CREATE TABLE "public"."Metier" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "Metier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetierService" (
    "metierId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "MetierService_pkey" PRIMARY KEY ("metierId","serviceId")
);

-- CreateTable
CREATE TABLE "public"."UtilisateurMetier" (
    "userId" TEXT NOT NULL,
    "metierId" INTEGER NOT NULL,

    CONSTRAINT "UtilisateurMetier_pkey" PRIMARY KEY ("userId","metierId")
);

-- CreateTable
CREATE TABLE "public"."UtilisateurService" (
    "userId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "UtilisateurService_pkey" PRIMARY KEY ("userId","serviceId")
);

-- CreateTable
CREATE TABLE "public"."Demande" (
    "id" SERIAL NOT NULL,
    "disponibiliteBien" TEXT,
    "description" TEXT,
    "contactNom" TEXT,
    "contactPrenom" TEXT,
    "contactEmail" TEXT,
    "contactTel" TEXT,
    "contactAdresse" TEXT,
    "contactAdresseCp" TEXT,
    "contactAdresseVille" TEXT,
    "lieuAdresse" TEXT,
    "lieuAdresseCp" TEXT,
    "lieuAdresseVille" TEXT,
    "optionAssurance" BOOLEAN DEFAULT false,
    "demandeAcceptee" BOOLEAN DEFAULT false,
    "nombreArtisans" TEXT,
    "createdById" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DemandeArtisan" (
    "userId" TEXT NOT NULL,
    "demandeId" INTEGER NOT NULL,
    "accepte" BOOLEAN DEFAULT false,
    "devis" TEXT,
    "rdv" TIMESTAMP(3),

    CONSTRAINT "DemandeArtisan_pkey" PRIMARY KEY ("userId","demandeId")
);

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "public"."Product"("userId");
