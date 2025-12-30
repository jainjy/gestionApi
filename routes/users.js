const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Ajouter ces routes dans votre fichier users.js existant

// Route pour exporter les données personnelles
router.get("/export-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer toutes les données de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Inclure toutes les relations importantes
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
        blogArticleLikes: true,
        blogComments: true,
        blogCommentLikes: true,
        Product: true,
        properties: true,
        blogArticles: true,
        favorites: true,
        ordersClient: true,
        ordersPrestataire: true,
        Transaction: true,
        subscriptions: {
          include: {
            plan: true,
          },
        },
        messagesEnvoyes: {
          select: {
            contenu: true,
            createdAt: true,
            conversation: {
              select: {
                titre: true,
              },
            },
          },
        },
        messagesRecus: {
          select: {
            contenu: true,
            createdAt: true,
            expediteur: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        demandesCrees: true,
        demandesRecues: true,
        Review: true,
        Appointment: true,
        demandesArtisan: true,
        locationsClient: true,
        conversationsCrees: true,
        conversationsParticipees: true,
        devisRecus: true,
        devisEnvoyes: true,
        advertisements: true,
        preferences: true,
        events: true,
        audits: true,
        notifications: true,
        notificationsProprietaire: true,
        mediaFavorites: true,
        wellBeingStats: true,
        ProfessionalSettings: true,
        ContratType: true,
        DocumentArchive: true,
        reservationsCours: true,
        courses: true,
        investmentRequests: true,
        tourismes: true,
        volsCrees: true,
        volsReserves: true,
        touristicPlaceBookings: true,
        flightReservations: true,
        flightReservationsReceived: true,
        financementPartenaires: true,
        rendezvousEntreprise: true,
        activityBookings: true,
        activityReviews: true,
        activityFavorites: true,
        activityShares: true,
        activityGuide: true,
        guideContacts: true,
        messagesRecusContact: true,
        messagesEnvoyesContact: true,
        servicesCrees: true,
        demandesDroitFamille: true,
        demandesConseil: true,
        expertDemandesConseil: true,
        suivisConseil: true,
        Document: true,
        demandesFinancement: true,
        tourismeBookings: true,
        activities: true,
        podcasts: true,
        videos: true,
        // ✅ SUPPRIMÉ: documents: true (utiliser Document à la place)
      },
    });

    // Structure des données pour l'export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: userId,
        format: "RGPD-Export",
        version: "1.0",
      },
      profile: {
        personalInfo: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          createdAt: userData.createdAt,
        },
        professionalInfo: {
          companyName: userData.companyName,
          siret: userData.siret,
          commercialName: userData.commercialName,
          address: userData.address,
          city: userData.city,
          zipCode: userData.zipCode,
        },
      },
      services: {
        metiers: userData.metiers.map((m) => ({
          id: m.metier.id,
          libelle: m.metier.libelle,
        })),
        services: userData.services.map((s) => ({
          id: s.service.id,
          libelle: s.service.libelle,
          customPrice: s.customPrice,
          customDuration: s.customDuration,
        })),
      },
      content: {
        products: userData.Product.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          createdAt: p.createdAt,
        })),
        properties: userData.properties.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          createdAt: p.createdAt,
        })),
        articles: userData.blogArticles.map((a) => ({
          id: a.id,
          title: a.title,
          createdAt: a.createdAt,
        })),
      },
      interactions: {
        orders: {
          asClient: userData.ordersClient.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt,
          })),
          asProvider: userData.ordersPrestataire.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt,
          })),
        },
        transactions: userData.Transaction.map((t) => ({ // ✅ CHANGÉ: userData.transactions → userData.Transaction
          id: t.id,
          amount: t.amount,
          status: t.status,
          description: t.description,
          createdAt: t.createdAt,
        })),
        messages: {
          sent: userData.messagesEnvoyes.map((m) => ({
            content: m.contenu,
            conversation: m.conversation?.titre,
            date: m.createdAt,
          })),
          received: userData.messagesRecus.map((m) => ({
            content: m.contenu,
            sender: m.expediteur
              ? `${m.expediteur.firstName} ${m.expediteur.lastName}`
              : "Anonyme",
            date: m.createdAt,
          })),
        },
        bookings: userData.tourismeBookings.map((b) => ({
          id: b.id,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          totalAmount: b.totalAmount,
          status: b.status,
        })),
      },
      subscriptions: userData.subscriptions.map((s) => ({
        plan: s.plan?.name,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
      })),
      documents: userData.Document.map((d) => ({ // ✅ CHANGÉ: userData.documents → userData.Document
        id: d.id,
        nom: d.nom,
        type: d.type,
        dateUpload: d.dateUpload,
      })),
    };

    res.json(exportData);
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error);
    res.status(500).json({ error: "Erreur lors de l'export des données" });
  }
});

