// prisma/seeders/alimentationVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Nutrition santé : les bases d'une alimentation équilibrée",
    description: "Découvrez les fondamentaux de la nutrition : macronutriments, micronutriments et équilibre alimentaire au quotidien.",
    duration: "00:36:45",
    category: "Alimentation",
    views: 3240,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/nutrition-sante-bases-equilibre.mp4"
  },
  {
    title: "Super-aliments : mythes et réalités",
    description: "Analyse des super-aliments tendance : baies de goji, graines de chia, spiruline. Quels sont leurs véritables bienfaits ?",
    duration: "00:32:20",
    category: "Alimentation",
    views: 2780,
    isActive: true,
    isPremium: true,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/super-aliments-mythes-realites.mp4"
  },
  {
    title: "Cuisine végétale : débuter en douceur",
    description: "Guide pratique pour incorporer plus de végétal dans son alimentation sans carences et avec plaisir.",
    duration: "00:41:10",
    category: "Alimentation",
    views: 3560,
    isActive: true,
    isPremium: false,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/cuisine-vegetale-debuter-douceur.mp4"
  },
  {
    title: "Recette healthy : bowl vitaminé du matin",
    description: "Préparation pas à pas d'un petit-déjeuner nutritif et coloré pour bien commencer la journée.",
    duration: "00:15:30",
    category: "Alimentation",
    views: 4230,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/recette-bowl-vitamine-matin.mp4"
  },
  {
    title: "Techniques de coupe : maîtriser les bases",
    description: "Démonstration des techniques essentielles de découpe pour gagner en efficacité en cuisine.",
    duration: "00:22:45",
    category: "Alimentation",
    views: 3340,
    isActive: true,
    isPremium: false,
    fileSize: 167890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/techniques-coupe-bases.mp4"
  },
  {
    title: "Cuisine anti-gaspi : recettes zéro déchet",
    description: "Astuces et recettes pour utiliser toutes les parties des aliments et réduire le gaspillage.",
    duration: "00:28:20",
    category: "Alimentation",
    views: 2980,
    isActive: true,
    isPremium: false,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/cuisine-anti-gaspi-zero-dechet.mp4"
  },
  {
    title: "Alimentation intuitive : écouter son corps",
    description: "Apprenez à reconnaître les signaux de faim et de satiété pour une relation saine avec la nourriture.",
    duration: "00:35:15",
    category: "Alimentation",
    views: 2670,
    isActive: true,
    isPremium: true,
    fileSize: 212345678,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/alimentation-intuitive-ecouter-corps.mp4"
  },
  {
    title: "Batch cooking : organisation de la semaine",
    description: "Méthode complète pour préparer ses repas de la semaine en une seule session de cuisine.",
    duration: "00:31:40",
    category: "Alimentation",
    views: 3120,
    isActive: true,
    isPremium: false,
    fileSize: 201234567,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/alimentation/batch-cooking-organisation-semaine.mp4"
  }
];

async function main() {
  console.log('🍎 Début du seeding des vidéos Alimentation...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Alimentation" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Alimentation existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Alimentation" }
      });
      console.log('✅ Anciennes vidéos Alimentation supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Alimentation...');

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

    console.log('🎉 Seeding des vidéos Alimentation terminé !');
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