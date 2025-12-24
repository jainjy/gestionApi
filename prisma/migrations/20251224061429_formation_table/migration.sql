-- CreateTable
CREATE TABLE "formations" (
    "id" SERIAL NOT NULL,
    "proId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "certification" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "requirements" TEXT,
    "program" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "isFinanced" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplois" (
    "id" SERIAL NOT NULL,
    "proId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typeContrat" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "salaire" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "remotePossible" BOOLEAN NOT NULL DEFAULT false,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "missions" TEXT[],
    "competences" TEXT[],
    "avantages" TEXT[],
    "datePublication" TIMESTAMP(3),
    "dateLimite" TIMESTAMP(3),
    "nombrePostes" INTEGER NOT NULL DEFAULT 1,
    "candidaturesCount" INTEGER NOT NULL DEFAULT 0,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emplois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternance_stages" (
    "id" SERIAL NOT NULL,
    "proId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "niveauEtude" TEXT NOT NULL,
    "duree" TEXT NOT NULL,
    "remuneration" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "missions" TEXT[],
    "competences" TEXT[],
    "avantages" TEXT[],
    "ecolePartenaire" TEXT,
    "rythmeAlternance" TEXT,
    "pourcentageTemps" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "candidaturesCount" INTEGER NOT NULL DEFAULT 0,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alternance_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "offreId" INTEGER NOT NULL,
    "offreType" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "messageMotivation" TEXT,
    "cvUrl" TEXT,
    "lettreMotivationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formations_proId_idx" ON "formations"("proId");

-- CreateIndex
CREATE INDEX "formations_status_idx" ON "formations"("status");

-- CreateIndex
CREATE INDEX "formations_category_idx" ON "formations"("category");

-- CreateIndex
CREATE INDEX "formations_createdAt_idx" ON "formations"("createdAt");

-- CreateIndex
CREATE INDEX "emplois_proId_idx" ON "emplois"("proId");

-- CreateIndex
CREATE INDEX "emplois_status_idx" ON "emplois"("status");

-- CreateIndex
CREATE INDEX "emplois_typeContrat_idx" ON "emplois"("typeContrat");

-- CreateIndex
CREATE INDEX "emplois_secteur_idx" ON "emplois"("secteur");

-- CreateIndex
CREATE INDEX "emplois_urgent_idx" ON "emplois"("urgent");

-- CreateIndex
CREATE INDEX "emplois_createdAt_idx" ON "emplois"("createdAt");

-- CreateIndex
CREATE INDEX "alternance_stages_proId_idx" ON "alternance_stages"("proId");

-- CreateIndex
CREATE INDEX "alternance_stages_status_idx" ON "alternance_stages"("status");

-- CreateIndex
CREATE INDEX "alternance_stages_type_idx" ON "alternance_stages"("type");

-- CreateIndex
CREATE INDEX "alternance_stages_niveauEtude_idx" ON "alternance_stages"("niveauEtude");

-- CreateIndex
CREATE INDEX "alternance_stages_urgent_idx" ON "alternance_stages"("urgent");

-- CreateIndex
CREATE INDEX "alternance_stages_createdAt_idx" ON "alternance_stages"("createdAt");

-- CreateIndex
CREATE INDEX "candidatures_userId_idx" ON "candidatures"("userId");

-- CreateIndex
CREATE INDEX "candidatures_offreId_offreType_idx" ON "candidatures"("offreId", "offreType");

-- CreateIndex
CREATE INDEX "candidatures_statut_idx" ON "candidatures"("statut");

-- CreateIndex
CREATE INDEX "candidatures_createdAt_idx" ON "candidatures"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_userId_offreId_offreType_key" ON "candidatures"("userId", "offreId", "offreType");
