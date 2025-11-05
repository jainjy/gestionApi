-- AlterTable
ALTER TABLE "DemandeArtisan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "devisFileName" TEXT,
ADD COLUMN     "devisFileType" TEXT,
ADD COLUMN     "devisFileUrl" TEXT,
ADD COLUMN     "factureFileName" TEXT,
ADD COLUMN     "factureFileType" TEXT,
ADD COLUMN     "factureFileUrl" TEXT,
ADD COLUMN     "factureMontant" DOUBLE PRECISION,
ADD COLUMN     "factureStatus" TEXT DEFAULT 'en_attente',
ADD COLUMN     "rdvNotes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DemandeArtisan_userId_idx" ON "DemandeArtisan"("userId");

-- CreateIndex
CREATE INDEX "DemandeArtisan_demandeId_idx" ON "DemandeArtisan"("demandeId");

-- CreateIndex
CREATE INDEX "DemandeArtisan_factureStatus_idx" ON "DemandeArtisan"("factureStatus");
