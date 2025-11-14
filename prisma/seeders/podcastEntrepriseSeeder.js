// seeders/podcastImmobilierSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  {
    title: "Investissement locatif : les bases pour bien débuter",
    description: "Guide complet pour se lancer dans l'investissement locatif. Rendement, fiscalité et choix du bien.",
    duration: "00:38:20",
    category: "Immobilier",
    listens: 2150,
    isActive: true,
    fileSize: 36789123, // 36.8 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Marché immobilier 2024 : tendances et prévisions",
    description: "Analyse du marché actuel et perspectives pour l'année. Prix, taux d'emprunt et zones dynamiques.",
    duration: "00:42:15",
    category: "Immobilier",
    listens: 1870,
    isActive: true,
    fileSize: 41234567, // 41.2 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Crédit immobilier : optimiser son dossier d'emprunt",
    description: "Conseils pour obtenir le meilleur taux et monter un dossier solide. Apport, endettement et assurances.",
    duration: "00:35:40",
    category: "Immobilier",
    listens: 2420,
    isActive: true,
    fileSize: 34567890, // 34.6 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Rénovation : augmenter la valeur de son bien",
    description: "Travaux qui rapportent le plus et astuces pour optimiser son budget rénovation. ROI et priorisation.",
    duration: "00:31:55",
    category: "Immobilier",
    listens: 1650,
    isActive: true,
    fileSize: 31234567, // 31.2 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Défiscalisation immobilière : Pinel, LMNP, Malraux",
    description: "Comparatif des dispositifs de défiscalisation. Avantages, inconvénients et critères d'éligibilité.",
    duration: "00:45:30",
    category: "Immobilier",
    listens: 1320,
    isActive: true,
    fileSize: 45678901, // 45.7 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Visite virtuelle : appartement neuf vs ancien",
    description: "Comparaison en vidéo des avantages et inconvénients. Qualité de construction, travaux et charges.",
    duration: "00:18:25",
    category: "Immobilier",
    listens: 3250,
    isActive: true,
    fileSize: 156789012, // 156.8 MB
    mimeType: "video/mp4"
  },
  {
    title: "Diagnostics immobiliers : ce qu'il faut vérifier",
    description: "Guide visuel des diagnostics obligatoires. Électricité, plomb, termites et performance énergétique.",
    duration: "00:22:40",
    category: "Immobilier",
    listens: 1980,
    isActive: true,
    fileSize: 187654321, // 187.7 MB
    mimeType: "video/mp4"
  },
  {
    title: "Négociation d'achat : techniques efficaces",
    description: "Stratégies pour négocier le prix d'un bien. Argumentation et timing pour maximiser la décote.",
    duration: "00:26:15",
    category: "Immobilier",
    listens: 2750,
    isActive: true,
    fileSize: 198765432, // 198.8 MB
    mimeType: "video/mp4"
  },
  {
    title: "Copropriété : droits et obligations",
    description: "Tout comprendre sur la vie en copropriété. Syndic, assemblée générale et travaux collectifs.",
    duration: "00:29:50",
    category: "Immobilier",
    listens: 1420,
    isActive: true,
    fileSize: 234567890, // 234.6 MB
    mimeType: "video/mp4"
  },
  {
    title: "Investissement en SCPI : le guide complet",
    description: "Découverte des Sociétés Civiles de Placement Immobilier. Rendement, liquidité et fiscalité.",
    duration: "00:33:20",
    category: "Immobilier",
    listens: 1680,
    isActive: true,
    fileSize: 256789012, // 256.8 MB
    mimeType: "video/mp4"
  },
  {
    title: "Location saisonnière : Airbnb et réglementation",
    description: "Comment réussir dans la location saisonnière. Aménagement, tarification et obligations légales.",
    duration: "00:24:35",
    category: "Immobilier",
    listens: 3100,
    isActive: true,
    fileSize: 187654321, // 187.7 MB
    mimeType: "video/mp4"
  },
  {
    title: "Construction maison : suivi de chantier",
    description: "Reportage sur la construction d'une maison individuelle. Étapes clés et points de vigilance.",
    duration: "00:31:45",
    category: "Immobilier",
    listens: 2250,
    isActive: true,
    fileSize: 245678901, // 245.7 MB
    mimeType: "video/mp4"
  },
  {
    title: "Estimation gratuite de son bien immobilier",
    description: "Méthodes pour estimer soi-même la valeur de son logement. Comparables et critères d'évaluation.",
    duration: "00:20:10",
    category: "Immobilier",
    listens: 2850,
    isActive: true,
    fileSize: 167890123, // 167.9 MB
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🏠 Début du seeding des podcasts Immobilier...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Immobilier" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Immobilier existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Immobilier" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/immobilier/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
        thumbnailUrl: `https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/immobilier/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`
      }
    });
    console.log(`✅ Podcast créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Immobilier terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });