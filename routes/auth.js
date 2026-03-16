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
const oliplusEmailService = require("../services/oliplusEmailService");

// Fonction de validation
function isPasswordStrong(password) {
    // Min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    return regex.test(password);
}

// Création du limiteur pour passwordReset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  // 🔥 CORRECTION : Désactive la validation automatique pour éviter l'erreur
  validate: { default: false },
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    const ip = req.ip || req.socket.remoteAddress;
    return `${ip}-${email}`; // Clé unique par couple IP + Email
  },
  message: {
    success: false,
    error: "Trop de tentatives. Veuillez réessayer dans 1 heure.",
  },
});

// Création du limiteur pour le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  validate: { default: false },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser l'email comme clé pour le rate limiting
    return req.body?.email || req.ip || "unknown";
  },
  // 🔥 AJOUT: Handler personnalisé quand la limite est dépassée
  handler: async (req, res, next, options) => {
    const email = req.body?.email;
    const ip = req.ip || req.socket.remoteAddress;
    
    console.warn(`⚠️ Taux de connexion dépassé pour email: ${email}, IP: ${ip}`);
    
    try {
      // 1. Chercher l'utilisateur par email
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, firstName: true, lastName: true }
        });
        
        if (user) {
          // 2. Envoyer l'email d'alerte de sécurité
          try {
            await oliplusEmailService.sendOliplusEmail({
              to: user.email,
              template: 'security-alert',
              data: {
                userName: `${user.firstName} ${user.lastName}`,
                date: new Date().toLocaleString('fr-FR'),
                location: `IP: ${ip}`,
                action: 'Tentatives de connexion excessives détectées'
              }
            });
            console.log(`✅ Email d'alerte sécurité envoyé à ${user.email}`);
            
            // 3. Optionnel: Log l'incident en base de données
            await prisma.securityLog.create({
              data: {
                userId: user.id,
                type: 'RATE_LIMIT_EXCEEDED',
                description: `Trop de tentatives de connexion (5+ en 15 min) depuis IP: ${ip}`,
                ipAddress: ip,
                metadata: {
                  email: email,
                  attempts: '5+',
                  window: '15 minutes'
                }
              }
            });
          } catch (emailError) {
            console.error('❌ Erreur lors de l\'envoi de l\'email d\'alerte:', emailError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement du rate limit:', error);
    }
    
    // 4. Retourner la réponse d'erreur
    return res.status(429).json({
      success: false,
      error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
      securityAlert: "Une alerte de sécurité a été envoyée à votre adresse email."
    });
  },
  // Message par défaut (utilisé si handler n'est pas défini)
  message: {
    error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  }
});

// 🔧 CORRECTION: Configuration rate-limit corrigée pour verifyToken
const verifyTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // 🔥 AJOUT : Validation désactivée
  validate: { default: false },
  keyGenerator: (req) => {
    const token = req.params?.token || "unknown";
    const ip = req.ip || req.socket.remoteAddress;
    return `${ip}-${token}`;
  },
  message: {
    success: false,
    error: "Trop de tentatives de vérification.",
  },
});

