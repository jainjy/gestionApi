-- CreateTable
CREATE TABLE "RendezvousEntreprise" (
    "id" TEXT NOT NULL,
    "nomComplet" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "projetDetails" TEXT,
    "dateChoisie" TEXT NOT NULL,
    "heureChoisie" TEXT NOT NULL,
    "userId" TEXT,
    "etat" TEXT NOT NULL DEFAULT 'nouveau',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RendezvousEntreprise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RendezvousEntreprise_email_idx" ON "RendezvousEntreprise"("email");

-- CreateIndex
CREATE INDEX "RendezvousEntreprise_creeLe_idx" ON "RendezvousEntreprise"("creeLe");

-- CreateIndex
CREATE INDEX "RendezvousEntreprise_etat_idx" ON "RendezvousEntreprise"("etat");
