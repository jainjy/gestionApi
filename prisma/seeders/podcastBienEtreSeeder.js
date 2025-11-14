// seeders/podcastBienEtreSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio - Bien-être mental
  {
    title: "Méditation guidée : retrouver la sérénité",
    description: "Séance de méditation de pleine conscience pour apaiser l'esprit et réduire le stress.",
    duration: "00:25:30",
    category: "Bien-être",
    listens: 4560,
    isActive: true,
    fileSize: 35678901,
    mimeType: "audio/mpeg"
  },
  {
    title: "Gestion du stress : techniques efficaces au quotidien",
    description: "Méthodes pratiques pour gérer le stress et l'anxiété dans la vie de tous les jours.",
    duration: "00:38:45",
    category: "Bien-être",
    listens: 3890,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Sommeil réparateur : les secrets d'une bonne nuit",
    description: "Conseils et routines pour améliorer la qualité de son sommeil et se réveiller en forme.",
    duration: "00:32:20",
    category: "Bien-être",
    listens: 5230,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Yoga du matin : routine énergisante",
    description: "Séquence de yoga doux pour commencer la journée avec vitalité et concentration.",
    duration: "00:28:15",
    category: "Bien-être",
    listens: 4120,
    isActive: true,
    fileSize: 36789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Alimentation mindful : manger en conscience",
    description: "Apprendre à écouter son corps et développer une relation saine avec la nourriture.",
    duration: "00:35:40",
    category: "Bien-être",
    listens: 3450,
    isActive: true,
    fileSize: 42345678,
    mimeType: "audio/mpeg"
  },
  {
    title: "Gestion des émotions : accueillir et transformer",
    description: "Techniques pour reconnaître, accepter et gérer ses émotions de façon constructive.",
    duration: "00:41:10",
    category: "Bien-être",
    listens: 3780,
    isActive: true,
    fileSize: 47890123,
    mimeType: "audio/mpeg"
  },
  {
    title: "Respiration consciente : l'anti-stress naturel",
    description: "Exercices de respiration pour calmer le système nerveux et retrouver l'équilibre.",
    duration: "00:22:35",
    category: "Bien-être",
    listens: 4670,
    isActive: true,
    fileSize: 28901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Digital detox : retrouver du temps pour soi",
    description: "Stratégies pour réduire sa dépendance aux écrans et se reconnecter à soi-même.",
    duration: "00:36:50",
    category: "Bien-être",
    listens: 3980,
    isActive: true,
    fileSize: 43210987,
    mimeType: "audio/mpeg"
  },

  // Vidéos - Bien-être physique et mental
  {
    title: "Yoga doux pour débutants : séance complète",
    description: "Séquence de yoga accessible à tous pour améliorer souplesse et détente.",
    duration: "00:35:20",
    category: "Bien-être",
    listens: 6230,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "Méditation en pleine nature : forêt guidée",
    description: "Méditation immersive au cœur d'une forêt pour une relaxation profonde.",
    duration: "00:28:45",
    category: "Bien-être",
    listens: 5780,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Auto-massage détente : techniques simples",
    description: "Apprendre à se masser pour relâcher les tensions et améliorer la circulation.",
    duration: "00:24:30",
    category: "Bien-être",
    listens: 5120,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Pilates : renforcement musculaire en douceur",
    description: "Séance de Pilates pour tonifier le corps sans impact sur les articulations.",
    duration: "00:32:15",
    category: "Bien-être",
    listens: 4890,
    isActive: true,
    fileSize: 267890123,
    mimeType: "video/mp4"
  },
  {
    title: "Routine bien-être du soir : préparation au sommeil",
    description: "Rituels du soir pour favoriser l'endormissement et un sommeil réparateur.",
    duration: "00:26:40",
    category: "Bien-être",
    listens: 5340,
    isActive: true,
    fileSize: 212345678,
    mimeType: "video/mp4"
  },
  {
    title: "Stretching matinal : réveil du corps en douceur",
    description: "Étirements doux pour démarrer la journée avec souplesse et vitalité.",
    duration: "00:18:25",
    category: "Bien-être",
    listens: 4670,
    isActive: true,
    fileSize: 154321098,
    mimeType: "video/mp4"
  },
  {
    title: "Création d'un sanctuaire bien-être à la maison",
    description: "Aménager un espace dédié à la détente et à la pratique du bien-être.",
    duration: "00:22:50",
    category: "Bien-être",
    listens: 4230,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Pratique du Qi Gong : énergie et équilibre",
    description: "Mouvements traditionnels chinois pour harmoniser le corps et l'esprit.",
    duration: "00:29:35",
    category: "Bien-être",
    listens: 3890,
    isActive: true,
    fileSize: 223456789,
    mimeType: "video/mp4"
  },
  {
    title: "Atelier aromathérapie : huiles essentielles bien-être",
    description: "Découverte des huiles essentielles pour le stress, le sommeil et l'énergie.",
    duration: "00:31:20",
    category: "Bien-être",
    listens: 4560,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "Marche méditative : connecter corps et esprit",
    description: "Pratique de marche consciente pour un bien-être global en mouvement.",
    duration: "00:27:10",
    category: "Bien-être",
    listens: 4120,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Yoga des yeux : détente visuelle au quotidien",
    description: "Exercices pour soulager la fatigue oculaire et améliorer la vision.",
    duration: "00:19:45",
    category: "Bien-être",
    listens: 3980,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🧘‍♀️ Début du seeding des podcasts Bien-être...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Bien-être" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Bien-être existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Bien-être" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/bien-etre/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/bien-etre/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Bien-être terminé !');
  console.log(`📊 Statistiques:`);
  console.log(`   - Total: ${podcastEpisodes.length} épisodes`);
  console.log(`   - Audio: ${podcastEpisodes.filter(p => p.mimeType === 'audio/mpeg').length}`);
  console.log(`   - Vidéo: ${podcastEpisodes.filter(p => p.mimeType === 'video/mp4').length}`);
  console.log(`   - Écoutes totales: ${podcastEpisodes.reduce((total, p) => total + p.listens, 0).toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });