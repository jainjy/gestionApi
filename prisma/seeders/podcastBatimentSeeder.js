// seeders/podcastBatimentSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  {
    title: "Les nouvelles réglementations thermiques 2024",
    description: "Tout comprendre sur la RE2020 et son impact sur les constructions neuves. Conseils pour s'adapter aux nouvelles normes.",
    duration: "00:38:25",
    category: "Bâtiment & Construction",
    listens: 890,
    isActive: true,
    fileSize: 36789123, // 36.8 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Matériaux écologiques : tendances et innovations",
    description: "Découverte des nouveaux matériaux durables pour la construction. Retours d'expérience sur le béton bas carbone et le bois local.",
    duration: "00:42:15",
    category: "Bâtiment & Construction",
    listens: 670,
    isActive: true,
    fileSize: 41234567, // 41.2 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Gestion de chantier : optimiser les délais et coûts",
    description: "Méthodes et outils pour une gestion de chantier efficace. Prévention des retards et maîtrise des budgets.",
    duration: "00:35:40",
    category: "Bâtiment & Construction",
    listens: 1120,
    isActive: true,
    fileSize: 34567890, // 34.6 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Rénovation énergétique : subventions et aides 2024",
    description: "Guide complet des aides disponibles pour la rénovation. MaPrimeRénov', CEE, éco-prêt à taux zéro...",
    duration: "00:31:55",
    category: "Bâtiment & Construction",
    listens: 1540,
    isActive: true,
    fileSize: 31234567, // 31.2 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Sécurité sur les chantiers : obligations et bonnes pratiques",
    description: "Rappel des obligations légales et mise en place d'une culture sécurité. Protection des travailleurs et prévention des risques.",
    duration: "00:29:30",
    category: "Bâtiment & Construction",
    listens: 780,
    isActive: true,
    fileSize: 29876543, // 29.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "BIM et maquette numérique : révolution dans le BTP",
    description: "Comment le BIM transforme la conception et la gestion des projets de construction. Retour d'expérience d'un bureau d'études.",
    duration: "00:45:20",
    category: "Bâtiment & Construction",
    listens: 560,
    isActive: true,
    fileSize: 45678901, // 45.7 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Construction bois : avantages et défis techniques",
    description: "Tout sur la construction bois : performances, durabilité, aspects réglementaires. Interview d'un charpentier expert.",
    duration: "00:39:45",
    category: "Bâtiment & Construction",
    listens: 920,
    isActive: true,
    fileSize: 39876543, // 39.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Digitalisation des métiers du bâtiment",
    description: "Les outils numériques qui transforment les métiers du BTP. Drones, réalité augmentée, gestion de projet en cloud.",
    duration: "00:36:10",
    category: "Bâtiment & Construction",
    listens: 640,
    isActive: true,
    fileSize: 36789012, // 36.8 MB
    mimeType: "audio/mpeg"
  }
];

async function main() {
  console.log ('🏗️  Début du seeding des podcasts Bâtiment & Construction...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Bâtiment & Construction" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Bâtiment & Construction existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Bâtiment & Construction" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/batiment/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
        thumbnailUrl: `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/batiment/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`
      }
    });
    console.log(`✅ Podcast créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Bâtiment & Construction terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });