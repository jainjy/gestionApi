// seeders/digitalisation-services.js
const { PrismaClient } = require("@prisma/client");
const bcrypt  = require("bcryptjs");
const prisma = new PrismaClient();

async function seedDigitalisationServices() {
  console.log("🌱 Début du seeding des services de digitalisation...");

  try {
    // 1. Vérifier ou créer la catégorie Digitalisation
    let digitalisationCategory = await prisma.category.findFirst({
      where: { name: "Digitalisation" },
    });
    let digitalisationMetiers = await prisma.metier.findFirst({
      where: { libelle: "Digitalisation" },
    });

    if (!digitalisationCategory) {
      digitalisationCategory = await prisma.category.create({
        data: { name: "Digitalisation" },
      });
      console.log("✅ Catégorie Digitalisation créée");
    }
    if (!digitalisationMetiers) {
      digitalisationMetiers = await prisma.metier.create({
        data: { libelle: "Digitalisation" },
      });
      console.log("✅ Métier Digitalisation créé");
    }

    // 2. Créer un utilisateur professionnel pour les services (si inexistant)
    const existingUser = await prisma.user.findFirst({
      where: { email: "contact@ariamada.com" },
    });

    let professionalUser;
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("Ariamada2024!", 10);
      professionalUser = await prisma.user.create({
        data: {
          email: "contact@ariamada.com",
          firstName: "Aria",
          lastName: "communication",
          commercialName: "Aria",
          companyName: "Aria communication",
          status: "active",
          role: "professional",
          userType: "professional",
          address: "Lot II M 23 Andrainarivo",
          city: "Antsirabe",
          zipCode: "110",
          phone: "+261340000000",
          avatar:
            "https://www.ariamada.com/wp-content/uploads/2024/01/logo-ariamada.png",
          passwordHash: hashedPassword,
        },
      });
      console.log("✅ Utilisateur professionnel créé");
    } else {
      professionalUser = existingUser;
    }

    // 3. Services de digitalisation avec images correspondantes
    const digitalisationServices = [
      {
        libelle: "Site E-commerce",
        description:
          "Boutique en ligne complète avec paiement sécurisé, gestion des stocks, et intégration des transporteurs. Solution clé en main pour vendre vos produits en ligne.",
        price: 2500,
        duration: 480, // 8 heures
        images: [
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: [
          "e-commerce",
          "boutique en ligne",
          "paiement sécurisé",
          "responsive",
          "SEO",
        ],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Site Vitrine",
        description:
          "Site web professionnel pour présenter votre activité. Design moderne, responsive et optimisé pour le référencement.",
        price: 1200,
        duration: 240, // 4 heures
        images: [
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["vitrine", "présentation", "responsive", "SEO", "entreprise"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "App Mobile",
        description:
          "Applications iOS et Android sur-mesure développées avec les dernières technologies. Interface intuitive et performances optimales.",
        price: 5000,
        duration: 960, // 16 heures
        images: [
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["mobile", "iOS", "Android", "application", "cross-platform"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Solutions Cloud",
        description:
          "Logiciels métier en ligne automatisés. Migration vers le cloud, solutions SaaS sur mesure et hébergement sécurisé.",
        price: 1800,
        duration: 360, // 6 heures
        images: [
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["cloud", "SaaS", "hébergement", "migration", "automatisation"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Marketing Digital",
        description:
          "Stratégie digitale complète pour plus de visibilité. SEO, réseaux sociaux, publicité en ligne et analyse de données.",
        price: 900,
        duration: 180, // 3 heures
        images: [
          "https://images.unsplash.com/photo-1432888622747-4eb9a8f0f6c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["marketing", "SEO", "réseaux sociaux", "analytics", "publicité"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Transformation Digitale",
        description:
          "Accompagnement complet pour digitaliser votre entreprise. Audit, stratégie, mise en œuvre et formation de vos équipes.",
        price: 3500,
        duration: 720, // 12 heures
        images: [
          "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: [
          "transformation",
          "digitalisation",
          "accompagnement",
          "audit",
          "formation",
        ],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Design UI/UX",
        description:
          "Conception d'interfaces utilisateur et expérience utilisateur. Recherche utilisateur, wireframes, prototypes et tests.",
        price: 1500,
        duration: 300, // 5 heures
        images: [
          "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["design", "UI", "UX", "interface", "expérience utilisateur"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Consulting Digital",
        description:
          "Conseil en stratégie digitale. Analyse de marché, benchmark concurrentiel et recommandations personnalisées.",
        price: 800,
        duration: 120, // 2 heures
        images: [
          "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1581091226825-c6ae736003b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: ["consulting", "conseil", "stratégie", "analyse", "benchmark"],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
      {
        libelle: "Maintenance & Support",
        description:
          "Maintenance et support technique pour vos solutions digitales. Surveillance, mises à jour, dépannage et sauvegarde.",
        price: 300,
        duration: 60, // 1 heure (par mois)
        images: [
          "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        ],
        tags: [
          "maintenance",
          "support",
          "technique",
          "sauvegarde",
          "dépannage",
        ],
        type: "digital",
        categoryId: digitalisationCategory.id,
        createdById: professionalUser.id,
        isCustom: false,
        isActive: true,
      },
    ];

    // 4. Insérer les services
    for (const serviceData of digitalisationServices) {
      const existingService = await prisma.service.findFirst({
        where: {
          libelle: serviceData.libelle,
          createdById: serviceData.createdById,
        },
      });

      if (!existingService) {
        await prisma.service.create({
          data: serviceData,
        });
        console.log(`✅ Service "${serviceData.libelle}" créé`);
      } else {
        console.log(`⏭️ Service "${serviceData.libelle}" existe déjà`);
      }
    }

    // 5. Créer quelques avis pour les services
    const reviews = [
      {
        rating: 5,
        comment:
          "Excellent service ! Site e-commerce parfaitement fonctionnel.",
        serviceName: "Site E-commerce",
      },
      {
        rating: 4,
        comment: "Site vitrine très professionnel, équipe réactive.",
        serviceName: "Site Vitrine",
      },
      {
        rating: 5,
        comment: "Application mobile de qualité, recommandé !",
        serviceName: "App Mobile",
      },
    ];

    for (const reviewData of reviews) {
      const service = await prisma.service.findFirst({
        where: { libelle: reviewData.serviceName },
      });

      if (service) {
        const existingReview = await prisma.review.findFirst({
          where: {
            serviceId: service.id,
            userId: professionalUser.id,
          },
        });

        if (!existingReview) {
          await prisma.review.create({
            data: {
              userId: professionalUser.id,
              serviceId: service.id,
              rating: reviewData.rating,
              comment: reviewData.comment,
            },
          });
          console.log(`✅ Avis créé pour "${reviewData.serviceName}"`);
        }
      }
    }

    console.log("🎉 Seeding des services de digitalisation terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder
seedDigitalisationServices();