// Route pour supprimer le compte
router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, confirmAllSteps } = req.body;

    // Vérifier que toutes les étapes sont confirmées
    if (!confirmAllSteps) {
      return res.status(403).json({
        error:
          "Vous devez confirmer toutes les étapes avant de supprimer votre compte",
      });
    }

    // Vérifier le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Journaliser la demande de suppression
    await prisma.userEvent.create({
      data: {
        userId: userId,
        eventType: "ACCOUNT_DELETION_REQUEST",
        eventData: {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
      },
    });

    // Marquer l'utilisateur comme "pending_deletion" pour traitement différé
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "pending_deletion",
        deletionRequestedAt: new Date(),
      },
    });

    // Notifier l'administrateur
    await prisma.notification.create({
      data: {
        type: "ACCOUNT_DELETION",
        title: "Demande de suppression de compte",
        message: `L'utilisateur ${user.email} a demandé la suppression de son compte conformément au RGPD`,
        userId: userId,
        userProprietaireId: userId,
        relatedEntity: "user",
        relatedEntityId: userId,
      },
    });

    res.json({
      success: true,
      message:
        "Votre demande de suppression a été enregistrée. Votre compte sera définitivement supprimé dans les 30 jours conformément au RGPD.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du compte:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du compte" });
  }
});

// GET /api/users - Récupérer les utilisateurs avec pagination et contrôle d'accès
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      status, 
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Validation des paramètres
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Limite à 100 max
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres de base
    const where = {};

    // Filtre par rôle
    if (role && ['admin', 'user', 'professional'].includes(role)) {
      where.role = role;
    }

    // Filtre par statut
    if (status && ['active', 'inactive', 'pending'].includes(status)) {
      where.status = status;
    }

    // Filtre de recherche
    if (search && typeof search === 'string') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Requête principale avec sélection de champs spécifiques
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          // Données de base nécessaires pour l'admin
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          status: true,
          companyName: true,
          demandType: true,
          address: true,
          zipCode: true,
          city: true,
          addressComplement: true,
          commercialName: true,
          siret: true,
          latitude: true,
          longitude: true,
          userType: true,
          createdAt: true,
          updatedAt: true,
          
          // Relations avec sélection limitée
          metiers: {
            select: {
              metier: {
                select: {
                  id: true,
                  libelle: true
                }
              }
            }
          },
          services: {
            select: {
              service: {
                select: {
                  id: true,
                  libelle: true
                }
              }
            }
          },
          Product: {
            select: { id: true }
          },
          properties: {
            select: { id: true }
          },
          blogArticles: {
            select: { id: true }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.user.count({ where })
    ]);

    // Formater les données avec masquage des informations sensibles
    const formattedUsers = users.map((user) => {
      const baseData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        companyName: user.companyName,
        demandType: user.demandType,
        userType: user.userType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        
        // Statistiques
        productsCount: user.Product.length,
        propertiesCount: user.properties.length,
        articlesCount: user.blogArticles.length,
        
        // Métiers et services
        metiers: user.metiers.map((m) => m.metier),
        services: user.services.map((s) => s.service),
      };

      // Déclaration de userReq (l'utilisateur connecté qui fait la requête)
      const currentUser = req.user;
      
      // Seuls les administrateurs "full" voient toutes les données
      if (currentUser && currentUser.role === 'admin' && currentUser.permissions?.includes('view_sensitive_data')) {
        return {
          ...baseData,
          // Données sensibles complètes pour admin autorisé
          phone: user.phone,
          avatar: user.avatar,
          address: user.address,
          zipCode: user.zipCode,
          city: user.city,
          addressComplement: user.addressComplement,
          commercialName: user.commercialName,
          siret: user.siret,
          latitude: user.latitude,
          longitude: user.longitude
        };
      } else {
        // Admin standard - données masquées ou partielles
        return {
          ...baseData,
          // Données sensibles masquées ou anonymisées
          phone: user.phone ? maskPhoneNumber(user.phone) : null,
          avatar: user.avatar,
          // Adresse partielle seulement
          city: user.city,
          // Autres données sensibles non incluses
        };
      }
    });

    // Réponse avec pagination
    const sensitiveDataMasked = !(req.user && req.user.role === 'admin' && req.user.permissions?.includes('view_sensitive_data'));
    
    res.json({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPreviousPage: pageNum > 1
      },
      // Informations de sécurité
      dataProtection: {
        sensitiveDataMasked: sensitiveDataMasked,
        maskedFields: ['phone', 'address', 'siret', 'coordinates'],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
});

