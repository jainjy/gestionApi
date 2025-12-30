-- AlterTable
ALTER TABLE "Discovery" ADD COLUMN     "userId" VARCHAR(36);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "userId" VARCHAR(36);

-- CreateIndex
CREATE INDEX "Discovery_userId_idx" ON "Discovery"("userId");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");
