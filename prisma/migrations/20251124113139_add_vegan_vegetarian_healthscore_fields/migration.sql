-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "healthScore" INTEGER DEFAULT 0,
ADD COLUMN     "isVegan" BOOLEAN DEFAULT false,
ADD COLUMN     "isVegetarian" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isVegan_idx" ON "Product"("isVegan");

-- CreateIndex
CREATE INDEX "Product_isVegetarian_idx" ON "Product"("isVegetarian");

-- CreateIndex
CREATE INDEX "Product_healthScore_idx" ON "Product"("healthScore");
