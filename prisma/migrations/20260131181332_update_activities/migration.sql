/*
  Warnings:

  - You are about to drop the column `guideId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `included` on the `Activity` table. All the data in the column will be lost.
  - The `duration` column on the `Activity` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `stripePaymentIntent` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the `ActivityFAQ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityGuide` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityMedia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityPromotion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityStatistics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuideContact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecurringAvailability` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[activityId,date,startTime]` on the table `ActivityAvailability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[availabilityId,userId]` on the table `ActivityBooking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Activity_guideId_idx";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "guideId",
DROP COLUMN "icon",
DROP COLUMN "image",
DROP COLUMN "included",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "bookingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "durationType" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "includedItems" TEXT[],
ADD COLUMN     "mainImage" TEXT,
ADD COLUMN     "priceType" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER,
ALTER COLUMN "level" DROP NOT NULL,
ALTER COLUMN "maxParticipants" DROP NOT NULL,
ALTER COLUMN "minParticipants" SET DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "ActivityBooking" DROP COLUMN "stripePaymentIntent",
ADD COLUMN     "participantEmails" TEXT[],
ADD COLUMN     "participantNames" TEXT[],
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentReceiptUrl" TEXT,
ALTER COLUMN "participants" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "ActivityReview" ADD COLUMN     "helpful" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT;

-- DropTable
DROP TABLE "ActivityFAQ";

-- DropTable
DROP TABLE "ActivityGuide";

-- DropTable
DROP TABLE "ActivityMedia";

-- DropTable
DROP TABLE "ActivityPromotion";

-- DropTable
DROP TABLE "ActivityShare";

-- DropTable
DROP TABLE "ActivityStatistics";

-- DropTable
DROP TABLE "GuideContact";

-- DropTable
DROP TABLE "RecurringAvailability";

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_rating_idx" ON "Activity"("rating");

-- CreateIndex
CREATE INDEX "Activity_location_idx" ON "Activity"("location");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAvailability_activityId_date_startTime_key" ON "ActivityAvailability"("activityId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityBooking_availabilityId_userId_key" ON "ActivityBooking"("availabilityId", "userId");

-- CreateIndex
CREATE INDEX "ActivityReview_verified_idx" ON "ActivityReview"("verified");
