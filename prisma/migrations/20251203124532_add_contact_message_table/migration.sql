-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderPhone" TEXT,
    "userId" TEXT,
    "recipientId" TEXT,
    "serviceId" INTEGER,
    "metierId" INTEGER,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'general',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isReplied" BOOLEAN NOT NULL DEFAULT false,
    "replyMessage" TEXT,
    "repliedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_userId_idx" ON "ContactMessage"("userId");

-- CreateIndex
CREATE INDEX "ContactMessage_recipientId_idx" ON "ContactMessage"("recipientId");

-- CreateIndex
CREATE INDEX "ContactMessage_serviceId_idx" ON "ContactMessage"("serviceId");

-- CreateIndex
CREATE INDEX "ContactMessage_metierId_idx" ON "ContactMessage"("metierId");

-- CreateIndex
CREATE INDEX "ContactMessage_senderEmail_idx" ON "ContactMessage"("senderEmail");

-- CreateIndex
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

-- CreateIndex
CREATE INDEX "ContactMessage_messageType_idx" ON "ContactMessage"("messageType");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_priority_idx" ON "ContactMessage"("priority");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
