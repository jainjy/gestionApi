-- CreateEnum
CREATE TYPE "RolePersonel" AS ENUM ('commercial', 'pro', 'support');

-- CreateTable
CREATE TABLE "Personel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rolePersonel" "RolePersonel" NOT NULL,
    "description" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "idUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Personel_idUser_idx" ON "Personel"("idUser");
