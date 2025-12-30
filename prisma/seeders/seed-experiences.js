const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedExperiences() {
  console.log("🌱 Seeding des expériences de démo...");

  // Vérifier si le guide existe, sinon le créer
  let guide = await prisma.activityGuide.findFirst({
    where: {
      user: {
        email: "guide@example.com",
      },
    },
  });

  if (!guide) {
    // Créer un utilisateur guide
    const guideUser = await prisma.user.create({
      data: {
        email: "guide@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        role: "guide",
        passwordHash: "$2a$10$hashplaceholder", // En prod, utiliser bcrypt
      },
    });

    guide = await prisma.activityGuide.create({
      data: {
        userId: guideUser.id,
        bio: "Guide passionné avec 10 ans d'expérience dans le tourisme d'aventure",
        specialties: ["Randonnée", "Volcanologie", "Culture locale"],
        languages: ["Français", "Anglais", "Créole"],
        experience: 10,
        certifications: ["Guide certifié", "Premiers secours"],
        isVerified: true,
        rating: 4.9,
      },
    });
  }

  // Données des expériences de démo (comme dans votre React)
  const demoExperiences = [
    {
      title: "Immersion Volcanique",
      category: "aventure",
      duration: "3 jours",
      location: "Piton de la Fournaise, Réunion",
      description:
        "Séjour d'immersion totale avec un vulcanologue pour comprendre et vivre le volcan. Exploration des coulées de lave récentes et nuit en refuge au bord du cratère.",
      price: 890,
      highlights: [
        "Nuit au refuge du volcan",
        "Accès zones restreintes",
        "Rencontre scientifique",
        "Photos exclusives",
        "Matériel de sécurité fourni",
      ],
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w-800&q=80",
        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=800&q=80",
      ],
      difficulty: "Intense",
      groupSize: "6 personnes max",
      season: "Toute l'année (selon conditions météo)",
      included: [
        "Guide expert volcanologue",
        "Équipement de sécurité",
        "Repas et hébergement",
        "Transport depuis Saint-Pierre",
        "Assurance activité",
      ],
      requirements: [
        "Bonne condition physique",
        "Chaussures de randonnée",
        "Vêtements chauds",
        "Âge minimum: 16 ans",
      ],
      isFeatured: true,
      rating: 4.9,
      reviewCount: 24,
    },
    {
      title: "Retraite Yogique",
      category: "bienetre",
      duration: "5 jours",
      location: "Salazie, Réunion",
      description:
        "Retraite spirituelle au cœur des cirques avec maîtres yogis et alimentation ayurvédique. Détente totale dans un cadre exceptionnel.",
      price: 1250,
      highlights: [
        "Sessions quotidiennes de yoga",
        "Alimentation 100% bio",
        "Massages thérapeutiques",
        "Méditation guidée",
        "Ateliers nutrition",
      ],
      images: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
      ],
      difficulty: "Douce",
      groupSize: "10 personnes max",
      season: "Printemps / Automne",
      included: [
        "Hébergement en écolodge",
        "Tous les repas ayurvédiques",
        "Cours de yoga (2x/jour)",
        "3 massages thérapeutiques",
        "Accès spa et piscine",
      ],
      requirements: [
        "Tenue confortable",
        "Serviette de bain",
        "Ouverture d'esprit",
        "Certificat médical optionnel",
      ],
      isFeatured: true,
      rating: 4.8,
      reviewCount: 18,
    },
    {
      title: "Plongée Grand Bleu",
      category: "marine",
      duration: "4 jours",
      location: "Lagon de Mayotte",
      description:
        "Exploration des tombants coralliens et rencontre avec les tortues géantes. Plongées encadrées par des moniteurs PADI.",
      price: 1450,
      highlights: [
        "3 plongées/jour encadrées",
        "Rencontre dauphins sauvages",
        "Photos sous-marines offertes",
        "Nuit à bord du bateau",
        "Apnée avec les tortues",
      ],
      images: [
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
      ],
      difficulty: "Intermédiaire",
      groupSize: "8 personnes max",
      season: "Mai à Octobre",
      included: [
        "Équipement de plongée complet",
        "Moniteur PADI diplômé",
        "Hébergement sur le bateau",
        "Tous les repas",
        "Photos souvenir",
      ],
      requirements: [
        "Niveau 1 de plongée",
        "Certificat médical de non contre-indication",
        "Maîtrise de la nage",
        "Âge minimum: 18 ans",
      ],
      rating: 4.7,
      reviewCount: 32,
    },
    {
      title: "Circuit Patrimoine",
      category: "culture",
      duration: "7 jours",
      location: "Île Maurice",
      description:
        "Voyage dans le temps à travers les plantations, temples et architecture coloniale. Découverte des traditions multiculturelles.",
      price: 2200,
      highlights: [
        "Visites privées de monuments",
        "Rencontres avec artisans locaux",
        "Ateliers cuisine traditionnelle",
        "Spectacles culturels",
        "Dégustation rhums locaux",
      ],
      images: [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      ],
      difficulty: "Facile",
      groupSize: "12 personnes max",
      season: "Toute l'année",
      included: [
        "Hôtel 4 étoiles",
        "Tous les transferts",
        "Guide francophone",
        "Toutes les entrées",
        "Demi-pension",
      ],
      requirements: [
        "Passeport valide",
        "Chaussures de marche",
        "Appareil photo",
        "Curiosité culturelle",
      ],
      rating: 4.9,
      reviewCount: 15,
    },
    {
      title: "Randonnée Extrême",
      category: "aventure",
      duration: "6 jours",
      location: "Cirque de Mafate, Réunion",
      description:
        "Traversée complète du cirque le plus sauvage avec nuits en gîtes authentiques. Défi sportif dans un décor à couper le souffle.",
      price: 980,
      highlights: [
        "Guide expert de la région",
        "Portage des bagages par mule",
        "Cuisine créole traditionnelle",
        "Photos aériennes drone",
        "Bivouac sous les étoiles",
      ],
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
      ],
      difficulty: "Extrême",
      groupSize: "8 personnes max",
      season: "Avril à Novembre",
      included: [
        "Gîtes et hébergement",
        "Tous les repas",
        "Guide de montagne",
        "Transport des bagages",
        "Kit de sécurité",
      ],
      requirements: [
        "Excellente condition physique",
        "Expérience randonnée montagne",
        "Équipement personnel",
        "Examen médical récent",
      ],
      isFeatured: true,
      rating: 4.6,
      reviewCount: 29,
    },
  ];

  // Ajouter les expériences
  for (const expData of demoExperiences) {
    const slug = expData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await prisma.experience.upsert({
      where: { slug },
      update: expData,
      create: {
        ...expData,
        slug,
        guideId: guide.id,
        isActive: true,
      },
    });

    console.log(`✓ Expérience "${expData.title}" ajoutée`);
  }

  // Ajouter quelques avis de démo
  const users = await prisma.user.findMany({
    take: 5,
    where: {
      NOT: { id: guide.userId },
    },
  });

  if (users.length > 0) {
    const experiences = await prisma.experience.findMany();
    
    for (const exp of experiences) {
      for (let i = 0; i < 3; i++) {
        const user = users[i % users.length];
        if (user) {
          await prisma.experienceReview.upsert({
            where: {
              experienceId_userId: {
                experienceId: exp.id,
                userId: user.id,
              },
            },
            update: {},
            create: {
              experienceId: exp.id,
              userId: user.id,
              rating: Math.floor(Math.random() * 2) + 4, // 4 ou 5
              comment: `Expérience incroyable ! ${exp.title} était à couper le souffle. Je recommande à 100%`,
              verified: true,
            },
          });
        }
      }
    }
    console.log("✓ Avis de démo ajoutés");
  }

  console.log("✅ Seeding des expériences terminé !");
}

seedExperiences()
  .catch((error) => {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });