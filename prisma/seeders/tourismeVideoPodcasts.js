// prisma/seeders/tourismeVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Voyager responsable : tourisme durable et éthique",
    description: "Comment voyager en respectant l'environnement et les communautés locales. Conseils pour un tourisme responsable.",
    duration: "00:38:20",
    category: "Tourisme",
    views: 3450,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/voyager-responsable-tourisme-durable.mp4"
  },
  {
    title: "Road trip en France : itinéraires insolites",
    description: "Découverte des routes les plus pittoresques et des villages cachés de l'Hexagone. Itinéraires détaillés.",
    duration: "00:42:15",
    category: "Tourisme",
    views: 4230,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/road-trip-france-itineraires-insolites.mp4"
  },
  {
    title: "Voyage solo : conseils et destinations adaptées",
    description: "Préparer un voyage en solo, destinations sécurisées et astuces pour rencontrer d'autres voyageurs.",
    duration: "00:35:40",
    category: "Tourisme",
    views: 3890,
    isActive: true,
    isPremium: false,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/voyage-solo-conseils-destinations.mp4"
  },
  {
    title: "Visite virtuelle : les calanques de Marseille",
    description: "Exploration en drone et à pied des magnifiques calanques méditerranéennes. Conseils randonnée.",
    duration: "00:22:40",
    category: "Tourisme",
    views: 5230,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/visite-virtuelle-calanques-marseille.mp4"
  },
  {
    title: "Carnet de voyage Japon : Tokyo à Kyoto",
    description: "Récit visuel d'un voyage au Japon avec conseils pratiques, bons plans et coups de cœur.",
    duration: "00:28:15",
    category: "Tourisme",
    views: 4450,
    isActive: true,
    isPremium: false,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/carnet-voyage-japon-tokyo-kyoto.mp4"
  },
  {
    title: "Préparer son sac à dos : guide visuel",
    description: "Démonstration complète pour optimiser son sac à dos de voyage. Organisation et équipement essentiel.",
    duration: "00:18:30",
    category: "Tourisme",
    views: 3980,
    isActive: true,
    isPremium: false,
    fileSize: 134567890,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/preparer-sac-dos-guide-visuel.mp4"
  },
  {
    title: "Week-end en Europe : escapades accessibles",
    description: "Idées de week-ends en Europe : villes méconnues, nature préservée et bonnes adresses.",
    duration: "00:31:25",
    category: "Tourisme",
    views: 3670,
    isActive: true,
    isPremium: true,
    fileSize: 201234567,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/weekend-europe-escapades-accessibles.mp4"
  },
  {
    title: "Photographie de voyage : capturer l'essentiel",
    description: "Techniques de photo pour immortaliser ses voyages : composition, lumière et matériel adapté.",
    duration: "00:26:50",
    category: "Tourisme",
    views: 4120,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/tourisme/photographie-voyage-capturer-essentiel.mp4"
  }
];

async function main() {
  console.log('✈️ Début du seeding des vidéos Tourisme...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Tourisme" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Tourisme existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Tourisme" }
      });
      console.log('✅ Anciennes vidéos Tourisme supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Tourisme...');

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

    console.log('🎉 Seeding des vidéos Tourisme terminé !');
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