-- RenameField: Renommer la relation devis en devis_demande
ALTER TABLE "Devis" DROP CONSTRAINT IF EXISTS "Devis_demandeId_fkey";

-- Renommer les champs et mettre à jour les contraintes
ALTER TABLE "Demande" RENAME COLUMN "devis" TO "devis_demande";

-- Recréer la contrainte de clé étrangère avec le nouveau nom
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_demandeId_fkey" 
    FOREIGN KEY ("demandeId") REFERENCES "Demande"("id") ON DELETE SET NULL ON UPDATE CASCADE;