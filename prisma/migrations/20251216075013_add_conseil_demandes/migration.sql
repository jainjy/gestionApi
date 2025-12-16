-- CreateTable
CREATE TABLE "ConseilType" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT[],
    "duration" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConseilType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeConseil" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "conseilType" TEXT NOT NULL,
    "besoin" TEXT NOT NULL,
    "budget" TEXT NOT NULL DEFAULT 'surdevis',
    "message" TEXT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "entreprise" TEXT,
    "serviceId" INTEGER,
    "metierId" INTEGER,
    "expertId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "origine" TEXT NOT NULL DEFAULT 'page_conseil',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeConseil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiviConseil" (
    "id" SERIAL NOT NULL,
    "demandeConseilId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'message',
    "rendezVous" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuiviConseil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConseilType_category_idx" ON "ConseilType"("category");

-- CreateIndex
CREATE INDEX "ConseilType_isActive_idx" ON "ConseilType"("isActive");

-- CreateIndex
CREATE INDEX "ConseilType_ordre_idx" ON "ConseilType"("ordre");

-- CreateIndex
CREATE INDEX "DemandeConseil_userId_idx" ON "DemandeConseil"("userId");

-- CreateIndex
CREATE INDEX "DemandeConseil_expertId_idx" ON "DemandeConseil"("expertId");

-- CreateIndex
CREATE INDEX "DemandeConseil_statut_idx" ON "DemandeConseil"("statut");

-- CreateIndex
CREATE INDEX "DemandeConseil_createdAt_idx" ON "DemandeConseil"("createdAt");

-- CreateIndex
CREATE INDEX "SuiviConseil_demandeConseilId_idx" ON "SuiviConseil"("demandeConseilId");

-- CreateIndex
CREATE INDEX "SuiviConseil_userId_idx" ON "SuiviConseil"("userId");

-- CreateIndex
CREATE INDEX "SuiviConseil_createdAt_idx" ON "SuiviConseil"("createdAt");
