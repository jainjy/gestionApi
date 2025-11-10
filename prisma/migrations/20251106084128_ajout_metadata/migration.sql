/*
  Warnings:

  - A unique constraint covering the columns `[userId,category]` on the table `UserPreference` will be added. If there are existing duplicate values, this will fail.
  - Made the column `category` on table `UserPreference` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."UserActivity_entityType_idx";

-- DropIndex
DROP INDEX "public"."UserPreference_category_idx";

-- AlterTable
ALTER TABLE "UserActivity" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "searchQuery" TEXT;

-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "interestScore" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_category_key" ON "UserPreference"("userId", "category");
