-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EvenementType" ADD VALUE 'PAIEMENT_CONFIRME_CLIENT';
ALTER TYPE "EvenementType" ADD VALUE 'PAIEMENT_RECU_ARTISAN';
ALTER TYPE "EvenementType" ADD VALUE 'TRAVAUX_CONFIRMES_CLIENT';
ALTER TYPE "EvenementType" ADD VALUE 'TRAVAUX_NON_CONFIRMES_CLIENT';
ALTER TYPE "EvenementType" ADD VALUE 'TRAVAUX_NON_CONFIRMES';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "image" SET DATA TYPE TEXT;
