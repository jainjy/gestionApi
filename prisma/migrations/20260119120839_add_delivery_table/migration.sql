-- CreateTable
CREATE TABLE "DeliveryPrice" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPrice_category_key" ON "DeliveryPrice"("category");

-- CreateIndex
CREATE INDEX "DeliveryPrice_category_idx" ON "DeliveryPrice"("category");
