-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('en_attente', 'confirmee', 'annulee', 'terminee');

-- CreateTable
CREATE TABLE "reservation_cours" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "participants" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "StatutReservation" NOT NULL DEFAULT 'en_attente',
    "notes" TEXT,
    "raisonAnnulation" TEXT,
    "professionalId" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "professionalName" TEXT NOT NULL,
    "courseCategory" TEXT NOT NULL,
    "courseDuration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateAnnulation" TIMESTAMP(3),

    CONSTRAINT "reservation_cours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservation_cours_courseId_idx" ON "reservation_cours"("courseId");

-- CreateIndex
CREATE INDEX "reservation_cours_userId_idx" ON "reservation_cours"("userId");

-- CreateIndex
CREATE INDEX "reservation_cours_status_idx" ON "reservation_cours"("status");

-- CreateIndex
CREATE INDEX "reservation_cours_date_idx" ON "reservation_cours"("date");

-- CreateIndex
CREATE INDEX "reservation_cours_professionalId_idx" ON "reservation_cours"("professionalId");
