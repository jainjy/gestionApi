-- AlterTable (ajout seulement si les colonnes n’existent pas déjà)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'clickCount') THEN
        ALTER TABLE "Product" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'purchaseCount') THEN
        ALTER TABLE "Product" ADD COLUMN "purchaseCount" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'viewCount') THEN
        ALTER TABLE "Product" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "UserPreference"
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "interestScore" SET DEFAULT 0.5;
