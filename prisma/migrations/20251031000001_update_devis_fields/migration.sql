-- AlterTable
ALTER TABLE "Devis" ADD COLUMN "nom" TEXT NOT NULL,
                    ADD COLUMN "prenom" TEXT NOT NULL,
                    ADD COLUMN "email" TEXT NOT NULL,
                    ADD COLUMN "telephone" TEXT NOT NULL,
                    ADD COLUMN "adresse" TEXT,
                    ADD COLUMN "typeBien" TEXT,
                    ADD COLUMN "message" TEXT,
                    ADD COLUMN "dateSouhaitee" TIMESTAMP(3),
                    DROP COLUMN "description";