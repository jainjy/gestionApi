-- CreateTable
CREATE TABLE "portraits_locaux" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "generation" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Réunion',
    "location" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "description" TEXT,
    "story" TEXT NOT NULL,
    "shortStory" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "region" TEXT,
    "categories" TEXT[],
    "tags" TEXT[],
    "images" TEXT[],
    "interviewAudioUrl" TEXT,
    "interviewDuration" TEXT,
    "interviewTopics" TEXT[],
    "wisdom" TEXT[],
    "instagramHandle" TEXT,
    "facebookHandle" TEXT,
    "youtubeHandle" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "listens" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "portraits_locaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portrait_shares" (
    "id" TEXT NOT NULL,
    "portraitId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "portrait_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portrait_listens" (
    "id" TEXT NOT NULL,
    "portraitId" TEXT NOT NULL,
    "userId" TEXT,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "listenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "portrait_listens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portrait_comments" (
    "id" TEXT NOT NULL,
    "portraitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "portrait_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portraits_locaux_generation_idx" ON "portraits_locaux"("generation");

-- CreateIndex
CREATE INDEX "portraits_locaux_country_idx" ON "portraits_locaux"("country");

-- CreateIndex
CREATE INDEX "portraits_locaux_location_idx" ON "portraits_locaux"("location");

-- CreateIndex
CREATE INDEX "portraits_locaux_featured_idx" ON "portraits_locaux"("featured");

-- CreateIndex
CREATE INDEX "portraits_locaux_isActive_idx" ON "portraits_locaux"("isActive");

-- CreateIndex
CREATE INDEX "portraits_locaux_createdAt_idx" ON "portraits_locaux"("createdAt");

-- CreateIndex
CREATE INDEX "portraits_locaux_categories_idx" ON "portraits_locaux"("categories");

-- CreateIndex
CREATE INDEX "portrait_shares_portraitId_idx" ON "portrait_shares"("portraitId");

-- CreateIndex
CREATE INDEX "portrait_shares_userId_idx" ON "portrait_shares"("userId");

-- CreateIndex
CREATE INDEX "portrait_shares_platform_idx" ON "portrait_shares"("platform");

-- CreateIndex
CREATE INDEX "portrait_shares_sharedAt_idx" ON "portrait_shares"("sharedAt");

-- CreateIndex
CREATE INDEX "portrait_listens_portraitId_idx" ON "portrait_listens"("portraitId");

-- CreateIndex
CREATE INDEX "portrait_listens_userId_idx" ON "portrait_listens"("userId");

-- CreateIndex
CREATE INDEX "portrait_listens_listenedAt_idx" ON "portrait_listens"("listenedAt");

-- CreateIndex
CREATE INDEX "portrait_listens_completed_idx" ON "portrait_listens"("completed");

-- CreateIndex
CREATE INDEX "portrait_comments_portraitId_idx" ON "portrait_comments"("portraitId");

-- CreateIndex
CREATE INDEX "portrait_comments_userId_idx" ON "portrait_comments"("userId");

-- CreateIndex
CREATE INDEX "portrait_comments_parentId_idx" ON "portrait_comments"("parentId");

-- CreateIndex
CREATE INDEX "portrait_comments_createdAt_idx" ON "portrait_comments"("createdAt");
