// seed-ibr-categories-services.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding des catégories et services IBR...");

  // Vérifier si le métier IBR existe déjà
  let metierIBR = await prisma.metier.findFirst({
    where: {
      libelle: "IBR",
    },
  });

  // Créer le métier IBR s'il n'existe pas
  if (!metierIBR) {
    metierIBR = await prisma.metier.create({
      data: {
        libelle: "IBR",
      },
    });
    console.log("✅ Métier IBR créé");
  } else {
    console.log("✅ Métier IBR existe déjà");
  }

  // Données des catégories et services
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
      name: "Spécialités selon BET",
      services: [
        "Études VRD (voiries, eaux pluviales, assainissement)",
        "Relevé 2D/3D pour villas/logements existants",
      ],
    },
  ];

  // Créer les catégories et services
  for (const categoryData of categoriesData) {
    // Vérifier si la catégorie existe déjà
    let category = await prisma.category.findFirst({
      where: {
        name: categoryData.name,
      },
    });

    // Créer la catégorie si elle n'existe pas
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryData.name,
        },
      });
      console.log(`✅ Catégorie "${categoryData.name}" créée`);
    } else {
      console.log(`✅ Catégorie "${categoryData.name}" existe déjà`);
    }

    // Créer les services pour cette catégorie
    for (const serviceLibelle of categoryData.services) {
      // Vérifier si le service existe déjà
      let service = await prisma.service.findFirst({
        where: {
          libelle: serviceLibelle,
          categoryId: category.id,
        },
      });

      // Créer le service s'il n'existe pas
      if (!service) {
        service = await prisma.service.create({
          data: {
            libelle: serviceLibelle,
            categoryId: category.id,
            description: `Service ${serviceLibelle} pour le métier IBR`,
            images: [],
            duration: null,
            price: null,
          },
        });
        console.log(`   ✅ Service "${serviceLibelle}" créé`);
      } else {
        console.log(`   ✅ Service "${serviceLibelle}" existe déjà`);
      }

      // Lier le service au métier IBR
      try {
        await prisma.metierService.upsert({
          where: {
            metierId_serviceId: {
              metierId: metierIBR.id,
              serviceId: service.id,
            },
          },
          update: {}, // Ne rien mettre à jour si la relation existe déjà
          create: {
            metierId: metierIBR.id,
            serviceId: service.id,
          },
        });
        console.log(`   🔗 Service "${serviceLibelle}" lié au métier IBR`);
      } catch (error) {
        console.log(`   ✅ Relation déjà existante pour "${serviceLibelle}"`);
      }
    }
  }

  console.log("🎉 Seeding des catégories et services IBR terminé avec succès!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
