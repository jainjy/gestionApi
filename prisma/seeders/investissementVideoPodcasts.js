// prisma/seeders/investissementVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Les bases de l'investissement : par où commencer ?",
    description: "Guide complet pour débutants : comprendre les marchés, définir ses objectifs et choisir ses premiers placements. Analyse des différentes options d'investissement.",
    duration: "00:39:15",
    category: "Investissement",
    views: 4230,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/bases-investissement-par-ou-commencer.mp4"
  },
  {
    title: "Portefeuille diversifié : construire son allocation d'actifs",
    description: "Stratégies pour répartir son capital entre actions, obligations, immobilier et placements alternatifs. Méthodes de diversification optimale.",
    duration: "00:42:30",
    category: "Investissement",
    views: 3560,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1642790553125-4d2b55a43571?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/portefeuille-diversifie-allocation-actifs.mp4"
  },
  {
    title: "Investissement immobilier vs boursier : comparatif détaillé",
    description: "Avantages et inconvénients de chaque approche, rentabilité, liquidité et niveau d'implication requis. Analyse comparative complète.",
    duration: "00:37:45",
    category: "Investissement",
    views: 3980,
    isActive: true,
    isPremium: false,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/immobilier-vs-boursier-comparatif.mp4"
  },
  {
    title: "Plateforme de trading : démonstration complète",
    description: "Prise en main d'une plateforme de trading avec explication des ordres, graphiques et outils d'analyse. Guide pratique pas à pas.",
    duration: "00:28:40",
    category: "Investissement",
    views: 4450,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/plateforme-trading-demonstration-complete.mp4"
  },
  {
    title: "Analyse technique : lire les graphiques boursiers",
    description: "Formation sur les indicateurs techniques, supports/résistances et figures chartistes pour le trading. Méthodes d'analyse avancées.",
    duration: "00:32:25",
    category: "Investissement",
    views: 3780,
    isActive: true,
    isPremium: false,
    fileSize: 201234567,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/analyse-technique-graphiques-boursiers.mp4"
  },
  {
    title: "Simulateur d'investissement : projection de rendement",
    description: "Utilisation d'un simulateur pour estimer la croissance de son portefeuille selon différentes stratégies. Outils de planification financière.",
    duration: "00:24:15",
    category: "Investissement",
    views: 3120,
    isActive: true,
    isPremium: false,
    fileSize: 145678901,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/simulateur-investissement-projection-rendement.mp4"
  },
  {
    title: "Cryptomonnaies : comprendre les actifs numériques",
    description: "Introduction au monde des cryptomonnaies : blockchain, Bitcoin, Ethereum et autres altcoins. Risques et opportunités.",
    duration: "00:35:20",
    category: "Investissement",
    views: 4670,
    isActive: true,
    isPremium: true,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/cryptomonnaies-comprendre-actifs-numeriques.mp4"
  },
  {
    title: "Investissement responsable : ESG et critères durables",
    description: "Intégrer les critères environnementaux, sociaux et de gouvernance dans ses décisions d'investissement. Finance durable et impact investing.",
    duration: "00:29:50",
    category: "Investissement",
    views: 3340,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/investissement/investissement-responsable-esg-durable.mp4"
  }
];

async function main() {
  console.log('📈 Début du seeding des vidéos Investissement...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Investissement" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Investissement existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Investissement" }
      });
      console.log('✅ Anciennes vidéos Investissement supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Investissement...');

    // Créer les vidéos
    for (const videoData of videoPodcasts) {
      const video = await prisma.video.create({
        data: {
          title: videoData.title,
          description: videoData.description,
          duration: videoData.duration,
          category: videoData.category,
          views: videoData.views,
          isActive: videoData.isActive,
          isPremium: videoData.isPremium,
          fileSize: videoData.fileSize,
          mimeType: videoData.mimeType,
          videoUrl: videoData.videoUrl,
          thumbnailUrl: videoData.thumbnailUrl,
          storagePath: videoData.storagePath,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ 📹 Vidéo créée: ${video.title} (${video.views} vues)`);
    }

    console.log('🎉 Seeding des vidéos Investissement terminé !');
    console.log(`📊 ${videoPodcasts.length} vidéos créées avec succès`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });