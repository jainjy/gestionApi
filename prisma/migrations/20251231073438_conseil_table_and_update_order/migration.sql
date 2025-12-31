/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.
  - Added the required column `deliveryAddress` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingAddress",
ADD COLUMN     "deliveryAddress" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Conseil" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT[],
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "expert" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "Conseil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConseilSave" (
    "id" SERIAL NOT NULL,
    "conseilId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConseilSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConseilView" (
    "id" SERIAL NOT NULL,
    "conseilId" INTEGER NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConseilView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConseilCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConseilCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConseilBookmark" (
    "id" SERIAL NOT NULL,
    "conseilId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConseilBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conseil_category_idx" ON "Conseil"("category");

-- CreateIndex
CREATE INDEX "Conseil_difficulty_idx" ON "Conseil"("difficulty");

-- CreateIndex
CREATE INDEX "Conseil_isFeatured_idx" ON "Conseil"("isFeatured");

-- CreateIndex
CREATE INDEX "Conseil_isActive_idx" ON "Conseil"("isActive");

-- CreateIndex
CREATE INDEX "Conseil_sortOrder_idx" ON "Conseil"("sortOrder");

-- CreateIndex
CREATE INDEX "Conseil_createdAt_idx" ON "Conseil"("createdAt");

-- CreateIndex
CREATE INDEX "ConseilSave_conseilId_idx" ON "ConseilSave"("conseilId");

-- CreateIndex
CREATE INDEX "ConseilSave_userId_idx" ON "ConseilSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConseilSave_conseilId_userId_key" ON "ConseilSave"("conseilId", "userId");

-- CreateIndex
CREATE INDEX "ConseilView_conseilId_idx" ON "ConseilView"("conseilId");

-- CreateIndex
CREATE INDEX "ConseilView_userId_idx" ON "ConseilView"("userId");

-- CreateIndex
CREATE INDEX "ConseilView_viewedAt_idx" ON "ConseilView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConseilCategory_name_key" ON "ConseilCategory"("name");

-- CreateIndex
CREATE INDEX "ConseilCategory_name_idx" ON "ConseilCategory"("name");

-- CreateIndex
CREATE INDEX "ConseilCategory_sortOrder_idx" ON "ConseilCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "ConseilCategory_isActive_idx" ON "ConseilCategory"("isActive");

-- CreateIndex
CREATE INDEX "ConseilBookmark_conseilId_idx" ON "ConseilBookmark"("conseilId");

-- CreateIndex
CREATE INDEX "ConseilBookmark_userId_idx" ON "ConseilBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConseilBookmark_conseilId_userId_key" ON "ConseilBookmark"("conseilId", "userId");