// Fonction utilitaire pour masquer les numéros de téléphone
function maskPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return '****';
  return `${cleaned.slice(0, 2)}**${cleaned.slice(-2)}`;
}

// Nouvelle route pour les statistiques sécurisées
router.get("/stats", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const stats = await prisma.user.groupBy({
      by: ['status', 'role'],
      _count: true
    });

    // Formater les statistiques sans données sensibles
    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      pro: 0,
      admin: 0,
      user: 0,
      byStatus: {},
      byRole: {}
    };

    stats.forEach(stat => {
      result.total += stat._count;
      if (stat.status === 'active') result.active += stat._count;
      if (stat.status === 'inactive') result.inactive += stat._count;
      if (stat.status === 'pending') result.pending += stat._count;
      if (stat.role === 'professional') result.pro += stat._count;
      if (stat.role === 'admin') result.admin += stat._count;
      if (stat.role === 'user') result.user += stat._count;
      
      result.byStatus[stat.status] = (result.byStatus[stat.status] || 0) + stat._count;
      result.byRole[stat.role] = (result.byRole[stat.role] || 0) + stat._count;
    });

    res.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// GET /api/users/metiers/all - Récupérer tous les métiers
router.get(
  "/metiers/all",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const metiers = await prisma.metier.findMany({
        orderBy: {
          libelle: "asc",
        },
      });
      res.json(metiers);
    } catch (error) {
      console.error("Erreur lors de la récupération des métiers:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/users/services/all - Récupérer tous les services
router.get(
  "/services/all",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const services = await prisma.service.findMany({
        orderBy: {
          libelle: "asc",
        },
      });
      res.json(services);
    } catch (error) {
      console.error("Erreur lors de la récupération des services:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/users - Créer un nouvel utilisateur
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        status,
        companyName,
        demandType,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        metiers,
        services,
        userType, // Nouveau champ pour le type d'utilisateur
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Un utilisateur avec cet email existe déjà" });
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 12);

      // Déterminer le userType en fonction du rôle
      let finalUserType = userType;
      if (!finalUserType) {
        if (role === "professional") {
          finalUserType = "PRESTATAIRE"; // Valeur par défaut pour les pros
        } else if (role === "user") {
          finalUserType = "CLIENT"; // Valeur par défaut pour les utilisateurs
        }
      }

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          role,
          status,
          userType: finalUserType, // Ajout du userType
          companyName: role === "professional" ? companyName : null,
          demandType: role === "user" ? demandType : null,
          address,
          zipCode,
          city,
          addressComplement,
          commercialName,
          siret,
          latitude,
          longitude,
        },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      // Ajouter les métiers si c'est un professionnel
      if (role === "professional" && metiers && metiers.length > 0) {
        await prisma.utilisateurMetier.createMany({
          data: metiers.map((metierId) => ({
            userId: user.id,
            metierId,
          })),
        });
      }

      // Ajouter les services si c'est un professionnel
      if (role === "professional" && services && services.length > 0) {
        await prisma.utilisateurService.createMany({
          data: services.map((serviceId) => ({
            userId: user.id,
            serviceId,
          })),
        });
      }

      // CRÉATION AUTOMATIQUE DE L'ABONNEMENT DE 2 MOIS
      await createSubscriptionForUser(user.id, finalUserType, role);

      // Récupérer l'utilisateur complet avec les relations
      const completeUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          subscriptions: {
            include: {
              plan: true,
            },
          },
        },
      });

      res.json(completeUser);
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        status,
        companyName,
        demandType,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        metiers,
        services,
      } = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email !== existingUser.email) {
        const emailUser = await prisma.user.findUnique({
          where: { email },
        });
        if (emailUser) {
          return res
            .status(400)
            .json({ error: "Un utilisateur avec cet email existe déjà" });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {
        firstName,
        lastName,
        email,
        phone,
        role,
        status,
        companyName: role === "professional" ? companyName : null,
        demandType: role === "user" ? demandType : null,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        updatedAt: new Date(),
      };

      // Mettre à jour le mot de passe si fourni
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      // Mettre à jour l'utilisateur
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Gérer les métiers pour les professionnels
      if (role === "professional") {
        // Supprimer les métiers existants
        await prisma.utilisateurMetier.deleteMany({
          where: { userId: id },
        });

        // Ajouter les nouveaux métiers
        if (metiers && metiers.length > 0) {
          await prisma.utilisateurMetier.createMany({
            data: metiers.map((metierId) => ({
              userId: id,
              metierId,
            })),
          });
        }

        // Supprimer les services existants
        await prisma.utilisateurService.deleteMany({
          where: { userId: id },
        });

        // Ajouter les nouveaux services
        if (services && services.length > 0) {
          await prisma.utilisateurService.createMany({
            data: services.map((serviceId) => ({
              userId: id,
              serviceId,
            })),
          });
        }
      } else {
        // Supprimer les métiers et services si l'utilisateur n'est plus professionnel
        await prisma.utilisateurMetier.deleteMany({
          where: { userId: id },
        });
        await prisma.utilisateurService.deleteMany({
          where: { userId: id },
        });
      }

      // Récupérer l'utilisateur complet avec les relations
      const completeUser = await prisma.user.findUnique({
        where: { id },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          Product: true,
          properties: true,
          blogArticles: true,
        },
      });

      res.json(completeUser);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PATCH /api/users/:id - Mettre à jour partiellement un utilisateur
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Mettre à jour l'utilisateur
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      res.json(user);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour partielle de l'utilisateur:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Supprimer l'utilisateur (les relations seront supprimées en cascade)
      await prisma.user.delete({
        where: { id },
      });

      res.json({ success: true, message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/users/update/change-password - Changer le mot de passe
router.put("/update/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/users/update/profile - Mettre à jour le profil de l'utilisateur connecté
router.put("/update/profile", authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      companyName,
      address,
      zipCode,
      city,
      addressComplement,
      commercialName,
      siret,
      avatar,
    } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
        companyName,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        avatar,
        updatedAt: new Date(),
      },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// Fonction pour créer un abonnement de 2 mois selon le userType
async function createSubscriptionForUser(userId, userType, role) {
  try {
    // Déterminer le plan d'abonnement selon le userType
    let planType;

    switch (userType) {
      case "VENDEUR":
        planType = "furniture";
        break;
      case "AGENCE":
        planType = "real_estate";
        break;
      case "PRESTATAIRE":
        planType = "services";
        break;
      case "BIEN_ETRE":
        planType = "wellness";
        break;
      case "CLIENT":
      default:
        planType = "services";
        break;
    }

    // Trouver le plan correspondant
    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        planType: planType,
        isActive: true,
      },
    });

    if (!plan) {
      console.warn(`Aucun plan trouvé pour le type: ${planType}`);
      return null;
    }

    // Calculer les dates (2 mois)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);

    // Créer l'abonnement
    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        planId: plan.id,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        autoRenew: false, // Ne pas renouveler automatiquement
      },
      include: {
        plan: true,
      },
    });

    console.log(
      `✅ Abonnement créé pour l'utilisateur ${userId}: ${plan.name} (2 mois)`
    );
    return subscription;
  } catch (error) {
    console.error("Erreur lors de la création de l'abonnement:", error);
    return null;
  }
}

module.exports = router;
