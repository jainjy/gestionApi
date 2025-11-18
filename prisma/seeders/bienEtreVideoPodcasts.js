// prisma/seeders/bienEtreVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Méditation guidée : retrouvez votre paix intérieure",
    description: "Séance de méditation complète pour se recentrer et apaiser l'esprit. Techniques de respiration et visualisation pour un bien-être profond.",
    duration: "00:25:30",
    category: "Bien-être",
    views: 3450,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/meditation-guidee-paix-interieure.mp4"
  },
  {
    title: "Yoga du matin : énergie et vitalité",
    description: "Routine de yoga douce pour bien commencer la journée. Postures adaptées à tous les niveaux pour réveiller le corps en douceur.",
    duration: "00:32:15",
    category: "Bien-être",
    views: 2780,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/yoga-matin-energie-vitalite.mp4"
  },
  {
    title: "Nutrition consciente : mangez en pleine conscience",
    description: "Découvrez comment transformer votre relation avec la nourriture. Techniques pour une alimentation intuitive et équilibrée.",
    duration: "00:28:45",
    category: "Bien-être",
    views: 3120,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/nutrition-consciente-pleine-conscience.mp4"
  },
  {
    title: "Gestion du stress : techniques au quotidien",
    description: "Méthodes pratiques pour réduire le stress et l'anxiété dans votre vie quotidienne. Outils concrets et faciles à appliquer.",
    duration: "00:35:20",
    category: "Bien-être",
    views: 2890,
    isActive: true,
    isPremium: true,
    fileSize: 245678901,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/gestion-stress-techniques-quotidien.mp4"
  },
  {
    title: "Séance de yoga complète en vidéo",
    description: "Pratique guidée de yoga flow pour tous niveaux. Instructions détaillées et modifications pour chaque posture.",
    duration: "00:45:20",
    category: "Bien-être",
    views: 2340,
    isActive: true,
    isPremium: false,
    fileSize: 267890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/yoga-complet-video.mp4"
  },
  {
    title: "Méditation en pleine nature",
    description: "Séance de méditation immersive au cœur de la forêt. Sons naturels et guidance douce pour une connexion profonde.",
    duration: "00:35:15",
    category: "Bien-être",
    views: 2670,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518607692856-c6d6d39d8e82?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/meditation-pleine-nature.mp4"
  },
  {
    title: "Cours de pilates débutant",
    description: "Découverte du pilates avec des exercices fondamentaux. Renforcement musculaire en douceur et amélioration de la posture.",
    duration: "00:38:40",
    category: "Bien-être",
    views: 2230,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/pilates-debutant.mp4"
  },
  {
    title: "Auto-massage détente : techniques simples",
    description: "Apprenez à vous masser pour relâcher les tensions du cou, des épaules et du dos. Techniques accessibles à tous.",
    duration: "00:28:30",
    category: "Bien-être",
    views: 1980,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/bien-etre/auto-massage-detente.mp4"
  }
];

async function main() {
  console.log('🌿 Début du seeding des vidéos Bien-être...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Bien-être" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Bien-être existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Bien-être" }
      });
      console.log('✅ Anciennes vidéos Bien-être supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Bien-être...');

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

    console.log('🎉 Seeding des vidéos Bien-être terminé !');
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