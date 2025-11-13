// scripts/cleanup-simple.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanupDemandes() {
  try {
    console.log("Début de la suppression...");

    // Supprimer dans l'ordre pour éviter les erreurs de contraintes
    await prisma.message.deleteMany({});
    console.log("Messages supprimés");

    await prisma.conversationParticipant.deleteMany({});
    console.log("Participants supprimés");

    await prisma.conversation.deleteMany({});
    console.log("Conversations supprimées");

    await prisma.devis.deleteMany({});
    console.log("Devis supprimés");

    await prisma.demandeArtisan.deleteMany({});
    console.log("Relations artisans supprimées");

    await prisma.demandeHistory.deleteMany({});
    console.log("Historique supprimé");

    await prisma.demande.deleteMany({});
    console.log("Demandes supprimées");

    console.log("✅ Toutes les données des demandes ont été supprimées !");
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer directement
cleanupDemandes();
