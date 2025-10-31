-- Modification de la table Demande
ALTER TABLE "Demande" ADD COLUMN IF NOT EXISTS "devis" TEXT;

-- La relation devis_demande est déjà gérée par Prisma via la relation Devis[], 
-- nous n'avons pas besoin de modifier la structure de la base de données pour cela
-- car c'est juste un renommage au niveau du modèle Prisma.