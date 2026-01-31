/*
  Warnings:

  - You are about to drop the column `availabilityId` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentIntentId` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReceiptUrl` on the `ActivityBooking` table. All the data in the column will be lost.
  - You are about to drop the `ActivityAvailability` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookingDate` to the `ActivityBooking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ActivityBooking_availabilityId_userId_key";

-- AlterTable
ALTER TABLE "ActivityBooking" DROP COLUMN "availabilityId",
DROP COLUMN "cancellationReason",
DROP COLUMN "completedAt",
DROP COLUMN "paymentIntentId",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentReceiptUrl",
ADD COLUMN     "bookingDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT;

-- DropTable
DROP TABLE "ActivityAvailability";

-- CreateIndex
CREATE INDEX "ActivityBooking_bookingDate_idx" ON "ActivityBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "ActivityBooking_activityId_bookingDate_startTime_endTime_idx" ON "ActivityBooking"("activityId", "bookingDate", "startTime", "endTime");
