-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "idpro" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "duree" TIMESTAMP(3) NOT NULL,
    "media" TEXT,
    "status" TEXT NOT NULL,
    "categorie" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Projet_idpro_idx" ON "Projet"("idpro");
