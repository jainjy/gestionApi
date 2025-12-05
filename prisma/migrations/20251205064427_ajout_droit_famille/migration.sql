-- CreateTable
CREATE TABLE "DroitFamille" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "serviceType" TEXT,
    "sousType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DroitFamille_pkey" PRIMARY KEY ("id")
);