// POST /api/auth/login - Connexion
// routes/auth.js - VERSION UNIFIÉE
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password, loginType } = req.body; // loginType optionnel

    console.log("🔍 Tentative de connexion pour:", email);

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis",
      });
    }

    let user = null;
    let personel = null;
    let authType = 'user';

    // 1. Chercher d'abord dans la table Personel
    const personelRecord = await prisma.personel.findUnique({
      where: { email },
      include: {
        user: true // Inclure l'utilisateur associé
      }
    });

    if (personelRecord) {
      console.log("🔍 Compte personnel trouvé");
      
      // Vérifier le mot de passe du personnel
      const isPasswordValid = await bcrypt.compare(password, personelRecord.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Identifiants invalides",
        });
      }

      // Vérifier si l'utilisateur associé existe
      if (!personelRecord.user) {
        return res.status(401).json({
          error: "Utilisateur associé non trouvé",
        });
      }

      // Vérifier le statut de l'utilisateur associé
      if (personelRecord.user.status !== "active") {
        return res.status(403).json({
          error: "Compte utilisateur inactif",
        });
      }

      user = personelRecord.user;
      personel = {
        id: personelRecord.id,
        name: personelRecord.name,
        email: personelRecord.email,
        role: personelRecord.rolePersonel,
        description: personelRecord.description
      };
      authType = 'personel';
    } else {
      // 2. Si pas trouvé dans Personel, chercher dans User
      console.log("🔍 Recherche dans utilisateurs normaux");
      
      user = await prisma.user.findUnique({
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

      // Vérifier le statut
      if (user.status !== "active") {
        return res.status(403).json({
          error: "Compte inactif",
        });
      }
    }

    // Vérifier l'expiration de l'abonnement pour les professionnels
    let subscriptionStatus = null;
    if (user.role === "professional") {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
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
      commercialName: user.commercialName,
      subscriptionStatus: subscriptionStatus,
    };

    // 1. Générer l'Access Token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        ...(authType === 'personel' && {
          personelId: personel.id,
          personelRole: personel.role,
          type: 'personel'
        })
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
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    // Déterminer la redirection
    let redirectPath = "/";
    if (user.role === "professional") {
      redirectPath = "/pro";
    } else if (user.role === "user") {
      redirectPath = "/mon-compte";
    } else if (user.role === "admin") {
      redirectPath = "/admin";
    }

    const response = {
      user: userResponse,
      token: accessToken,
      refreshToken: refreshToken,
      redirectPath: redirectPath,
      authType: authType,
      ...(subscriptionStatus === "expired" && {
        message: "Votre abonnement a expiré",
      }),
    };

    // Ajouter les données personnel si c'est le cas
    if (authType === 'personel') {
      response.personel = personel;
      response.isPersonel = true;
      response.actingAs = `Vous gérez le compte de ${user.companyName || user.firstName + ' ' + user.lastName}`;
    }

    res.json(response);

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

    // 1. Générer l'Access Token (Court : 24hin à 1h)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
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
    const { utilisateur, planId, visibilityOption } = req.body;
    
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

    if (!isPasswordStrong(utilisateur.password)) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit faire 8 caractères min. avec majuscule, minuscule et chiffre.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: utilisateur.email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Un utilisateur avec cet email existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(utilisateur.password, 12);

    // 🔥 CORRECTION : Créer l'utilisateur avec les métiers ET descriptionMetierUser
    const user = await prisma.user.create({
      data: {
        email: utilisateur.email,
        passwordHash: hashedPassword,
        firstName: utilisateur.firstName,
        lastName: utilisateur.lastName,
        phone: utilisateur.phone,
        role: "professional",
        userType: utilisateur.userType,
        status: "active",
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
        // 🔥 CRÉATION DES MÉTIERS AVEC DESCRIPTION PERSONNALISÉE
        metiers:
          utilisateur.metiers && utilisateur.metiers.length > 0
            ? {
                create: utilisateur.metiers.map((metierId) => ({
                  metier: {
                    connect: { id: metierId },
                  },
                  // 🔥 AJOUT : Stocker la description personnalisée du métier
                  descriptionMetierUser: utilisateur.descriptionMetierUser || null,
                })),
              }
            : undefined,
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
        visibilityOption: visibilityOption || "standard",
      },
    });

    // Générer le token
    // 1. Générer l'Access Token (Court : 24hin à 1h)
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
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
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Pro signup error:", error);
    res.status(500).json({
      error: "Erreur serveur lors de l'inscription professionnelle",
    });
  }
});

// routes/auth.js - Mettez à jour la route /subscription/status
router.get("/subscription/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { 
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            enhancedVisibilityPrice: true,
            interval: true,
            features: true,
            planType: true,
            professionalCategory: true,
            userTypes: true,
            popular: true,
            color: true,
            icon: true,
            isVisibilityEnhanced: true,
          }
        } 
      },
    });
    
    if (!subscription) {
      // Retourner un abonnement par défaut si aucun n'existe
      return res.json({
        status: "inactive",
        plan: null,
        startDate: null,
        endDate: null,
        autoRenew: false,
        visibilityOption: "standard",
      });
    }
    
    // Calculer les jours restants
    let daysRemaining = 0;
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Mettre à jour le statut si l'abonnement a expiré
      if (daysRemaining <= 0 && subscription.status !== "expired") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "expired" }
        });
        subscription.status = "expired";
      }
    }
    
    res.json({
      ...subscription,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    });
  } catch (error) {
    console.error("Erreur récupération abonnement:", error);
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

        // 🔥 AJOUT: Envoyer l'email de confirmation de paiement
        try {
          // Récupérer les détails du plan depuis les métadonnées
          const planName = paymentIntent.metadata.planName || "Service Oliplus";
          const planPrice = paymentIntent.metadata.planPrice || transaction.amount || 0;
          
          await oliplusEmailService.sendOliplusEmail({
            to: user.email,
            template: 'payment-confirmation',
            data: {
              userName: `${user.firstName} ${user.lastName}`,
              serviceName: planName,
              amount: planPrice,
              date: new Date().toLocaleDateString('fr-FR'),
              transactionId: paymentIntentId.substring(0, 12)
            }
          });
          console.log(`✅ Email de confirmation de paiement envoyé à ${user.email}`);
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
          // Continuer même si l'email échoue
        }
        
        // Générer le token
        // 1. Générer l'Access Token (Court : 24hin à 1h)
        const accessToken = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
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
          emailSent: true
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
      { expiresIn: "24h" }
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