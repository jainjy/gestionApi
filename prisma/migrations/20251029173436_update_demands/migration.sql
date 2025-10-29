-- AlterTable
ALTER TABLE "public"."Demande" ADD COLUMN     "dateSouhaitee" TIMESTAMP(3),
ADD COLUMN     "heureSouhaitee" TEXT,
ADD COLUMN     "metierId" INTEGER,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "statut" TEXT,
ALTER COLUMN "serviceId" DROP NOT NULL;

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
