// prisma/seeders/entrepriseVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Création d'entreprise : les étapes clés",
    description: "Guide complet pour créer son entreprise : statut juridique, business plan, formalités administratives et financement. Conseils d'experts.",
    duration: "00:31:20",
    category: "Entreprise",
    views: 1890,
    isActive: true,
    isPremium: false,
    fileSize: 195432198,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/creation-entreprise-etapes-cles.mp4"
  },
  {
    title: "Stratégie de croissance : scaling et développement",
    description: "Comment passer de startup à scale-up : levée de fonds, recrutement, internationalisation et optimisation des processus.",
    duration: "00:35:45",
    category: "Entreprise",
    views: 1560,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/strategie-croissance-scaling.mp4"
  },
  {
    title: "Management d'équipe : leadership et motivation",
    description: "Techniques de management modernes : communication efficace, délégation, reconnaissance et développement des talents.",
    duration: "00:28:15",
    category: "Entreprise",
    views: 2230,
    isActive: true,
    isPremium: false,
    fileSize: 178901234,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/management-equipe-leadership.mp4"
  },
  {
    title: "Transformation digitale : enjeux et solutions",
    description: "Comment réussir sa transformation digitale : outils, méthodologie, formation des équipes et mesure des résultats.",
    duration: "00:33:50",
    category: "Entreprise",
    views: 1980,
    isActive: true,
    isPremium: true,
    fileSize: 245678901,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/transformation-digitale-enjeux.mp4"
  },
  {
    title: "Financement : trouver les bons investisseurs",
    description: "Tour d'horizon des solutions de financement : love money, business angels, VC, banques et aides publiques.",
    duration: "00:29:30",
    category: "Entreprise",
    views: 1670,
    isActive: true,
    isPremium: false,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/financement-trouver-investisseurs.mp4"
  },
  {
    title: "Marketing B2B : stratégies qui fonctionnent",
    description: "Techniques de marketing B2B efficaces : inbound marketing, account based marketing, content marketing et automation.",
    duration: "00:26:40",
    category: "Entreprise",
    views: 2140,
    isActive: true,
    isPremium: true,
    fileSize: 167890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/marketing-b2b-strategies.mp4"
  },
  {
    title: "Innovation et R&D : rester compétitif",
    description: "Comment développer une culture de l'innovation : veille technologique, R&D, partenariats et protection intellectuelle.",
    duration: "00:30:25",
    category: "Entreprise",
    views: 1450,
    isActive: true,
    isPremium: false,
    fileSize: 201234567,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/innovation-rd-competitivite.mp4"
  },
  {
    title: "Gestion de crise : anticiper et réagir",
    description: "Plan de gestion de crise : communication, continuité d'activité, management et retour à la normale.",
    duration: "00:27:15",
    category: "Entreprise",
    views: 1320,
    isActive: true,
    isPremium: true,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/entreprise/gestion-crise-anticipation.mp4"
  }
];

async function main() {
  console.log('🏢 Début du seeding des vidéos Entreprise...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Entreprise" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Entreprise existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Entreprise" }
      });
      console.log('✅ Anciennes vidéos Entreprise supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Entreprise...');

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

    console.log('🎉 Seeding des vidéos Entreprise terminé !');
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