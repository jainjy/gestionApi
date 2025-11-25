-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'session',
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxParticipants" INTEGER NOT NULL DEFAULT 1,
    "materialsIncluded" BOOLEAN NOT NULL DEFAULT false,
    "level" TEXT NOT NULL DEFAULT 'Tous niveaux',
    "imageUrl" TEXT,
    "documents" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAvailability" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CourseAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAvailability_courseId_idx" ON "CourseAvailability"("courseId");

-- CreateIndex
CREATE INDEX "CourseAvailability_dayOfWeek_idx" ON "CourseAvailability"("dayOfWeek");
