// prisma/seeders/immobilierVideoPodcasts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const videoPodcasts = [
  {
    title: "Investissement locatif : guide complet pour débutants",
    description: "Découvrez les bases de l'investissement locatif : rendement, fiscalité, choix du bien et gestion locative. Conseils pratiques pour bien démarrer.",
    duration: "00:28:45",
    category: "Immobilier",
    views: 2450,
    isActive: true,
    isPremium: false,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/investissement-locatif-guide-complet.mp4"
  },
  {
    title: "Marché immobilier 2024 : analyse et tendances",
    description: "Analyse approfondie du marché immobilier actuel : prix, taux d'emprunt, zones dynamiques et conseils pour investir au bon moment.",
    duration: "00:32:15",
    category: "Immobilier",
    views: 1870,
    isActive: true,
    isPremium: false,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1570126618953-d437176e8c79?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/marche-immobilier-2024.mp4"
  },
  {
    title: "Crédit immobilier : optimiser son dossier",
    description: "Toutes les astuces pour obtenir le meilleur taux et monter un dossier solide. Apport, endettement, assurances et négociation.",
    duration: "00:25:30",
    category: "Immobilier",
    views: 3120,
    isActive: true,
    isPremium: true,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/credit-immobilier-optimiser-dossier.mp4"
  },
  {
    title: "Visite virtuelle : appartement neuf Paris 16ème",
    description: "Découverte complète d'un appartement haut de gamme avec explications sur les finitions, aménagements et potentiel locatif.",
    duration: "00:18:20",
    category: "Immobilier",
    views: 4230,
    isActive: true,
    isPremium: false,
    fileSize: 134567890,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/visite-virtuelle-appartement-paris.mp4"
  },
  {
    title: "Rénovation : transformer un bien ancien",
    description: "Guide pratique pour la rénovation immobilière : budget, planning, choix des matériaux et retour sur investissement.",
    duration: "00:35:10",
    category: "Immobilier",
    views: 2780,
    isActive: true,
    isPremium: true,
    fileSize: 223456789,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/renovation-transformer-bien-ancien.mp4"
  },
  {
    title: "Défiscalisation : Pinel, LMNP, Malraux comparés",
    description: "Comparatif complet des dispositifs de défiscalisation immobilière. Avantages, inconvénients et critères d'éligibilité détaillés.",
    duration: "00:29:55",
    category: "Immobilier",
    views: 1950,
    isActive: true,
    isPremium: false,
    fileSize: 187654321,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/defiscalisation-pinel-lmnp-malraux.mp4"
  },
  {
    title: "Diagnostics immobiliers : ce qu'il faut savoir",
    description: "Tous les diagnostics obligatoires expliqués en détail. DPE, amiante, plomb, termites et électricité.",
    duration: "00:22:40",
    category: "Immobilier",
    views: 1650,
    isActive: true,
    isPremium: false,
    fileSize: 156789012,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/diagnostics-immobiliers-guide.mp4"
  },
  {
    title: "Gestion locative : les bonnes pratiques",
    description: "Conseils pour une gestion locative efficace : sélection des locataires, contrat, entretien et relations locataires.",
    duration: "00:26:25",
    category: "Immobilier",
    views: 1320,
    isActive: true,
    isPremium: true,
    fileSize: 198765432,
    mimeType: "video/mp4",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    storagePath: "videos/immobilier/gestion-locative-bonnes-pratiques.mp4"
  }
];

async function main() {
  console.log('🏠 Début du seeding des vidéos Immobilier...');

  try {
    // Vérifier si des vidéos de cette catégorie existent déjà
    const existingVideos = await prisma.video.count({
      where: { category: "Immobilier" }
    });
    
    if (existingVideos > 0) {
      console.log('📊 Des vidéos Immobilier existent déjà, suppression...');
      await prisma.video.deleteMany({
        where: { category: "Immobilier" }
      });
      console.log('✅ Anciennes vidéos Immobilier supprimées');
    }

    console.log('📹 Création des nouvelles vidéos Immobilier...');

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

    console.log('🎉 Seeding des vidéos Immobilier terminé !');
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