-- CreateTable
CREATE TABLE "BlogArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogArticleLike_articleId_idx" ON "BlogArticleLike"("articleId");

-- CreateIndex
CREATE INDEX "BlogArticleLike_userId_idx" ON "BlogArticleLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogArticleLike_articleId_userId_key" ON "BlogArticleLike"("articleId", "userId");

-- CreateIndex
CREATE INDEX "BlogComment_articleId_idx" ON "BlogComment"("articleId");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- CreateIndex
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");

-- CreateIndex
CREATE INDEX "BlogCommentLike_commentId_idx" ON "BlogCommentLike"("commentId");

-- CreateIndex
CREATE INDEX "BlogCommentLike_userId_idx" ON "BlogCommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCommentLike_commentId_userId_key" ON "BlogCommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "BlogArticle_authorId_idx" ON "BlogArticle"("authorId");

-- CreateIndex
CREATE INDEX "BlogArticle_slug_idx" ON "BlogArticle"("slug");
