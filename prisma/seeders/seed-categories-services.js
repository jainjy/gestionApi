// seed-categories-services.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding des catégories et services...");

  try {
    // 1. Création des catégories
    const categoriesData = [
      {
        name: "Études préalables & faisabilité",
        services: [
          "Analyse du site et du contexte (PLU, PPR, contraintes ABF, réseaux, accès)",
          "Étude de faisabilité architecturale et technique",
          "Estimation du coût et des enveloppes financières",
          "Études thermiques initiales (besoins, potentiels, contraintes)",
          "Études d'impact environnemental (si applicable)",
          "Relevés, diagnostic et état des lieux (structure, réseaux, pathologies)",
        ],
      },
      {
        name: "Études architecturales",
        services: [
          "Analyse du programme et élaboration des premières intentions",
          "Production des plans : esquisse, APS (avant-projet sommaire), APD (avant-projet détaillé)",
          "Vue d'ensemble du projet (plans, coupes, façades, 3D)",
          "Dossier de demande de permis de construire",
          "Plans d'exécution (DCE ou EXE selon ton rôle)",
        ],
      },
      {
        name: "Études structurelles",
        services: [
          "Calculs de structures (béton, bois, métal)",
          "Dimensionnement des éléments porteurs",
          "Plans d'armatures, plans de charpente, descentes de charges",
          "Études de renforcement structurel (réhabilitation)",
          "Modélisation (Robot, Arche, Advance Design, etc.)",
        ],
      },
      {
        name: "Économie de la construction",
        services: [
          "Estimation financière détaillée (DQE, estimatifs par lots)",
          "Rédaction du CCTP (Cahier des Clauses Techniques Particulières)",
          "Assistance à la consultation des entreprises (ACT)",
          "Analyse des offres et mise en concurrence",
        ],
      },
      {
        name: "Ingénierie environnementale & performance",
        services: [
          "Études énergétiques et simulations thermiques (STD, FLJ)",
          "Études d'optimisation environnementale (matériaux biosourcés, ACV)",
        ],
      },
      {
        name: "Suivi de chantier & direction de travaux",
        services: [
          "Visa des plans des entreprises",
          "Contrôle de l'exécution sur site",
          "Réunions de chantier & rédaction des comptes-rendus",
          "Suivi des plannings et gestion des aléas",
          "Réception des travaux & levée des réserves",
        ],
      },
      {
        name: "Spécialités techniques",
        services: [
          "Études VRD (voiries, eaux pluviales, assainissement)",
          "Relevé 2D/3D pour villas/logements existants",
        ],
      },
    ];

    // 2. Création d'un métier principal pour les BET
    const metierBET = await prisma.metier.upsert({
      where: { libelle: "Bureau d'Études Techniques" },
      update: {},
      create: {
        libelle: "Bureau d'Études Techniques",
        services: {
          create: [], // Les services seront créés après
        },
      },
    });

    console.log(`✅ Métier créé: ${metierBET.libelle}`);

    // 3. Création des catégories et services
    for (const categoryData of categoriesData) {
      // Créer ou mettre à jour la catégorie
      const category = await prisma.category.upsert({
        where: { name: categoryData.name },
        update: { name: categoryData.name },
        create: {
          name: categoryData.name,
          services: {
            create: categoryData.services.map((serviceLibelle) => ({
              libelle: serviceLibelle,
              description: `Service de ${serviceLibelle.toLowerCase()}`,
              images: [],
              duration: null,
              price: null,
              metiers: {
                create: {
                  metierId: metierBET.id,
                },
              },
            })),
          },
        },
        include: {
          services: true,
        },
      });

      console.log(
        `✅ Catégorie créée: ${category.name} avec ${category.services.length} services`
      );

      // Afficher les services créés
      for (const service of category.services) {
        console.log(`   📋 Service: ${service.libelle}`);
      }
    }

    // 4. Vérification du seeding
    const totalCategories = await prisma.category.count();
    const totalServices = await prisma.service.count();
    const totalMetierServices = await prisma.metierService.count();

    console.log("\n📊 Récapitulatif du seeding:");
    console.log(`   📁 Catégories créées: ${totalCategories}`);
    console.log(`   📋 Services créés: ${totalServices}`);
    console.log(`   🔗 Associations métier-service: ${totalMetierServices}`);

    // 5. Afficher toutes les catégories et services créés
    const allCategoriesWithServices = await prisma.category.findMany({
      include: {
        services: {
          select: {
            id: true,
            libelle: true,
            description: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("\n🏷️  Détail des catégories et services:");
    allCategoriesWithServices.forEach((category) => {
      console.log(`\n📂 ${category.name}:`);
      category.services.forEach((service) => {
        console.log(`   • ${service.libelle}`);
      });
    });
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
