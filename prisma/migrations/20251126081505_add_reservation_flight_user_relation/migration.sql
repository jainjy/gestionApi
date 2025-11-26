/*
  Warnings:

  - You are about to drop the column `productType` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ReservationFlight" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "idUser" TEXT NOT NULL,
    "idPrestataire" TEXT NOT NULL,
    "nbrPersonne" INTEGER NOT NULL,
    "place" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationFlight_pkey" PRIMARY KEY ("id")
);
