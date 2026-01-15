/*
  Warnings:

  - The values [SPORT] on the enum `MetierCategorie` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetierCategorie_new" AS ENUM ('IMMOBILIER', 'ARTISAN', 'TOURISME', 'BIEN_ETRE', 'COMMERCE', 'AUTRE');
ALTER TABLE "public"."Metier" ALTER COLUMN "categorie" DROP DEFAULT;
ALTER TABLE "Metier" ALTER COLUMN "categorie" TYPE "MetierCategorie_new" USING ("categorie"::text::"MetierCategorie_new");
ALTER TYPE "MetierCategorie" RENAME TO "MetierCategorie_old";
ALTER TYPE "MetierCategorie_new" RENAME TO "MetierCategorie";
DROP TYPE "public"."MetierCategorie_old";
ALTER TABLE "Metier" ALTER COLUMN "categorie" SET DEFAULT 'AUTRE';
COMMIT;
