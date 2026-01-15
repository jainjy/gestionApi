-- CreateEnum
CREATE TYPE "MetierCategorie" AS ENUM ('IMMOBILIER', 'ARTISAN', 'TOURISME', 'SPORT', 'BIEN_ETRE', 'COMMERCE', 'AUTRE');

-- AlterTable
ALTER TABLE "Metier" ADD COLUMN     "categorie" "MetierCategorie" NOT NULL DEFAULT 'AUTRE';
