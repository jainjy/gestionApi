-- CreateTable
CREATE TABLE "TourismeBooking" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL,
    "infants" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 15.00,
    "specialRequests" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "stripePaymentIntent" TEXT,
    "confirmationNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "TourismeBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourismeBooking_confirmationNumber_key" ON "TourismeBooking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "TourismeBooking_listingId_idx" ON "TourismeBooking"("listingId");

-- CreateIndex
CREATE INDEX "TourismeBooking_userId_idx" ON "TourismeBooking"("userId");

-- CreateIndex
CREATE INDEX "TourismeBooking_status_idx" ON "TourismeBooking"("status");

-- CreateIndex
CREATE INDEX "TourismeBooking_paymentStatus_idx" ON "TourismeBooking"("paymentStatus");

-- CreateIndex
CREATE INDEX "TourismeBooking_createdAt_idx" ON "TourismeBooking"("createdAt");

-- CreateIndex
CREATE INDEX "TourismeBooking_confirmationNumber_idx" ON "TourismeBooking"("confirmationNumber");
