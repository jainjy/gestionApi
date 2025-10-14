/*
  Warnings:

  - The `coverageArea` column on the `Vendor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "coverageArea",
ADD COLUMN     "coverageArea" TEXT[];
