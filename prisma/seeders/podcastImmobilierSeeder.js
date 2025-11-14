// seeders/podcastEntrepriseSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Leadership : développer son impact managérial",
    description: "Les compétences essentielles pour devenir un leader inspirant et fédérer ses équipes dans un environnement complexe.",
    duration: "00:45:20",
    category: "Entreprise",
    listens: 3120,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Stratégie d'entreprise : construire un avantage concurrentiel",
    description: "Méthodologies pour élaborer une stratégie pérenne et créer de la valeur durable pour son entreprise.",
    duration: "00:38:45",
    category: "Entreprise",
    listens: 2780,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  {
    title: "Transformation digitale : réussir sa transition",
    description: "Guide pratique pour accompagner les entreprises dans leur transformation numérique et rester compétitives.",
    duration: "00:42:30",
    category: "Entreprise",
    listens: 3450,
    isActive: true,
    fileSize: 48901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Gestion de crise : anticiper et rebondir",
    description: "Stratégies de gestion de crise et plans de continuité d'activité pour faire face aux imprévus.",
    duration: "00:36:15",
    category: "Entreprise",
    listens: 2890,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Innovation et R&D : cultiver la créativité",
    description: "Comment développer une culture de l'innovation et structurer sa recherche et développement.",
    duration: "00:39:50",
    category: "Entreprise",
    listens: 2670,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Management à distance : outils et bonnes pratiques",
    description: "Adapter son management pour piloter efficacement des équipes distantes et maintenir la cohésion.",
    duration: "00:33:40",
    category: "Entreprise",
    listens: 4230,
    isActive: true,
    fileSize: 36789012,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Business Plan : modèle financier interactif",
    description: "Création pas à pas d'un business plan complet avec projections financières et analyse de rentabilité.",
    duration: "00:32:25",
    category: "Entreprise",
    listens: 3560,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Tableau de bord commercial : reporting avancé",
    description: "Mise en place d'un tableau de bord pour suivre les performances commerciales en temps réel.",
    duration: "00:28:40",
    category: "Entreprise",
    listens: 3120,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Pitch investisseurs : répétition commentée",
    description: "Analyse de pitchs réels avec retours d'experts pour convaincre les investisseurs.",
    duration: "00:25:15",
    category: "Entreprise",
    listens: 2980,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  },
  {
    title: "Atelier design thinking : résolution de problèmes",
    description: "Animation complète d'un atelier de design thinking pour innover sur des challenges business.",
    duration: "00:35:30",
    category: "Entreprise",
    listens: 2340,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "CRM : optimisation des processus commerciaux",
    description: "Configuration avancée d'un CRM pour automatiser le funnel de vente et améliorer la conversion.",
    duration: "00:29:55",
    category: "Entreprise",
    listens: 2670,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Entretien d'embauche : techniques de recrutement",
    description: "Méthodes pour conduire des entretiens efficaces et recruter les meilleurs talents.",
    duration: "00:26:20",
    category: "Entreprise",
    listens: 3780,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Transformation culturelle : étude de cas",
    description: "Retour d'expérience sur une transformation culturelle réussie dans une entreprise traditionnelle.",
    duration: "00:31:45",
    category: "Entreprise",
    listens: 2890,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Analyse de marché : outils et méthodologies",
    description: "Utilisation des outils d'analyse de marché pour identifier les opportunités et menaces.",
    duration: "00:27:10",
    category: "Entreprise",
    listens: 2450,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🏢 Début du seeding des podcasts Entreprise...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Entreprise" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Entreprise existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Entreprise" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/entreprise/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/entreprise/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Entreprise terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });