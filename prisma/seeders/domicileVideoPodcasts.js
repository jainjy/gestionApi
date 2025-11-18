// prisma/seeders/domicileVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Aménagement intérieur : tendances déco 2024",
    description: "Découvrez les dernières tendances déco : couleurs, matériaux, mobilier et astuces pour créer un intérieur moderne et fonctionnel.",
    duration: "00:28:30",
    category: "Domicile",
    views: 3450,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/amenagement-interieur-tendances-deco-2024.mp4"
  },
  {
    title: "Rénovation cuisine : du plan à la réalisation",
    description: "Guide complet pour rénover sa cuisine : planification, choix des matériaux, électroménager et optimisation de l'espace.",
    duration: "00:32:15",
    category: "Domicile",
    views: 2780,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/renovation-cuisine-plan-realisation.mp4"
  },
  {
    title: "Jardinage urbain : créer un espace vert chez soi",
    description: "Techniques de jardinage en ville : balcon, terrasse, potager vertical et plantes d'intérieur pour un habitat plus vert.",
    duration: "00:25:45",
    category: "Domicile",
    views: 3120,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/jardinage-urbain-espace-vert.mp4"
  },
  {
    title: "Éclairage intelligent : ambiances et économies",
    description: "Solutions d'éclairage connecté : ampoules LED intelligentes, scénarios d'éclairage et réduction de la consommation énergétique.",
    duration: "00:23:20",
    category: "Domicile",
    views: 2340,
    isActive: true,
    isPremium: true,
    fileSize: 167890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25856cd23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/eclairage-intelligent-ambiances-economies.mp4"
  },
  {
    title: "Rangement optimisé : solutions gain de place",
    description: "Astuces et solutions de rangement innovantes pour chaque pièce : dressing, cuisine, salon et espaces sous-exploités.",
    duration: "00:26:50",
    category: "Domicile",
    views: 2890,
    isActive: true,
    isPremium: false,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/rangement-optimise-gain-place.mp4"
  },
  {
    title: "Home office : créer un espace de travail efficace",
    description: "Conseils pour aménager un bureau à domicile productif : ergonomie, isolation phonique, éclairage et organisation.",
    duration: "00:29:35",
    category: "Domicile",
    views: 2670,
    isActive: true,
    isPremium: false,
    fileSize: 201234567,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/home-office-espace-travail-efficace.mp4"
  },
  {
    title: "Salle de bains spa : transformer son quotidien",
    description: "Idées pour créer une salle de bains relaxante : choix des matériaux, équipements wellness et ambiance cocooning.",
    duration: "00:27:10",
    category: "Domicile",
    views: 2230,
    isActive: true,
    isPremium: true,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/salle-bains-spa-transformer-quotidien.mp4"
  },
  {
    title: "Domotique accessible : automatiser sa maison",
    description: "Solutions domotiques abordables : chauffage intelligent, sécurité, gestion de l'énergie et contrôle à distance.",
    duration: "00:31:40",
    category: "Domicile",
    views: 1980,
    isActive: true,
    isPremium: false,
    fileSize: 212345678,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25856cd23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/domicile/domotique-accessible-automatiser-maison.mp4"
  }
];

async function main() {
  console.log('🏠 Début du seeding des vidéos Domicile...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Domicile" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Domicile existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Domicile" }
      });
      console.log('✅ Anciennes vidéos Domicile supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Domicile...');

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

    console.log('🎉 Seeding des vidéos Domicile terminé !');
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