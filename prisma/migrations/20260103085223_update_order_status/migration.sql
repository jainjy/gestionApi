-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryDetails" JSONB,
ADD COLUMN     "deliveryId" TEXT,
ADD COLUMN     "syncStatus" TEXT,
ADD COLUMN     "trackingNumber" TEXT;
