// routes/conseil.js - CODE COMPLET CORRIGÉ (sans le champ bio)
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
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        suivis: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    // Récupérer les infos service/metier si besoin
    let serviceInfo = null;
    let metierInfo = null;

    if (demandeConseil.serviceId) {
      serviceInfo = await prisma.service.findUnique({
        where: { id: demandeConseil.serviceId }
      });
    }

    if (demandeConseil.metierId) {
      metierInfo = await prisma.metier.findUnique({
        where: { id: demandeConseil.metierId }
      });
    }

    // Combiner toutes les données
    const responseData = {
      ...demandeConseil,
      service: serviceInfo,
      metier: metierInfo
    };

    // Créer une notification
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
      await prisma.notification.create({
        data: {
          type: "demande_conseil",
          title: "Nouvelle demande de conseil",
          message: `Nouvelle demande: ${conseilType}`,
          relatedEntity: "demandeConseil",
          relatedEntityId: String(demandeConseil.id),
          userProprietaireId: req.user.id,
          read: false
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Votre demande de conseil a été envoyée avec succès",
      data: responseData
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

    // Récupérer les infos service et metier
    const demandesAvecDetails = await Promise.all(
      demandes.map(async (demande) => {
        let serviceInfo = null;
        let metierInfo = null;

        if (demande.serviceId) {
          serviceInfo = await prisma.service.findUnique({
            where: { id: demande.serviceId }
          });
        }

        if (demande.metierId) {
          metierInfo = await prisma.metier.findUnique({
            where: { id: demande.metierId }
          });
        }

        return {
          ...demande,
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    res.json({
      success: true,
      data: demandesAvecDetails
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
          { metiers: { some: {} } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        // SUPPRIMER: bio: true, // Ce champ n'existe pas
        avatar: true,
        userType: true,
        role: true,
        commercialName: true,
        createdAt: true,
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
            demandesCrees: true,
            demandesConseil: true,
            expertDemandesConseil: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fonction pour calculer le rating d'un expert
    const calculateExpertRating = (expert) => {
      let rating = 4.0;
      
      const totalDemandes = (expert._count?.demandesCrees || 0) + 
                           (expert._count?.expertDemandesConseil || 0);
      
      if (totalDemandes > 50) rating += 1.0;
      else if (totalDemandes > 20) rating += 0.7;
      else if (totalDemandes > 10) rating += 0.5;
      else if (totalDemandes > 5) rating += 0.3;
      else if (totalDemandes > 0) rating += 0.1;
      
      if (expert.metiers?.length > 3) rating += 0.4;
      else if (expert.metiers?.length > 1) rating += 0.2;
      
      if (expert.services?.length > 10) rating += 0.3;
      else if (expert.services?.length > 5) rating += 0.2;
      else if (expert.services?.length > 2) rating += 0.1;
      
      if (expert.createdAt) {
        const now = new Date();
        const joinDate = new Date(expert.createdAt);
        const yearsSinceJoin = (now - joinDate) / (1000 * 60 * 60 * 24 * 365);
        
        if (yearsSinceJoin > 5) rating += 0.5;
        else if (yearsSinceJoin > 3) rating += 0.3;
        else if (yearsSinceJoin > 1) rating += 0.2;
      }
      
      if (expert.role === 'expert') rating += 0.3;
      
      rating = Math.max(0, Math.min(rating, 5));
      return rating.toFixed(1);
    };

    // Fonction pour calculer l'expérience
    const calculateExperience = (expert) => {
      if (expert.createdAt) {
        const now = new Date();
        const joinDate = new Date(expert.createdAt);
        const years = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24 * 365));
        
        if (years > 10) return "Plus de 10 ans d'expérience";
        if (years > 5) return "5-10 ans d'expérience";
        if (years > 3) return "3-5 ans d'expérience";
        if (years > 1) return "1-3 ans d'expérience";
        return "Moins d'un an d'expérience";
      }
      return "Expérience variable";
    };

    // Fonction pour calculer la disponibilité
    const calculateDisponibilite = (expert) => {
      const totalDemandes = (expert._count?.expertDemandesConseil || 0);
      if (totalDemandes < 5) return 'disponible';
      if (totalDemandes < 15) return 'limitee';
      return 'complet';
    };

    // Enrichir les données
    const expertsEnriched = experts.map(expert => {
      const title = expert.commercialName || 
                   (expert.role === 'expert' ? 'Expert Conseil' : 
                    expert.userType === 'professional' ? 'Professionnel' : 
                    'Consultant');
      
      const rating = calculateExpertRating(expert);
      const experience = calculateExperience(expert);
      const disponibilite = calculateDisponibilite(expert);
      
      return {
        ...expert,
        title,
        rating: parseFloat(rating),
        experience,
        disponibilite,
        projets: expert._count?.demandesCrees || 0,
        certifications: []
      };
    });

    // Trier par rating
    expertsEnriched.sort((a, b) => b.rating - a.rating);

    res.json({
      success: true,
      data: expertsEnriched
    });

  } catch (error) {
    console.error("❌ Erreur récupération experts:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des experts",
      details: error.message
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
    const types = await prisma.conseilType.findMany({
      where: { isActive: true },
      orderBy: { ordre: "asc" }
    });

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
 * @route GET /api/conseil/demandes/expert
 * @description Récupérer les demandes de conseil pour un expert
 * @access Private (pour experts)
 */
router.get("/demandes/expert", authenticateToken, async (req, res) => {
  try {
    const demandes = await prisma.demandeConseil.findMany({
      where: {
        OR: [
          { expertId: req.user.id },
          { expertId: null, statut: "en_attente" }
        ]
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
        suivis: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const demandesAvecDetails = await Promise.all(
      demandes.map(async (demande) => {
        let serviceInfo = null;
        let metierInfo = null;

        if (demande.serviceId) {
          serviceInfo = await prisma.service.findUnique({
            where: { id: demande.serviceId }
          });
        }

        if (demande.metierId) {
          metierInfo = await prisma.metier.findUnique({
            where: { id: demande.metierId }
          });
        }

        return {
          ...demande,
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    res.json({
      success: true,
      data: demandesAvecDetails
    });

  } catch (error) {
    console.error("❌ Erreur récupération demandes expert:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes"
    });
  }
});

/**
 * @route PUT /api/conseil/demande/:id/statut
 * @description Mettre à jour le statut d'une demande de conseil
 * @access Private (expert ou admin)
 */
router.put("/demande/:id/statut", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut) {
      return res.status(400).json({
        success: false,
        error: "Le statut est requis"
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

    if (demande.expertId !== req.user.id && demande.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à modifier cette demande"
      });
    }

    const demandeMiseAJour = await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { statut },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du statut"
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
 * @route GET /api/conseil/demande/:id/suivis
 * @description Récupérer tous les suivis d'une demande de conseil
 * @access Private
 */
router.get("/demande/:id/suivis", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await prisma.demandeConseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!demande) {
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée"
      });
    }

    if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à voir cette demande"
      });
    }

    const suivis = await prisma.suiviConseil.findMany({
      where: { demandeConseilId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: suivis
    });

  } catch (error) {
    console.error("❌ Erreur récupération suivis:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des suivis"
    });
  }
});

/**
 * @route PUT /api/conseil/demande/:id/assign
 * @description Assigner un expert à une demande de conseil
 * @access Private (admin ou expert)
 */
router.put("/demande/:id/assign", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { expertId } = req.body;

    if (!expertId) {
      return res.status(400).json({
        success: false,
        error: "L'ID de l'expert est requis"
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

    const expert = await prisma.user.findUnique({
      where: { id: expertId }
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert non trouvé"
      });
    }

    const demandeMiseAJour = await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { expertId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    await prisma.notification.create({
      data: {
        type: "demande_assignee",
        title: "Demande de conseil assignée",
        message: `Une nouvelle demande de conseil "${demande.conseilType}" vous a été assignée`,
        relatedEntity: "demandeConseil",
        relatedEntityId: String(demande.id),
        userId: expertId,
        read: false
      }
    });

    res.json({
      success: true,
      message: "Expert assigné avec succès",
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error("❌ Erreur assignation expert:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'assignation de l'expert"
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
        userType: true,
        metiers: {
          include: {
            metier: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
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

/**
 * @route GET /api/conseil/stats
 * @description Récupérer les statistiques des demandes de conseil
 * @access Public
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      totalDemandes: await prisma.demandeConseil.count(),
      demandesEnAttente: await prisma.demandeConseil.count({
        where: { statut: "en_attente" }
      }),
      demandesTraitees: await prisma.demandeConseil.count({
        where: { statut: "en_cours" }
      }),
      demandesTerminees: await prisma.demandeConseil.count({
        where: { statut: "terminee" }
      }),
      totalExperts: await prisma.user.count({
        where: {
          OR: [
            { role: "expert" },
            { userType: "professional" }
          ]
        }
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques"
    });
  }
});

/**
 * @route GET /api/conseil/services
 * @description Récupérer la liste des services
 * @access Public
 */
router.get("/services", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        libelle: true,
        description: true,
        price: true,
        duration: true,
        type: true,
        metiers: {
          include: {
            metier: true
          }
        }
      },
      orderBy: { libelle: "asc" }
    });

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    console.error("❌ Erreur récupération services:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des services"
    });
  }
});

/**
 * @route GET /api/conseil/metiers
 * @description Récupérer la liste des métiers
 * @access Public
 */
router.get("/metiers", async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      select: {
        id: true,
        libelle: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: { libelle: "asc" }
    });

    res.json({
      success: true,
      data: metiers
    });

  } catch (error) {
    console.error("❌ Erreur récupération métiers:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des métiers"
    });
  }
});

/**
 * @route GET /api/conseil/admin/demandes
 * @description Récupérer toutes les demandes de conseil (admin)
 * @access Private (admin seulement)
 */
router.get("/admin/demandes", authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs"
      });
    }

    const demandes = await prisma.demandeConseil.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        },
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        suivis: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Récupérer les infos service et metier
    const demandesAvecDetails = await Promise.all(
      demandes.map(async (demande) => {
        let serviceInfo = null;
        let metierInfo = null;

        if (demande.serviceId) {
          serviceInfo = await prisma.service.findUnique({
            where: { id: demande.serviceId }
          });
        }

        if (demande.metierId) {
          metierInfo = await prisma.metier.findUnique({
            where: { id: demande.metierId }
          });
        }

        return {
          ...demande,
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    res.json({
      success: true,
      data: demandesAvecDetails
    });

  } catch (error) {
    console.error("❌ Erreur récupération demandes admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes"
    });
  }
});

/**
 * @route PUT /api/conseil/admin/demande/:id/assign
 * @description Assigner un expert à une demande (admin)
 * @access Private (admin seulement)
 */
router.put("/admin/demande/:id/assign", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { expertId } = req.body;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs"
      });
    }

    if (!expertId) {
      return res.status(400).json({
        success: false,
        error: "L'ID de l'expert est requis"
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

    const expert = await prisma.user.findUnique({
      where: { id: expertId }
    });

    if (!expert) {
      return res.status(404).json({
        success: false,
        error: "Expert non trouvé"
      });
    }

    const demandeMiseAJour = await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { expertId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    // Créer une notification
    await prisma.notification.create({
      data: {
        type: "demande_assignee",
        title: "Demande de conseil assignée",
        message: `Une nouvelle demande de conseil "${demande.conseilType}" vous a été assignée`,
        relatedEntity: "demandeConseil",
        relatedEntityId: String(demande.id),
        userId: expertId,
        read: false
      }
    });

    // Ajouter un suivi automatique
    await prisma.suiviConseil.create({
      data: {
        demandeConseilId: parseInt(id),
        userId: req.user.id,
        message: `Demande assignée à l'expert ${expert.firstName} ${expert.lastName}`,
        type: "message"
      }
    });

    res.json({
      success: true,
      message: "Expert assigné avec succès",
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error("❌ Erreur assignation expert:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'assignation de l'expert"
    });
  }
});

/**
 * @route POST /api/conseil/admin/demande/:id/response
 * @description Envoyer une réponse admin à une demande
 * @access Private (admin seulement)
 */
router.post("/admin/demande/:id/response", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs"
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Le message de réponse est requis"
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

    const suivi = await prisma.suiviConseil.create({
      data: {
        demandeConseilId: parseInt(id),
        userId: req.user.id,
        message,
        type: "message"
      }
    });

    res.json({
      success: true,
      message: "Réponse envoyée avec succès",
      data: suivi
    });

  } catch (error) {
    console.error("❌ Erreur envoi réponse admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la réponse"
    });
  }
});

/**
 * @route PUT /api/conseil/admin/demande/:id/status
 * @description Mettre à jour le statut d'une demande (admin)
 * @access Private (admin seulement)
 */
router.put("/admin/demande/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs"
      });
    }

    if (!statut) {
      return res.status(400).json({
        success: false,
        error: "Le statut est requis"
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

    const demandeMiseAJour = await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { statut }
    });

    // Ajouter un suivi
    await prisma.suiviConseil.create({
      data: {
        demandeConseilId: parseInt(id),
        userId: req.user.id,
        message: `Statut changé à: ${statut}`,
        type: "message"
      }
    });

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du statut"
    });
  }
});

