-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'PDF', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."EvenementType" AS ENUM ('DEMANDE_ENVOYEE', 'ARTISAN_ACCEPTE', 'ARTISAN_REFUSE', 'PROPOSITION_RENDEZ_VOUS', 'PROPOSITION_DEVIS', 'CLIENT_SIGNE', 'RENDEZ_VOUS_FIXE', 'FACTURE_ENVOYEE', 'TRAVAUX_TERMINES', 'AVIS_LAISSE', 'CLIENT_REFUSE', 'GENERIC');

-- AlterTable
ALTER TABLE "public"."BlogArticle" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "allergens" TEXT[],
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "foodCategory" TEXT,
ADD COLUMN     "isOrganic" BOOLEAN DEFAULT false,
ADD COLUMN     "isPerishable" BOOLEAN DEFAULT false,
ADD COLUMN     "nutritionalInfo" JSONB,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "productType" TEXT DEFAULT 'general',
ADD COLUMN     "storageTips" TEXT,
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "titre" TEXT,
    "demandeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createurId" TEXT NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "urlFichier" TEXT,
    "nomFichier" TEXT,
    "typeFichier" TEXT,
    "evenementType" "public"."EvenementType",
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_demandeId_idx" ON "public"."Conversation"("demandeId");

-- CreateIndex
CREATE INDEX "Conversation_createurId_idx" ON "public"."Conversation"("createurId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "public"."ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "public"."ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "public"."ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "public"."Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_expediteurId_idx" ON "public"."Message"("expediteurId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_evenementType_idx" ON "public"."Message"("evenementType");

-- CreateIndex
CREATE INDEX "Demande_propertyId_idx" ON "public"."Demande"("propertyId");

-- CreateIndex
CREATE INDEX "Demande_createdById_idx" ON "public"."Demande"("createdById");

-- CreateIndex
CREATE INDEX "Demande_serviceId_idx" ON "public"."Demande"("serviceId");

-- CreateIndex
CREATE INDEX "Demande_statut_idx" ON "public"."Demande"("statut");

-- CreateIndex
CREATE INDEX "Demande_createdAt_idx" ON "public"."Demande"("createdAt");

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "public"."Product"("productType");

-- CreateIndex
CREATE INDEX "Product_foodCategory_idx" ON "public"."Product"("foodCategory");
