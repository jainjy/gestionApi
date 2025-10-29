/*
  Warnings:

  - You are about to drop the column `devis` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Demande" ADD COLUMN     "devis" TEXT;

-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "devis";
