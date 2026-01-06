-- CreateTable
CREATE TABLE "EntrepreneurInterview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "guest" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "thumbnailUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "listens" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "EntrepreneurInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" TEXT,
    "fileType" TEXT,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "duration" TEXT,
    "speakers" TEXT[],
    "speakerRoles" TEXT[],
    "registered" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "isRegistrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "onlineLink" TEXT,
    "recordingUrl" TEXT,
    "organizerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewInteraction" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "platform" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntrepreneurInterview_slug_key" ON "EntrepreneurInterview"("slug");

-- CreateIndex
CREATE INDEX "EntrepreneurInterview_category_idx" ON "EntrepreneurInterview"("category");

-- CreateIndex
CREATE INDEX "EntrepreneurInterview_status_idx" ON "EntrepreneurInterview"("status");

-- CreateIndex
CREATE INDEX "EntrepreneurInterview_isFeatured_idx" ON "EntrepreneurInterview"("isFeatured");

-- CreateIndex
CREATE INDEX "EntrepreneurInterview_publishedAt_idx" ON "EntrepreneurInterview"("publishedAt");

-- CreateIndex
CREATE INDEX "EntrepreneurInterview_authorId_idx" ON "EntrepreneurInterview"("authorId");

-- CreateIndex
CREATE INDEX "EntrepreneurResource_type_idx" ON "EntrepreneurResource"("type");

-- CreateIndex
CREATE INDEX "EntrepreneurResource_category_idx" ON "EntrepreneurResource"("category");

-- CreateIndex
CREATE INDEX "EntrepreneurResource_status_idx" ON "EntrepreneurResource"("status");

-- CreateIndex
CREATE INDEX "EntrepreneurResource_isFeatured_idx" ON "EntrepreneurResource"("isFeatured");

-- CreateIndex
CREATE INDEX "EntrepreneurResource_authorId_idx" ON "EntrepreneurResource"("authorId");

-- CreateIndex
CREATE INDEX "EntrepreneurEvent_format_idx" ON "EntrepreneurEvent"("format");

-- CreateIndex
CREATE INDEX "EntrepreneurEvent_date_idx" ON "EntrepreneurEvent"("date");

-- CreateIndex
CREATE INDEX "EntrepreneurEvent_status_idx" ON "EntrepreneurEvent"("status");

-- CreateIndex
CREATE INDEX "EntrepreneurEvent_organizerId_idx" ON "EntrepreneurEvent"("organizerId");

-- CreateIndex
CREATE INDEX "InterviewInteraction_interviewId_idx" ON "InterviewInteraction"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewInteraction_userId_idx" ON "InterviewInteraction"("userId");

-- CreateIndex
CREATE INDEX "InterviewInteraction_action_idx" ON "InterviewInteraction"("action");

-- CreateIndex
CREATE INDEX "InterviewInteraction_createdAt_idx" ON "InterviewInteraction"("createdAt");
