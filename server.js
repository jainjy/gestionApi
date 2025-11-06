// Ajouter cette ligne tout en haut du fichier server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require('cors');
const helmet = require("helmet");
//test
const bodyParser = require("body-parser");

const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { upload } = require("./middleware/upload");
const { authenticateToken } = require("./middleware/auth");
const app = express();
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  },
  allowEIO3: true,
  pingTimeout: 60000,
});

// Middleware pour Socket.IO
io.engine.on("headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "http://localhost:5173";
  headers["Access-Control-Allow-Credentials"] = true;
});

// Gestion des connexions Socket.io
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
});

//test
// CORS configuration for main Express app
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'EIO', 'transport'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));

app.use(bodyParser.json());

// Configure Helmet with less restrictive settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: false
}));
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/professional", require("./routes/professional-billing"));
app.use("/api/stripe", require("./routes/stripeCreate"));
//pour les notations
app.use("/api/reviews", require("./routes/reviews"));

//pour les estimations immobilières
app.use("/api/estimation", require("./routes/estimation"));

//bienetre
app.use("/api/bienetre", require("./routes/bienetre"));

// Nouvelle route : suggestions intelligentes
app.use("/api/suggestion", require("./routes/suggestionIntelligent"));

//oeuvre
const oeuvre = require("./routes/oeuvre");
app.use("/api/oeuvre", oeuvre);

//pour les publicités
app.use("/api/advertisements", require("./routes/advertisements"));

// Ajouter ces routes après les autres routes
app.use("/api/conversations", require("./routes/conversations"));

// Routes pour les demandes pro et discussions
app.use("/api/pro", require("./routes/proDemandes"));
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

// Remplacer app.listen par server.listen
server.listen(PORT, () => {
  console.log(`🚀 Le serveur tourne sur le port: ${PORT}`);
  console.log(`🏥 Voir la santé sur : http://localhost:${PORT}/health`);
});
