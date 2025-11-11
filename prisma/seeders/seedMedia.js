const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMedia() {
  try {
    console.log('🌱 Début de l\'insertion des données médias...');

    // Supprimer dans l'ordre pour respecter les contraintes de clé étrangère
    console.log('🗑️  Nettoyage des anciennes données...');
    
    // D'abord supprimer les favoris utilisateur
    await prisma.userMediaFavorite.deleteMany({});
    console.log('✅ Favoris utilisateur supprimés');
    
    // Ensuite supprimer les podcasts et vidéos
    await prisma.podcast.deleteMany({});
    await prisma.video.deleteMany({});
    console.log('✅ Podcasts et vidéos supprimés');
    
    // Enfin supprimer les catégories
    await prisma.mediaCategory.deleteMany({});
    console.log('✅ Catégories supprimées');

    // Créer les catégories avec des noms uniques
    console.log('📂 Création des catégories...');
    const categories = await prisma.mediaCategory.createMany({
      data: [
        // Catégories podcasts
        { name: "Relaxation", type: "podcast", description: "Séances de relaxation et méditation", color: "blue" },
        { name: "Pranayama", type: "podcast", description: "Techniques de respiration", color: "green" },
        { name: "Yoga Audio", type: "podcast", description: "Pratiques et philosophie du yoga", color: "purple" },
        { name: "Développement personnel", type: "podcast", description: "Croissance personnelle et bien-être mental", color: "orange" },
        
        // Catégories vidéos
        { name: "Yoga", type: "video", description: "Séances de yoga guidées", color: "purple" },
        { name: "Fitness", type: "video", description: "Exercices et entraînements", color: "red" },
        { name: "Massage", type: "video", description: "Techniques de massage et auto-massage", color: "pink" },
        { name: "Méditation", type: "video", description: "Séances de méditation guidée", color: "blue" },
        { name: "Nutrition", type: "video", description: "Conseils nutrition et recettes santé", color: "green" }
      ]
    });

    console.log('✅ Catégories créées');

    // Récupérer un utilisateur existant
    let author = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { role: 'admin' },
          { userType: 'ADMIN' }
        ]
      }
    });

    // Si aucun admin trouvé, prendre le premier utilisateur
    if (!author) {
      author = await prisma.user.findFirst();
    }

    // Si toujours aucun utilisateur, créer un utilisateur par défaut
    if (!author) {
      console.log('ℹ️ Aucun utilisateur trouvé, création d\'un utilisateur par défaut...');
      author = await prisma.user.create({
        data: {
          email: 'media-author@example.com',
          firstName: 'Auteur',
          lastName: 'Médias',
          role: 'user',
          userType: 'BIEN_ETRE',
          status: 'active'
        }
      });
      console.log('✅ Utilisateur par défaut créé:', author.email);
    }

    console.log('👤 Auteur des médias:', author.email);

    // Récupérer les catégories créées
    const podcastCategories = await prisma.mediaCategory.findMany({
      where: { type: "podcast" }
    });
    
    const videoCategories = await prisma.mediaCategory.findMany({
      where: { type: "video" }
    });

    console.log(`📊 Catégories podcasts: ${podcastCategories.map(c => c.name).join(', ')}`);
    console.log(`📊 Catégories vidéos: ${videoCategories.map(c => c.name).join(', ')}`);

    // Fonctions pour trouver les catégories
    const findPodcastCategory = (name) => {
      const category = podcastCategories.find(c => c.name === name);
      if (!category) {
        throw new Error(`Catégorie podcast "${name}" non trouvée`);
      }
      return category.id;
    };

    const findVideoCategory = (name) => {
      const category = videoCategories.find(c => c.name === name);
      if (!category) {
        throw new Error(`Catégorie vidéo "${name}" non trouvée`);
      }
      return category.id;
    };

    // Créer des podcasts
    console.log('🎧 Création des podcasts...');
    const podcasts = await prisma.podcast.createMany({
      data: [
        {
          title: "Méditation guidée pour le sommeil",
          description: "Une séance de méditation apaisante pour un sommeil profond et réparateur. Idéale pour les nuits agitées.",
          duration: "25 min",
          imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop",
          audioUrl: "/audio/meditation-sommeil.mp3",
          categoryId: findPodcastCategory("Relaxation"),
          authorId: author.id,
          listens: 1520,
          isActive: true
        },
        {
          title: "Les secrets de la respiration consciente",
          description: "Découvrez les techniques de respiration pour équilibrer votre énergie et réduire le stress au quotidien.",
          duration: "35 min",
          imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=250&fit=crop",
          audioUrl: "/audio/respiration-consciente.mp3",
          categoryId: findPodcastCategory("Pranayama"),
          authorId: author.id,
          listens: 890,
          isActive: true
        },
        {
          title: "Yoga Nidra pour la régénération",
          description: "Un yoga du sommeil pour régénérer le corps et l'esprit en profondeur. Parfait pour la récupération.",
          duration: "40 min",
          imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop",
          audioUrl: "/audio/yoga-nidra.mp3",
          categoryId: findPodcastCategory("Yoga Audio"),
          authorId: author.id,
          listens: 1230,
          isActive: true
        },
        {
          title: "Techniques de pleine conscience",
          description: "Apprenez à vivre pleinement le moment présent et à cultiver la sérénité dans votre vie quotidienne.",
          duration: "30 min",
          imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
          audioUrl: "/audio/pleine-conscience.mp3",
          categoryId: findPodcastCategory("Développement personnel"),
          authorId: author.id,
          listens: 980,
          isActive: true
        }
      ]
    });

    console.log('✅ Podcasts créés');

    // Créer des vidéos
    console.log('🎥 Création des vidéos...');
    const videos = await prisma.video.createMany({
      data: [
        {
          title: "Séquence yoga du matin",
          description: "Réveillez votre corps en douceur avec cette séquence matinale complète. Parfait pour bien commencer la journée.",
          duration: "20 min",
          thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop",
          videoUrl: "/videos/yoga-matin.mp4",
          categoryId: findVideoCategory("Yoga"),
          authorId: author.id,
          views: 15200,
          isActive: true
        },
        {
          title: "Routine fitness maison",
          description: "Entraînement complet sans matériel pour rester en forme. Adapté à tous les niveaux.",
          duration: "30 min",
          thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop",
          videoUrl: "/videos/fitness-maison.mp4",
          categoryId: findVideoCategory("Fitness"),
          authorId: author.id,
          views: 23700,
          isActive: true
        },
        {
          title: "Techniques de massage auto-détente",
          description: "Apprenez à vous masser pour relâcher les tensions du quotidien. Techniques simples et efficaces.",
          duration: "15 min",
          thumbnailUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop",
          videoUrl: "/videos/massage-auto-detente.mp4",
          categoryId: findVideoCategory("Massage"),
          authorId: author.id,
          views: 18900,
          isActive: true
        },
        {
          title: "Méditation guidée pour l'anxiété",
          description: "Une séance spécialement conçue pour apaiser l'anxiété et retrouver calme et sérénité.",
          duration: "25 min",
          thumbnailUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
          videoUrl: "/videos/meditation-anxiete.mp4",
          categoryId: findVideoCategory("Méditation"),
          authorId: author.id,
          views: 21400,
          isActive: true
        },
        {
          title: "Recettes énergétiques pour le sport",
          description: "Découvrez des recettes simples et nutritives pour optimiser vos performances sportives.",
          duration: "18 min",
          thumbnailUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=250&fit=crop",
          videoUrl: "/videos/recettes-energetiques.mp4",
          categoryId: findVideoCategory("Nutrition"),
          authorId: author.id,
          views: 16700,
          isActive: true
        }
      ]
    });

    console.log('✅ Vidéos créées');

    // Vérifier que tout a été créé
    const podcastCount = await prisma.podcast.count();
    const videoCount = await prisma.video.count();
    const categoryCount = await prisma.mediaCategory.count();

    console.log('\n📊 Résumé final:');
    console.log(`   📂 Catégories: ${categoryCount}`);
    console.log(`   🎧 Podcasts: ${podcastCount}`);
    console.log(`   🎥 Vidéos: ${videoCount}`);
    console.log('🎉 Données médias insérées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
    console.error('Détails:', error.message);
    
    // Debug détaillé en cas d'erreur
    if (error.message.includes('Catégorie')) {
      try {
        const allCategories = await prisma.mediaCategory.findMany();
        console.log('🔍 Catégories dans la base:', allCategories);
      } catch (e) {
        console.log('❌ Impossible de récupérer les catégories pour le debug');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seedMedia()
  .then(() => {
    console.log('✨ Seed terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });