// routes/conseil.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

/**
 * @route POST /api/conseil/demande
 * @description Créer une demande de conseil
 * @access Private
 */
router.post("/demande", authenticateToken, async (req, res) => {
  try {
    const {
      conseilType,
      besoin,
      budget,
      message,
      serviceId,
      metierId,
      expertId
    } = req.body;

    // Validation de base
    if (!conseilType || !besoin) {
      return res.status(400).json({
        success: false,
        error: "Le type de conseil et la description du besoin sont requis"
      });
    }

    // Récupérer l'utilisateur connecté avec ses informations
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        address: true,
        city: true,
        zipCode: true,
        websiteUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé"
      });
    }

    // Créer la demande de conseil
    const demandeConseil = await prisma.demandeConseil.create({
      data: {
        userId: user.id,
        conseilType,
        besoin,
        budget: budget || "surdevis",
        message: message || "",
        nom: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Client",
        email: user.email,
        telephone: user.phone || "",
        entreprise: user.companyName || "",
        serviceId: serviceId ? parseInt(serviceId) : null,
        metierId: metierId ? parseInt(metierId) : null,
        expertId: expertId || null,
        statut: "en_attente",
        origine: "page_conseil"
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: true,
        metier: true,
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Créer une notification pour l'administrateur/expert
    if (expertId) {
      await prisma.notification.create({
        data: {
          type: "demande_conseil",
          title: "Nouvelle demande de conseil",
          message: `${user.firstName} ${user.lastName} a demandé un conseil "${conseilType}"`,
          relatedEntity: "demandeConseil",
          relatedEntityId: String(demandeConseil.id),
          userId: expertId,
          read: false
        }
      });
    } else {
      // Notification générale pour les administrateurs
      await prisma.notification.create({
        data: {
          type: "demande_conseil",
          title: "Nouvelle demande de conseil",
          message: `Nouvelle demande: ${conseilType}`,
          relatedEntity: "demandeConseil",
          relatedEntityId: String(demandeConseil.id),
          userProprietaireId: req.user.id, // Propriétaire de la notification
          read: false
        }
      });
    }

    // Envoyer un email de confirmation
    // À implémenter avec votre service d'email

    res.status(201).json({
      success: true,
      message: "Votre demande de conseil a été envoyée avec succès",
      data: demandeConseil
    });

  } catch (error) {
    console.error("❌ Erreur création demande conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la demande",
      details: error.message
    });
  }
});

/**
 * @route GET /api/conseil/mes-demandes
 * @description Récupérer les demandes de conseil de l'utilisateur
 * @access Private
 */
router.get("/mes-demandes", authenticateToken, async (req, res) => {
  try {
    const demandes = await prisma.demandeConseil.findMany({
      where: { userId: req.user.id },
      include: {
        service: true,
        metier: true,
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        suivis: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: demandes
    });

  } catch (error) {
    console.error("❌ Erreur récupération demandes conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes"
    });
  }
});

/**
 * @route GET /api/conseil/experts
 * @description Récupérer la liste des experts conseil
 * @access Public
 */
router.get("/experts", async (req, res) => {
  try {
    const experts = await prisma.user.findMany({
      where: {
        OR: [
          { role: "expert" },
          { userType: "professional" },
          { metiers: { some: {} } } // Avoir au moins un métier
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        title: true,
        bio: true,
        avatar: true,
        rating: true,
        experience: true,
        metiers: {
          include: {
            metier: true
          }
        },
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            demandesCrees: true
          }
        }
      },
      orderBy: { rating: "desc" }
    });

    res.json({
      success: true,
      data: experts
    });

  } catch (error) {
    console.error("❌ Erreur récupération experts:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des experts"
    });
  }
});

/**
 * @route GET /api/conseil/types
 * @description Récupérer les types de conseil disponibles
 * @access Public
 */
router.get("/types", async (req, res) => {
  try {
    // Récupérer les types depuis la base de données
    const types = await prisma.conseilType.findMany({
      where: { isActive: true },
      orderBy: { ordre: "asc" }
    });

    // Types par défaut si pas en base
    const defaultTypes = [
      {
        id: 1,
        title: "Audit Stratégique",
        description: "Analyse approfondie de votre situation et recommandations stratégiques",
        category: "audit",
        duration: "2-4 semaines",
        price: "À partir de 2 500€",
        icon: "BarChart",
        color: "#6B8E23"
      },
      {
        id: 2,
        title: "Médiation & Résolution",
        description: "Résolution amiable des conflits internes et externes",
        category: "mediation",
        duration: "1-3 semaines",
        price: "À partir de 1 800€",
        icon: "Handshake",
        color: "#27AE60"
      },
      {
        id: 3,
        title: "Conseil en Stratégie",
        description: "Développement et optimisation de votre stratégie d'entreprise",
        category: "strategie",
        duration: "3-6 semaines",
        price: "À partir de 3 500€",
        icon: "Target",
        color: "#8B4513"
      }
    ];

    res.json({
      success: true,
      data: types.length > 0 ? types : defaultTypes
    });

  } catch (error) {
    console.error("❌ Erreur récupération types conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des types de conseil"
    });
  }
});

/**
 * @route POST /api/conseil/demande/:id/suivi
 * @description Ajouter un suivi à une demande de conseil
 * @access Private
 */
router.post("/demande/:id/suivi", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type, rendezVous } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Un message est requis pour le suivi"
      });
    }

    const demande = await prisma.demandeConseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!demande) {
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée"
      });
    }

    // Vérifier que l'utilisateur est autorisé
    if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à modifier cette demande"
      });
    }

    const suivi = await prisma.suiviConseil.create({
      data: {
        demandeConseilId: parseInt(id),
        userId: req.user.id,
        message,
        type: type || "message",
        rendezVous: rendezVous ? new Date(rendezVous) : null
      }
    });

    res.json({
      success: true,
      message: "Suivi ajouté avec succès",
      data: suivi
    });

  } catch (error) {
    console.error("❌ Erreur ajout suivi:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout du suivi"
    });
  }
});

/**
 * @route GET /api/conseil/user-info
 * @description Récupérer les informations de l'utilisateur connecté
 * @access Private
 */
router.get("/user-info", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        address: true,
        city: true,
        zipCode: true,
        commercialName: true,
        websiteUrl: true,
        avatar: true,
        role: true,
        userType: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("❌ Erreur récupération info utilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des informations"
    });
  }
});

module.exports = router;