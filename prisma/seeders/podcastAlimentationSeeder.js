// seeders/podcastAlimentationSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Nutrition santé : les bases d'une alimentation équilibrée",
    description: "Découvrez les fondamentaux de la nutrition : macronutriments, micronutriments et équilibre alimentaire au quotidien.",
    duration: "00:36:45",
    category: "Alimentation",
    listens: 3240,
    isActive: true,
    fileSize: 38765432,
    mimeType: "audio/mpeg"
  },
  {
    title: "Super-aliments : mythes et réalités",
    description: "Analyse des super-aliments tendance : baies de goji, graines de chia, spiruline. Quels sont leurs véritables bienfaits ?",
    duration: "00:32:20",
    category: "Alimentation",
    listens: 2780,
    isActive: true,
    fileSize: 35678901,
    mimeType: "audio/mpeg"
  },
  {
    title: "Cuisine végétale : débuter en douceur",
    description: "Guide pratique pour incorporer plus de végétal dans son alimentation sans carences et avec plaisir.",
    duration: "00:41:10",
    category: "Alimentation",
    listens: 3560,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Intolérances alimentaires : comment les identifier",
    description: "Symptômes, tests et solutions pour gérer les intolérances au gluten, lactose et autres allergènes courants.",
    duration: "00:38:55",
    category: "Alimentation",
    listens: 2890,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  {
    title: "Manger local et de saison : impact santé et environnement",
    description: "Avantages nutritionnels et écologiques des produits locaux de saison. Comment les intégrer facilement ?",
    duration: "00:35:30",
    category: "Alimentation",
    listens: 3120,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Nutrition sportive : optimiser ses performances",
    description: "Alimentation pré et post entraînement, hydratation et suppléments pour sportifs amateurs et confirmés.",
    duration: "00:44:25",
    category: "Alimentation",
    listens: 2670,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Recette healthy : bowl vitaminé du matin",
    description: "Préparation pas à pas d'un petit-déjeuner nutritif et coloré pour bien commencer la journée.",
    duration: "00:15:30",
    category: "Alimentation",
    listens: 4230,
    isActive: true,
    fileSize: 156789012,
    mimeType: "video/mp4"
  },
  {
    title: "Techniques de coupe : maîtriser les bases",
    description: "Démonstration des techniques essentielles de découpe pour gagner en efficacité en cuisine.",
    duration: "00:22:45",
    category: "Alimentation",
    listens: 3340,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Cuisine anti-gaspi : recettes zéro déchet",
    description: "Astuces et recettes pour utiliser toutes les parties des aliments et réduire le gaspillage.",
    duration: "00:28:20",
    category: "Alimentation",
    listens: 2980,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Atelier pâtisserie healthy",
    description: "Réalisation de desserts gourmands mais sains : remplacement du sucre, farines alternatives...",
    duration: "00:35:15",
    category: "Alimentation",
    listens: 2560,
    isActive: true,
    fileSize: 267890123,
    mimeType: "video/mp4"
  },
  {
    title: "Visite d'un marché bio de producteurs",
    description: "Immersion dans un marché bio pour apprendre à choisir les meilleurs produits de saison.",
    duration: "00:19:40",
    category: "Alimentation",
    listens: 3120,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Préparation de batch cooking de la semaine",
    description: "Organisation complète des repas de la semaine en moins de 2 heures : démonstration pratique.",
    duration: "00:26:50",
    category: "Alimentation",
    listens: 3780,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "Atelier fermentation : légumes et boissons",
    description: "Apprendre à fermenter ses légumes et préparer ses boissons probiotiques maison.",
    duration: "00:31:25",
    category: "Alimentation",
    listens: 2340,
    isActive: true,
    fileSize: 256789012,
    mimeType: "video/mp4"
  },
  {
    title: "Comparatif des modes de cuisson",
    description: "Test et analyse des différentes méthodes de cuisson et leur impact sur les nutriments.",
    duration: "00:24:35",
    category: "Alimentation",
    listens: 2890,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🍎 Début du seeding des podcasts Alimentation...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Alimentation" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Alimentation existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Alimentation" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/alimentation/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/alimentation/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Alimentation terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });