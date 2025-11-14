// seeders/podcastInvestissementSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Les bases de l'investissement : par où commencer ?",
    description: "Guide complet pour débutants : comprendre les marchés, définir ses objectifs et choisir ses premiers placements.",
    duration: "00:39:15",
    category: "Investissement",
    listens: 4230,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Portefeuille diversifié : construire son allocation d'actifs",
    description: "Stratégies pour répartir son capital entre actions, obligations, immobilier et placements alternatifs.",
    duration: "00:42:30",
    category: "Investissement",
    listens: 3560,
    isActive: true,
    fileSize: 48901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Investissement immobilier vs boursier : comparatif",
    description: "Avantages et inconvénients de chaque approche, rentabilité, liquidité et niveau d'implication requis.",
    duration: "00:37:45",
    category: "Investissement",
    listens: 3980,
    isActive: true,
    fileSize: 42345678,
    mimeType: "audio/mpeg"
  },
  {
    title: "ETF et fonds indiciels : la stratégie passive",
    description: "Comprendre les ETF, leurs avantages fiscaux et comment les intégrer dans sa stratégie d'investissement.",
    duration: "00:35:20",
    category: "Investissement",
    listens: 3120,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Analyse fondamentale : évaluer la valeur d'une entreprise",
    description: "Méthodes pour analyser les états financiers, calculer les ratios et identifier les actions sous-évaluées.",
    duration: "00:44:10",
    category: "Investissement",
    listens: 2890,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Investissement responsable : ESG et critères durables",
    description: "Intégrer les critères environnementaux, sociaux et de gouvernance dans ses décisions d'investissement.",
    duration: "00:38:55",
    category: "Investissement",
    listens: 2670,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Plateforme de trading : démonstration complète",
    description: "Prise en main d'une plateforme de trading avec explication des ordres, graphiques et outils d'analyse.",
    duration: "00:28:40",
    category: "Investissement",
    listens: 4450,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Analyse technique : lire les graphiques boursiers",
    description: "Formation sur les indicateurs techniques, supports/résistances et figures chartistes pour le trading.",
    duration: "00:32:25",
    category: "Investissement",
    listens: 3780,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Simulateur d'investissement : projection de rendement",
    description: "Utilisation d'un simulateur pour estimer la croissance de son portefeuille selon différentes stratégies.",
    duration: "00:24:15",
    category: "Investissement",
    listens: 3120,
    isActive: true,
    fileSize: 156789012,
    mimeType: "video/mp4"
  },
  {
    title: "SCPI : visite virtuelle d'un parc immobilier",
    description: "Découverte en vidéo des actifs détenus par une SCPI et explication du mécanisme de rendement.",
    duration: "00:19:30",
    category: "Investissement",
    listens: 2890,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  },
  {
    title: "Crypto-actifs : portefeuille et sécurité",
    description: "Configuration d'un wallet sécurisé et bonnes pratiques pour investir dans les cryptomonnaies.",
    duration: "00:26:50",
    category: "Investissement",
    listens: 5230,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Private Equity : investir dans les startups",
    description: "Processus complet d'investissement en capital-risque, due diligence et suivi des participations.",
    duration: "00:35:20",
    category: "Investissement",
    listens: 2340,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Or et métaux précieux : stratégie de couverture",
    description: "Comment intégrer l'or dans son portefeuille comme valeur refuge et protection contre l'inflation.",
    duration: "00:22:45",
    category: "Investissement",
    listens: 2670,
    isActive: true,
    fileSize: 156789012,
    mimeType: "video/mp4"
  },
  {
    title: "Investissement international : diversification géographique",
    description: "Opportunités et risques des marchés émergents, méthodes pour investir à l'international.",
    duration: "00:29:35",
    category: "Investissement",
    listens: 2980,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('📈 Début du seeding des podcasts Investissement...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Investissement" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Investissement existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Investissement" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/investissement/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1642790553125-4d2b55a43571?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/investissement/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Investissement terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });