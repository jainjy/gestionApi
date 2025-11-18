-- AlterTable
ALTER TABLE "Tourisme" ADD COLUMN     "category" TEXT,
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "entranceFee" TEXT,
ADD COLUMN     "isTouristicPlace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "website" TEXT;
