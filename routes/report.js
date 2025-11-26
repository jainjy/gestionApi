const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const nodemailer = require("nodemailer");
const reportService = require("../lib/report-service");

// ================= ANALYSE =================
async function generateReport() {
  try {
    console.log("🔍 Début génération du rapport...");
    
    // TOP 3 PRODUITS
    const topProducts = await prisma.product.findMany({
      orderBy: [
        { viewCount: "desc" },
        { clickCount: "desc" },
        { purchaseCount: "desc" }
      ],
      take: 3
    });
    console.log("✅ Produits récupérés:", topProducts.length);

    // TOP 3 PROPERTIES
    const properties = await prisma.property.findMany({
      include: { favorites: true }
    });

    const topProperties = properties
      .map(p => ({
        ...p,
        score: (p.views || 0) + (p.favorites.length * 2)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    console.log("✅ Propriétés traitées:", topProperties.length);

    // TOP 3 TOURISME
    const tourisms = await prisma.tourisme.findMany({
      include: { bookings: true }
    });

    const topTourisme = tourisms
      .map(t => ({
        ...t,
        score: (t.rating * 2) + t.reviewCount + t.bookings.length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    console.log("✅ Tourisme traité:", topTourisme.length);

    return { topProducts, topProperties, topTourisme };
  } catch (error) {
    console.error("❌ Erreur génération rapport:", error);
    throw error;
  }
}

// ================= EMAIL =================
async function sendEmail(report, recipientEmail) {
  try {
    console.log("📧 Préparation envoi email à:", recipientEmail);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Vérification que le rapport contient des données
    const hasProducts = report.topProducts && report.topProducts.length > 0;
    const hasProperties = report.topProperties && report.topProperties.length > 0;
    const hasTourisme = report.topTourisme && report.topTourisme.length > 0;

    const html = `
      <h2>📊 Rapport Popularité SERVO</h2>

      ${hasProducts ? `
      <h3>🔥 Top 3 Produits</h3>
      <ul>
        ${report.topProducts.map(p => `<li>${p.name} - Vues: ${p.viewCount || 0}</li>`).join("")}
      </ul>
      ` : '<p>Aucun produit populaire</p>'}

      ${hasProperties ? `
      <h3>🏠 Top 3 Propriétés</h3>
      <ul>
        ${report.topProperties.map(p => `<li>${p.title} - Score: ${p.score || 0}</li>`).join("")}
      </ul>
      ` : '<p>Aucune propriété populaire</p>'}

      ${hasTourisme ? `
      <h3>🌍 Top 3 Tourisme</h3>
      <ul>
        ${report.topTourisme.map(t => `<li>${t.title} - Score: ${t.score || 0}</li>`).join("")}
      </ul>
      ` : '<p>Aucun lieu touristique populaire</p>'}
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject: "📈 TOP 3 Populaires - SERVO",
      html
    });

    console.log("✅ Email envoyé avec succès");
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw error;
  }
}

// ================= ENDPOINT PRINCIPAL =================
router.post("/analyse-popularite", async (req, res) => {
  try {
    console.log("📨 Début analyse popularité - Email reçu:", req.body?.email);
    
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "L'adresse email est requise"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide"
      });
    }

    const cleanEmail = email.trim();
    console.log("📧 Email nettoyé:", cleanEmail);

   // ✅ STOCKAGE de l'email AVEC ReportService - TOUJOURS créer un nouveau
  try {
    const storedEmail = await reportService.addDestinationEmail(cleanEmail);
    console.log("✅ Email traité via ReportService:", storedEmail.id, storedEmail.email);
  } catch (storageError) {
    console.error("❌ Erreur stockage email:", storageError.message);
    // Continue quand même l'envoi même si le stockage échoue
  }

    // Génération du rapport
    console.log("📊 Génération du rapport...");
    const report = await generateReport();
    console.log("✅ Rapport généré avec succès");

    // Envoi de l'email
    console.log("📤 Envoi de l'email...");
    await sendEmail(report, cleanEmail);
    console.log("✅ Email envoyé avec succès");

    // Réponse SUCCÈS - données simplifiées pour éviter les erreurs de sérialisation
    const responseData = {
      success: true,
      message: `Analyse effectuée + Email envoyé à ${cleanEmail} ✅`,
      data: {
        report: {
          topProducts: report.topProducts.map(p => ({ 
            name: p.name || 'Sans nom', 
            viewCount: p.viewCount || 0 
          })),
          topProperties: report.topProperties.map(p => ({ 
            title: p.title || 'Sans titre', 
            score: p.score || 0 
          })),
          topTourisme: report.topTourisme.map(t => ({ 
            title: t.title || 'Sans titre', 
            score: t.score || 0 
          }))
        }
      }
    };

    console.log("🎉 Envoi réponse au client...");
    res.json(responseData);
    console.log("🎉 Réponse envoyée au client avec succès");

  } catch (error) {
    console.error("❌ Erreur analyse popularité DÉTAILLÉE:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: "Erreur analyse popularité",
      error: error.message
    });
  }
});

// ================= GESTION DES EMAILS STOCKÉS =================

// Récupérer tous les emails stockés
router.get("/destinations", async (req, res) => {
  try {
    const destinations = await reportService.getAllDestinations();
    
    res.json({
      success: true,
      data: destinations,
      count: destinations.length
    });
  } catch (error) {
    console.error("❌ Erreur récupération destinations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur récupération des emails",
      error: error.message
    });
  }
});

// Récupérer seulement les emails actifs (pour le dropdown)
router.get("/destinations/active", async (req, res) => {
  try {
    const destinations = await reportService.getActiveDestinations();
    
    res.json({
      success: true,
      data: destinations
    });
  } catch (error) {
    console.error("❌ Erreur récupération destinations actives:", error);
    res.status(500).json({
      success: false,
      message: "Erreur récupération des emails actifs",
      error: error.message
    });
  }
});

module.exports = router;