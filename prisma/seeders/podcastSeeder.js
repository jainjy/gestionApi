// seeders/podcastSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  {
    title: "Les fondements de la création d'entreprise",
    description: "Découvrez les étapes essentielles pour transformer votre idée en entreprise viable. Conseils pratiques et retours d'expérience.",
    duration: "00:32:15",
    category: "Entreprise",
    listens: 1250,
    isActive: true,
    fileSize: 25431892, // 25.4 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Stratégies de croissance pour PME",
    description: "Comment développer votre entreprise de manière durable. Stratégies marketing, levée de fonds et expansion.",
    duration: "00:41:30",
    category: "Entreprise",
    listens: 980,
    isActive: true,
    fileSize: 39876543, // 39.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Management d'équipe en startup",
    description: "Les meilleures pratiques pour manager une équipe en phase de croissance. Recrutement, motivation et culture d'entreprise.",
    duration: "00:28:45",
    category: "Entreprise",
    listens: 1560,
    isActive: true,
    fileSize: 27654321, // 27.7 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Innovation et transformation digitale",
    description: "Comment intégrer les nouvelles technologies dans votre entreprise. Cas concrets et tendances 2024.",
    duration: "00:36:20",
    category: "Entreprise",
    listens: 890,
    isActive: true,
    fileSize: 35678901, // 35.7 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Financement et business plan",
    description: "Tout savoir sur les différentes sources de financement et comment construire un business plan convaincant.",
    duration: "00:39:10",
    category: "Entreprise",
    listens: 1120,
    isActive: true,
    fileSize: 40123456, // 40.1 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Export et développement international",
    description: "Stratégies pour développer votre entreprise à l'international. Marchés porteurs et pièges à éviter.",
    duration: "00:34:55",
    category: "Entreprise",
    listens: 740,
    isActive: true,
    fileSize: 34219876, // 34.2 MB
    mimeType: "audio/mpeg"
  }
];

async function main() {
  console.log('🎧 Début du seeding des podcasts...');

  // Vérifier si des podcasts existent déjà
  const existingPodcasts = await prisma.podcast.count();
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts existent déjà, suppression...');
    await prisma.podcast.deleteMany({});
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
        thumbnailUrl: `https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/audio/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`
      }
    });
    console.log(`✅ Podcast créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });