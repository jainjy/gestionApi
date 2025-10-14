/*
  Warnings:

  - Added the required column `category` to the `BlogArticle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "comments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "readTime" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "BlogArticle" ADD CONSTRAINT "BlogArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
