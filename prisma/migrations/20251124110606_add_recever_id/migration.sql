-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "receiverId" TEXT;

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");
