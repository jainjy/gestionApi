import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Ajout des métiers Art et Création selon les catégories du frontend...");

    // Métiers organisés selon les 5 catégories de votre application React
    const metiersParCategories = [
      // 1. PHOTOGRAPHIE (PhotographiePage)
      { libelle: "Photographe portrait", categorie: "photographie" },
      { libelle: "Photographe paysage", categorie: "photographie" },
      { libelle: "Photographe événementiel", categorie: "photographie" },
      { libelle: "Photographe artistique", categorie: "photographie" },
      { libelle: "Photographe de mode", categorie: "photographie" },
      
      // 2. SCULPTURE (SculpturePage)
      { libelle: "Sculpteur sur bois", categorie: "sculpture" },
      { libelle: "Sculpteur sur pierre", categorie: "sculpture" },
      { libelle: "Sculpteur sur métal", categorie: "sculpture" },
      { libelle: "Sculpteur terre cuite", categorie: "sculpture" },
      { libelle: "Sculpteur contemporain", categorie: "sculpture" },
      
      // 3. PEINTURE (PeinturePage)
      { libelle: "Peintre à l'huile", categorie: "peinture" },
      { libelle: "Peintre aquarelle", categorie: "peinture" },
      { libelle: "Peintre acrylique", categorie: "peinture" },
      { libelle: "Peintre mural", categorie: "peinture" },
      { libelle: "Peintre abstrait", categorie: "peinture" },
      { libelle: "Peintre portraitiste", categorie: "peinture" },
      
      // 4. ARTISANAT (ArtisanatPage)
      { libelle: "Artisan céramiste", categorie: "artisanat" },
      { libelle: "Artisan tisserand", categorie: "artisanat" },
      { libelle: "Artisan maroquinier", categorie: "artisanat" },
      { libelle: "Artisan bijoutier", categorie: "artisanat" },
      { libelle: "Artisan ébéniste", categorie: "artisanat" },
      { libelle: "Artisan verrier", categorie: "artisanat" },
      { libelle: "Artisan vannier", categorie: "artisanat" },
      { libelle: "Artisan maroquinier d'art", categorie: "artisanat" },
      
      // 5. MARKETPLACE (MarketplaceCreateurs - créateurs divers)
      { libelle: "Créateur textile", categorie: "marketplace" },
      { libelle: "Créateur céramique", categorie: "marketplace" },
      { libelle: "Créateur mobilier", categorie: "marketplace" },
      { libelle: "Créateur maroquinerie", categorie: "marketplace" },
      { libelle: "Créateur verre soufflé", categorie: "marketplace" },
      { libelle: "Créateur bijoux textile", categorie: "marketplace" }
    ];

    console.log(`🛠️ Création de ${metiersParCategories.length} métiers organisés par catégories...`);
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const metierData of metiersParCategories) {
      // Vérifier si le métier existe déjà
      const existingMetier = await prisma.metier.findFirst({
        where: { libelle: metierData.libelle }
      });

      if (!existingMetier) {
        await prisma.metier.create({
          data: { 
            libelle: metierData.libelle,
            // Vous pourriez ajouter un champ catégorie dans votre modèle si besoin
          },
        });
        console.log(`✅ "${metierData.libelle}" - ${metierData.categorie}`);
        createdCount++;
      } else {
        console.log(`ℹ️ "${metierData.libelle}" - existe déjà`);
        skippedCount++;
      }
    }

    console.log(`\n🌿 SEED TERMINÉ AVEC SUCCÈS !`);
    console.log(`📊 STATISTIQUES :`);
    console.log(`   - Total métiers traités: ${metiersParCategories.length}`);
    console.log(`   - Nouveaux métiers créés: ${createdCount}`);
    console.log(`   - Métiers déjà existants: ${skippedCount}`);
    
    console.log(`\n🎨 RÉPARTITION PAR CATÉGORIES :`);
    const stats = metiersParCategories.reduce((acc, metier) => {
      acc[metier.categorie] = (acc[metier.categorie] || 0) + 1;
      return acc;
    }, {});
    
    for (const [categorie, count] of Object.entries(stats)) {
      console.log(`   - ${categorie}: ${count} métiers`);
    }

  } catch (error) {
    console.error("❌ Erreur lors de la création des métiers:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});