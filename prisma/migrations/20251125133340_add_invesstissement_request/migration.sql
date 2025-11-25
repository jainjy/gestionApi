-- CreateTable
CREATE TABLE "investment_requests" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "pays_interet" TEXT NOT NULL,
    "type_investissement" TEXT NOT NULL,
    "budget" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'en_attente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "investment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_requests_email_idx" ON "investment_requests"("email");

-- CreateIndex
CREATE INDEX "investment_requests_status_idx" ON "investment_requests"("status");

-- CreateIndex
CREATE INDEX "investment_requests_created_at_idx" ON "investment_requests"("created_at");

-- CreateIndex
CREATE INDEX "investment_requests_pays_interet_idx" ON "investment_requests"("pays_interet");

-- CreateIndex
CREATE INDEX "investment_requests_userId_idx" ON "investment_requests"("userId");
