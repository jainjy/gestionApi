/*
  Warnings:

  - You are about to drop the column `audioFile` on the `Podcast` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Podcast` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Podcast` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `Podcast` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `UserMediaFavorite` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the `MediaCategory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,podcastId,mediaType]` on the table `UserMediaFavorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,videoId,mediaType]` on the table `UserMediaFavorite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."UserMediaFavorite_mediaId_mediaType_idx";

-- DropIndex
DROP INDEX "public"."UserMediaFavorite_userId_mediaId_mediaType_key";

-- AlterTable
ALTER TABLE "Podcast" DROP COLUMN "audioFile",
DROP COLUMN "categoryId",
DROP COLUMN "imageUrl",
DROP COLUMN "isPremium",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "UserMediaFavorite" DROP COLUMN "mediaId",
ADD COLUMN     "podcastId" TEXT,
ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT,
ALTER COLUMN "thumbnailUrl" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."MediaCategory";

-- CreateIndex
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");

-- CreateIndex
CREATE INDEX "Podcast_category_idx" ON "Podcast"("category");

-- CreateIndex
CREATE INDEX "Podcast_isActive_idx" ON "Podcast"("isActive");

-- CreateIndex
CREATE INDEX "UserMediaFavorite_podcastId_idx" ON "UserMediaFavorite"("podcastId");

-- CreateIndex
CREATE INDEX "UserMediaFavorite_videoId_idx" ON "UserMediaFavorite"("videoId");

-- CreateIndex
CREATE INDEX "UserMediaFavorite_mediaType_idx" ON "UserMediaFavorite"("mediaType");

-- CreateIndex
CREATE UNIQUE INDEX "UserMediaFavorite_userId_podcastId_mediaType_key" ON "UserMediaFavorite"("userId", "podcastId", "mediaType");

-- CreateIndex
CREATE UNIQUE INDEX "UserMediaFavorite_userId_videoId_mediaType_key" ON "UserMediaFavorite"("userId", "videoId", "mediaType");

-- CreateIndex
CREATE INDEX "Video_authorId_idx" ON "Video"("authorId");

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");

-- CreateIndex
CREATE INDEX "Video_isActive_idx" ON "Video"("isActive");
