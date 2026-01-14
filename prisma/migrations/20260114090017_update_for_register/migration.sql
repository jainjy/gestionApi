-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "visibilityOption" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "isVisibilityEnhanced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "professionalCategory" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "professionalCategory" TEXT;
