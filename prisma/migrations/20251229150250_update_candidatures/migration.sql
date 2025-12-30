/*
  Warnings:

  - You are about to drop the column `offreId` on the `candidatures` table. All the data in the column will be lost.
  - Added the required column `titreOffre` to the `candidatures` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `offreType` on the `candidatures` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OffreType" AS ENUM ('FORMATION', 'EMPLOI', 'ALTERNANCE');

-- DropIndex
DROP INDEX "candidatures_offreId_offreType_idx";

-- DropIndex
DROP INDEX "candidatures_userId_offreId_offreType_key";

-- AlterTable
ALTER TABLE "candidatures" DROP COLUMN "offreId",
ADD COLUMN     "alternanceStageId" INTEGER,
ADD COLUMN     "dateEntretien" TIMESTAMP(3),
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "emailCandidat" TEXT,
ADD COLUMN     "emploiId" INTEGER,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "formationId" INTEGER,
ADD COLUMN     "nomCandidat" TEXT,
ADD COLUMN     "note" DOUBLE PRECISION,
ADD COLUMN     "telephoneCandidat" TEXT,
ADD COLUMN     "titreOffre" TEXT NOT NULL,
DROP COLUMN "offreType",
ADD COLUMN     "offreType" "OffreType" NOT NULL;

-- CreateIndex
CREATE INDEX "candidatures_offreType_idx" ON "candidatures"("offreType");
