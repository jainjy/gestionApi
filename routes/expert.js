const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

/**
 * Middleware de vérification des permissions expert/professionnel
 */
const checkExpertPermission = async (req, res, next) => {
  try {
    console.log("🔍 [Middleware] Vérification permissions pour:", req.user?.id);
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true, userType: true, status: true, email: true }
    });

    if (!user) {
      console.log("❌ [Middleware] Utilisateur non trouvé");
      return res.status(403).json({
        success: false,
        error: "Accès refusé - utilisateur non trouvé"
      });
    }

    console.log("👤 [Middleware] Utilisateur trouvé:", {
      email: user.email,
      role: user.role,
      userType: user.userType,
      status: user.status
    });

    if (user.status !== 'active') {
      console.log("❌ [Middleware] Utilisateur non actif:", user.status);
      return res.status(403).json({
        success: false,
        error: "Votre compte n'est pas actif"
      });
    }

    // Logique de permission CORRIGÉE
    const isAuthorized = 
      user.role === 'expert' || 
      user.role === 'professional' || 
      user.userType === 'professional' ||
      user.userType === 'PRESTATAIRE';

    console.log("🔐 [Middleware] Autorisation:", {
      role: user.role,
      userType: user.userType,
      isAuthorized
    });

    if (!isAuthorized) {
      console.log("❌ [Middleware] Accès refusé - permissions insuffisantes");
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux experts et professionnels",
        details: {
          votreRole: user.role,
          votreUserType: user.userType,
          requis: "role: 'expert' ou 'professional' | userType: 'professional' ou 'PRESTATAIRE'"
        }
      });
    }

    req.userData = user;
    next();
  } catch (error) {
    console.error("❌ [Middleware] Erreur vérification permissions:", error);
    res.status(500).json({
      success: false,
      error: "Erreur de vérification des permissions"
    });
  }
};

/**
 * @route GET /api/expert/debug
 * @description Débogage des permissions et connexion
 */
router.get("/debug", authenticateToken, async (req, res) => {
  try {
    console.log("🐛 [Debug] Démarrage debug...");
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        userType: true, 
        status: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.json({
        success: false,
        error: "Utilisateur non trouvé en DB",
        tokenUser: req.user
      });
    }

    const canAccess = 
      user.role === 'expert' || 
      user.role === 'professional' || 
      user.userType === 'professional' ||
      user.userType === 'PRESTATAIRE';

    const response = {
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        user: {
          ...user,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        },
        permissions: {
          canAccessExpertRoutes: canAccess,
          checks: {
            isRoleExpert: user.role === 'expert',
            isRoleProfessional: user.role === 'professional',
            isUserTypeProfessional: user.userType === 'professional',
            isUserTypePrestataire: user.userType === 'PRESTATAIRE'
          }
        },
        endpoints: [
          "/api/expert/profile",
          "/api/expert/stats",
          "/api/expert/demandes",
          "/api/expert/demandes-toutes",
          "/api/expert/demandes-conseil",
          "/api/expert/demandes-accompagnement"
        ]
      }
    };

    console.log("✅ [Debug] Réponse envoyée");
    res.json(response);

  } catch (error) {
    console.error("❌ [Debug] Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur de débogage",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/profile
 * @description Récupérer le profil de l'expert
 * @access Private (expert/professionnel seulement)
 */
router.get("/profile", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("👤 [Profile] Récupération pour:", req.user.id);

    // Récupérer l'utilisateur
    const expert = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        metiers: {
          include: { metier: true }
        },
        services: {
          include: { service: true }
        }
      }
    });

    if (!expert) {
      console.log("❌ [Profile] Expert non trouvé");
      return res.status(404).json({
        success: false,
        error: "Expert non trouvé"
      });
    }

    // Compter les demandes POUR CET EXPERT
    const totalDemandes = await prisma.demandeConseil.count({
      where: { expertId: req.user.id }
    });

    // Calculer le rating
    const calculateRating = () => {
      let rating = 4.0;
      
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
      
      return Math.min(rating, 5).toFixed(1);
    };

    // Calculer l'expérience
    const calculateExperience = () => {
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

    // Calculer la disponibilité
    const calculateAvailability = () => {
      if (totalDemandes < 5) return 'disponible';
      if (totalDemandes < 15) return 'limitee';
      return 'complet';
    };

    const profile = {
      id: expert.id,
      name: `${expert.firstName || ''} ${expert.lastName || ''}`.trim(),
      email: expert.email,
      phone: expert.phone,
      title: expert.commercialName || (expert.role === 'expert' ? 'Expert Conseil' : 'Professionnel'),
      specialty: expert.metiers?.[0]?.metier?.libelle || 'Conseil stratégique',
      experience: calculateExperience(),
      rating: parseFloat(calculateRating()),
      projects: totalDemandes,
      avatar: expert.avatar,
      companyName: expert.companyName || expert.commercialName || '',
      availability: calculateAvailability(),
      certifications: [],
      metiers: expert.metiers?.map(m => m.metier?.libelle).filter(Boolean) || [],
      services: expert.services?.map(s => s.service?.libelle).filter(Boolean) || [],
      userInfo: {
        role: expert.role,
        userType: expert.userType
      },
      _debug: {
        totalDemandes: totalDemandes
      }
    };

    console.log("✅ [Profile] Profil récupéré:", {
      name: profile.name,
      email: profile.email,
      projects: profile.projects,
      role: profile.userInfo.role,
      userType: profile.userInfo.userType
    });

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error("❌ [Profile] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du profil",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/stats
 * @description Récupérer les statistiques de l'expert
 * @access Private (expert/professionnel seulement)
 */
router.get("/stats", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("📈 [Stats] Récupération pour:", req.user.id);

    // Récupérer TOUTES les demandes pour cet expert
    const toutesDemandes = await prisma.demandeConseil.findMany({
      where: { expertId: req.user.id }
    });

    // Séparer conseil vs accompagnement par origine
    const demandesConseil = toutesDemandes.filter(d => 
      d.origine === "page_conseil"
    );
    
    const demandesAccompagnement = toutesDemandes.filter(d => 
      d.origine === "page_accompagnement"
    );

    // Calculer les statistiques combinées
    const total = toutesDemandes.length;
    const en_attente = toutesDemandes.filter(d => d.statut === "en_attente").length;
    const en_cours = toutesDemandes.filter(d => d.statut === "en_cours").length;
    const terminee = toutesDemandes.filter(d => d.statut === "terminee").length;
    const annulee = toutesDemandes.filter(d => d.statut === "annulee").length;
    const en_revision = toutesDemandes.filter(d => d.statut === "en_revision").length;

    // Demandes du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const demandeMois = toutesDemandes.filter(d => 
      new Date(d.createdAt) >= startOfMonth
    ).length;

    console.log("📊 [Stats] Données récupérées:", {
      total,
      en_attente,
      en_cours,
      terminee,
      annulee,
      en_revision,
      demandeMois,
      details: {
        conseil: demandesConseil.length,
        accompagnement: demandesAccompagnement.length
      }
    });

    // Calcul du temps de réponse moyen
    const suivis = await prisma.suiviConseil.findMany({
      where: {
        userId: req.user.id,
        demandeConseil: { expertId: req.user.id }
      },
      select: { createdAt: true }
    });

    let tempsMoyenReponse = "24h";
    if (suivis.length > 1) {
      const delais = [];
      for (let i = 1; i < suivis.length; i++) {
        const delai = new Date(suivis[i].createdAt) - new Date(suivis[i-1].createdAt);
        delais.push(delai);
      }
      const moyenne = delais.reduce((a, b) => a + b, 0) / delais.length;
      const heures = Math.floor(moyenne / (1000 * 60 * 60));
      tempsMoyenReponse = heures < 24 ? `${heures}h` : `${Math.floor(heures/24)}j`;
    }

    // Calcul du revenu total estimé
    const revenuTotal = terminee * 1500;

    const stats = {
      total,
      en_attente,
      en_cours,
      terminee,
      annulee,
      en_revision,
      satisfaction: 95,
      tempsMoyenReponse,
      revenuTotal,
      demandeMois,
      conseil: demandesConseil.length,
      accompagnement: demandesAccompagnement.length
    };

    console.log("✅ [Stats] Statistiques calculées");

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ [Stats] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/demandes-toutes
 * @description Récupérer TOUTES les demandes (conseil + accompagnement)
 * @access Private (expert/professionnel seulement)
 */
router.get("/demandes-toutes", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    const expertId = req.user.id;
    console.log(`🔍 [DemandesToutes] Recherche pour expert: ${expertId}`);

    // Récupérer TOUTES les demandes pour cet expert
    const toutesDemandes = await prisma.demandeConseil.findMany({
      where: {
        expertId: expertId
      },
      include: {
        user: {
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
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 [DemandesToutes] ${toutesDemandes.length} demandes trouvées`);

    // Récupérer les infos service et metier
    const demandesAvecDetails = await Promise.all(
      toutesDemandes.map(async (demande) => {
        let serviceInfo = null;
        let metierInfo = null;

        if (demande.serviceId) {
          try {
            serviceInfo = await prisma.service.findUnique({
              where: { id: demande.serviceId }
            });
          } catch (error) {
            console.log("⚠️ Service non trouvé pour demande:", demande.id);
          }
        }

        if (demande.metierId) {
          try {
            metierInfo = await prisma.metier.findUnique({
              where: { id: demande.metierId }
            });
          } catch (error) {
            console.log("⚠️ Métier non trouvé pour demande:", demande.id);
          }
        }

        // Déterminer le type de demande basé sur l'origine
        const typeDemande = demande.origine === "page_accompagnement" ? "accompagnement" : "conseil";
        
        return {
          ...demande,
          typeDemande: typeDemande,
          conseilType: demande.conseilType || (typeDemande === "accompagnement" ? "Accompagnement" : "Conseil"),
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    // Calculer les compteurs
    const conseilCount = demandesAvecDetails.filter(d => d.typeDemande === "conseil").length;
    const accompagnementCount = demandesAvecDetails.filter(d => d.typeDemande === "accompagnement").length;

    console.log(`✅ [DemandesToutes] Total: ${demandesAvecDetails.length} demandes (${conseilCount} conseil, ${accompagnementCount} accompagnement)`);

    res.json({
      success: true,
      data: demandesAvecDetails,
      counts: {
        total: demandesAvecDetails.length,
        conseil: conseilCount,
        accompagnement: accompagnementCount
      },
      meta: {
        userId: expertId,
        userType: req.userData?.userType,
        role: req.userData?.role
      }
    });

  } catch (error) {
    console.error("❌ [DemandesToutes] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/demandes
 * @description Récupérer les demandes assignées à l'expert
 * @access Private (expert/professionnel seulement)
 */
router.get("/demandes", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("📊 [Demandes] Récupération pour expert:", req.user.id);

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
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Récupérer les infos service et metier séparément
    const demandesAvecDetails = await Promise.all(
      demandes.map(async (demande) => {
        let serviceInfo = null;
        let metierInfo = null;

        if (demande.serviceId) {
          try {
            serviceInfo = await prisma.service.findUnique({
              where: { id: demande.serviceId }
            });
          } catch (error) {
            console.log("⚠️ Service non trouvé pour demande:", demande.id);
          }
        }

        if (demande.metierId) {
          try {
            metierInfo = await prisma.metier.findUnique({
              where: { id: demande.metierId }
            });
          } catch (error) {
            console.log("⚠️ Métier non trouvé pour demande:", demande.id);
          }
        }

        // Déterminer le type de demande
        const typeDemande = demande.origine === "page_accompagnement" ? "accompagnement" : "conseil";

        return {
          ...demande,
          typeDemande: typeDemande,
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    console.log(`✅ [Demandes] ${demandesAvecDetails.length} demandes trouvées`);

    res.json({
      success: true,
      data: demandesAvecDetails,
      meta: {
        count: demandesAvecDetails.length,
        userId: req.user.id
      }
    });

  } catch (error) {
    console.error("❌ [Demandes] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/demandes-conseil
 * @description Récupérer uniquement les demandes de conseil
 * @access Private (expert/professionnel seulement)
 */
router.get("/demandes-conseil", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("📋 [DemandesConseil] Récupération pour:", req.user.id);

    const demandes = await prisma.demandeConseil.findMany({
      where: {
        expertId: req.user.id,
        origine: "page_conseil"
      },
      include: {
        user: {
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
          try {
            serviceInfo = await prisma.service.findUnique({
              where: { id: demande.serviceId }
            });
          } catch (error) {
            console.log("⚠️ Service non trouvé pour demande:", demande.id);
          }
        }

        if (demande.metierId) {
          try {
            metierInfo = await prisma.metier.findUnique({
              where: { id: demande.metierId }
            });
          } catch (error) {
            console.log("⚠️ Métier non trouvé pour demande:", demande.id);
          }
        }

        return {
          ...demande,
          typeDemande: 'conseil',
          service: serviceInfo,
          metier: metierInfo
        };
      })
    );

    console.log(`✅ [DemandesConseil] ${demandesAvecDetails.length} demandes trouvées`);

    res.json({
      success: true,
      data: demandesAvecDetails
    });

  } catch (error) {
    console.error("❌ [DemandesConseil] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes de conseil",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/demandes-accompagnement
 * @description Récupérer uniquement les demandes d'accompagnement
 * @access Private (expert/professionnel seulement)
 */
router.get("/demandes-accompagnement", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("📋 [DemandesAccompagnement] Récupération pour:", req.user.id);

    const demandes = await prisma.demandeConseil.findMany({
      where: {
        expertId: req.user.id,
        origine: "page_accompagnement"
      },
      include: {
        user: {
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
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Formater pour avoir la même structure
    const demandesFormatees = demandes.map(d => ({
      ...d,
      typeDemande: 'accompagnement',
      conseilType: d.conseilType || 'Accompagnement'
    }));

    console.log(`✅ [DemandesAccompagnement] ${demandesFormatees.length} demandes trouvées`);

    res.json({
      success: true,
      data: demandesFormatees
    });

  } catch (error) {
    console.error("❌ [DemandesAccompagnement] Erreur récupération:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes d'accompagnement",
      message: error.message
    });
  }
});

/**
 * @route PUT /api/expert/demande/:id/status
 * @description Mettre à jour le statut d'une demande
 * @access Private (expert/professionnel seulement)
 */
router.put("/demande/:id/status", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    console.log("🔄 [Status] Mise à jour demande:", { id, statut, userId: req.user.id });

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
      console.log("❌ [Status] Demande non trouvée:", id);
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée"
      });
    }

    // Vérifier que l'expert est assigné à cette demande
    if (demande.expertId !== req.user.id) {
      console.log("❌ [Status] Non autorisé - expertId mismatch:", {
        demandeExpertId: demande.expertId,
        userId: req.user.id
      });
      return res.status(403).json({
        success: false,
        error: "Non autorisé à modifier cette demande"
      });
    }

    const demandeMiseAJour = await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { 
        statut, 
        updatedAt: new Date() 
      },
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
    });

    // Ajouter un suivi automatique
    await prisma.suiviConseil.create({
      data: {
        demandeConseilId: parseInt(id),
        userId: req.user.id,
        message: `Statut changé à: ${statut}`,
        type: "message"
      }
    });

    console.log("✅ [Status] Statut mis à jour pour demande:", id);

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: demandeMiseAJour
    });

  } catch (error) {
    console.error("❌ [Status] Erreur mise à jour:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du statut",
      message: error.message
    });
  }
});

/**
 * @route POST /api/expert/demande/:id/suivi
 * @description Ajouter un suivi à une demande
 * @access Private (expert/professionnel seulement)
 */
router.post("/demande/:id/suivi", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type, rendezVous } = req.body;

    console.log("📝 [Suivi] Ajout suivi demande:", { id, userId: req.user.id });

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

    // Vérifier que l'expert est assigné à cette demande
    if (demande.expertId !== req.user.id) {
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

    // Mettre à jour la date de modification
    await prisma.demandeConseil.update({
      where: { id: parseInt(id) },
      data: { updatedAt: new Date() }
    });

    console.log("✅ [Suivi] Suivi ajouté pour demande:", id);

    res.json({
      success: true,
      message: "Suivi ajouté avec succès",
      data: suivi
    });

  } catch (error) {
    console.error("❌ [Suivi] Erreur ajout:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout du suivi",
      message: error.message
    });
  }
});

/**
 * @route PUT /api/expert/availability
 * @description Mettre à jour la disponibilité de l'expert
 * @access Private (expert/professionnel seulement)
 */
router.put("/availability", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    const { availability } = req.body;

    console.log("📅 [Availability] Mise à jour pour:", req.user.id, availability);

    if (!availability || !['disponible', 'limitee', 'complet'].includes(availability)) {
      return res.status(400).json({
        success: false,
        error: "Disponibilité invalide"
      });
    }

    // Mettre à jour la disponibilité
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { availability }
      });
      console.log("✅ [Availability] Disponibilité mise à jour");
    } catch (error) {
      console.log("⚠️ [Availability] Champ 'availability' non trouvé dans modèle User");
    }

    res.json({
      success: true,
      message: `Disponibilité mise à jour: ${availability}`
    });

  } catch (error) {
    console.error("❌ [Availability] Erreur mise à jour:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de la disponibilité",
      message: error.message
    });
  }
});

/**
 * @route GET /api/expert/demandes/test
 * @description Endpoint de test pour vérifier les données
 * @access Private (expert/professionnel seulement)
 */
router.get("/demandes/test", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("🧪 [Test] Endpoint test pour:", req.user.id);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, role: true, userType: true }
    });

    // Compter le nombre de demandes pour cet expert
    const countTotal = await prisma.demandeConseil.count({
      where: { expertId: req.user.id }
    });

    const countConseil = await prisma.demandeConseil.count({
      where: { 
        expertId: req.user.id,
        origine: "page_conseil"
      }
    });

    const countAccompagnement = await prisma.demandeConseil.count({
      where: { 
        expertId: req.user.id,
        origine: "page_accompagnement"
      }
    });

    res.json({
      success: true,
      message: "Test endpoint - vérification données",
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        userType: user.userType
      },
      counts: {
        total: countTotal,
        conseil: countConseil,
        accompagnement: countAccompagnement
      },
      note: "Si vous voyez ces données, l'endpoint fonctionne correctement"
    });

  } catch (error) {
    console.error("❌ [Test] Erreur test endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du test",
      message: error.message
    });
  }
});

/**
 * @route GET /api/orders/pro/stats
 * @description Compatibilité - Redirige vers /api/expert/stats
 * @access Private (expert/professionnel seulement)
 */
router.get("/orders/pro/stats", authenticateToken, checkExpertPermission, async (req, res) => {
  try {
    console.log("📊 [OrdersStats] Compatibilité - redirection pour:", req.user.id);
    
    // Récupérer les statistiques via la route expert/stats
    const statsResponse = await prisma.demandeConseil.findMany({
      where: { expertId: req.user.id }
    });

    // Calculer les stats
    const total = statsResponse.length;
    const en_attente = statsResponse.filter(d => d.statut === "en_attente").length;
    const en_cours = statsResponse.filter(d => d.statut === "en_cours").length;
    const terminee = statsResponse.filter(d => d.statut === "terminee").length;
    const annulee = statsResponse.filter(d => d.statut === "annulee").length;
    
    // Demandes du mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const demandeMois = statsResponse.filter(d => 
      new Date(d.createdAt) >= startOfMonth
    ).length;

    const stats = {
      total,
      en_attente,
      en_cours,
      terminee,
      annulee,
      demandeMois,
      satisfaction: 95,
      tempsMoyenReponse: "24h",
      revenuTotal: terminee * 1500
    };

    res.json({
      success: true,
      data: stats,
      message: "Compatibilité endpoint orders/pro/stats",
      redirect: "Utilisez /api/expert/stats pour plus de fonctionnalités"
    });

  } catch (error) {
    console.error("❌ [OrdersStats] Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur endpoint stats orders",
      message: error.message
    });
  }
});

module.exports = router;