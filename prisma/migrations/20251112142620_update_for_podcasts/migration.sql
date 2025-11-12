-- AlterTable
ALTER TABLE "Podcast" ADD COLUMN     "storagePath" TEXT;

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "isFeatured" DROP NOT NULL,
ALTER COLUMN "isActive" DROP NOT NULL,
ALTER COLUMN "views" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "hasBalcony" DROP NOT NULL,
ALTER COLUMN "hasElevator" DROP NOT NULL,
ALTER COLUMN "hasGarden" DROP NOT NULL,
ALTER COLUMN "hasParking" DROP NOT NULL,
ALTER COLUMN "hasPool" DROP NOT NULL,
ALTER COLUMN "hasTerrace" DROP NOT NULL,
ALTER COLUMN "listingType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "storagePath" TEXT;

-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dateAudit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsable" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en cours',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_referenceType_referenceId_idx" ON "Transaction"("referenceType", "referenceId");
