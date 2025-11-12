-- AlterTable
ALTER TABLE "Demande" ADD COLUMN     "artisanId" TEXT;

-- CreateIndex
CREATE INDEX "Demande_artisanId_idx" ON "Demande"("artisanId");
