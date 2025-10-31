-- RemoveField
ALTER TABLE "Demande" DROP COLUMN IF EXISTS "devis";

-- AddField
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "_DevisClientToUser" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "_DevisProviderToUser" TEXT;

-- ModifyField
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;