-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "userProprietaireId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userProprietaireId_idx" ON "Notification"("userProprietaireId");
