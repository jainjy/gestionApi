/*
  Warnings:

  - Added the required column `userId` to the `Audit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "userId" TEXT NOT NULL;
