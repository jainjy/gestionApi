const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding des activités...");

  try {
    // 1. Trouver l'utilisateur pro@servo.mg
    console.log("🔍 Recherche de l'utilisateur pro@servo.mg...");
    const proUser = await prisma.user.findUnique({
      where: { email: "pro@servo.mg" },
    });

    if (!proUser) {
      console.error("❌ Utilisateur pro@servo.mg non trouvé!");
      console.log("📋 Création de l'utilisateur pro...");

      // Créer l'utilisateur pro s'il n'existe pas
      const newProUser = await prisma.user.create({
        data: {
          email: "pro@servo.mg",
          passwordHash: "$2b$10$YourHashedPasswordHere", // À remplacer par un hash réel
          firstName: "Pro",
          lastName: "Servo",
          role: "professional",
          professionalCategory: "tourism",
          companyName: "Servo Madagascar",
          phone: "+261340000000",
          status: "active",
          userType: "professional",
        },
      });

      console.log("✅ Utilisateur pro créé:", newProUser.id);
    }

    const userId = proUser ? proUser.id : newProUser.id;
    console.log("👤 ID utilisateur pro:", userId);

    // 2. Créer les catégories d'activités
    console.log("📂 Création des catégories...");

    const categories = [
      {
        name: "Randonnée",
        description: "Randonnées pédestres et trekking",
        icon: "Mountain",
        color: "#10B981",
        image:
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        sortOrder: 1,
        isActive: true,
      },
      {
        name: "Aventure",
        description: "Activités d'aventure et extrêmes",
        icon: "Compass",
        color: "#EF4444",
        image:
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
        sortOrder: 2,
        isActive: true,
      },
      {
        name: "Observation Faune",
        description: "Observation de la faune et flore",
        icon: "TreePine",
        color: "#22C55E",
        image:
          "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w-800",
        sortOrder: 3,
        isActive: true,
      },
      {
        name: "Sports Nautiques",
        description: "Activités aquatiques et nautiques",
        icon: "Waves",
        color: "#3B82F6",
        image:
          "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
        sortOrder: 4,
        isActive: true,
      },
      {
        name: "Culture",
        description: "Découvertes culturelles et visites",
        icon: "Tent",
        color: "#8B5CF6",
        image:
          "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800",
        sortOrder: 5,
        isActive: true,
      },
      {
        name: "Nocturne",
        description: "Activités de nuit et observation",
        icon: "Moon",
        color: "#6366F1",
        image:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        sortOrder: 6,
        isActive: true,
      },
      {
        name: "Sports Extrêmes",
        description: "Sports à sensation forte",
        icon: "Zap",
        color: "#F59E0B",
        image:
          "https://images.unsplash.com/photo-1511994717241-8e4e484dfa8f?w=800",
        sortOrder: 7,
        isActive: true,
      },
      {
        name: "Compétition",
        description: "Compétitions et challenges",
        icon: "Trophy",
        color: "#EC4899",
        image:
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        sortOrder: 8,
        isActive: true,
      },
    ];

    // Créer ou mettre à jour les catégories
    const createdCategories = {};
    for (const cat of categories) {
      const existing = await prisma.activityCategory.findUnique({
        where: { name: cat.name },
      });

      if (existing) {
        console.log(`📝 Catégorie existante: ${cat.name}`);
        createdCategories[cat.name] = existing;
      } else {
        const category = await prisma.activityCategory.create({
          data: cat,
        });
        console.log(`✅ Catégorie créée: ${category.name}`);
        createdCategories[cat.name] = category;
      }
    }

    // 3. Créer les activités
    console.log("🎯 Création des activités...");

    const activities = [
      // RANDONNÉES
      {
        title: "Randonnée dans la Forêt Primaire d'Andasibe",
        description:
          "Découvrez la célèbre forêt primaire d'Andasibe, habitat naturel des lémuriens Indri. Cette randonnée guidée vous emmène au cœur de la biodiversité malgache avec un guide naturaliste expérimenté. Vous pourrez observer plusieurs espèces de lémuriens, caméléons, et une flore unique au monde.",
        shortDescription:
          "Randonnée guidée dans la forêt primaire à la découverte des lémuriens Indri",
        categoryId: createdCategories["Randonnée"].id,
        userId: userId,
        price: 35.0,
        priceType: "per_person",
        duration: 240,
        durationType: "minutes",
        level: "intermediate",
        minParticipants: 2,
        maxParticipants: 8,
        location: "Andasibe",
        address: "Parc National d'Andasibe-Mantadia",
        latitude: -18.9286,
        longitude: 48.4177,
        meetingPoint: "Bureau d'accueil du parc national",
        mainImage:
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        images: [
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
          "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
        ],
        includedItems: [
          "Guide naturaliste",
          "Droit d'entrée parc",
          "Eau minérale",
          "Collation",
        ],
        requirements: [
          "Chaussures de randonnée",
          "Vêtements adaptés",
          "Anti-moustiques",
          "Appareil photo",
        ],
        highlights: [
          "Observation Indri Indri",
          "Flore endémique",
          "Guide francophone",
          "Petit groupe",
        ],
        status: "active",
        featured: true,
        rating: 4.8,
        reviewCount: 42,
        viewCount: 156,
        bookingCount: 28,
      },
      {
        title: "Trekking Tsingy de Bemaraha",
        description:
          "Exploration des fameux Tsingy, formations karstiques uniques au monde classées UNESCO. Cette aventure unique vous emmène sur des ponts suspendus, dans des grottes mystérieuses et offre des vues panoramiques à couper le souffle. Une expérience pour les amateurs de sensations fortes.",
        shortDescription:
          "Aventure unique dans les Tsingy de Bemaraha, site UNESCO",
        categoryId: createdCategories["Aventure"].id,
        userId: userId,
        price: 75.0,
        priceType: "per_person",
        duration: 360,
        durationType: "minutes",
        level: "advanced",
        minParticipants: 1,
        maxParticipants: 6,
        location: "Bemaraha",
        address: "Réserve Naturelle Intégrale du Tsingy de Bemaraha",
        latitude: -18.675,
        longitude: 44.7522,
        meetingPoint: "Entrée principale du parc",
        mainImage:
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
        images: [
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        ],
        includedItems: [
          "Guide spécialisé",
          "Équipement de sécurité",
          "Pique-nique",
          "Transport local",
        ],
        requirements: [
          "Condition physique bonne",
          "Chaussures fermées",
          "Gants",
          "Casque fourni",
        ],
        highlights: [
          "Site UNESCO",
          "Ponts suspendus",
          "Vues panoramiques",
          "Géologie unique",
        ],
        status: "active",
        featured: true,
        rating: 4.9,
        reviewCount: 31,
        viewCount: 189,
        bookingCount: 19,
      },

      // OBSERVATION FAUNE
      {
        title: "Observation Nocturne des Lémuriens",
        description:
          "Partez à la découverte des lémuriens nocturnes dans leur habitat naturel. Équipés de lampes frontales, vous explorerez la forêt de nuit avec un guide expert qui vous fera découvrir les espèces comme l'Aye-aye, le Microcèbe et d'autres créatures de la nuit.",
        shortDescription:
          "Safari nocturne pour observer les lémuriens nocturnes",
        categoryId: createdCategories["Observation Faune"].id,
        userId: userId,
        price: 45.0,
        priceType: "per_person",
        duration: 180,
        durationType: "minutes",
        level: "beginner",
        minParticipants: 2,
        maxParticipants: 10,
        location: "Vohimana",
        address: "Réserve de Vohimana",
        latitude: -18.95,
        longitude: 48.5,
        meetingPoint: "Lodge Vohimana",
        mainImage:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        ],
        includedItems: [
          "Guide nocturne",
          "Lampe frontale",
          "Collation chaude",
          "Transport aller-retour",
        ],
        requirements: [
          "Vêtements sombres",
          "Chaussures fermées",
          "Silence requis",
          "Pas de flash photo",
        ],
        highlights: [
          "Lémuriens nocturnes",
          "Guide expert",
          "Petits groupes",
          "Expérience unique",
        ],
        status: "active",
        featured: true,
        rating: 4.7,
        reviewCount: 28,
        viewCount: 134,
        bookingCount: 22,
      },

      // SPORTS NAUTIQUES
      {
        title: "Kitesurf à Anakao",
        description:
          "Session de kitesurf dans les eaux turquoises d'Anakao, spot réputé pour ses vents constants et son lagon protégé. Encadrement par un moniteur certifié, matériel haut de gamme inclus. Adapté aux débutants comme aux confirmés.",
        shortDescription: "Kitesurf dans le lagon paradisiaque d'Anakao",
        categoryId: createdCategories["Sports Nautiques"].id,
        userId: userId,
        price: 65.0,
        priceType: "per_person",
        duration: 120,
        durationType: "minutes",
        level: "intermediate",
        minParticipants: 1,
        maxParticipants: 4,
        location: "Anakao",
        address: "Plage d'Anakao",
        latitude: -23.6667,
        longitude: 43.65,
        meetingPoint: "Kite School Anakao",
        mainImage:
          "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
        images: [
          "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
          "https://images.unsplash.com/photo-1511994717241-8e4e484dfa8f?w=800",
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        ],
        includedItems: [
          "Moniteur certifié",
          "Matériel complet",
          "Combinaison",
          "Assurance",
        ],
        requirements: [
          "Maîtrise natation",
          "Certificat médical",
          "Serviette",
          "Crème solaire",
        ],
        highlights: [
          "Spot exceptionnel",
          "Matériel récent",
          "Cours personnalisés",
          "Eaux chaudes",
        ],
        status: "active",
        featured: true,
        rating: 4.9,
        reviewCount: 37,
        viewCount: 178,
        bookingCount: 25,
      },

      // CULTURE
      {
        title: "Visite des Ateliers d'Artisanat Zafimaniry",
        description:
          "Rencontre avec les artisans Zafimaniry, derniers dépositaires d'un savoir-faire du bois classé au patrimoine immatériel de l'UNESCO. Vous assisterez à des démonstrations, apprendrez les techniques traditionnelles et pourrez acquérir des pièces uniques.",
        shortDescription: "Découverte de l'artisanat Zafimaniry classé UNESCO",
        categoryId: createdCategories["Culture"].id,
        userId: userId,
        price: 30.0,
        priceType: "per_person",
        duration: 210,
        durationType: "minutes",
        level: "beginner",
        minParticipants: 1,
        maxParticipants: 12,
        location: "Ambositra",
        address: "Village Zafimaniry",
        latitude: -20.5333,
        longitude: 47.25,
        meetingPoint: "Office du tourisme Ambositra",
        mainImage:
          "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800",
        images: [
          "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800",
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
          "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
        ],
        includedItems: [
          "Guide culturel",
          "Rencontre artisans",
          "Démonstration",
          "Café d'accueil",
        ],
        requirements: [
          "Respect traditions",
          "Photos autorisées",
          "Chaussures confortables",
        ],
        highlights: [
          "Patrimoine UNESCO",
          "Rencontre authentique",
          "Savoir-faire unique",
          "Achat direct",
        ],
        status: "active",
        featured: false,
        rating: 4.6,
        reviewCount: 19,
        viewCount: 89,
        bookingCount: 15,
      },

      // NOCTURNE
      {
        title: "Observation des Étoiles au Désert",
        description:
          "Nuit sous les étoiles dans le désert de l'Androy. Avec un astronome amateur, découvrez les constellations de l'hémisphère sud, observez la Voie Lactée et écoutez les légendes malgaches liées aux étoiles. Thé et pâtisseries locales inclus.",
        shortDescription: "Observation astronomique dans le désert de l'Androy",
        categoryId: createdCategories["Nocturne"].id,
        userId: userId,
        price: 40.0,
        priceType: "per_person",
        duration: 180,
        durationType: "minutes",
        level: "beginner",
        minParticipants: 3,
        maxParticipants: 15,
        location: "Androy",
        address: "Désert de l'Androy",
        latitude: -25.0,
        longitude: 45.5,
        meetingPoint: "Campement Tsimanampetsotsa",
        mainImage:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
        ],
        includedItems: [
          "Télescope",
          "Couverture",
          "Thé et pâtisseries",
          "Guide astronome",
        ],
        requirements: [
          "Vêtements chauds",
          "Lampe torche rouge",
          "Chaise pliante (optionnel)",
        ],
        highlights: [
          "Ciel désertique",
          "Voie Lactée visible",
          "Légendes malgaches",
          "Ambiance magique",
        ],
        status: "active",
        featured: true,
        rating: 4.8,
        reviewCount: 23,
        viewCount: 112,
        bookingCount: 17,
      },

      // SPORTS EXTRÊMES
      {
        title: "Vol en Wingsuit sur les Falaises",
        description:
          "Expérience extrême de vol en wingsuit au-dessus des falaises côtières. Pour wingsuiters confirmés seulement. Encadrement par des professionnels, équipement de dernière génération, vidéo HD incluse. Une expérience unique à Madagascar.",
        shortDescription: "Vol en wingsuit au-dessus des falaises malgaches",
        categoryId: createdCategories["Sports Extrêmes"].id,
        userId: userId,
        price: 250.0,
        priceType: "per_person",
        duration: 90,
        durationType: "minutes",
        level: "advanced",
        minParticipants: 1,
        maxParticipants: 2,
        location: "Diego Suarez",
        address: "Falaises de la Montagne d'Ambre",
        latitude: -12.2667,
        longitude: 49.2833,
        meetingPoint: "Base jump Diego",
        mainImage:
          "https://images.unsplash.com/photo-1511994717241-8e4e484dfa8f?w=800",
        images: [
          "https://images.unsplash.com/photo-1511994717241-8e4e484dfa8f?w=800",
          "https://images.unsplash.com/photo-1536152471326-642d7d7d5f0c?w=800",
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        ],
        includedItems: [
          "Équipement complet",
          "Moniteur certifié",
          "Vidéo HD",
          "Assurance spéciale",
        ],
        requirements: [
          "Licence wingsuit",
          "Certificat médical",
          "Expérience requise",
          "Parachute personnel",
        ],
        highlights: [
          "Spot unique",
          "Encadrement pro",
          "Vidéo souvenir",
          "Sensation extrême",
        ],
        status: "active",
        featured: true,
        rating: 5.0,
        reviewCount: 8,
        viewCount: 245,
        bookingCount: 6,
      },

      // COMPÉTITION
      {
        title: "Course de Pirogues Traditionnelles",
        description:
          "Participez à une course de pirogues traditionnelles malgaches. Apprenez les techniques de navigation ancestrales, constituez votre équipe et affrontez d'autres participants dans une ambiance festive. Trophée et cadeaux pour les gagnants.",
        shortDescription: "Course compétitive de pirogues traditionnelles",
        categoryId: createdCategories["Compétition"].id,
        userId: userId,
        price: 55.0,
        priceType: "per_person",
        duration: 240,
        durationType: "minutes",
        level: "intermediate",
        minParticipants: 4,
        maxParticipants: 20,
        location: "Nosy Be",
        address: "Baie d'Andilana",
        latitude: -13.3167,
        longitude: 48.2667,
        meetingPoint: "Plage d'Andilana",
        mainImage:
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        images: [
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
          "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
          "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800",
        ],
        includedItems: [
          "Pirogue équipée",
          "Gilet de sauvetage",
          "Encadrement sécurité",
          "Trophée gagnants",
        ],
        requirements: [
          "Savoir nager",
          "Esprit d'équipe",
          "Tenue sportive",
          "Serviette",
        ],
        highlights: [
          "Culture malgache",
          "Ambiance festive",
          "Prix aux gagnants",
          "Photos officielles",
        ],
        status: "active",
        featured: false,
        rating: 4.7,
        reviewCount: 15,
        viewCount: 76,
        bookingCount: 12,
      },
    ];

    // Créer les activités
    let createdCount = 0;
    for (const activityData of activities) {
      const existing = await prisma.activity.findFirst({
        where: {
          title: activityData.title,
          userId: userId,
        },
      });

      if (existing) {
        console.log(`📝 Activité existante: ${activityData.title}`);
      } else {
        await prisma.activity.create({
          data: activityData,
        });
        console.log(`✅ Activité créée: ${activityData.title}`);
        createdCount++;
      }
    }

    console.log(
      `🎉 Seeding terminé ! ${createdCount} nouvelles activités créées pour pro@servo.mg`,
    );
    console.log(`👤 ID du créateur: ${userId}`);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log("✅ Seeding des activités terminé avec succès!"))
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  });
