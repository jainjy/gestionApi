/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Property` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "externalId" INTEGER,
ADD COLUMN     "externalSource" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Property_externalId_key" ON "Property"("externalId");
