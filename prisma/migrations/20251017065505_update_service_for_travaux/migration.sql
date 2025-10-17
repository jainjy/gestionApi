-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
