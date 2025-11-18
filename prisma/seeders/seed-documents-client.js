const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sampleDocuments = [
  {
    nom: "Carte d'identité nationale",
    type: "identite",
    categorie: "identite",
    description: "Carte d'identité recto-verso",
    dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
    statut: "VALIDE",
    taille: "2.5 MB",
    format: "image/jpeg",
    url: "https://example.com/documents/cni.jpg",
    cheminFichier: "documents/cni.jpg",
    tags: ["identité", "officiel", "cni"],
  },
  {
    nom: "Contrat de travail CDI",
    type: "professionnel",
    categorie: "juridique",
    description: "Contrat de travail à durée indéterminée",
    dateExpiration: null,
    statut: "VALIDE",
    taille: "1.8 MB",
    format: "application/pdf",
    url: "https://example.com/documents/contrat-travail.pdf",
    cheminFichier: "documents/contrat-travail.pdf",
    tags: ["travail", "contrat", "cdi"],
  },
  {
    nom: "Avis d'imposition 2023",
    type: "fiscal",
    categorie: "financier",
    description: "Avis d'imposition sur le revenu 2023",
    dateExpiration: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +6 mois
    statut: "EN_ATTENTE",
    taille: "3.2 MB",
    format: "application/pdf",
    url: "https://example.com/documents/avis-imposition-2023.pdf",
    cheminFichier: "documents/avis-imposition-2023.pdf",
    tags: ["fiscal", "impôt", "revenu"],
  },
  {
    nom: "Permis de conduire",
    type: "identite",
    categorie: "identite",
    description: "Permis de conduire catégorie B",
    dateExpiration: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // -1 mois
    statut: "EXPIRÉ",
    taille: "1.5 MB",
    format: "image/jpeg",
    url: "https://example.com/documents/permis.jpg",
    cheminFichier: "documents/permis.jpg",
    tags: ["permis", "conduire", "identité"],
  },
  {
    nom: "Facture EDF Février 2024",
    type: "utilitaire",
    categorie: "financier",
    description: "Facture d'électricité du mois de février",
    dateExpiration: null,
    statut: "VALIDE",
    taille: "0.8 MB",
    format: "application/pdf",
    url: "https://example.com/documents/facture-edf-fev2024.pdf",
    cheminFichier: "documents/facture-edf-fev2024.pdf",
    tags: ["facture", "électricité", "edf"],
  },
  {
    nom: "Bail d'habitation",
    type: "immobilier",
    categorie: "immobilier",
    description: "Contrat de bail location appartement",
    dateExpiration: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +3 mois
    statut: "VALIDE",
    taille: "4.1 MB",
    format: "application/pdf",
    url: "https://example.com/documents/bail-appartement.pdf",
    cheminFichier: "documents/bail-appartement.pdf",
    tags: ["bail", "location", "appartement"],
  },
  {
    nom: "Rapport médical annuel",
    type: "sante",
    categorie: "general",
    description: "Rapport de visite médicale annuelle",
    dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
    statut: "VALIDE",
    taille: "2.3 MB",
    format: "application/pdf",
    url: "https://example.com/documents/rapport-medical.pdf",
    cheminFichier: "documents/rapport-medical.pdf",
    tags: ["médical", "santé", "rapport"],
  },
  {
    nom: "Relevé bancaire Janvier 2024",
    type: "bancaire",
    categorie: "financier",
    description: "Relevé de compte courant janvier 2024",
    dateExpiration: null,
    statut: "EN_ATTENTE",
    taille: "1.7 MB",
    format: "application/pdf",
    url: "https://example.com/documents/releve-bancaire-jan2024.pdf",
    cheminFichier: "documents/releve-bancaire-jan2024.pdf",
    tags: ["bancaire", "relevé", "compte"],
  },
];

async function seedDocuments() {
  try {
    console.log("🌱 Début du seeding des documents...");

    // Récupérer un utilisateur existant (le premier de la base)
    const user = await prisma.user.findFirst({
        where: {email: "user@servo.mg"},
    });

    if (!user) {
      console.log(
        "❌ Aucun utilisateur trouvé. Veuillez d'abord créer un utilisateur."
      );
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${user.email}`);

    // Vérifier si des documents existent déjà
    const existingCount = await prisma.document.count({
      where: { userId: user.id },
    });

    if (existingCount > 0) {
      console.log(
        `📄 ${existingCount} documents existent déjà. Suppression...`
      );
      await prisma.document.deleteMany({
        where: { userId: user.id },
      });
    }

    // Créer les documents avec l'userId
    const documentsWithUser = sampleDocuments.map((doc) => ({
      ...doc,
      userId: user.id,
      dateUpload: new Date(),
    }));

    const createdDocuments = await prisma.document.createMany({
      data: documentsWithUser,
    });

    console.log(`✅ ${createdDocuments.count} documents créés avec succès!`);

    // Afficher les statistiques
    const stats = await prisma.document.groupBy({
      by: ["statut"],
      where: { userId: user.id },
      _count: true,
    });

    console.log("\n📊 Statistiques des documents créés:");
    stats.forEach((stat) => {
      console.log(`   ${stat.statut}: ${stat._count} documents`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder
seedDocuments();
