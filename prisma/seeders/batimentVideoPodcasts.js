// prisma/seeders/batimentVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Nouveaux matériaux de construction : tendances 2024",
    description: "Découverte des matériaux innovants : béton bas carbone, bois lamellé-croisé, isolants écologiques et leurs applications pratiques.",
    duration: "00:32:45",
    category: "Bâtiment & Construction",
    views: 2870,
    isActive: true,
    isPremium: false,
    fileSize: 234567890,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/nouveaux-materiaux-tendances-2024.mp4"
  },
  {
    title: "Chantier HQE : normes et bonnes pratiques",
    description: "Guide complet pour mener un chantier Haute Qualité Environnementale : gestion des déchets, économies d'énergie, matériaux écologiques.",
    duration: "00:35:20",
    category: "Bâtiment & Construction",
    views: 2340,
    isActive: true,
    isPremium: true,
    fileSize: 267890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/chantier-hqe-normes-bonnes-pratiques.mp4"
  },
  {
    title: "Rénovation énergétique : solutions et aides financières",
    description: "Panorama des solutions de rénovation : isolation, chauffage, ventilation. MaPrimeRénov', CEE et autres aides disponibles.",
    duration: "00:28:15",
    category: "Bâtiment & Construction",
    views: 3450,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/renovation-energetique-solutions-aides.mp4"
  },
  {
    title: "Béton bas carbone : révolution dans la construction",
    description: "Décryptage des bétons écologiques : composition, performances, coûts et retours d'expérience sur chantiers réels.",
    duration: "00:26:40",
    category: "Bâtiment & Construction",
    views: 1980,
    isActive: true,
    isPremium: true,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/beton-bas-carbone-revolution.mp4"
  },
  {
    title: "Sécurité chantier : équipements et procédures",
    description: "Rappel des obligations réglementaires, équipements de protection individuels et collectifs, formation du personnel.",
    duration: "00:29:55",
    category: "Bâtiment & Construction",
    views: 2670,
    isActive: true,
    isPremium: false,
    fileSize: 212345678,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/securite-chantier-equipements-procedures.mp4"
  },
  {
    title: "Construction bois : avantages et mise en œuvre",
    description: "Tout sur la construction bois : techniques, performances thermiques, durabilité et réglementation.",
    duration: "00:31:25",
    category: "Bâtiment & Construction",
    views: 2230,
    isActive: true,
    isPremium: false,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/construction-bois-avantages-mise-en-oeuvre.mp4"
  },
  {
    title: "Gros œuvre : techniques et contrôles qualité",
    description: "Méthodes de construction modernes, contrôles géotechniques, essais béton et assurance qualité sur chantier.",
    duration: "00:34:10",
    category: "Bâtiment & Construction",
    views: 1890,
    isActive: true,
    isPremium: true,
    fileSize: 245678901,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/gros-oeuvre-techniques-controles-qualite.mp4"
  },
  {
    title: "Second œuvre : finitions et aménagements",
    description: "Choix des matériaux de finition, techniques d'isolation, électricité, plomberie et aménagements intérieurs.",
    duration: "00:27:30",
    category: "Bâtiment & Construction",
    views: 2560,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/batiment/second-oeuvre-finitions-amenagements.mp4"
  }
];

async function main() {
  console.log('🏗️ Début du seeding des vidéos Bâtiment & Construction...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Bâtiment & Construction" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Bâtiment & Construction existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Bâtiment & Construction" }
      });
      console.log('✅ Anciennes vidéos Bâtiment & Construction supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Bâtiment & Construction...');

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

    console.log('🎉 Seeding des vidéos Bâtiment & Construction terminé !');
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