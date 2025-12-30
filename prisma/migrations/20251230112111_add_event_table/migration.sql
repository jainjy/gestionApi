-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscoveryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" VARCHAR(10),
    "endTime" VARCHAR(10),
    "location" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "category" VARCHAR(100) NOT NULL,
    "subCategory" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPrice" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "image" VARCHAR(500),
    "images" JSONB DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "organizer" VARCHAR(255),
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(20),
    "website" VARCHAR(255),
    "tags" JSONB DEFAULT '[]',
    "requirements" TEXT,
    "highlights" JSONB DEFAULT '[]',
    "duration" VARCHAR(50),
    "difficulty" "Difficulty",
    "targetAudience" JSONB DEFAULT '[]',
    "includes" JSONB DEFAULT '[]',
    "notIncludes" JSONB DEFAULT '[]',
    "cancellationPolicy" TEXT,
    "refundPolicy" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "registrationDeadline" TIMESTAMP(3),
    "earlyBirdDeadline" TIMESTAMP(3),
    "earlyBirdPrice" DOUBLE PRECISION DEFAULT 0,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discovery" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "difficulty" "Difficulty" NOT NULL,
    "duration" VARCHAR(100),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" VARCHAR(500),
    "images" JSONB DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "DiscoveryStatus" NOT NULL DEFAULT 'DRAFT',
    "organizer" VARCHAR(255),
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(20),
    "website" VARCHAR(255),
    "tags" JSONB DEFAULT '[]',
    "highlights" JSONB DEFAULT '[]',
    "recommendations" TEXT,
    "bestSeason" JSONB DEFAULT '[]',
    "bestTime" JSONB DEFAULT '[]',
    "accessibility" TEXT,
    "equipment" JSONB DEFAULT '[]',
    "safety" TEXT,
    "price" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "includes" JSONB DEFAULT '[]',
    "notIncludes" JSONB DEFAULT '[]',
    "groupSizeMin" INTEGER DEFAULT 1,
    "groupSizeMax" INTEGER DEFAULT 10,
    "ageRestrictionMin" INTEGER,
    "ageRestrictionMax" INTEGER,
    "languages" JSONB DEFAULT '[]',
    "guideIncluded" BOOLEAN NOT NULL DEFAULT false,
    "transportIncluded" BOOLEAN NOT NULL DEFAULT false,
    "mealIncluded" BOOLEAN NOT NULL DEFAULT false,
    "parkingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "wifiAvailable" BOOLEAN NOT NULL DEFAULT false,
    "familyFriendly" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "sustainabilityRating" DOUBLE PRECISION DEFAULT 0,
    "carbonFootprint" VARCHAR(100),
    "coordinates" JSONB DEFAULT '{}',
    "includedServices" JSONB DEFAULT '[]',
    "requirements" JSONB DEFAULT '[]',
    "maxVisitors" INTEGER DEFAULT 0,
    "availableDates" JSONB DEFAULT '[]',
    "visits" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_featured_idx" ON "Event"("featured");

-- CreateIndex
CREATE INDEX "Event_visibility_idx" ON "Event"("visibility");

-- CreateIndex
CREATE INDEX "Discovery_status_idx" ON "Discovery"("status");

-- CreateIndex
CREATE INDEX "Discovery_type_idx" ON "Discovery"("type");

-- CreateIndex
CREATE INDEX "Discovery_featured_idx" ON "Discovery"("featured");

-- CreateIndex
CREATE INDEX "Discovery_difficulty_idx" ON "Discovery"("difficulty");
