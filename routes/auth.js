const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/db");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../lib/email");
const stripe = require("../utils/stripe");
const { authenticateToken } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
// Fonction de validation
function isPasswordStrong(password) {
    // Min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    return regex.test(password);
}

// Création du limiteur pour passwordReset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  
  // ⚠️ CORRECTION: Utilisation correcte de keyGenerator
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    // Utilise la fonction ipKeyGenerator fournie par express-rate-limit
    const ip = req.ip || req.socket.remoteAddress;
    return `${ip}:${email}`;
  },
  
  // ⚠️ CORRECTION: Ajout de validate pour éviter l'erreur IPv6
  validate: {
    ip: false
  },

  message: {
    success: false,
    error: "Trop de tentatives. Veuillez réessayer dans 1 heure.",
  },

  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// Création du limiteur pour le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max par IP
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔧 CORRECTION: Configuration rate-limit corrigée pour verifyToken
const verifyTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  // ⚠️ CORRECTION: Utilisation correcte de keyGenerator
  keyGenerator: (req) => {
    const token = req.params?.token || req.query?.token || req.body?.token || "unknown";
    const ip = req.ip || req.socket.remoteAddress;
    return `${ip}:${token}`;
  },
  
  // ⚠️ CORRECTION: Ajout de validate pour éviter l'erreur IPv6
  validate: {
    ip: false
  },

  message: {
    success: false,
    error: "Trop de tentatives de vérification.",
  },

  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// POST /api/auth/login - Connexion
router.post("/login",loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "Identifiants invalides",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Identifiants invalides",
      });
    }

    // Vérifier l'expiration de l'abonnement pour les professionnels
    let subscriptionStatus = null;
    if (user.role === "professional") {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });

      if (
        subscription &&
        subscription.endDate < new Date() &&
        subscription.status === "active"
      ) {
        // Mettre à jour le statut de l'abonnement et de l'utilisateur
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        });

        subscriptionStatus = "expired";
      } else if (subscription) {
        subscriptionStatus = subscription.status;
      }
    }

    // Recharger les données de l'utilisateur si nécessaire
    const updatedUser =
      user.role === "professional"
        ? await prisma.user.findUnique({
            where: { id: user.id },
          })
        : user;

    // Préparer la réponse utilisateur
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      role: updatedUser.role,
      companyName: updatedUser.companyName,
      status: updatedUser.status,
      userType: updatedUser.userType,
      avatar: updatedUser.avatar,
      address: updatedUser.address,
      siret: updatedUser.siret,
      city: updatedUser.city,
      subscriptionStatus: subscriptionStatus, // AJOUT: Status de l'abonnement
    };

    // 1. Générer l'Access Token (Court : 15min à 1h)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 2. Générer le Refresh Token (Long : 7 jours)
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Stocker le Refresh Token en base (Sécurité MED-04)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    res.json({
      user: userResponse,
      token: accessToken, // Access Token pour le header Authorization
      refreshToken: refreshToken, // À stocker côté client (localStorage ou Cookie)
      ...(subscriptionStatus === "expired" && {
        message: "Votre abonnement a expiré",
      }),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la connexion",
    });
  }
});

// POST /api/auth/signup - Inscription
router.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      userType, // AJOUT: Récupérer userType
      companyName,
      metiers,
      demandType,
      role,
      address,
      addressComplement,
      zipCode,
      city,
      latitude,
      longitude,
      siret,
      commercialName,
      avatar,
    } = req.body;

    // Validation des données
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être remplis",
      });
    }
    // Dans la route
    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit faire 8 caractères min. avec majuscule, minuscule et chiffre.",
      });
    }

    // Vérifier l'email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur avec TOUS les champs
    const user = await prisma.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        role: role,
        userType: "CLIENT",
        demandType: demandType || "particulier",
        address: address || null,
        addressComplement: addressComplement || null,
        zipCode: zipCode || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        avatar: avatar || null,
      },
    });

    // 1. Générer l'Access Token (Court : 15min à 1h)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 2. Générer le Refresh Token (Long : 7 jours)
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Stocker le Refresh Token en base (Sécurité MED-04)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        companyName: user.companyName,
        demandType: user.demandType,
        userType: user.userType,
        avatar: user.avatar,
        address: user.address,
        city: user.city,
      },
      token: accessToken, // Access Token pour le header Authorization
      refreshToken: refreshToken, // À stocker côté client (localStorage ou Cookie)
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de l'inscription",
    });
  }
});

// POST /api/auth/signup-pro - Inscription Pro sans paiement (essai gratuit 2 mois)
router.post("/signup-pro", async (req, res) => {
  try {
    const { utilisateur, planId } = req.body;
    // Validation des données utilisateur
    if (
      !utilisateur ||
      !utilisateur.firstName ||
      !utilisateur.lastName ||
      !utilisateur.email ||
      !utilisateur.phone ||
      !utilisateur.password
    ) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être remplis",
      });
    }
    // Dans la route
    if (!isPasswordStrong(utilisateur.password)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit faire 8 caractères min. avec majuscule, minuscule et chiffre.",
      });
    }
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: utilisateur.email },
    });
    if (existingUser) {
      return res.status(409).json({
        error: "Un utilisateur avec cet email existe déjà",
      });
    }
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(utilisateur.password, 12);
    // Créer l'utilisateur avec statut "active"
    const user = await prisma.user.create({
      data: {
        email: utilisateur.email,
        passwordHash: hashedPassword,
        firstName: utilisateur.firstName,
        lastName: utilisateur.lastName,
        phone: utilisateur.phone,
        role: "professional",
        userType: utilisateur.userType,
        status: "active", // Actif immédiatement
        companyName: utilisateur.companyName || null,
        address: utilisateur.address || null,
        addressComplement: utilisateur.addressComplement || null,
        zipCode: utilisateur.zipCode || null,
        city: utilisateur.city || null,
        latitude: utilisateur.latitude
          ? parseFloat(utilisateur.latitude)
          : null,
        longitude: utilisateur.longitude
          ? parseFloat(utilisateur.longitude)
          : null,
        siret: utilisateur.siret || null,
        commercialName: utilisateur.commercialName || null,
        metiers: utilisateur.metiers &&
          utilisateur.metiers.length > 0 && {
            create: utilisateur.metiers.map((metierId) => ({
              metier: {
                connect: { id: metierId },
              },
            })),
          },
      },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
      },
    }); 
    // Créer un abonnement essai gratuit de 2 mois
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        startDate,
        endDate,
        status: "active",
        autoRenew: false,
        planId: planId,
      },
    });

    // Générer le token
    // 1. Générer l'Access Token (Court : 15min à 1h)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // 2. Générer le Refresh Token (Long : 7 jours)
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Stocker le Refresh Token en base (Sécurité MED-04)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    res.status(201).json({
      message: "Utilisateur créé avec essai gratuit de 2 mois",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        userType: user.userType,
        companyName: user.companyName,
        metiers: user.metiers,
        avatar: user.avatar,
        address: user.address,
        siret: user.siret,
        city: user.city,
      },
      token: accessToken, // Access Token pour le header Authorization
      refreshToken: refreshToken, // À stocker côté client (localStorage ou Cookie)
    });
  } catch (error) {
    console.error("Pro signup error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de l'inscription professionnelle",
    });
  }
});

