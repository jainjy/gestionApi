// server.js - VERSION MISE À JOUR AVEC EXPÉRIENCES TOURISTIQUES
require("dotenv").config();
const path = require("path");
const jwt = require("jsonwebtoken"); // Assurez-vous d'avoir l'import JWT en haut
const express = require("express");
const cors = require("./middleware/cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const sanitizeHtml = require("sanitize-html");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { upload } = require("./middleware/upload");
const { authenticateToken } = require("./middleware/auth");
require("./cron/subscriptionCron.js");

const artCreationRoutes = require('./routes/art-creation');

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
      process.env.FRONTEND_URL3,
      process.env.FRONTEND_URL4,
      process.env.FRONTEND_URL_LOCAL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});
/**
 * 🔥 CORRECTION [HIGH-07]: Middleware d'authentification WebSocket
 * Vérifie le JWT présent dans socket.handshake.auth.token
 */
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    console.error("❌ Connexion WebSocket refusée : Token manquant");
    return next(new Error("Authentication error: Token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // On attache l'utilisateur décodé au socket pour l'utiliser plus tard
    socket.user = decoded; 
    next();
  } catch (err) {
    console.error("❌ Connexion WebSocket refusée : Token invalide");
    return next(new Error("Authentication error: Invalid token"));
  }
});
app.set("io", io);

/**
 * 🔥 GESTION DES CONNEXIONS (SÉCURISÉE)
 */
io.on("connection", (socket) => {
  // Désormais, socket.user est disponible grâce au middleware ci-dessus
  const userId = socket.user.userId; 
  
  console.log(`🔌 Nouvelle connexion sécurisée: ${socket.id} (User: ${userId})`);

  // Rejoindre automatiquement sa room personnelle
  socket.join(`user:${userId}`);

  // Événement pour rejoindre les rooms de notifications
  socket.on('join-user-room', (userRoomId) => {
    // Sécurité supplémentaire : vérifier que l'utilisateur ne rejoint que SA propre room
    if (userRoomId === userId) {
      socket.join(`user:${userRoomId}`);
      console.log(`📨 User ${userRoomId} a rejoint sa room de notifications`);
    }
  });

  // Gestion des notifications en temps réel
  socket.on('send-notification', (notificationData) => {
    const { userId: targetUserId, titre, message } = notificationData;
    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('new-notification', {
        titre,
        message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Rejoindre une conversation
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`💬 User ${userId} est dans la conversation ${conversationId}`);
  });

  // Envoyer un message
  socket.on("send_message", (message) => {
    // On force l'expéditeur à être l'utilisateur authentifié (évite l'usurpation)
    const secureMessage = { ...message, expediteurId: userId };
    
    socket
      .to(`conversation:${message.conversationId}`)
      .emit("new_message", secureMessage);
    
    // Notifier l'expéditeur sur ses autres appareils
    socket.emit("message_sent", secureMessage);
  });

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
    // Protection Clickjacking (MED-05)
    frameguard: {
      action: "deny",
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    // Protection CSP (MED-06)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' est souvent nécessaire pour React/Tailwind
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "ws:", "wss:"], // Autorise WebSocket et API
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
        frameAncestors: ["'none'"], // Double sécurité Clickjacking
      },
    },
  })
);
app.use("/api", limiter);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" })); // Augmenter à 50MB pour être large
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
/**
 * 🔥 CORRECTION [MED-03]: Middleware Global de Sanitization XSS
 * Ce middleware parcourt tout le corps de la requête (req.body) 
 * et supprime les balises HTML malveillantes avant le traitement par les routes.
 */
const xssSanitizer = (req, res, next) => {
  const sanitizeOptions = {
    allowedTags: [], // On refuse toutes les balises HTML par défaut
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  };

  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Nettoyage de la chaîne de caractères
        obj[key] = sanitizeHtml(obj[key], sanitizeOptions);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Récursion pour les objets imbriqués
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// 🔥 AJOUT: Middleware pour injecter io dans les requêtes
app.use((req, res, next) => {
  req.io = io;
  next();
});
// 🆕 APPLICATION DU MIDDLEWARE SUR TOUTES LES ROUTES /api
app.use("/api", xssSanitizer);
// ======================
// ROUTES API EXISTANTES
// ======================
require('dotenv').config({ path: '.env' });

console.log('Token chargé:', process.env.DELIVERY_PLATFORM_TOKEN);

app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/delivery', require('./routes/deliveryApi'));
//entreprenariat
app.use("/api/entrepreneuriat", require("./routes/entrepreneuriat"));
app.use("/api/entrepreneuriat/admin", require("./routes/entrepreneuriat-admin"));
app.use("/api/test-internal", require("./routes/test-internal"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/articles", require("./routes/articles"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/products", require("./routes/products"));
app.use("/api/aliments", require("./routes/alimentsProduct"));
app.use("/api/services", require("./routes/services"));
app.use("/api/searchservice", require("./routes/searchService"));
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
app.use("/api/parapente", require("./routes/parapente"));
app.use("/api/parapenteprofile", require("./routes/parapenteProfile"));
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
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/projets", require("./routes/projet"));
//droit de famille
app.use("/api/droitFamille", require("./routes/droitFamille"));
app.use("/api/patrimoine", require("./routes/Patrimoine"));
app.use(
  "/api/subscription-payments",
  require("./routes/subscription-payments")
);
app.use('/api/suggestions', require('./routes/Recherchesuggestions'));
app.use('/test',require('./routes/user'))
app.use("/api/sync", require("./routes/syncOlimmoProperties"));

// AJOUTEZ ICI les nouvelles routes ↓
app.use("/api/pro/formations", require("./routes/formations")); // <-- AJOUTEZ CETTE LIGNE

// Routes publiques des formations
app.use("/api/formations", require("./routes/formations-public"));
// Assurez-vous d'avoir cette ligne
const candidaturesRoutes = require('./routes/candidatures');

// Et cette ligne pour monter la route
app.use('/api/candidatures', candidaturesRoutes);

// Routes protégées des formations (pour les professionnels)
app.use("/api/pro/formations", require("./routes/formations"));

// Dans server.js, ajoutez cette ligne avec les autres routes :
app.use("/api/emploi", require("./routes/emploi"));


// Route candidatures simplifiée
app.post('/api/candidatures', (req, res) => {
  console.log('Candidature reçue:', req.body);
  res.json({ 
    success: true, 
    message: 'Candidature reçue (mode test)' 
  });
});

app.get('/api/candidatures', (req, res) => {
  res.json({ 
    candidatures: [
      { id: 1, titre: 'Formation React', statut: 'en_attente' }
    ] 
  });
});


const alternancePublicRoutes = require('./routes/alternance');

// Ajouter les routes publiques
app.use('/api/alternance', alternancePublicRoutes);

// 🔥 AJOUTEZ CE MIDDLEWARE POUR LE DÉBOGAGE
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   console.log('Headers:', req.headers);
//   console.log('User:', req.user);
//   next();
// });
// 🔥 CORRECTION: Route alternance avec log supplémentaire
app.use("/api/pro/alternance", (req, res, next) => {
  console.log('📍 Route alternance appelée pour:', req.user?.id);
  next();
}, require("./routes/alternance"));

//app.use("/api/recherche", require("./routes/rechercheIntelligent"));
app.use("/api/recherche", require("./routes/rechercheIntelligentPremium"));
  
// 🔥 CORRECTION: Route notifications
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/bienetre", require("./routes/reservationbien_etre"));
app.use('/api/soins-bienetre', require('./routes/soins.routes'));
app.use('/api/therapeutes-bienetre', require('./routes/therapeutes.routes'));
app.use('/api/medecines-bienetre', require('./routes/medecines.routes'));
app.use('/api/conseils', require('./routes/conseils'));
 
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
app.use("/api/portraits", require("./routes/portraits"));
app.use("/api/pro", require("./routes/pro"));

app.use("/api/oliplus-email", require("./routes/oliplusEmailRoutes"));
// Route pour upload multiple
app.post(
  "/api/upload/multiple",
  authenticateToken,
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun fichier fourni",
        });
      }

      const uploadedImages = [];
      for (const file of req.files) {
        const { uploadToSupabase } = require("./middleware/upload");
        const fileInfo = await uploadToSupabase(file, "vehicules");
        uploadedImages.push(fileInfo);
      }

      res.json({
        success: true,
        data: uploadedImages,
      });
    } catch (error) {
      console.error("Erreur upload multiple:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'upload des fichiers",
      });
    }
  }
);

app.use("/api/art-creation", artCreationRoutes);

app.use("/api", require("./routes/rendez_vous"));
//route pour le demande conseil
app.use('/api/conseil', require('./routes/conseil.js'));
//route pour les demandes d'accompagnement
app.use('/api/accompagnement', require('./routes/accompagnement.js'));
//route pour les demande expert
app.use('/api/expert', require('./routes/expert.js'));
//route pour les service maison
app.use('/api/service-maison', require('./routes/service-maison.js'));
//route pour les design decoration
app.use('/api/design', require('./routes/design.routes.js'));
//route pour les equipement 
app.use('/api/equipements', require('./routes/equipement.routes'));
//route pour les demandes de marketplace
app.use('/api/marketplace', require('./routes/marketplace.routes'));
//route pour les nutrition bien etre
app.use('/api/nutrition-bienetre', require('./routes/nutrition.routes'));

//routes pour les vehicukles sa reservation et autres 
app.use("/api/vehicules", require("./routes/vehicules"));
app.use(
  "/api/reservations-vehicules",
  require("./routes/reservations-vehicules")
);
app.use("/api/avis-vehicules", require("./routes/avis-vehicules"));
// ======================
// 🆕 NOUVELLES ROUTES ACTIVITÉS ET LOISIRS
// ======================
app.use("/api/activities", require("./routes/activities"));
app.use("/api/activity-bookings", require("./routes/activity-bookings"));
app.use("/api/activity-actions", require("./routes/activity-actions"));
app.use("/api/guide-contact", require("./routes/guide-contact"));
app.use("/api/activity-availability", require("./routes/activity-availability"));

//Route event & dicovery
app.use("/api/event", require("./routes/eventRoutes.js"));
app.use("/api/discoveries", require("./routes/discoveriesRoutes.js"));

// ======================
// 🆕 ROUTES SÉJOURS & EXPÉRIENCES TOURISTIQUES
// ======================
app.use("/api/experiences", require("./routes/experiences"));
app.use("/api/experience-bookings", require("./routes/experience-bookings"));
app.use("/api/experience-reviews", require("./routes/experience-reviews"));

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
      "activities",
      "activity-bookings",
      "activity-actions",
      "guide-contact",
      "activity-availability",
      "experiences",
      "experience-bookings",
      "experience-reviews",
      "rendez-vous-entreprise",
    ],
    websocket: {
      connectedClients: io.engine.clientsCount,
      status: "Running"
    }
  });
});

// Routes publiques pour utilisateurs
app.use("/api/user/metiers", require("./routes/userMetier"));

// 🔥 AJOUTEZ ICI - ROUTES SERVICES ENTREPRISE & PRO
app.use("/api/user/enterprise-services", require("./routes/userService"));

// Api pour sync avec tracking de colis 
app.use("/api/sync", require("./routes/syncRoutes"));

// Route 404 - MISE À JOUR
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Ressources  non trouvée",
   
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
});