-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityGuide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[],
    "languages" TEXT[],
    "experience" INTEGER,
    "certifications" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "duration" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "minParticipants" INTEGER NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "meetingPoint" TEXT,
    "included" TEXT[],
    "requirements" TEXT[],
    "highlights" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "guideId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityMedia" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFAQ" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringAvailability" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAvailability" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "bookedSlots" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityBooking" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participants" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "stripePaymentIntent" TEXT,
    "specialRequests" TEXT,
    "cancellationReason" TEXT,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ActivityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReview" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFavorite" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityShare" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sharedWith" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPromotion" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minParticipants" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityStatistics" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "cancelledBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalFavorites" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideContact" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "activityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_name_key" ON "ActivityCategory"("name");

-- CreateIndex
CREATE INDEX "ActivityCategory_isActive_idx" ON "ActivityCategory"("isActive");

-- CreateIndex
CREATE INDEX "ActivityCategory_sortOrder_idx" ON "ActivityCategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityGuide_userId_key" ON "ActivityGuide"("userId");

-- CreateIndex
CREATE INDEX "ActivityGuide_isVerified_idx" ON "ActivityGuide"("isVerified");

-- CreateIndex
CREATE INDEX "ActivityGuide_rating_idx" ON "ActivityGuide"("rating");

-- CreateIndex
CREATE INDEX "Activity_guideId_idx" ON "Activity"("guideId");

-- CreateIndex
CREATE INDEX "Activity_categoryId_idx" ON "Activity"("categoryId");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_featured_idx" ON "Activity"("featured");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityMedia_activityId_idx" ON "ActivityMedia"("activityId");

-- CreateIndex
CREATE INDEX "ActivityMedia_sortOrder_idx" ON "ActivityMedia"("sortOrder");

-- CreateIndex
CREATE INDEX "ActivityFAQ_activityId_idx" ON "ActivityFAQ"("activityId");

-- CreateIndex
CREATE INDEX "ActivityFAQ_isActive_idx" ON "ActivityFAQ"("isActive");

-- CreateIndex
CREATE INDEX "ActivityFAQ_order_idx" ON "ActivityFAQ"("order");

-- CreateIndex
CREATE INDEX "RecurringAvailability_guideId_idx" ON "RecurringAvailability"("guideId");

-- CreateIndex
CREATE INDEX "RecurringAvailability_dayOfWeek_idx" ON "RecurringAvailability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringAvailability_guideId_dayOfWeek_key" ON "RecurringAvailability"("guideId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ActivityAvailability_activityId_idx" ON "ActivityAvailability"("activityId");

-- CreateIndex
CREATE INDEX "ActivityAvailability_date_idx" ON "ActivityAvailability"("date");

-- CreateIndex
CREATE INDEX "ActivityAvailability_status_idx" ON "ActivityAvailability"("status");

-- CreateIndex
CREATE INDEX "ActivityBooking_activityId_idx" ON "ActivityBooking"("activityId");

-- CreateIndex
CREATE INDEX "ActivityBooking_userId_idx" ON "ActivityBooking"("userId");

-- CreateIndex
CREATE INDEX "ActivityBooking_status_idx" ON "ActivityBooking"("status");

-- CreateIndex
CREATE INDEX "ActivityBooking_paymentStatus_idx" ON "ActivityBooking"("paymentStatus");

-- CreateIndex
CREATE INDEX "ActivityBooking_bookedAt_idx" ON "ActivityBooking"("bookedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReview_bookingId_key" ON "ActivityReview"("bookingId");

-- CreateIndex
CREATE INDEX "ActivityReview_activityId_idx" ON "ActivityReview"("activityId");

-- CreateIndex
CREATE INDEX "ActivityReview_userId_idx" ON "ActivityReview"("userId");

-- CreateIndex
CREATE INDEX "ActivityReview_rating_idx" ON "ActivityReview"("rating");

-- CreateIndex
CREATE INDEX "ActivityReview_createdAt_idx" ON "ActivityReview"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityFavorite_userId_idx" ON "ActivityFavorite"("userId");

-- CreateIndex
CREATE INDEX "ActivityFavorite_activityId_idx" ON "ActivityFavorite"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityFavorite_userId_activityId_key" ON "ActivityFavorite"("userId", "activityId");

-- CreateIndex
CREATE INDEX "ActivityShare_userId_idx" ON "ActivityShare"("userId");

-- CreateIndex
CREATE INDEX "ActivityShare_activityId_idx" ON "ActivityShare"("activityId");

-- CreateIndex
CREATE INDEX "ActivityShare_platform_idx" ON "ActivityShare"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityPromotion_code_key" ON "ActivityPromotion"("code");

-- CreateIndex
CREATE INDEX "ActivityPromotion_activityId_idx" ON "ActivityPromotion"("activityId");

-- CreateIndex
CREATE INDEX "ActivityPromotion_code_idx" ON "ActivityPromotion"("code");

-- CreateIndex
CREATE INDEX "ActivityPromotion_isActive_idx" ON "ActivityPromotion"("isActive");

-- CreateIndex
CREATE INDEX "ActivityPromotion_validFrom_validUntil_idx" ON "ActivityPromotion"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityStatistics_activityId_key" ON "ActivityStatistics"("activityId");

-- CreateIndex
CREATE INDEX "ActivityStatistics_activityId_idx" ON "ActivityStatistics"("activityId");

-- CreateIndex
CREATE INDEX "GuideContact_guideId_idx" ON "GuideContact"("guideId");

-- CreateIndex
CREATE INDEX "GuideContact_userId_idx" ON "GuideContact"("userId");

-- CreateIndex
CREATE INDEX "GuideContact_activityId_idx" ON "GuideContact"("activityId");

-- CreateIndex
CREATE INDEX "GuideContact_status_idx" ON "GuideContact"("status");

-- CreateIndex
CREATE INDEX "GuideContact_createdAt_idx" ON "GuideContact"("createdAt");
