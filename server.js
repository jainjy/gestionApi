// server.js - VERSION MISE À JOUR
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
require("./cron/subscriptionCron.js");

// Initialisation des variables nécessaires
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// 🔥 CORRECTION: Configuration Socket.io améliorée
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

// 🔥 CORRECTION: Gestion des connexions Socket.io avec logs détaillés
io.on("connection", (socket) => {
  console.log("🔌 Nouvelle connexion Socket.io:", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("📨 User ID from query:", userId);

  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} a rejoint sa room`);
    
    // Événement pour rejoindre les rooms de notifications
    socket.on('join-user-room', (userRoomId) => {
      socket.join(`user:${userRoomId}`);
      console.log(`📨 User ${userRoomId} a rejoint sa room de notifications`);
    });
  }

  // 🔥 AJOUT: Gestion des notifications en temps réel
  socket.on('new-notification', (data) => {
    console.log('📨 Nouvelle notification reçue:', data);
    if (data.userId) {
      socket.to(`user:${data.userId}`).emit('notification-received', data);
    }
  });

  // Événement pour envoyer une notification spécifique
  socket.on('send-notification', (notificationData) => {
    const { userId, titre, message } = notificationData;
    if (userId) {
      socket.to(`user:${userId}`).emit('new-notification', {
        titre,
        message,
        timestamp: new Date().toISOString()
      });
      console.log(`📨 Notification envoyée à l'utilisateur ${userId}`);
    }
  });

  // Événement pour mettre à jour le compteur de notifications
  socket.on('update-notification-count', (data) => {
    const { userId, count } = data;
    if (userId) {
      socket.to(`user:${userId}`).emit('notification-count-update', {
        count,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Rejoindre une conversation
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`💬 User ${userId} a rejoint la conversation ${conversationId}`);
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

  // Gestion des erreurs
  socket.on("error", (error) => {
    console.error("❌ Erreur Socket:", error);
  });

  // Déconnexion
  socket.on("disconnect", (reason) => {
    console.log("❌ User déconnecté:", socket.id, "Raison:", reason);
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Trop de requêtes : veuillez réessayer dans quelques minutes.",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

app.use(cors);
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
        connectSrc: ["'self'", "https:", "ws:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
      },
    },
  })
);
app.use("/api", limiter);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" })); // Augmenter à 50MB pour être large
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// 🔥 CORRECTION CRITIQUE: Middleware CORS très permissif pour les fichiers média
app.use("/media", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST, PUT");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Expose-Headers", "*");
  res.header("Access-Control-Max-Age", "86400");

  res.removeHeader("X-Content-Type-Options");
  res.removeHeader("X-Frame-Options");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Désactiver Helmet pour les médias
app.use("/media", (req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Resource-Policy");
  next();
});

// Servir les fichiers médias
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

// 🔥 AJOUT: Middleware pour injecter io dans les requêtes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ======================
// ROUTES API EXISTANTES
// ======================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/articles", require("./routes/articles"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/products", require("./routes/products"));
app.use("/api/aliments", require("./routes/alimentsProduct"));
app.use("/api/services", require("./routes/services"));
app.use("/api/metiers", require("./routes/metiersRoutes"));
app.use("/api/professional/services", require("./routes/professional-services"));
app.use("/api/agenda", require("./routes/agenda"));
app.use("/api/batiment", require("./routes/batiment"));
app.use("/api/anonce", require("./routes/anonce"));
app.use('/api/produits-naturels', require("./routes/produits-naturels"));
app.use('/api/courses', require("./routes/courses"));
app.use('/api/reservation-cours', require("./routes/reservationCours"));
app.use("/api/digitalisation-services", require("./routes/digitalisation-services"));
app.use("/api/investissement", require("./routes/investment"));
// Ajouter dans server.js, avec les autres routes
app.use("/api/contact-messages", require("./routes/contact-messages"));
//rapport 
app.use("/api/report", require("./routes/report"));
//offres exclusives
app.use("/api/offres-exclusives", require("./routes/offres-exclusives"));
//audit
app.use("/api/add_audit", require("./routes/audit"));
app.use("/api/mail", require("./routes/mail"));
app.use("/api/demandes/immobilier", require("./routes/demandes-immobilier"));
app.use("/api/demandes", require("./routes/user-demandes"));
app.use("/api/devis", require("./routes/devis"));
app.use("/api/demande-devis", require("./routes/demande_devis"));
app.use("/api/admin/demandes", require("./routes/admin-demandes"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/admin/payments", require("./routes/admin-payments"));


//droit de famille
app.use("/api/droitFamille", require("./routes/droitFamille"));

app.use('/api/suggestions', require('./routes/Recherchesuggestions'));


//app.use("/api/recherche", require("./routes/rechercheIntelligent"));
app.use("/api/recherche", require("./routes/rechercheIntelligentPremium"));
  
// 🔥 CORRECTION: Route notifications
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/bienetre", require("./routes/reservationbien_etre"));
 
app.use("/api/Vol", require("./routes/Vol"));
app.use("/api/ActivityCategory", require("./routes/ActivityCategory"));
app.use("/api/notificationadmin", require("./routes/AllNotifications"));

app.use("/api/demandes-history", require("./routes/demandes-history"));
app.use("/api/cookies", require("./routes/cookies"));
app.use("/api/harmonie/", require("./routes/HarmoniePro"));
app.use("/api/financement", require("./routes/financement"));
app.use("/api/appointment/", require("./routes/appointment"));
app.use("/api/subscription-plans", require("./routes/subscriptionPlanRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/admin/subscriptions", require("./routes/admin-subscriptions"));
app.use("/api/demande-actions", require("./routes/demande-actions"));
app.use("/api/tourisme", require("./routes/tourisme"));
app.use("/api/tourisme-bookings", require("./routes/tourisme-bookings"));
app.use("/api/admin/tourisme", require("./routes/admin-tourisme"));
app.use("/api/admin/bookings", require("./routes/admin-bookings"));
app.use("/api/user/bookings", require("./routes/user-bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/professional/billing", require("./routes/professional-billing"));
app.use("/api/stripe", require("./routes/stripeCreate"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/professional/settings", require("./routes/professional-settings"));
app.use("/api/professional/profile", require("./routes/professional-profile"));
app.use("/api/estimation", require("./routes/estimation"));
app.use("/api/touristic-place-bookings", require("./routes/touristic-place-bookings"));
//planning pro
app.use("/api/planning", require("./routes/PlanningPro"));
app.use("/api/bienetre", require("./routes/bienetre"));
app.use("/api/suggestion", require("./routes/suggestionIntelligent"));
app.use("/api/oeuvre", require("./routes/oeuvre"));
app.use("/api/media", require("./routes/media"));
app.use("/api/advertisements", require("./routes/advertisements"));
app.use("/api/map", require("./routes/map"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/admin/media", require("./routes/admin-media"));
app.use("/api/pro/demandes", require("./routes/proDemandes"));
app.use("/api/services-ibr", require("./routes/services-ibr"));
app.use("/api/locations-saisonnieres", require("./routes/locations-saisonniere"));

// ======================
// 🆕 NOUVELLES ROUTES ACTIVITÉS ET LOISIRS
// ======================
app.use("/api/activities", require("./routes/activities"));
app.use("/api/activity-bookings", require("./routes/activity-bookings"));
app.use("/api/activity-actions", require("./routes/activity-actions"));
app.use("/api/guide-contact", require("./routes/guide-contact"));
app.use("/api/activity-availability", require("./routes/activity-availability"));

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

app.use("/api/documents", require("./routes/documents"));
app.use("/api/client/documents", require("./routes/documents-client"));
app.use("/api/contrats-types", require("./routes/contratsTypes"));

// Route de test pour les fichiers médias
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

// 🔥 AJOUT: Route de test WebSocket
app.get("/websocket-test", (req, res) => {
  res.json({
    status: "WebSocket Server Running",
    port: PORT,
    timestamp: new Date().toISOString(),
    endpoints: {
      websocket: `ws://localhost:${PORT}`,
      health: `http://localhost:${PORT}/health`
    }
  });
});

// Route de santé - MISE À JOUR
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
      "notifications",
      "websocket",
      "map",
      "investissement",
      // 🆕 AJOUT DES SERVICES ACTIVITÉS
      "activities",
      "activity-bookings",
      "activity-actions",
      "guide-contact",
      "activity-availability"
    ],
    websocket: {
      connectedClients: io.engine.clientsCount,
      status: "Running"
    }
  });
});

// Route 404 - MISE À JOUR
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
    availableRoutes: [
      "/health",
      "/websocket-test",
      "/api/notifications/user/:userId",
      "/api/auth/*",
      "/api/users/*",
      "/api/investissement/*",
      // 🆕 AJOUT DES ROUTES ACTIVITÉS
      "/api/activities/*",
      "/api/activity-bookings/*",
      "/api/activity-actions/*",
      "/api/guide-contact/*",
      "/api/activity-availability/*"
    ]
  });
});

// Middleware d'erreurs global
app.use((error, req, res, next) => {
  console.error("❌ Erreur Globale:", error);
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur",
    message: error.message
  });
});

// Démarrage du serveur - MISE À JOUR
server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port: ${PORT}`);
  console.log(`🔌 WebSocket disponible sur: ws://localhost:${PORT}`);
  console.log(`🏥 Route santé: http://localhost:${PORT}/health`);
  console.log(`🧪 Test WebSocket: http://localhost:${PORT}/websocket-test`);
  console.log(`📨 Notifications: http://localhost:${PORT}/api/notifications/user/:userId`);
  console.log(`🌍 Investissement: http://localhost:${PORT}/api/investissement/demande`);
  // 🆕 AJOUT DES ACTIVITÉS
  console.log(`🎯 Activités: http://localhost:${PORT}/api/activities`);
  console.log(`📅 Réservations: http://localhost:${PORT}/api/activity-bookings`);
  console.log(`❤️ Actions: http://localhost:${PORT}/api/activity-actions`);
});