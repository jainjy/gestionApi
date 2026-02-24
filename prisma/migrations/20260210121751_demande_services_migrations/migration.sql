-- AlterTable
ALTER TABLE "Demande" ADD COLUMN     "aiBudget" TEXT,
ADD COLUMN     "aiClass" TEXT,
ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiInterventionTime" TEXT,
ADD COLUMN     "aiProcessedAt" TIMESTAMP(3),
ADD COLUMN     "aiScore" TEXT,
ADD COLUMN     "aiSummary" TEXT;