/**
 * @route GET /api/conseil/admin/stats/detailed
 * @description Récupérer des statistiques détaillées (admin)
 * @access Private (admin seulement)
 */
router.get("/admin/stats/detailed", authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux administrateurs"
      });
    }

    const stats = {
      totalDemandes: await prisma.demandeConseil.count(),
      demandesEnAttente: await prisma.demandeConseil.count({ where: { statut: "en_attente" } }),
      demandesEnCours: await prisma.demandeConseil.count({ where: { statut: "en_cours" } }),
      demandesTerminees: await prisma.demandeConseil.count({ where: { statut: "terminee" } }),
      demandesAnnulees: await prisma.demandeConseil.count({ where: { statut: "annulee" } }),
      demandesNonAssignees: await prisma.demandeConseil.count({ where: { expertId: null } }),
      totalExperts: await prisma.user.count({
        where: {
          OR: [
            { role: "expert" },
            { userType: "professional" }
          ]
        }
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats détaillées:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques"
    });
  }
});
/**
 * @route GET /api/conseil/demande/:id
 * @description Récupérer une demande de conseil spécifique
 * @access Private
 */
router.get("/demande/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await prisma.demandeConseil.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        },
        expert: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            avatar: true
          }
        },
        suivis: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!demande) {
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée"
      });
    }

    if (demande.userId !== req.user.id && demande.expertId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à voir cette demande"
      });
    }

    // Récupérer les infos service et metier
    let serviceInfo = null;
    let metierInfo = null;

    if (demande.serviceId) {
      serviceInfo = await prisma.service.findUnique({
        where: { id: demande.serviceId }
      });
    }

    if (demande.metierId) {
      metierInfo = await prisma.metier.findUnique({
        where: { id: demande.metierId }
      });
    }

    const demandeComplete = {
      ...demande,
      service: serviceInfo,
      metier: metierInfo
    };

    res.json({
      success: true,
      data: demandeComplete
    });

  } catch (error) {
    console.error("❌ Erreur récupération demande:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la demande"
    });
  }
});
/**
 * @route GET /api/conseil/demandes/statistics/user
 * @description Récupérer les statistiques des demandes pour l'utilisateur
 * @access Private
 */
router.get("/demandes/statistics/user", authenticateToken, async (req, res) => {
  try {
    const stats = {
      total: await prisma.demandeConseil.count({
        where: { userId: req.user.id }
      }),
      en_attente: await prisma.demandeConseil.count({
        where: { userId: req.user.id, statut: "en_attente" }
      }),
      en_cours: await prisma.demandeConseil.count({
        where: { userId: req.user.id, statut: "en_cours" }
      }),
      terminee: await prisma.demandeConseil.count({
        where: { userId: req.user.id, statut: "terminee" }
      }),
      annulee: await prisma.demandeConseil.count({
        where: { userId: req.user.id, statut: "annulee" }
      })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats utilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques"
    });
  }
});

module.exports = router;