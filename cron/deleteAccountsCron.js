// Fichier cron pour traiter les suppressions différées
require("dotenv").config();
const { prisma } = require("../lib/db");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function processAccountDeletions() {
  try {
    console.log("🔍 Recherche des comptes à supprimer...");

    // Récupérer les comptes marqués pour suppression depuis plus de 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const accountsToDelete = await prisma.user.findMany({
      where: {
        status: "pending_deletion",
        deletionRequestedAt: {
          lte: thirtyDaysAgo,
        },
      },
      include: {
        // Inclure les relations pour log
        Product: true,
        properties: true,
        blogArticles: true,
      },
    });

    console.log(`📋 ${accountsToDelete.length} comptes à supprimer`);

    for (const account of accountsToDelete) {
      try {
        // Log avant suppression
        console.log(`🗑️ Suppression du compte: ${account.email}`);

        // Suppression en cascade via Prisma
        await prisma.user.delete({
          where: { id: account.id },
        });

        // Envoyer une confirmation de suppression
        await transporter.sendMail({
          from: `"SERVO" <${process.env.SMTP_FROM}>`,
          to: account.email,
          subject: "Confirmation de suppression de compte",
          html: `
            <h2>Votre compte a été supprimé</h2>
            <p>Conformément à votre demande et aux délais RGPD, votre compte a été définitivement supprimé.</p>
            <p><strong>Date de suppression :</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
            <p><strong>Compte concerné :</strong> ${account.email}</p>
            <hr>
            <p><small>Ceci est un message automatique. Si vous n'êtes pas à l'origine de cette demande, veuillez contacter notre support.</small></p>
          `,
        });

        console.log(`✅ Compte ${account.email} supprimé avec succès`);
      } catch (error) {
        console.error(
          `❌ Erreur lors de la suppression du compte ${account.email}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Erreur dans le cron de suppression des comptes:", error);
  }
}

// Exécuter tous les jours à minuit
module.exports = processAccountDeletions;
