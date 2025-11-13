-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categorie" TEXT,
    "description" TEXT,
    "dateExpiration" TIMESTAMP(3),
    "dateUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'VALIDE',
    "taille" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "tags" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratType" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "contenu" TEXT NOT NULL,
    "variables" TEXT[],
    "utilise" INTEGER NOT NULL DEFAULT 0,
    "derniereModification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentArchive" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateSignature" TIMESTAMP(3) NOT NULL,
    "parties" TEXT[],
    "bien" TEXT,
    "reference" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'SIGNÉ',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_statut_idx" ON "Document"("statut");

-- CreateIndex
CREATE INDEX "Document_categorie_idx" ON "Document"("categorie");

-- CreateIndex
CREATE INDEX "Document_dateExpiration_idx" ON "Document"("dateExpiration");

-- CreateIndex
CREATE INDEX "ContratType_userId_idx" ON "ContratType"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentArchive_reference_key" ON "DocumentArchive"("reference");

-- CreateIndex
CREATE INDEX "DocumentArchive_userId_idx" ON "DocumentArchive"("userId");

-- CreateIndex
CREATE INDEX "DocumentArchive_dateSignature_idx" ON "DocumentArchive"("dateSignature");
