-- AlterTable
ALTER TABLE "DemandeArtisan" ADD COLUMN     "artisanConfirmeReception" BOOLEAN DEFAULT false,
ADD COLUMN     "clientConfirmePaiement" BOOLEAN DEFAULT false,
ADD COLUMN     "clientConfirmeTravaux" BOOLEAN DEFAULT false,
ADD COLUMN     "paiementMode" TEXT,
ADD COLUMN     "paiementMontant" DOUBLE PRECISION;
