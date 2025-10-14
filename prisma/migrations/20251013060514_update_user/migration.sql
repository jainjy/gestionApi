-- DropForeignKey
ALTER TABLE "public"."BlogArticle" DROP CONSTRAINT "BlogArticle_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vendor" DROP CONSTRAINT "Vendor_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
