// seeders/podcastAssuranceFinanceSeeder.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const podcastEpisodes = [
  // Podcasts Audio
  {
    title: "Assurance vie : optimiser son contrat en 2024",
    description: "Tout savoir sur l'assurance vie : supports d'investissement, fiscalité, arbitrage et transmission.",
    duration: "00:41:15",
    category: "Assurance et Finance",
    listens: 2890,
    isActive: true,
    fileSize: 42345678,
    mimeType: "audio/mpeg"
  },
  {
    title: "Épargne retraite : les meilleures solutions",
    description: "Comparatif PER, PERP, assurance vie et autres solutions pour préparer sa retraite sereinement.",
    duration: "00:37:50",
    category: "Assurance et Finance",
    listens: 2340,
    isActive: true,
    fileSize: 38901234,
    mimeType: "audio/mpeg"
  },
  {
    title: "Investissement boursier : débuter en Bourse",
    description: "Les bases pour investir en Bourse : actions, ETF, PEA et stratégies pour débutants.",
    duration: "00:44:20",
    category: "Assurance et Finance",
    listens: 3120,
    isActive: true,
    fileSize: 46789012,
    mimeType: "audio/mpeg"
  },
  {
    title: "Assurance emprunteur : réduire son coût",
    description: "Comment négocier son assurance de prêt et faire jouer la délégation d'assurance.",
    duration: "00:33:45",
    category: "Assurance et Finance",
    listens: 2670,
    isActive: true,
    fileSize: 34567890,
    mimeType: "audio/mpeg"
  },
  {
    title: "Fiscalité : optimiser ses impôts légalement",
    description: "Les meilleures stratégies fiscales pour particuliers : investissements, donations et réductions d'impôts.",
    duration: "00:39:10",
    category: "Assurance et Finance",
    listens: 2980,
    isActive: true,
    fileSize: 41234567,
    mimeType: "audio/mpeg"
  },
  {
    title: "Crypto-monnaies : opportunités et risques",
    description: "Analyse du marché des cryptos : Bitcoin, Ethereum et comment investir prudemment.",
    duration: "00:36:25",
    category: "Assurance et Finance",
    listens: 4230,
    isActive: true,
    fileSize: 39876543,
    mimeType: "audio/mpeg"
  },
  // Vidéos
  {
    title: "Tableau de bord financier : suivi en temps réel",
    description: "Démonstration d'un tableau de bord Excel avancé pour suivre ses investissements et son patrimoine.",
    duration: "00:28:40",
    category: "Assurance et Finance",
    listens: 3560,
    isActive: true,
    fileSize: 187654321,
    mimeType: "video/mp4"
  },
  {
    title: "Analyse graphique : lire les courbes boursières",
    description: "Formation vidéo sur l'analyse technique : supports, résistances et indicateurs clés.",
    duration: "00:35:20",
    category: "Assurance et Finance",
    listens: 2980,
    isActive: true,
    fileSize: 245678901,
    mimeType: "video/mp4"
  },
  {
    title: "Simulateur de retraite : projection interactive",
    description: "Utilisation d'un simulateur pour estimer sa retraite et ajuster sa stratégie d'épargne.",
    duration: "00:22:15",
    category: "Assurance et Finance",
    listens: 2670,
    isActive: true,
    fileSize: 167890123,
    mimeType: "video/mp4"
  },
  {
    title: "Comparateur d'assurances en ligne",
    description: "Guide pratique pour utiliser les comparateurs d'assurance et obtenir les meilleures offres.",
    duration: "00:19:30",
    category: "Assurance et Finance",
    listens: 3120,
    isActive: true,
    fileSize: 156789012,
    mimeType: "video/mp4"
  },
  {
    title: "Gestion de portefeuille : outils et méthodes",
    description: "Tour d'horizon des applications et méthodes pour gérer efficacement son portefeuille d'actifs.",
    duration: "00:31:45",
    category: "Assurance et Finance",
    listens: 2340,
    isActive: true,
    fileSize: 234567890,
    mimeType: "video/mp4"
  },
  {
    title: "Déclaration d'impôts : guide visuel complet",
    description: "Marche à pas pour remplir sa déclaration de revenus en ligne avec captures d'écran.",
    duration: "00:26:50",
    category: "Assurance et Finance",
    listens: 4230,
    isActive: true,
    fileSize: 198765432,
    mimeType: "video/mp4"
  },
  {
    title: "Audit financier personnel : méthode pas à pas",
    description: "Processus complet pour réaliser un audit de ses finances personnelles et identifier des axes d'amélioration.",
    duration: "00:38:20",
    category: "Assurance et Finance",
    listens: 1890,
    isActive: true,
    fileSize: 267890123,
    mimeType: "video/mp4"
  }
];

async function main() {
  console.log('💰 Début du seeding des podcasts Assurance et Finance...');

  // Vérifier si des podcasts de cette catégorie existent déjà
  const existingPodcasts = await prisma.podcast.count({
    where: { category: "Assurance et Finance" }
  });
  
  if (existingPodcasts > 0) {
    console.log('📊 Des podcasts Assurance et Finance existent déjà, mise à jour...');
    await prisma.podcast.deleteMany({
      where: { category: "Assurance et Finance" }
    });
  }

  // Créer les podcasts
  for (const podcastData of podcastEpisodes) {
    const isVideo = podcastData.mimeType === "video/mp4";
    const podcast = await prisma.podcast.create({
      data: {
        ...podcastData,
        audioUrl: `https://example.com/podcasts/finance/${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${isVideo ? 'mp4' : 'mp3'}`,
        thumbnailUrl: isVideo 
          ? `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`
          : `https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80`,
        storagePath: `podcasts/finance/${Date.now()}-${podcastData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isVideo ? 'mp4' : 'mp3'}`
      }
    });
    console.log(`✅ ${isVideo ? '📹 Vidéo' : '🎧 Audio'} créé: ${podcast.title}`);
  }

  console.log('🎉 Seeding des podcasts Assurance et Finance terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });