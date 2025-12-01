// seeders/serviceTypeSeeder.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedServiceTypes() {
  console.log("🚀 Démarrage de la migration des types de services...");

  try {

    // 1. Mettre à jour les services avec type basé sur la catégorie
    console.log("🔄 Mise à jour des types de services...");

    // Catégories bien-être
    const bienEtreCategories = [
      "Thérapeute",
      "Yoga",
      "Formateur",
      "Podcaste",
      "Pilates",
      "Cuisine",
      "Sport",
      "Motivation",
      "Guérison",
      "Spriritualité",
      "Méditation",
      "Bien-être",
      "Santé",
      "Relaxation",
      "Détente",
      "Coaching",
      "Nutrition",
    ];

    // Catégories art
    const artCategories = [
      "Art",
      "Commerce",
      "Peinture",
      "Sculptures",
      "Artisanat",
      "Boutique",
      "Création",
      "Design",
      "Photographie",
      "Musique",
      "Danse",
      "Théâtre",
      "Cinéma",
    ];

    // Mettre à jour les services bien-être
    console.log("🎯 Mise à jour des services bien-être...");
    for (const categoryName of bienEtreCategories) {
      const updatedCount = await prisma.service.updateMany({
        where: {
          category: {
            name: {
              contains: categoryName,
              mode: "insensitive",
            },
          },
          type: null, // Seulement si pas déjà défini
        },
        data: {
          type: "bienetre",
        },
      });

      if (updatedCount.count > 0) {
        console.log(
          `   ✅ ${updatedCount.count} services de catégorie "${categoryName}" marqués comme bien-être`
        );
      }
    }

    // Mettre à jour les services art
    console.log("🎨 Mise à jour des services art...");
    for (const categoryName of artCategories) {
      const updatedCount = await prisma.service.updateMany({
        where: {
          category: {
            name: {
              contains: categoryName,
              mode: "insensitive",
            },
          },
          type: null, // Seulement si pas déjà défini
        },
        data: {
          type: "art",
        },
      });

      if (updatedCount.count > 0) {
        console.log(
          `   ✅ ${updatedCount.count} services de catégorie "${categoryName}" marqués comme art`
        );
      }
    }

    // 2. Pour les services restants sans type, mettre 'general' ou null
    const remainingServices = await prisma.service.findMany({
      where: {
        type: null,
      },
      include: {
        category: true,
      },
    });

    if (remainingServices.length > 0) {
      console.log(
        `ℹ️  ${remainingServices.length} services restent sans type spécifique`
      );

      // Vous pouvez choisir de les laisser null ou leur donner un type par défaut
      const defaultUpdated = await prisma.service.updateMany({
        where: {
          type: null,
        },
        data: {
          type: "general",
        },
      });

      console.log(
        `   ✅ ${defaultUpdated.count} services marqués comme 'general'`
      );
    }

    // 3. Afficher les statistiques finales
    const stats = await prisma.service.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    console.log("\n📊 Statistiques finales:");
    stats.forEach((stat) => {
      console.log(`   📍 ${stat.type || "null"}: ${stat._count.id} services`);
    });

    const totalServices = await prisma.service.count();
    console.log(`\n🎉 Migration terminée ! ${totalServices} services traités.`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedServiceTypes()
.then(() => {
    console.log("✨ Seeder exécuté avec succès !");
    process.exit(0);
})
.catch((error) => {
    console.error("💥 Erreur lors de l'exécution du seeder:", error);
    process.exit(1);
});

