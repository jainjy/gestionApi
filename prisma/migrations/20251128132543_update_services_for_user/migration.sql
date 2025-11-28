-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "UtilisateurService" ADD COLUMN     "customDuration" INTEGER,
ADD COLUMN     "customPrice" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Service_createdById_idx" ON "Service"("createdById");

-- CreateIndex
CREATE INDEX "Service_isCustom_idx" ON "Service"("isCustom");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "User_userType_idx" ON "User"("userType");

-- CreateIndex
CREATE INDEX "UtilisateurService_isAvailable_idx" ON "UtilisateurService"("isAvailable");
