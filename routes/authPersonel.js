const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/db");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

// Rate limiter pour le login du personnel
const personelLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  validate: { default: false },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip || "unknown";
  },
  handler: async (req, res) => {
    console.warn(`⚠️ Taux de connexion personnel dépassé pour email: ${req.body?.email}`);
    return res.status(429).json({
      success: false,
      error: "Trop de tentatives de connexion. Réessayez dans 15 minutes."
    });
  }
});

// POST /api/auth/personel/login - Connexion du personnel
router.post("/personel/login", personelLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email et mot de passe requis",
      });
    }

    // Trouver le personnel par email
    const personel = await prisma.personel.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            companyName: true,
            status: true,
            userType: true,
            avatar: true,
            address: true,
            siret: true,
            city: true,
            commercialName: true,
          }
        }
      }
    });

    if (!personel || !personel.password) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, personel.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier si l'utilisateur associé existe toujours
    if (!personel.user) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur associé non trouvé",
      });
    }

    // Vérifier le statut de l'utilisateur
    if (personel.user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Compte utilisateur inactif",
      });
    }

    // Vérifier l'expiration de l'abonnement pour les professionnels
    let subscriptionStatus = null;
    if (personel.user.role === "professional") {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: personel.user.id },
      });

      if (subscription && subscription.endDate < new Date() && subscription.status === "active") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" },
        });
        subscriptionStatus = "expired";
      } else if (subscription) {
        subscriptionStatus = subscription.status;
      }
    }

    // Préparer la réponse utilisateur (fusion des données personnel + user)
    const userResponse = {
      id: personel.user.id,
      email: personel.user.email,
      firstName: personel.user.firstName,
      lastName: personel.user.lastName,
      phone: personel.user.phone,
      role: personel.user.role,
      companyName: personel.user.companyName,
      status: personel.user.status,
      userType: personel.user.userType,
      avatar: personel.user.avatar,
      address: personel.user.address,
      siret: personel.user.siret,
      city: personel.user.city,
      commercialName: personel.user.commercialName,
      subscriptionStatus: subscriptionStatus,
    };

    // Données du personnel
    const personelResponse = {
      id: personel.id,
      name: personel.name,
      email: personel.email,
      role: personel.rolePersonel,
      description: personel.description,
    };

    // 1. Générer l'Access Token (avec indication que c'est un personnel)
    const accessToken = jwt.sign(
      { 
        userId: personel.user.id, 
        personelId: personel.id,
        role: personel.user.role,
        personelRole: personel.rolePersonel,
        type: 'personel' // Important pour distinguer
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 2. Générer le Refresh Token
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Stocker le Refresh Token en base
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: personel.user.id,
        expiresAt: expiresAt,
      },
    });

    // Déterminer la redirection basée sur le rôle de l'utilisateur
    let redirectPath = "/";
    if (personel.user.role === "professional") {
      redirectPath = "/pro";
    } else if (personel.user.role === "user") {
      redirectPath = "/mon-compte";
    } else if (personel.user.role === "admin") {
      redirectPath = "/admin";
    }

    res.json({
      success: true,
      user: userResponse,
      personel: personelResponse,
      token: accessToken,
      refreshToken: refreshToken,
      redirectPath: redirectPath,
      isPersonel: true,
      ...(subscriptionStatus === "expired" && {
        message: "L'abonnement de l'utilisateur associé a expiré",
      }),
    });

  } catch (error) {
    console.error("❌ Personel login error:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la connexion",
    });
  }
});

module.exports = router;