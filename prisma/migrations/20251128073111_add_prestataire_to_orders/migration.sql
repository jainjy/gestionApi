/*
  Warnings:

  - Added the required column `idPrestataire` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idPrestataire" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Order_idPrestataire_idx" ON "Order"("idPrestataire");
