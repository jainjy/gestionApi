-- DropIndex
DROP INDEX "public"."Product_productType_idx";

-- DropIndex
DROP INDEX "public"."report_destinations_email_key";

-- CreateTable
CREATE TABLE "TouristicPlaceBooking" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "visitTime" TEXT NOT NULL,
    "numberOfTickets" INTEGER NOT NULL,
    "ticketType" TEXT NOT NULL DEFAULT 'adult',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialRequests" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'card',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "stripePaymentIntent" TEXT,
    "confirmationNumber" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "TouristicPlaceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TouristicPlaceBooking_confirmationNumber_key" ON "TouristicPlaceBooking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_placeId_idx" ON "TouristicPlaceBooking"("placeId");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_userId_idx" ON "TouristicPlaceBooking"("userId");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_status_idx" ON "TouristicPlaceBooking"("status");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_paymentStatus_idx" ON "TouristicPlaceBooking"("paymentStatus");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_visitDate_idx" ON "TouristicPlaceBooking"("visitDate");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_confirmationNumber_idx" ON "TouristicPlaceBooking"("confirmationNumber");

-- CreateIndex
CREATE INDEX "TouristicPlaceBooking_createdAt_idx" ON "TouristicPlaceBooking"("createdAt");
