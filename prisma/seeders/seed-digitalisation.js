const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seedDigitalisation() {
  console.log("🌱 Seeding digitalisation services...");

  try {
    // Vérifier si la catégorie existe
    let digitalisationCategory = await prisma.category.findFirst({
      where: { name: "Digitalisation" },
    });

    if (!digitalisationCategory) {
      digitalisationCategory = await prisma.category.create({
        data: {
          name: "Digitalisation",
        },
      });
      console.log("✅ Catégorie Digitalisation créée");
    }

    // Services de digitalisation
    const digitalisationServices = [
      {
        libelle: "Site Vitrine Professionnel",
        description:
          "Site web responsive et moderne pour présenter votre entreprise avec un design sur mesure et une optimisation SEO.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/site-vitrine.jpg"],
        duration: 15,
        price: 1500,
        type: "digitalisation",
        tags: ["site-web", "responsive", "seo", "professionnel"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Boutique E-commerce",
        description:
          "Solution e-commerce complète avec gestion des produits, paiement en ligne sécurisé et tableau de bord administrateur.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/ecommerce.jpg"],
        duration: 30,
        price: 3500,
        type: "digitalisation",
        tags: ["ecommerce", "boutique", "paiement", "stock"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Application Mobile",
        description:
          "Développement d'applications mobiles natives (iOS/Android) ou cross-platform selon vos besoins.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/app-mobile.jpg"],
        duration: 45,
        price: 5000,
        type: "digitalisation",
        tags: ["mobile", "app", "ios", "android", "react-native"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Référencement SEO",
        description:
          "Optimisation de votre site pour les moteurs de recherche et amélioration de votre visibilité en ligne.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/seo.jpg"],
        duration: 60,
        price: 800,
        type: "digitalisation",
        tags: ["seo", "référencement", "google", "optimisation"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Stratégie Marketing Digital",
        description:
          "Élaboration et mise en œuvre d'une stratégie marketing digitale complète pour votre entreprise.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/marketing.jpg"],
        duration: 90,
        price: 1200,
        type: "digitalisation",
        tags: ["marketing", "stratégie", "réseaux-sociaux", "publicité"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Formation Digitale",
        description:
          "Formations sur mesure pour vos équipes sur les outils digitaux et les bonnes pratiques.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/formation.jpg"],
        duration: 120,
        price: 600,
        type: "digitalisation",
        tags: ["formation", "accompagnement", "équipe", "outils"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Audit Digital",
        description:
          "Analyse complète de votre présence digitale et recommandations pour l'améliorer.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/audit.jpg"],
        duration: 180,
        price: 1500,
        type: "digitalisation",
        tags: ["audit", "analyse", "diagnostic", "conseil"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Gestion des Réseaux Sociaux",
        description:
          "Gestion complète de votre présence sur les réseaux sociaux (création de contenu, community management).",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/reseaux-sociaux.jpg"],
        duration: 30,
        price: 900,
        type: "digitalisation",
        tags: ["social-media", "facebook", "instagram", "linkedin"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Campagnes Publicitaires Online",
        description:
          "Création et gestion de campagnes publicitaires sur Google Ads, Facebook Ads, etc.",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/pub-online.jpg"],
        duration: 45,
        price: 1000,
        type: "digitalisation",
        tags: ["publicité", "google-ads", "facebook-ads", "campagnes"],
        isActive: true,
        isCustom: false,
      },
      {
        libelle: "Automatisation Marketing",
        description:
          "Mise en place de systèmes d'automatisation marketing (emailing, chatbots, workflows).",
        categoryId: digitalisationCategory.id,
        images: ["/images/digitalisation/automatisation.jpg"],
        duration: 60,
        price: 2000,
        type: "digitalisation",
        tags: ["automatisation", "emailing", "chatbot", "workflow"],
        isActive: true,
        isCustom: false,
      },
    ];

    // Ajouter les services
    for (const serviceData of digitalisationServices) {
      const existingService = await prisma.service.findFirst({
        where: {
          libelle: serviceData.libelle,
          type: "digitalisation",
        },
      });

      if (!existingService) {
        await prisma.service.create({
          data: serviceData,
        });
        console.log(`✅ Service "${serviceData.libelle}" créé`);
      }
    }

    console.log("🌱 Seeding des métiers de digitalisation...");

    // Vérifier si le métier Digitalisation existe
    let digitalisationMetier = await prisma.metier.findFirst({
      where: { libelle: "Digitalisation" },
    });

    if (!digitalisationMetier) {
      digitalisationMetier = await prisma.metier.create({
        data: {
          libelle: "Digitalisation",
        },
      });
      console.log("✅ Métier Digitalisation créé");
    }

    // Lier les services au métier Digitalisation
    const services = await prisma.service.findMany({
      where: { type: "digitalisation" },
    });

    for (const service of services) {
      const existingLink = await prisma.metierService.findFirst({
        where: {
          metierId: digitalisationMetier.id,
          serviceId: service.id,
        },
      });

      if (!existingLink) {
        await prisma.metierService.create({
          data: {
            metierId: digitalisationMetier.id,
            serviceId: service.id,
          },
        });
        console.log(
          `✅ Service "${service.libelle}" lié au métier Digitalisation`
        );
      }
    }

    console.log("✅ Seeding digitalisation terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  }
}

async function createDigitalisationProfessional() {
  console.log("👤 Création d'un professionnel digitalisation...");

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: "contact@ariamada.com" },
    });

    if (existingUser) {
      console.log("⚠️  Utilisateur existe déjà:", existingUser.email);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash("Ariamada2024!", 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: "contact@ariamada.com",
        passwordHash: hashedPassword,
        firstName: "Alexandre",
        lastName: "Dumont",
        companyName: "Ariamada Digital",
        commercialName: "Ariamada",
        phone: "+33 1 23 45 67 89",
        role: "professional",
        userType: "digitalisation",
        address: "123 Avenue des Champs-Élysées",
        city: "Paris",
        zipCode: "75008",
        siret: "12345678901234",
        avatar: "/avatars/professional/digitalisation.jpg",
        status: "active",
      },
    });

    console.log("✅ Utilisateur professionnel créé:", user.email);

    // Récupérer le métier Digitalisation
    const digitalisationMetier = await prisma.metier.findFirst({
      where: { libelle: "Digitalisation" },
    });

    if (digitalisationMetier) {
      // Lier l'utilisateur au métier Digitalisation
      await prisma.utilisateurMetier.create({
        data: {
          userId: user.id,
          metierId: digitalisationMetier.id,
        },
      });
      console.log("✅ Utilisateur lié au métier Digitalisation");
    }

    // Récupérer les services de digitalisation
    const digitalisationServices = await prisma.service.findMany({
      where: { type: "digitalisation" },
      take: 5,
    });

    // Lier l'utilisateur aux services
    for (const service of digitalisationServices) {
      await prisma.utilisateurService.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          customPrice: service.price ? service.price * 1.1 : undefined,
          customDuration: service.duration,
          isAvailable: true,
          description: `Service ${service.libelle} proposé par Ariamada Digital`,
        },
      });
      console.log(`✅ Service "${service.libelle}" ajouté au profil`);
    }

    // Créer les paramètres professionnels
    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: "Ariamada Digital",
        emailContact: "contact@ariamada.com",
        telephone: "+33 1 23 45 67 89",
        adresse: "123 Avenue des Champs-Élysées, 75008 Paris",
        horairesLundi: JSON.stringify({ start: "09:00", end: "18:00" }),
        horairesMardi: JSON.stringify({ start: "09:00", end: "18:00" }),
        horairesMercredi: JSON.stringify({ start: "09:00", end: "18:00" }),
        horairesJeudi: JSON.stringify({ start: "09:00", end: "18:00" }),
        horairesVendredi: JSON.stringify({ start: "09:00", end: "17:00" }),
        delaiReponseEmail: 24,
        delaiReponseTelephone: 2,
        conditionsAnnulation: "Annulation gratuite jusqu'à 48h avant",
        acomptePourcentage: 30,
        montantMinimum: 500,
        conditionsPaiement: "30% à la commande, solde à la livraison",
      },
    });

    console.log("✅ Paramètres professionnels créés");

    console.log("🎉 Professionnel digitalisation créé avec succès !");
    console.log("📧 Email: contact@ariamada.com");
    console.log("🔑 Mot de passe: Ariamada2024!");
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }
}

async function main() {
  await seedDigitalisation();
  await createDigitalisationProfessional();
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du setup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
