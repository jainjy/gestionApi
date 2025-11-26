const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/db");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../lib/email");
const stripe = require("../utils/stripe");
const { authenticateToken } = require("../middleware/auth");

// POST /api/auth/login - Connexion
router.post("/login", async (req, res) => {
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

    // Générer le token
    const token = `real-jwt-token-${user.id}`;

    // Préparer la réponse utilisateur
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      companyName: user.companyName,
      status: user.status,
      userType: user.userType,
      avatar: user.avatar,
      address: user.address,
      siret: user.siret,
      city: user.city,
      status: user.status,
    };

    res.json({
      user: userResponse,
      token,
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
      avatar
    } = req.body;

    // Validation des données
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        error: "Tous les champs obligatoires doivent être remplis",
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

    // Déterminer le userType selon le rôle
    const finalUserType = role == "professional" ? userType : "CLIENT";

    // Créer l'utilisateur avec TOUS les champs
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role === "professional" ? "professional" : "user",
        userType: finalUserType, // AJOUT: Sauvegarder userType
        status: "inactive",
        companyName: role === "professional" ? companyName : null,
        demandType: role === "user" ? demandType : null,
        address: address || null,
        addressComplement: addressComplement || null,
        zipCode: zipCode || null,
        city: city || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        siret: siret || null,
        commercialName: commercialName || null,
        avatar: avatar || null,
        ...(role === "professional" &&
          metiers && {
            metiers: {
              create: metiers.map((metierId) => ({
                metier: {
                  connect: { id: metierId },
                },
              })),
            },
          }),
      },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
      },
    });

    // Générer le token
    const token = `real-jwt-token-${user.id}`;

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
        metiers: user.metiers,
      },
      token,
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
    const { utilisateur,planId } = req.body;
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
        latitude: utilisateur.latitude ? parseFloat(utilisateur.latitude) : null,
        longitude: utilisateur.longitude ? parseFloat(utilisateur.longitude) : null,
        siret: utilisateur.siret || null,
        commercialName: utilisateur.commercialName || null,
        metiers: utilisateur.metiers && utilisateur.metiers.length > 0 && {
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
    const token = `real-jwt-token-${user.id}`;
    res.json({
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
      token,
      message: "Utilisateur créé avec essai gratuit de 2 mois",
    });
  } catch (error) {
    console.error("Pro signup error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de l'inscription professionnelle",
    });
  }
});

// GET /api/auth/subscription/status - Récupérer l'état de l'abonnement (nouveau endpoint)
router.get("/subscription/status",authenticateToken, async (req, res) => {
  try {

    const userId = req.user.id;
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription) return res.status(404).json({ error: "Aucun abonnement trouvé" });
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

        // Générer le token
        const token = `real-jwt-token-${transaction.userId}`;

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
          token,
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

// GET /api/auth/verify-reset-token - Vérifier le token de réinitialisation
router.get("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        valid: false,
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
        email: true,
      },
    });

    if (!user) {
      return res.json({
        valid: false,
      });
    }

    res.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      valid: false,
    });
  }
});

// POST /api/auth/reset-password - Réinitialiser le mot de passe
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token et nouveau mot de passe requis",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères",
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

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
    });
  }
});

// POST /api/auth/forgot-password - Mot de passe oublié
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email requis",
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return res.json({
        success: true,
        message:
          "Si votre email est enregistré, vous recevrez un lien de réinitialisation",
      });
    }

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
      message:
        "Si votre email est enregistré, vous recevrez un lien de réinitialisation",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Erreur interne du serveur",
    });
  }
});

// POST /api/auth/refresh - Rafraîchir le token
router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.replace("Bearer ", "");
    const userId = token.replace("real-jwt-token-", "");

    // Vérifier si l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    // Générer un nouveau token
    const newToken = `real-jwt-token-${user.id}`;

    res.json({ token: newToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/logout - Déconnexion
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Déconnexion réussie" });
});

module.exports = router;