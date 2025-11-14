// seeders/podcastTourismeSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Voyager responsable : tourisme durable et éthique",
    description: "Comment voyager en respectant l'environnement et les communautés locales. Conseils pour un tourisme responsable.",
    duration: "00:38:20",
    category: "Tourisme",
    listens: 3450,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  {
    title: "Road trip en France : itinéraires insolites",
    description: "Découverte des routes les plus pittoresques et des villages cachés de l'Hexagone. Itinéraires détaillés.",
    duration: "00:42:15",
    category: "Tourisme",
    listens: 4230,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Voyage solo : conseils et destinations adaptées",
    description: "Préparer un voyage en solo, destinations sécurisées et astuces pour rencontrer d'autres voyageurs.",
    duration: "00:35:40",
    category: "Tourisme",
    listens: 3890,
    isActive: true,
    fileSize: 38901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Tourisme gastronomique : routes des saveurs",
    description: "Voyager pour découvrir les spécialités culinaires locales. Itinéraires gourmands en Europe et ailleurs.",
    duration: "00:39:55",
    category: "Tourisme",
    listens: 3120,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Voyager avec un petit budget : astuces économiques",
    description: "Conseils pour réduire les coûts de transport, hébergement et activités sans sacrifier la qualité.",
    duration: "00:36:25",
    category: "Tourisme",
    listens: 4780,
    isActive: true,
    fileSize: 42345678,
    mimeType: "audio/mpeg"
  },
  {
    title: "Tourisme culturel : visites hors des sentiers battus",
    description: "Découverte du patrimoine culturel authentique, musées méconnus et sites historiques préservés.",
    duration: "00:41:30",
    category: "Tourisme",
    listens: 3560,
    isActive: true,
    fileSize: 48901234,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Visite virtuelle : les calanques de Marseille",
    description: "Exploration en drone et à pied des magnifiques calanques méditerranéennes. Conseils randonnée.",
    duration: "00:22:40",
    category: "Tourisme",
    listens: 5230,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Carnet de voyage Japon : Tokyo à Kyoto",
    description: "Récit visuel d'un voyage au Japon avec conseils pratiques, bons plans et coups de cœur.",
    duration: "00:28:15",
    category: "Tourisme",
    listens: 4450,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Préparer son sac à dos : guide visuel",
    description: "Démonstration complète pour optimiser son sac à dos de voyage. Organisation et équipement essentiel.",
    duration: "00:18:30",
    category: "Tourisme",
    listens: 3980,
    isActive: true,
    fileSize: 156789012,
    mimeType: "video/mp4"
  },
  {
    title: "Road trip Islande : la route circulaire",
    description: "Parcours complet de la Ring Road islandaise avec paysages époustouflants et conseils pratiques.",
    duration: "00:32:45",
    category: "Tourisme",
    listens: 3670,
    isActive: true,
    fileSize: 267890123,
    mimeType: "video/mp4"
  },
  {
    title: "Photographie de voyage : techniques en situation",
    description: "Cours de photo en extérieur pour capturer de beaux souvenirs de voyage. Réglages et composition.",
    duration: "00:25:20",
    category: "Tourisme",
    listens: 3120,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Marchés locaux du monde : immersion culinaire",
    description: "Tour des marchés les plus colorés et authentiques d'Asie, d'Europe et d'Amérique latine.",
    duration: "00:21:50",
    category: "Tourisme",
    listens: 2890,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  },
  {
    title: "Randonnée montagne : préparation et sécurité",
    description: "Guide complet pour préparer une randonnée en montagne. Équipement, météo et précautions.",
    duration: "00:26:35",
    category: "Tourisme",
    listens: 3340,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Villages perchés de Provence : balade virtuelle",
    description: "Découverte des plus beaux villages de Provence avec histoire, spécialités et points de vue.",
    duration: "00:24:10",
    category: "Tourisme",
    listens: 3780,
    isActive: true,
    fileSize: 178901234,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🏔️ Début du seeding des podcasts Tourisme...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Tourisme" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Tourisme existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Tourisme" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/tourisme/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/tourisme/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Tourisme terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });