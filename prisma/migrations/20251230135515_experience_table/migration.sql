-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "highlights" TEXT[],
    "images" TEXT[],
    "difficulty" TEXT NOT NULL,
    "groupSize" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "included" TEXT[],
    "requirements" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "guideId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceBooking" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "specialRequests" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmationNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExperienceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceReview" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceFAQ" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceMedia" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceFavorite" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");

-- CreateIndex
CREATE INDEX "Experience_category_idx" ON "Experience"("category");

-- CreateIndex
CREATE INDEX "Experience_createdById_idx" ON "Experience"("createdById");

-- CreateIndex
CREATE INDEX "Experience_guideId_idx" ON "Experience"("guideId");

-- CreateIndex
CREATE INDEX "Experience_isActive_idx" ON "Experience"("isActive");

-- CreateIndex
CREATE INDEX "Experience_isFeatured_idx" ON "Experience"("isFeatured");

-- CreateIndex
CREATE INDEX "Experience_createdAt_idx" ON "Experience"("createdAt");

-- CreateIndex
CREATE INDEX "Experience_price_idx" ON "Experience"("price");

-- CreateIndex
CREATE INDEX "Experience_difficulty_idx" ON "Experience"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceBooking_confirmationNumber_key" ON "ExperienceBooking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "ExperienceBooking_experienceId_idx" ON "ExperienceBooking"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceBooking_userId_idx" ON "ExperienceBooking"("userId");

-- CreateIndex
CREATE INDEX "ExperienceBooking_status_idx" ON "ExperienceBooking"("status");

-- CreateIndex
CREATE INDEX "ExperienceBooking_confirmationNumber_idx" ON "ExperienceBooking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "ExperienceBooking_createdAt_idx" ON "ExperienceBooking"("createdAt");

-- CreateIndex
CREATE INDEX "ExperienceBooking_checkIn_idx" ON "ExperienceBooking"("checkIn");

-- CreateIndex
CREATE INDEX "ExperienceBooking_checkOut_idx" ON "ExperienceBooking"("checkOut");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceReview_bookingId_key" ON "ExperienceReview"("bookingId");

-- CreateIndex
CREATE INDEX "ExperienceReview_experienceId_idx" ON "ExperienceReview"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceReview_userId_idx" ON "ExperienceReview"("userId");

-- CreateIndex
CREATE INDEX "ExperienceReview_rating_idx" ON "ExperienceReview"("rating");

-- CreateIndex
CREATE INDEX "ExperienceReview_createdAt_idx" ON "ExperienceReview"("createdAt");

-- CreateIndex
CREATE INDEX "ExperienceReview_verified_idx" ON "ExperienceReview"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceReview_experienceId_userId_key" ON "ExperienceReview"("experienceId", "userId");

-- CreateIndex
CREATE INDEX "ExperienceFAQ_experienceId_idx" ON "ExperienceFAQ"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceFAQ_order_idx" ON "ExperienceFAQ"("order");

-- CreateIndex
CREATE INDEX "ExperienceFAQ_isActive_idx" ON "ExperienceFAQ"("isActive");

-- CreateIndex
CREATE INDEX "ExperienceMedia_experienceId_idx" ON "ExperienceMedia"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceMedia_sortOrder_idx" ON "ExperienceMedia"("sortOrder");

-- CreateIndex
CREATE INDEX "ExperienceMedia_isPrimary_idx" ON "ExperienceMedia"("isPrimary");

-- CreateIndex
CREATE INDEX "ExperienceFavorite_userId_idx" ON "ExperienceFavorite"("userId");

-- CreateIndex
CREATE INDEX "ExperienceFavorite_experienceId_idx" ON "ExperienceFavorite"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceFavorite_createdAt_idx" ON "ExperienceFavorite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceFavorite_userId_experienceId_key" ON "ExperienceFavorite"("userId", "experienceId");
