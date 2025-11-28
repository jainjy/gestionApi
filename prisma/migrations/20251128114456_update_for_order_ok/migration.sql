/*
  Warnings:

  - You are about to drop the column `prestataireId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `idPrestataire` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `paymentMethod` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Order_prestataireId_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "prestataireId",
ADD COLUMN     "idPrestataire" TEXT NOT NULL,
ALTER COLUMN "paymentMethod" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Order_idPrestataire_idx" ON "Order"("idPrestataire");
