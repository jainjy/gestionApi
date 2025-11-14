// seeders/podcastBienEtreSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  {
    title: "Méditation guidée : retrouvez votre paix intérieure",
    description: "Séance de méditation complète pour se recentrer et apaiser l'esprit. Techniques de respiration et visualisation pour un bien-être profond.",
    duration: "00:25:30",
    category: "Bien-être & Santé",
    listens: 1250,
    isActive: true,
    fileSize: 24567890, // 24.6 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Yoga du matin : énergie et vitalité",
    description: "Routine de yoga douce pour bien commencer la journée. Postures adaptées à tous les niveaux pour réveiller le corps en douceur.",
    duration: "00:32:15",
    category: "Bien-être & Santé",
    listens: 980,
    isActive: true,
    fileSize: 31234567, // 31.2 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Nutrition consciente : mangez en pleine conscience",
    description: "Découvrez comment transformer votre relation avec la nourriture. Techniques pour une alimentation intuitive et équilibrée.",
    duration: "00:28:45",
    category: "Bien-être & Santé",
    listens: 870,
    isActive: true,
    fileSize: 27890123, // 27.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Sophrologie : gestion du stress et des émotions",
    description: "Exercices pratiques de sophrologie pour mieux gérer le stress quotidien. Techniques accessibles pour retrouver calme et sérénité.",
    duration: "00:35:20",
    category: "Bien-être & Santé",
    listens: 1100,
    isActive: true,
    fileSize: 34567890, // 34.6 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Massage auto-détente : techniques pour se masser",
    description: "Apprenez les gestes simples pour vous auto-masser et soulager les tensions. Focus sur le visage, le cou et les épaules.",
    duration: "00:26:50",
    category: "Bien-être & Santé",
    listens: 760,
    isActive: true,
    fileSize: 25678901, // 25.7 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Rituels du soir pour un sommeil réparateur",
    description: "Créez une routine du soir efficace pour améliorer la qualité de votre sommeil. Conseils pour un endormissement facile et un repos profond.",
    duration: "00:29:15",
    category: "Bien-être & Santé",
    listens: 1340,
    isActive: true,
    fileSize: 29876543, // 29.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Ayurveda : les bases pour équilibrer vos doshas",
    description: "Introduction à la médecine ayurvédique. Découvrez votre constitution et les pratiques adaptées à votre profil.",
    duration: "00:41:30",
    category: "Bien-être & Santé",
    listens: 690,
    isActive: true,
    fileSize: 39876543, // 39.9 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Respiration consciente : l'art de bien respirer",
    description: "Maîtrisez les techniques de respiration pour améliorer votre santé et votre bien-être. Exercices de cohérence cardiaque et pranayama.",
    duration: "00:23:40",
    category: "Bien-être & Santé",
    listens: 920,
    isActive: true,
    fileSize: 22345678, // 22.3 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Aromathérapie : les huiles essentielles du bien-être",
    description: "Guide pratique des huiles essentielles pour le quotidien. Recettes pour le stress, le sommeil, l'énergie et la concentration.",
    duration: "00:37:25",
    category: "Bien-être & Santé",
    listens: 810,
    isActive: true,
    fileSize: 36789012, // 36.8 MB
    mimeType: "audio/mpeg"
  },
  {
    title: "Marche méditative : connectez-vous à la nature",
    description: "Pratique de marche consciente en extérieur. Apprenez à vous connecter à vos sens et à l'environnement pour un bien-être global.",
    duration: "00:31:10",
    category: "Bien-être & Santé",
    listens: 580,
    isActive: true,
    fileSize: 29876543, // 29.9 MB
    mimeType: "audio/mpeg"
  }
];

async function main() {
  console.log('🌿 Début du seeding des podcasts Bien-être & Santé...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Bien-être & Santé" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Bien-être & Santé existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Bien-être & Santé" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/bien-etre/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
        thumbnailUrl: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/bien-etre/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`
      }
    });
    console.log(`✅ Podcast créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Bien-être & Santé terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });