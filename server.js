// Ajouter cette ligne tout en haut du fichier server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("./middleware/cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const fs = require("fs");


const app = express();
const PORT = process.env.PORT || 3001;

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Dossier uploads créé");
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
});

// Middleware
app.use(helmet());
app.use(cors);
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// SERVIR LES FICHIERS STATIQUES - DOIT ÊTRE APRÈS LES MIDDLEWARES DE BASE
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/articles", require("./routes/articles"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/products", require("./routes/products"));
app.use("/api/aliments", require("./routes/alimentsProduct"));
app.use("/api/services", require("./routes/services"));
app.use("/api/metiers", require("./routes/metiersRoutes"));
app.use(
  "/api/professional/services",
  require("./routes/professional-services")
);
app.use("/api/mail", require("./routes/mail"));
app.use("/api/demandes/immobilier", require("./routes/demandes-immobilier"));
app.use("/api/demandes", require("./routes/user-demandes"));
app.use("/api/devis", require("./routes/devis"));
app.use("/api/demande-devis", require("./routes/demande_devis"));
app.use("/api/admin", require("./routes/admin-demandes"));
// routes pour le panier et les commandes
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/admin/payments", require("./routes/admin-payments"));
app.use("/api/recherche", require("./routes/rechercheIntelligent"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/demandes-history", require("./routes/demandes-history"));
app.use("/api/cookies", require("./routes/cookies"));
// routes pour le service harmonie pro
app.use("/api/harmonie/", require("./routes/HarmoniePro"));
app.use("/api/financement", require("./routes/financement"));

//tourisme
app.use("/api/tourisme", require("./routes/tourisme"));
//reservation tourisme
app.use("/api/tourisme-bookings", require("./routes/tourisme-bookings"));
app.use("/api/admin/tourisme", require("./routes/admin-tourisme"));

//bienetre
app.use("/api/bienetre", require("./routes/bienetre"));
//oeuvre

const oeuvre = require("./routes/oeuvre");
app.use("/api/oeuvre", oeuvre);

// Ajouter ces imports
const { upload } = require('./middleware/upload');
const { authenticateToken } = require("./middleware/auth");

// Ajouter ces routes après les autres routes
app.use("/api/conversations", require("./routes/conversations"));

// Routes pour les demandes pro et discussions
app.use("/api/pro",require("./routes/proDemandes"));
// Route pour l'upload de fichiers dans les messages
app.post('/api/upload/message-file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      });
    }

    const { uploadToSupabase } = require('./middleware/upload');
    const fileInfo = await uploadToSupabase(req.file, 'messages');

    res.json({
      success: true,
      url: fileInfo.url,
      path: fileInfo.path,
      name: fileInfo.name,
      type: fileInfo.type
    });
  } catch (error) {
    console.error('Erreur upload fichier message:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'upload du fichier'
    });
  }
});
// Route de santé
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: [
      "auth",
      "users",
      "upload",
      "articles",
      "properties",
      "products",
      "services",
      "metiers",
      "professional-services",
      "demandes",
      "admin-demandes",
      "cart",
      "orders"
    ],
  });
});

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
  });
});

// Middleware d'erreurs global
app.use((error, req, res, next) => {
  console.error("Erreur Globales :", error);
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Le serveur tourne sur le port: ${PORT}`);
  console.log(`🏥 Voir la santé sur : http://localhost:${PORT}/health`);

});
