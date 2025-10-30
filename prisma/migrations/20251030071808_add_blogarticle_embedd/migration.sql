-- AlterTable
ALTER TABLE "BlogArticle" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Metier" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "embedding" vector(768);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "embedding" vector(768);
