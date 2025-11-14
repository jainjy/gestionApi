-- CreateTable
CREATE TABLE IF NOT EXISTS "MediaCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Podcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "audioFile" TEXT,
    "audioUrl" TEXT,
    "imageUrl" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "authorId" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "listens" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "videoFile" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "authorId" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserMediaFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMediaFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WellBeingStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "favoriteCategory" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WellBeingStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MediaCategory_name_key" ON "MediaCategory"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MediaCategory_type_idx" ON "MediaCategory"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserMediaFavorite_userId_idx" ON "UserMediaFavorite"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserMediaFavorite_mediaId_mediaType_idx" ON "UserMediaFavorite"("mediaId", "mediaType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserMediaFavorite_userId_mediaId_mediaType_key" ON "UserMediaFavorite"("userId", "mediaId", "mediaType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WellBeingStats_userId_key" ON "WellBeingStats"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WellBeingStats_userId_idx" ON "WellBeingStats"("userId");
