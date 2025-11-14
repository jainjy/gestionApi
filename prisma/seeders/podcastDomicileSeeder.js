// seeders/podcastDomicileSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Rénovation intérieure : par où commencer ?",
    description: "Guide complet pour planifier et organiser vos travaux de rénovation intérieure.",
    duration: "00:42:15",
    category: "Domicile",
    listens: 2870,
    isActive: true,
    fileSize: 47890123,
    mimeType: "audio/mpeg"
  },
  {
    title: "Déco tendance 2024 : les nouvelles inspirations",
    description: "Découvrez les dernières tendances déco pour donner du style à votre intérieur.",
    duration: "00:39:20",
    category: "Domicile",
    listens: 3240,
    isActive: true,
    fileSize: 45678901,
    mimeType: "audio/mpeg"
  },
  {
    title: "Optimisation de l'espace : solutions pour petites surfaces",
    description: "Astuces et solutions ingénieuses pour optimiser l'espace dans les petits logements.",
    duration: "00:36:45",
    category: "Domicile",
    listens: 2980,
    isActive: true,
    fileSize: 43210987,
    mimeType: "audio/mpeg"
  },
  {
    title: "Éclairage d'intérieur : créer l'ambiance parfaite",
    description: "Choix des luminaires et techniques d'éclairage pour chaque pièce de la maison.",
    duration: "00:34:30",
    category: "Domicile",
    listens: 2560,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  {
    title: "Entretien maison : routine et produits naturels",
    description: "Programme d'entretien et recettes de produits ménagers écologiques.",
    duration: "00:31:50",
    category: "Domicile",
    listens: 3120,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Aménagement de jardin et terrasse",
    description: "Créer un espace extérieur fonctionnel et esthétique.",
    duration: "00:38:10",
    category: "Domicile",
    listens: 2340,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Relooking salon : transformation complète",
    description: "Pas à pas pour relooker votre salon avec un budget limité.",
    duration: "00:25:40",
    category: "Domicile",
    listens: 4450,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Cuisine pratique : organisation et rangement",
    description: "Solutions de rangement et astuces d'organisation pour une cuisine fonctionnelle.",
    duration: "00:22:15",
    category: "Domicile",
    listens: 3890,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Création d'un home office ergonomique",
    description: "Aménager un espace de travail confortable et productif à la maison.",
    duration: "00:19:30",
    category: "Domicile",
    listens: 4230,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Déco chambre : conseils pour un sommeil de qualité",
    description: "Aménagement et décoration pour créer une chambre propice au repos.",
    duration: "00:21:45",
    category: "Domicile",
    listens: 3560,
    isActive: true,
    fileSize: 176543210,
    mimeType: "video/mp4"
  },
  {
    title: "Rénovation salle de bain : techniques professionnelles",
    description: "Guide complet pour rénover sa salle de bain comme un pro.",
    duration: "00:28:20",
    category: "Domicile",
    listens: 3120,
    isActive: true,
    fileSize: 223456789,
    mimeType: "video/mp4"
  },
  {
    title: "Jardinage urbain : potager sur balcon",
    description: "Créer et entretenir un potager en milieu urbain.",
    duration: "00:24:50",
    category: "Domicile",
    listens: 2780,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Rangement dressing : solutions sur mesure",
    description: "Optimiser l'espace de rangement des vêtements et accessoires.",
    duration: "00:20:15",
    category: "Domicile",
    listens: 2670,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  },
  {
    title: "Déco de Noël : idées créatives et économiques",
    description: "Décoration festive pour les fêtes de fin d'année.",
    duration: "00:18:40",
    category: "Domicile",
    listens: 4120,
    isActive: true,
    fileSize: 154321098,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🏠 Début du seeding des podcasts Domicile...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Domicile" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Domicile existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Domicile" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/domicile/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/domicile/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Domicile terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });