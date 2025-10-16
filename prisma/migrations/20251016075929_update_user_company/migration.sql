-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressComplement" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "commercialName" TEXT,
ADD COLUMN     "demandType" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "zipCode" TEXT;
