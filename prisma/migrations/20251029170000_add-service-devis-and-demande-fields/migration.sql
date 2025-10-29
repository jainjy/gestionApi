
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='Service' AND column_name='devis'
  ) THEN
    ALTER TABLE "Service" ADD COLUMN "devis" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='Demande' AND column_name='propertyId'
  ) THEN
    ALTER TABLE "Demande" ADD COLUMN "propertyId" TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='Demande' AND column_name='dateSouhaitee'
  ) THEN
    ALTER TABLE "Demande" ADD COLUMN "dateSouhaitee" TIMESTAMP;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='Demande' AND column_name='heureSouhaitee'
  ) THEN
    ALTER TABLE "Demande" ADD COLUMN "heureSouhaitee" TEXT;
  END IF;
END $$;

ALTER TABLE "Demande"
  ADD CONSTRAINT "Demande_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE SET NULL;