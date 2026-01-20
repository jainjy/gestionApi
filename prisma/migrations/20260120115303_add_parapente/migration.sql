-- CreateTable
CREATE TABLE "Parapente" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "images" TEXT[],
    "idUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parapente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Parapente_idUser_idx" ON "Parapente"("idUser");
