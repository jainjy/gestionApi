/*
  Warnings:

  - You are about to drop the column `devis` on the `Demande` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Demande" DROP CONSTRAINT "Demande_propertyId_fkey";

-- AlterTable
ALTER TABLE "public"."Demande" DROP COLUMN "devis",
ADD COLUMN     "statut" TEXT,
ALTER COLUMN "dateSouhaitee" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."DemandeHistory" (
    "id" SERIAL NOT NULL,
    "demandeId" INTEGER NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandeHistory_demandeId_idx" ON "public"."DemandeHistory"("demandeId");
