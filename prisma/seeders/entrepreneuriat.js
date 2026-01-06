// prisma/seeders/entrepreneuriat.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedEntrepreneuriat() {
  console.log("🌱 Début du seeding des données entrepreneuriat...");

  // Trouver un utilisateur admin pour être l'auteur
  const adminUser = await prisma.user.findFirst({
    where: {
      email: "superadmin@servo.mg",
    },
  });

  if (!adminUser) {
    console.error(
      "❌ Aucun utilisateur admin trouvé. Créez d'abord un utilisateur admin."
    );
    return;
  }

  // 1. Seed des interviews
  const interviews = [
    {
      title: "De zéro à 1 million en 3 ans",
      slug: "de-zero-a-1-million-en-3-ans",
      description:
        "Comment Marie a transformé son idée en entreprise à succès avec peu de moyens.",
      content:
        "Interview complète avec Marie Dubois sur son parcours entrepreneurial...",
      excerpt:
        "Découvrez comment cette entrepreneure a démarré son business avec un budget limité.",
      guest: "Marie Dubois",
      role: "Fondatrice & CEO",
      company: "EcoTech Solutions",
      duration: "45 min",
      date: new Date("2024-03-15"),
      tags: ["startup", "tech", "croissance", "success-story"],
      category: "jeunes",
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example1",
      audioUrl: "https://example.com/audio1.mp3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      status: "published",
      isFeatured: true,
      views: 1250,
      listens: 850,
      shares: 120,
      likes: 89,
    },
    {
      title: "40 ans dans l'industrie",
      slug: "40-ans-dans-l-industrie",
      description:
        "Les leçons de leadership et de gestion d'une entreprise familiale sur plusieurs décennies.",
      content: "Interview avec Jean Martin sur son expérience de dirigeant...",
      excerpt:
        "Un regard rétrospectif sur 40 ans de direction d'entreprise familiale.",
      guest: "Jean Martin",
      role: "Président-directeur général",
      company: "Industries Martin",
      duration: "60 min",
      date: new Date("2024-03-10"),
      tags: ["industrie", "transmission", "leadership", "entreprise-familiale"],
      category: "experimentes",
      imageUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example2",
      audioUrl: "https://example.com/audio2.mp3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      status: "published",
      isFeatured: true,
      views: 980,
      listens: 720,
      shares: 85,
      likes: 67,
    },
    {
      title: "Politique et Entrepreneuriat",
      slug: "politique-et-entrepreneuriat",
      description: "Comment concilier vie politique et entrepreneuriat.",
      content:
        "Discussion avec Sophie Lambert sur l'intersection entre politique et business...",
      excerpt:
        "Les défis et opportunités d'être à la fois entrepreneure et politicienne.",
      guest: "Sophie Lambert",
      role: "Députée & Entrepreneure",
      company: "Assemblée Nationale",
      duration: "50 min",
      date: new Date("2024-03-05"),
      tags: ["politique", "innovation", "public", "leadership-feminin"],
      category: "politiques",
      imageUrl:
        "https://images.unsplash.com/photo-1589156280159-27698a70f29e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example3",
      audioUrl: "https://example.com/audio3.mp3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1589156280159-27698a70f29e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      status: "published",
      isFeatured: false,
      views: 750,
      listens: 520,
      shares: 45,
      likes: 38,
    },
    {
      title: "L'entrepreneuriat à 20 ans",
      slug: "l-entrepreneuriat-a-20-ans",
      description: "Lancer sa startup en parallèle des études.",
      content:
        "Témoignage de Lucas Petit sur son parcours d'étudiant-entrepreneur...",
      excerpt: "Comment concilier études supérieures et création d'entreprise.",
      guest: "Lucas Petit",
      role: "Fondateur",
      company: "AppGenius",
      duration: "35 min",
      date: new Date("2024-03-01"),
      tags: ["jeune", "tech", "mobile", "etudiant-entrepreneur"],
      category: "jeunes",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example4",
      audioUrl: "https://example.com/audio4.mp3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      status: "published",
      isFeatured: true,
      views: 1100,
      listens: 780,
      shares: 95,
      likes: 82,
    },
    {
      title: "Startup à La Réunion : défi insulaire",
      slug: "startup-a-la-reunion-defi-insulaire",
      description: "Créer une entreprise tech dans un territoire ultra-marin.",
      content:
        "Interview avec David Hoarau sur les spécificités de l'entrepreneuriat réunionnais...",
      excerpt:
        "Les avantages et contraintes du marché local pour les startups.",
      guest: "David Hoarau",
      role: "CEO & Co-fondateur",
      company: "RéunionTech",
      duration: "55 min",
      date: new Date("2024-02-25"),
      tags: ["reunion", "tech", "territoire", "innovation-locale"],
      category: "success",
      imageUrl:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com/watch?v=example5",
      audioUrl: "https://example.com/audio5.mp3",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      status: "published",
      isFeatured: true,
      views: 920,
      listens: 650,
      shares: 78,
      likes: 71,
    },
  ];

  for (const interviewData of interviews) {
    const existingInterview = await prisma.entrepreneurInterview.findUnique({
      where: { slug: interviewData.slug },
    });

    if (!existingInterview) {
      await prisma.entrepreneurInterview.create({
        data: {
          ...interviewData,
          authorId: adminUser.id,
          publishedAt: new Date(),
        },
      });
      console.log(`✅ Interview créée: ${interviewData.title}`);
    } else {
      console.log(`⏭️ Interview déjà existante: ${interviewData.title}`);
    }
  }

  // 2. Seed des ressources
  const resources = [
    {
      title: "Business Plan Template",
      description:
        "Modèle complet pour structurer votre projet entrepreneurial",
      type: "template",
      category: "financement",
      fileUrl: "/templates/business-plan.pdf",
      fileSize: "2.5 MB",
      fileType: "pdf",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      tags: ["business-plan", "template", "démarrage"],
      downloads: 1500,
      isFree: true,
      status: "published",
      isFeatured: true,
    },
    {
      title: "Guide Financement Départemental",
      description: "Toutes les aides et financements disponibles à La Réunion",
      type: "guide",
      category: "financement",
      fileUrl: "/guides/financement-reunion.pdf",
      fileSize: "3.2 MB",
      fileType: "pdf",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      tags: ["financement", "aides", "réunion", "subventions"],
      downloads: 890,
      isFree: true,
      status: "published",
      isFeatured: true,
    },
    {
      title: "Calculateur ROI",
      description: "Estimez votre retour sur investissement pour votre projet",
      type: "tool",
      category: "financement",
      fileUrl: "/tools/roi-calculator.xlsx",
      fileSize: "1.8 MB",
      fileType: "xlsx",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      tags: ["calculateur", "roi", "finance", "outil"],
      downloads: 620,
      isFree: true,
      status: "published",
      isFeatured: false,
    },
    {
      title: "Checklist Lancement Réunion",
      description:
        "Toutes les étapes pour un lancement réussi d'entreprise à La Réunion",
      type: "checklist",
      category: "legal",
      fileUrl: "/checklists/launch-checklist-reunion.pdf",
      fileSize: "1.2 MB",
      fileType: "pdf",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      tags: ["checklist", "lancement", "réunion", "étapes"],
      downloads: 1100,
      isFree: true,
      status: "published",
      isFeatured: true,
    },
    {
      title: "Guide Marketing Digital Local",
      description:
        "Stratégies de marketing digital adaptées au marché réunionnais",
      type: "guide",
      category: "marketing",
      fileUrl: "/guides/marketing-digital-local.pdf",
      fileSize: "4.1 MB",
      fileType: "pdf",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      tags: ["marketing", "digital", "local", "réunion"],
      downloads: 750,
      isFree: true,
      status: "published",
      isFeatured: false,
    },
  ];

  for (const resourceData of resources) {
    const existingResource = await prisma.entrepreneurResource.findFirst({
      where: { title: resourceData.title },
    });

    if (!existingResource) {
      await prisma.entrepreneurResource.create({
        data: {
          ...resourceData,
          authorId: adminUser.id,
        },
      });
      console.log(`✅ Ressource créée: ${resourceData.title}`);
    } else {
      console.log(`⏭️ Ressource déjà existante: ${resourceData.title}`);
    }
  }

  // 3. Seed des événements
  const events = [
    {
      title: "Webinar: Levée de fonds à La Réunion",
      description:
        "Découvrez comment lever des fonds pour votre startup dans le contexte réunionnais",
      format: "webinar",
      date: new Date("2024-04-15"),
      time: "18:30",
      duration: "2h",
      speakers: ["Sarah Chen", "Marc Hoarau"],
      speakerRoles: ["Venture Capitalist", "Expert financement local"],
      registered: 145,
      maxParticipants: 500,
      isRegistrationOpen: true,
      location: "En ligne",
      onlineLink: "https://meet.google.com/xyz-abc-def",
      status: "upcoming",
    },
    {
      title: "Workshop: Pitch Deck Gagnant",
      description:
        "Apprenez à créer un pitch deck qui convainc les investisseurs",
      format: "workshop",
      date: new Date("2024-04-20"),
      time: "14:00",
      duration: "3h",
      speakers: ["Marc Lefebvre"],
      speakerRoles: ["Pitch Coach"],
      registered: 25,
      maxParticipants: 30,
      isRegistrationOpen: true,
      location: "CCI Réunion, Saint-Denis",
      onlineLink: null,
      status: "upcoming",
    },
    {
      title: "Networking Entrepreneurs Réunion",
      description:
        "Rencontrez d'autres entrepreneurs et échangez sur vos projets",
      format: "networking",
      date: new Date("2024-04-25"),
      time: "19:00",
      duration: "3h",
      speakers: ["Communauté OLIPLUS"],
      speakerRoles: ["Organisateur"],
      registered: 87,
      maxParticipants: 100,
      isRegistrationOpen: true,
      location: "Coworking Saint-Pierre",
      onlineLink: null,
      status: "upcoming",
    },
    {
      title: "Conférence: Entrepreneuriat Féminin",
      description:
        "Table ronde sur les spécificités de l'entrepreneuriat féminin à La Réunion",
      format: "conference",
      date: new Date("2024-05-10"),
      time: "17:00",
      duration: "2h30",
      speakers: ["Marie Dubois", "Sophie Lambert", "Nathalie Hoareau"],
      speakerRoles: [
        "CEO EcoTech",
        "Députée",
        "Présidente Femmes Entrepreneurs",
      ],
      registered: 65,
      maxParticipants: 150,
      isRegistrationOpen: true,
      location: "Hôtel de Région",
      onlineLink: "https://meet.google.com/xyz-abc-ghi",
      status: "upcoming",
    },
  ];

  for (const eventData of events) {
    const existingEvent = await prisma.entrepreneurEvent.findFirst({
      where: {
        title: eventData.title,
        date: eventData.date,
      },
    });

    if (!existingEvent) {
      await prisma.entrepreneurEvent.create({
        data: {
          ...eventData,
          organizerId: adminUser.id,
        },
      });
      console.log(`✅ Événement créé: ${eventData.title}`);
    } else {
      console.log(`⏭️ Événement déjà existant: ${eventData.title}`);
    }
  }

  console.log("✅ Seeding des données entrepreneuriat terminé !");
}

// Exécution du seeding
seedEntrepreneuriat()
  .catch((error) => {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