// GET /api/auth/subscription/status - Récupérer l'état de l'abonnement (nouveau endpoint)
router.get("/subscription/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription)
      return res.status(404).json({ error: "Aucun abonnement trouvé" });
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/confirm-payment - Confirmation du paiement
router.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "PaymentIntent ID requis",
      });
    }

    // Récupérer le PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Mettre à jour la transaction
      await prisma.transaction.updateMany({
        where: { providerId: paymentIntentId },
        data: { status: "completed" },
      });

      // Mettre à jour le statut de l'utilisateur
      const transaction = await prisma.transaction.findFirst({
        where: { providerId: paymentIntentId },
      });

      if (transaction && transaction.userId) {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { status: "active" },
        });

        // Récupérer l'utilisateur mis à jour
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          include: {
            metiers: {
              include: {
                metier: true,
              },
            },
          },
        });
        
        // Générer le token
        // 1. Générer l'Access Token (Court : 15min à 1h)
        const accessToken = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        // 2. Générer le Refresh Token (Long : 7 jours)
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // 3. Stocker le Refresh Token en base (Sécurité MED-04)
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: expiresAt,
          },
        });

        return res.json({
          success: true,
          message: "Paiement confirmé et compte activé",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            userType: user.userType,
            companyName: user.companyName,
            metiers: user.metiers,
          },
          token: accessToken, // Access Token pour le header Authorization
          refreshToken: refreshToken, // À stocker côté client (localStorage ou Cookie)
        });
      }
    }

    res.status(400).json({
      error: "Paiement non réussi",
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation du paiement",
    });
  }
});

// 🔥 MODIFICATION: Appliquer le rate limiting à la route forgot-password
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    // 🔥 AJOUT: Vérifier s'il y a déjà eu trop de tentatives pour cet email
    const recentRequests = await prisma.passwordResetRequest.findMany({
      where: {
        emailHash: crypto.createHash('sha256').update(email).digest('hex'),
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // dernière heure
        }
      }
    });

    if (recentRequests.length >= 3) {
      return res.status(429).json({
        success: false,
        message: "Trop de tentatives pour cet email. Veuillez réessayer dans 1 heure."
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 🔥 AJOUT: Enregistrer la tentative même si l'email n'existe pas
      await prisma.passwordResetRequest.create({
        data: {
          emailHash: crypto.createHash('sha256').update(email).digest('hex'),
          ip: clientIp
        }
      });

      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return res.json({
        success: true,
        message: "Si votre email est enregistré, vous recevrez un lien de réinitialisation",
        attemptsLeft: 3 - (recentRequests.length + 1)
      });
    }

    // 🔥 AJOUT: Enregistrer la tentative
    await prisma.passwordResetRequest.create({
      data: {
        emailHash: crypto.createHash('sha256').update(email).digest('hex'),
        ip: clientIp
      }
    });

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Stocker le token dans la base de données
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Envoyer l'email de réinitialisation
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: "Si votre email est enregistré, vous recevrez un lien de réinitialisation",
      attemptsLeft: 3 - (recentRequests.length + 1)
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// 🔥 MODIFICATION: Appliquer le rate limiting à la vérification du token
router.get("/verify-reset-token/:token", verifyTokenLimiter, async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        valid: false,
        message: "Token manquant"
      });
    }

    // Vérifier la validité du token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: "Token invalide ou expiré"
      });
    }

    res.json({
      valid: true,
      email: user.email,
      userId: user.id,
      message: "Token valide"
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      valid: false,
      message: "Erreur lors de la vérification du token"
    });
  }
});

// POST /api/auth/reset-password - Réinitialiser le mot de passe
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token et nouveau mot de passe requis",
      });
    }

    // Dans la route
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit faire 8 caractères min. avec majuscule, minuscule et chiffre.",
      });
    }

    // Trouver l'utilisateur avec le token valide
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe et effacer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // 🔥 AJOUT: Supprimer les tentatives enregistrées pour cet email
    const emailHash = crypto
      .createHash("sha256")
      .update(user.email)
      .digest("hex");
    await prisma.passwordResetRequest.deleteMany({
      where: {
        emailHash: emailHash,
      },
    });

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
});

// POST /api/auth/refresh - Rafraîchir le token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body; // Envoyer le refreshToken dans le corps

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token requis" });
    }

    // Chercher le token en base et vérifier s'il est révoqué ou expiré
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token invalide ou expiré" });
    }

    // Générer un nouvel Access Token
    const newAccessToken = jwt.sign(
      { userId: storedToken.user.id, role: storedToken.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/logout - Déconnexion
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Invalider le token en base de données
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() }
      });
    }

    res.json({ success: true, message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
});



module.exports = router;  