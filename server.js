require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("./middleware/cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { upload } = require("./middleware/upload");
const { authenticateToken } = require("./middleware/auth");

//initialisation des variables necessaires
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Gestion des connexions Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL2,
      process.env.FRONTEND_URL_LOCAL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});
app.set("io", io);
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }
  // Rejoindre une conversation
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });
  // Quitter une conversation
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });
  // Envoyer un message
  socket.on("send_message", (message) => {
    socket
      .to(`conversation:${message.conversationId}`)
      .emit("new_message", message);
    // Notifier les participants
    if (message.expediteurId) {
      socket.to(`user:${message.expediteurId}`).emit("message_sent", message);
    }
  });
  // Marquer les messages comme lus
  socket.on("mark_messages_read", (data) => {
    socket.to(`conversation:${data.conversationId}`).emit("message_read", data);
  });
  //deconnexion
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Dossier uploads créé");
}

// Créer les sous-dossiers pour les médias
const mediaDirs = ["audio", "videos", "thumbnails"];
mediaDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, "uploads", dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Dossier ${dir} créé`);
  }
});

// Rate limiting pour les limitation de nombres de requetes
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 🔸 Fenêtre de 10 minutes
  max: 300, // 🔸 300 requêtes par IP dans cette période
  standardHeaders: true, // ✅ Envoie les infos de limites dans les en-têtes `RateLimit-*`
  legacyHeaders: false, // ✅ Désactive les anciens headers `X-RateLimit-*`
  message: {
    status: 429,
    error: "Trop de requêtes : veuillez réessayer dans quelques minutes.",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

app.use(bodyParser.json());
app.use(cors);
// Configure Helmet with less restrictive settings
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
      },
    },
  })
);
app.use("/api", limiter);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 🔥 CORRECTION CRITIQUE: Middleware CORS très permissif pour les fichiers média
app.use("/media", (req, res, next) => {
  // Headers CORS très permissifs pour les fichiers média
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Expose-Headers", "*");
  res.header("Access-Control-Max-Age", "86400");

  // Désactiver certaines protections de sécurité pour les fichiers média
  res.removeHeader("X-Content-Type-Options");
  res.removeHeader("X-Frame-Options");

  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// 🔥 MIDDLEWARE POUR DÉSACTIVER HELMET POUR LES MÉDIAS
app.use("/media", (req, res, next) => {
  // Temporairement désactiver helmet pour les fichiers média
  res.removeHeader("Content-Security-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Resource-Policy");
  next();
});

// 🔥 SERVIR LES FICHIERS MÉDIA AVEC LES BONS HEADERS
app.use(
  "/media/audio",
  express.static(path.join(__dirname, "uploads/audio"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  })
);

app.use(
  "/media/videos",
  express.static(path.join(__dirname, "uploads/videos"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
      // 🔥 IMPORTANT: Headers pour la lecture cross-origin
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    },
  })
);

app.use(
  "/media/thumbnails",
  express.static(path.join(__dirname, "uploads/thumbnails"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  })
);

// Routes API
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
// routes pour les   batiments
app.use("/api/batiment", require("./routes/batiment"));


app.use("/api/mail", require("./routes/mail"));
app.use("/api/demandes/immobilier", require("./routes/demandes-immobilier"));
app.use("/api/demandes", require("./routes/user-demandes"));
app.use("/api/devis", require("./routes/devis"));
app.use("/api/demande-devis", require("./routes/demande_devis"));
app.use("/api/admin/demandes", require("./routes/admin-demandes"));
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
app.use("/api/appointment/", require("./routes/appointment"));
app.use("/api/subscription-plans", require("./routes/subscriptionPlanRoutes"));
//demandes des artisans
app.use("/api/demande-actions", require("./routes/demande-actions"));
//tourisme
app.use("/api/tourisme", require("./routes/tourisme"));
//reservation tourisme
app.use("/api/tourisme-bookings", require("./routes/tourisme-bookings"));
app.use("/api/admin/tourisme", require("./routes/admin-tourisme"));
//admin bookings tourisme
app.use("/api/admin/bookings", require("./routes/admin-bookings"));
app.use("/api/user/bookings", require("./routes/user-bookings"));
app.use("/api/payments", require("./routes/payments"));
//pour les facturations
app.use("/api/professional/billing", require("./routes/professional-billing"));
app.use("/api/stripe", require("./routes/stripeCreate"));
//pour les notations
app.use("/api/reviews", require("./routes/reviews"));
//pour les settings pro
app.use(
  "/api/professional/settings",
  require("./routes/professional-settings")
);
//pour les estimations immobilières
app.use("/api/estimation", require("./routes/estimation"));

//bienetre
app.use("/api/bienetre", require("./routes/bienetre"));

// Nouvelle route : suggestions intelligentes
app.use("/api/suggestion", require("./routes/suggestionIntelligent"));

//oeuvre
const oeuvre = require("./routes/oeuvre");
const { prisma } = require("./lib/db");
app.use("/api/oeuvre", oeuvre);

// NOUVELLE ROUTE POUR LES MÉDIAS (BIEN-ÊTRE)
app.use("/api/media", require("./routes/media"));

//pour les publicités
app.use("/api/advertisements", require("./routes/advertisements"));

// Ajouter ces routes après les autres routes
app.use("/api/conversations", require("./routes/conversations"));

// Routes pour les demandes pro et discussions
app.use("/api/pro/demandes", require("./routes/proDemandes"));
// Route pour l'upload de fichiers dans les messages
app.post(
  "/api/upload/message-file",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Aucun fichier fourni",
        });
      }

      const { uploadToSupabase } = require("./middleware/upload");
      const fileInfo = await uploadToSupabase(req.file, "messages");

      res.json({
        success: true,
        url: fileInfo.url,
        path: fileInfo.path,
        name: fileInfo.name,
        type: fileInfo.type,
      });
    } catch (error) {
      console.error("Erreur upload fichier message:", error);
      res.status(500).json({
        error: "Erreur lors de l'upload du fichier",
      });
    }
  }
);
//ROUTE DE TEST POUR LES FICHIERS MÉDIA
app.get("/media/test/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "uploads/videos", filename);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log("✅ Fichier trouvé:", {
      filename,
      size: stats.size,
      path: filePath,
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(filePath);
  } else {
    console.log("❌ Fichier non trouvé:", filePath);
    res.status(404).json({
      success: false,
      message: "Fichier non trouvé",
      path: filePath,
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
      "orders",
      "media",
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

// MODIFICATION: Remplacer le server.listen avec vérification DB
server.listen(PORT, async () => {
  console.log(`🚀 Le serveur tourne sur le port: ${PORT}`);
  console.log(`🏥 Voir la santé sur : http://localhost:${PORT}/health`);
});
