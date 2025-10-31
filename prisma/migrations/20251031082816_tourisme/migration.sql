-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Metier" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "embedding" vector(768);

-- CreateTable
CREATE TABLE "Tourisme" (
    "id" TEXT NOT NULL,
    "idUnique" TEXT NOT NULL,
    "idPrestataire" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "amenities" TEXT[],
    "maxGuests" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT NOT NULL DEFAULT 'direct',
    "description" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" INTEGER,
    "instantBook" BOOLEAN NOT NULL DEFAULT false,
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'moderate',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tourisme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tourisme_idUnique_key" ON "Tourisme"("idUnique");

-- CreateIndex
CREATE UNIQUE INDEX "Tourisme_idPrestataire_key" ON "Tourisme"("idPrestataire");
