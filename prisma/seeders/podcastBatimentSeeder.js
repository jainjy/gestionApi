// seeders/podcastBatimentSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Gestion de chantier : méthodes et bonnes pratiques",
    description: "Organisation, planification et suivi de chantier pour respecter les délais et le budget.",
    duration: "00:44:30",
    category: "Bâtiment & Construction",
    listens: 3120,
    isActive: true,
    fileSize: 48901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Réglementation thermique RE2020 : ce qui change",
    description: "Nouveaux standards environnementaux et implications pour la construction neuve.",
    duration: "00:38:15",
    category: "Bâtiment & Construction",
    listens: 2780,
    isActive: true,
    fileSize: 44567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Matériaux écologiques : choix et mise en œuvre",
    description: "Comparatif des matériaux biosourcés et leur application dans la construction moderne.",
    duration: "00:41:20",
    category: "Bâtiment & Construction",
    listens: 2340,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Sécurité sur chantier : obligations et formations",
    description: "Protocoles de sécurité, équipements de protection et formations obligatoires.",
    duration: "00:36:45",
    category: "Bâtiment & Construction",
    listens: 2890,
    isActive: true,
    fileSize: 42345678,
    mimeType: "audio/mpeg"
  },
  {
    title: "Rénovation énergétique : solutions techniques",
    description: "Isolation, ventilation et systèmes de chauffage pour améliorer la performance énergétique.",
    duration: "00:39:50",
    category: "Bâtiment & Construction",
    listens: 3560,
    isActive: true,
    fileSize: 49876543,
    mimeType: "audio/mpeg"
  },
  {
    title: "Calcul de structure : bases et outils",
    description: "Principes fondamentaux du calcul de structure et logiciels spécialisés.",
    duration: "00:42:10",
    category: "Bâtiment & Construction",
    listens: 2670,
    isActive: true,
    fileSize: 51234567,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Pose de charpente traditionnelle : démonstration complète",
    description: "Étapes de fabrication et pose d'une charpente en bois avec techniques ancestrales.",
    duration: "00:32:25",
    category: "Bâtiment & Construction",
    listens: 4230,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "Coulage de dalle béton : préparation et réalisation",
    description: "Préparation du sol, ferraillage et coulage d'une dalle béton avec conseils experts.",
    duration: "00:28:40",
    category: "Bâtiment & Construction",
    listens: 3780,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Isolation extérieure : pose d'ITE pas à pas",
    description: "Technique d'isolation thermique par l'extérieur avec matériaux modernes.",
    duration: "00:35:15",
    category: "Bâtiment & Construction",
    listens: 3120,
    isActive: true,
    fileSize: 267890123,
    mimeType: "video/mp4"
  },
  {
    title: "Installation électrique neuve : normes et réalisation",
    description: "Tableau électrique, circuit et protections selon la norme NFC 15-100.",
    duration: "00:26:50",
    category: "Bâtiment & Construction",
    listens: 2890,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Pose de carrelage grand format : techniques professionnelles",
    description: "Préparation du support, collage et jointoiement pour un résultat parfait.",
    duration: "00:24:30",
    category: "Bâtiment & Construction",
    listens: 3340,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Chantier ERP : accessibilité et normes",
    description: "Application des normes d'accessibilité dans les établissements recevant du public.",
    duration: "00:31:20",
    category: "Bâtiment & Construction",
    listens: 2450,
    isActive: true,
    fileSize: 223456789,
    mimeType: "video/mp4"
  },
  {
    title: "Plomberie sanitaire : installation complète",
    description: "Réseau d'eau chaude et froide, évacuations et raccordements sanitaires.",
    duration: "00:29:45",
    category: "Bâtiment & Construction",
    listens: 2980,
    isActive: true,
    fileSize: 212345678,
    mimeType: "video/mp4"
  },
  {
    title: "Construction ossature bois : montage d'un mur",
    description: "Fabrication et levage d'un mur en ossature bois avec isolation intégrée.",
    duration: "00:27:10",
    category: "Bâtiment & Construction",
    listens: 3560,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('🏗️ Début du seeding des podcasts Bâtiment & Construction...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Bâtiment & Construction" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Bâtiment & Construction existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Bâtiment & Construction" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/batiment/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/batiment/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Bâtiment & Construction terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });