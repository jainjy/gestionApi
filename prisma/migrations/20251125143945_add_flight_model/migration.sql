-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "idPrestataire" TEXT NOT NULL,
    "compagnie" TEXT NOT NULL,
    "numeroVol" TEXT NOT NULL,
    "departVille" TEXT NOT NULL,
    "departDateHeure" TIMESTAMP(3) NOT NULL,
    "arriveeVille" TEXT NOT NULL,
    "arriveeDateHeure" TIMESTAMP(3) NOT NULL,
    "duree" TEXT NOT NULL,
    "escales" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "classe" TEXT NOT NULL,
    "services" TEXT[],
    "image" TEXT,
    "idUser" TEXT,
    "nbrPersonne" INTEGER,
    "place" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);
