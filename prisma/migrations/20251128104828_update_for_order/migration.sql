/*
  Warnings:

  - Added the required column `prestataireId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "prestataireId" TEXT NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_prestataireId_idx" ON "Order"("prestataireId");
