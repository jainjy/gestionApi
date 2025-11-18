// prisma/seeders/creditAssuranceVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Crédit immobilier : obtenir le meilleur taux",
    description: "Guide complet pour négocier son crédit immobilier : taux d'intérêt, apport personnel, durée et assurances emprunteur.",
    duration: "00:26:35",
    category: "Crédit & Assurance",
    views: 3120,
    isActive: true,
    isPremium: false,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/credit-immobilier-meilleur-taux.mp4"
  },
  {
    title: "Assurance emprunteur : comment faire jouer la concurrence",
    description: "Toutes les astuces pour réduire le coût de son assurance emprunteur : délégation, comparaison et négociation.",
    duration: "00:22:15",
    category: "Crédit & Assurance",
    views: 2450,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/assurance-emprunteur-concurrence.mp4"
  },
  {
    title: "Rachat de crédits : solution pour alléger ses mensualités",
    description: "Quand et comment procéder à un rachat de crédits : conditions, économies réalisées et démarches pratiques.",
    duration: "00:29:40",
    category: "Crédit & Assurance",
    views: 1870,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1563013546-7e5c7d0c94c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/rachat-credits-aleger-mensualites.mp4"
  },
  {
    title: "Assurance habitation : bien protéger son logement",
    description: "Comprendre les garanties essentielles, les options utiles et comment optimiser son contrat d'assurance habitation.",
    duration: "00:24:20",
    category: "Crédit & Assurance",
    views: 2780,
    isActive: true,
    isPremium: false,
    fileSize: 167890123,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224154-2604c0b64e4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/assurance-habitation-proteger-logement.mp4"
  },
  {
    title: "Crédit consommation : utiliser le bon financement",
    description: "Comparatif des différents crédits conso : prêt personnel, revolving, affecté. Avantages et pièges à éviter.",
    duration: "00:27:50",
    category: "Crédit & Assurance",
    views: 1950,
    isActive: true,
    isPremium: true,
    fileSize: 189012345,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/credit-consommation-bon-financement.mp4"
  },
  {
    title: "Assurance vie : épargner et transmettre",
    description: "Tout sur l'assurance vie : fiscalité avantageuse, supports d'investissement et transmission du patrimoine.",
    duration: "00:33:15",
    category: "Crédit & Assurance",
    views: 2230,
    isActive: true,
    isPremium: false,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/assurance-vie-epargner-transmettre.mp4"
  },
  {
    title: "Prêt travaux : financer ses projets de rénovation",
    description: "Solutions de financement pour vos travaux : éco-prêt, prêt personnel, crédit affecté. Comparatif et conseils.",
    duration: "00:25:30",
    category: "Crédit & Assurance",
    views: 1670,
    isActive: true,
    isPremium: false,
    fileSize: 176543210,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/pret-travaux-financer-renovation.mp4"
  },
  {
    title: "Protection juridique : se faire assister au quotidien",
    description: "Quand souscrire une protection juridique ? Garanties, domaines couverts et comment bien choisir son contrat.",
    duration: "00:21:45",
    category: "Crédit & Assurance",
    views: 1450,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/credit-assurance/protection-juridique-assistance.mp4"
  }
];

async function main() {
  console.log('💰 Début du seeding des vidéos Crédit & Assurance...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Crédit & Assurance" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Crédit & Assurance existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Crédit & Assurance" }
      });
      console.log('✅ Anciennes vidéos Crédit & Assurance supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Crédit & Assurance...');

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

    console.log('🎉 Seeding des vidéos Crédit & Assurance terminé !');
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