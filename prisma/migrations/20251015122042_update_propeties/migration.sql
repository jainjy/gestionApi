/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Property` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Property" ADD COLUMN     "energyClass" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasElevator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasGarden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasParking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPool" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTerrace" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingType" TEXT NOT NULL DEFAULT 'sale',
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "totalFloors" INTEGER,
ADD COLUMN     "yearBuilt" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "public"."Property"("slug");

-- CreateIndex
CREATE INDEX "Property_listingType_idx" ON "public"."Property"("listingType");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "public"."Property"("createdAt");
