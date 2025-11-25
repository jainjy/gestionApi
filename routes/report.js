const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const nodemailer = require("nodemailer");

// ================= ANALYSE =================
async function generateReport() {
  // TOP 3 PRODUITS
  const topProducts = await prisma.product.findMany({
    orderBy: [
      { viewCount: "desc" },
      { clickCount: "desc" },
      { purchaseCount: "desc" }
    ],
    take: 3
  });

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

  return { topProducts, topProperties, topTourisme };
}

// ================= EMAIL =================
async function sendEmail(report, recipientEmail) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const html = `
    <h2>📊 Rapport Popularité SERVO</h2>

    <h3>🔥 Top 3 Produits</h3>
    <ul>
      ${report.topProducts.map(p => `<li>${p.name} </li>`).join("")}
    </ul>

    <h3>🏠 Top 3 Propriétés</h3>
    <ul>
      ${report.topProperties.map(p => `<li>${p.title} - Vues: ${p.views}</li>`).join("")}
    </ul>

    <h3>🌍 Top 3 Tourisme</h3>
    <ul>
      ${report.topTourisme.map(t => `<li>${t.title} - Note: ${t.rating}</li>`).join("")}
    </ul>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipientEmail, // Utilise l'email reçu du frontend
    subject: "📈 TOP 3 Populaires - SERVO",
    html
  });
}

// ================= ENDPOINT =================
// Changé en POST pour accepter le body avec l'email
router.post("/analyse-popularite", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validation de l'email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "L'adresse email est requise"
      });
    }

    // Validation basique du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide"
      });
    }

    const report = await generateReport();
    await sendEmail(report, email.trim()); // Passe l'email au service d'envoi

    res.json({
      success: true,
      message: `Analyse effectuée + Email envoyé à ${email} ✅`,
      data: report
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur analyse popularité",
      error: error.message
    });
  }
});

module.exports = router;