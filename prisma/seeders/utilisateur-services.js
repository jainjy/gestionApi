const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedUtilisateurServices() {
  console.log("🌱 Début du seeding des services utilisateur...");

  try {
    // 1. Récupérer l'utilisateur professionnel Aria
    const professionalUser = await prisma.user.findFirst({
      where: { email: "contact@ariamada.com" },
    });

    if (!professionalUser) {
      console.log("❌ Utilisateur professionnel 'Aria communication' non trouvé");
      return;
    }

    console.log(
      `✅ Utilisateur trouvé: ${professionalUser.companyName || professionalUser.email}`
    );

    // 2. Récupérer tous les services de digitalisation
    const digitalisationServices = await prisma.service.findMany({
      where: {
        createdById: professionalUser.id,
      },
    });

    if (digitalisationServices.length === 0) {
      console.log("❌ Aucun service de digitalisation trouvé");
      return;
    }

    console.log(
      `✅ ${digitalisationServices.length} services de digitalisation trouvés`
    );

    // 3. Configuration personnalisée pour chaque service
    const serviceConfigurations = {
      "Site E-commerce": {
        customPrice: 2500,
        customDuration: 480,
        isAvailable: true,
        description:
          "Service complet de création de boutique en ligne avec intégration paiement et gestion stocks",
      },
      "Site Vitrine": {
        customPrice: 1200,
        customDuration: 240,
        isAvailable: true,
        description:
          "Site web professionnel moderne et optimisé pour le référencement naturel",
      },
      "App Mobile": {
        customPrice: 5000,
        customDuration: 960,
        isAvailable: true,
        description:
          "Développement d'applications mobiles iOS et Android cross-platform",
      },
      "Solutions Cloud": {
        customPrice: 1800,
        customDuration: 360,
        isAvailable: true,
        description:
          "Migration vers le cloud et logiciels métier en ligne SaaS",
      },
      "Marketing Digital": {
        customPrice: 900,
        customDuration: 180,
        isAvailable: true,
        description:
          "Stratégie marketing digital complète: SEO, réseaux sociaux, publicité",
      },
      "Transformation Digitale": {
        customPrice: 3500,
        customDuration: 720,
        isAvailable: true,
        description:
          "Accompagnement complet de transformation numérique de l'entreprise",
      },
      "Design UI/UX": {
        customPrice: 1500,
        customDuration: 300,
        isAvailable: true,
        description:
          "Conception d'interfaces et expérience utilisateur professionnelle",
      },
      "Consulting Digital": {
        customPrice: 800,
        customDuration: 120,
        isAvailable: true,
        description:
          "Conseil en stratégie digitale et analyse de votre présence en ligne",
      },
      "Maintenance & Support": {
        customPrice: 300,
        customDuration: 60,
        isAvailable: true,
        description:
          "Maintenance mensuelle et support technique pour vos solutions digitales",
      },
    };

    // 4. Créer les liaisons utilisateur-service
    let createdCount = 0;
    let skippedCount = 0;

    for (const service of digitalisationServices) {
      const config = serviceConfigurations[service.libelle];

      if (!config) {
        console.log(
          `⏭️ Pas de configuration pour le service "${service.libelle}"`
        );
        skippedCount++;
        continue;
      }

      // Vérifier si la liaison existe déjà
      const existingUtilisateurService = await prisma.utilisateurService.findUnique({
        where: {
          userId_serviceId: {
            userId: professionalUser.id,
            serviceId: service.id,
          },
        },
      });

      if (existingUtilisateurService) {
        console.log(
          `⏭️ Liaison déjà existante pour "${service.libelle}" et l'utilisateur`
        );
        skippedCount++;
        continue;
      }

      // Créer la liaison
      await prisma.utilisateurService.create({
        data: {
          userId: professionalUser.id,
          serviceId: service.id,
          customPrice: config.customPrice,
          customDuration: config.customDuration,
          isAvailable: config.isAvailable,
          description: config.description,
        },
      });

      console.log(`✅ Service "${service.libelle}" lié à l'utilisateur`);
      createdCount++;
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${createdCount} liaisons créées`);
    console.log(`   ⏭️ ${skippedCount} liaisons ignorées`);
    console.log("🎉 Seeding des services utilisateur terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder
seedUtilisateurServices();
