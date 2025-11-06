const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/pro/demandes - Récupérer les demandes pour un professionnel
router.get(
  "/demandes",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      // Récupérer les métiers et services du professionnel
      const userWithServices = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: {
                include: {
                  metiers: {
                    include: {
                      metier: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extraire les IDs des métiers et services du professionnel
      const userMetierIds = userWithServices.metiers.map((m) => m.metierId);
      const userServiceIds = userWithServices.services.map((s) => s.serviceId);

      // Construire la clause WHERE pour les demandes compatibles
      let whereClause = {
        AND: [
          {
            OR: [
              // Demandes avec service que le professionnel propose
              {
                serviceId: {
                  in: userServiceIds.length > 0 ? userServiceIds : undefined,
                },
              },
              // Demandes avec métier que le professionnel possède
              {
                metierId: {
                  in: userMetierIds.length > 0 ? userMetierIds : undefined,
                },
              },
            ].filter(
              (condition) => Object.values(condition)[0].in !== undefined
            ),
          },
          {
            propertyId: null, // Exclure les demandes immobilières
          },
          {
            // 🔥 Seulement les demandes artisan correspondantes ou libres
            OR: [
              // 1️⃣ Demandes où l’artisan n’est pas encore assigné
              {
                artisans: {
                  none: { userId },
                },
              },
              // 2️⃣ Demandes où il est déjà assigné et accepte ou pas encore décidé
              {
                artisans: {
                  some: {
                    userId,
                    OR: [{ accepte: true }, { accepte: null }],
                  },
                },
              },
            ],
          },
        ],
      };

      // Filtre par statut
      if (status && status !== "Toutes") {
        switch (status) {
          case "En attente":
            whereClause.demandeAcceptee = false;
            whereClause.artisans = { none: { userId } };
            break;
          case "En cours":
            whereClause.demandeAcceptee = false;
            whereClause.artisans = { some: { userId } };
            break;
          case "Validée":
            whereClause.demandeAcceptee = true;
            whereClause.artisans = { some: { userId, accepte: true } };
            break;
          case "Refusée":
            whereClause.artisans = {
              some: {
                userId,
                accepte: false,
              },
            };
            break;
          case "Assignée":
            whereClause.artisans = {
              some: {
                userId,
                accepte: null,
              },
            };
            break;
        }
      }

      // Recherche
      if (search) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          { description: { contains: search, mode: "insensitive" } },
          { contactNom: { contains: search, mode: "insensitive" } },
          { contactPrenom: { contains: search, mode: "insensitive" } },
          { lieuAdresseVille: { contains: search, mode: "insensitive" } },
          { service: { libelle: { contains: search, mode: "insensitive" } } },
          { metier: { libelle: { contains: search, mode: "insensitive" } } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [demandes, total] = await Promise.all([
        prisma.demande.findMany({
          where: whereClause,
          include: {
            service: {
              select: {
                id: true,
                libelle: true,
                description: true,
                images: true,
                price: true,
                duration: true,
                category: true,
                metiers: {
                  include: {
                    metier: {
                      select: {
                        id: true,
                        libelle: true,
                      },
                    },
                  },
                },
              },
            },
            metier: {
              select: {
                id: true,
                libelle: true,
              },
            },
            artisans: {
              where: {
                userId: userId,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                companyName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: parseInt(limit),
        }),
        prisma.demande.count({ where: whereClause }),
      ]);

      // Transformer les données pour le frontend pro
      const transformedDemandes = demandes.map((demande) => {
        const artisanAssignment = demande.artisans.find(
          (a) => a.userId === userId
        );

        // Déterminer le métier selon le type de demande
        let metierLibelle = "Non spécifié";
        let titre = "Demande de service";

        if (demande.service) {
          metierLibelle =
            demande.service.metiers[0]?.metier?.libelle || "Non spécifié";
          titre = `Demande ${demande.service.libelle}`;
        } else if (demande.metier) {
          metierLibelle = demande.metier.libelle;
          titre = `Demande ${demande.metier.libelle}`;
        }

        // Déterminer le statut pour le professionnel
        let statut = "Disponible";
        if (artisanAssignment) {
          if (artisanAssignment.accepte === true) {
            statut = "Validée";
          } else if (artisanAssignment.accepte === false) {
            statut = "Refusée";
          } else {
            statut = "Assignée";
          }
        }

        // Déterminer l'urgence basée sur la date de création
        const now = new Date();
        const daysSinceCreation = Math.floor(
          (now - demande.createdAt) / (1000 * 60 * 60 * 24)
        );

        let urgence = "Moyen";
        if (daysSinceCreation <= 1) {
          urgence = "Urgent";
        } else if (daysSinceCreation <= 3) {
          urgence = "Moyen";
        } else {
          urgence = "Faible";
        }

        // Vérifier si c'est une nouvelle demande (moins de 24h)
        const isNouvelle = daysSinceCreation <= 1;

        return {
          id: demande.id,
          titre: titre,
          metier: metierLibelle,
          lieu: `${demande.lieuAdresseCp || ""} ${demande.lieuAdresseVille || ""}`.trim(),
          statut: statut,
          urgence: urgence,
          description: demande.description || "Aucune description fournie",
          date: demande.createdAt.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          client:
            `${demande.contactPrenom || ""} ${demande.contactNom || ""}`.trim() ||
            `${demande.createdBy.firstName || ""} ${demande.createdBy.lastName || ""}`.trim(),
          budget: "Non estimé",
          nouvelle: isNouvelle,
          urgent: urgence === "Urgent",
          type: demande.serviceId ? "service" : "metier",
          // Informations d'assignation
          assignment: artisanAssignment,
          canAccept: !artisanAssignment || artisanAssignment.accepte === null,
          // Données détaillées
          contactNom: demande.contactNom,
          contactPrenom: demande.contactPrenom,
          contactEmail: demande.contactEmail,
          contactTel: demande.contactTel,
          lieuAdresse: demande.lieuAdresse,
          lieuAdresseCp: demande.lieuAdresseCp,
          lieuAdresseVille: demande.lieuAdresseVille,
          optionAssurance: demande.optionAssurance,
          nombreArtisans: demande.nombreArtisans,
          serviceId: demande.serviceId,
          metierId: demande.metierId,
          createdAt: demande.createdAt,
          createdBy: demande.createdBy,
          service: demande.service,
          metier: demande.metier,
        };
      });

      res.json({
        demandes: transformedDemandes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/pro/demandes/stats - Statistiques pour le professionnel
router.get(
  "/demandes/stats",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Récupérer les métiers et services du professionnel
      const userWithServices = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: {
                include: {
                  metiers: {
                    include: {
                      metier: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extraire les IDs des métiers et services du professionnel
      const userMetierIds = userWithServices.metiers.map((m) => m.metierId);
      const userServiceIds = userWithServices.services.map((s) => s.serviceId);

      const whereClause = {
        OR: [
          { serviceId: { in: userServiceIds } },
          { metierId: { in: userMetierIds } },
        ].filter((condition) => Object.values(condition)[0].in !== undefined),
        propertyId: null,
      };

      const [
        totalDemandes,
        demandesDisponibles,
        demandesAssignees,
        demandesValidees,
        demandesRefusees,
        demandesUrgentes,
      ] = await Promise.all([
        // Total des demandes compatibles
        prisma.demande.count({ where: whereClause }),
        // Demandes disponibles (non assignées au professionnel)
        prisma.demande.count({
          where: {
            ...whereClause,
            artisans: {
              none: { userId },
            },
          },
        }),
        // Demandes assignées en attente de réponse
        prisma.demande.count({
          where: {
            ...whereClause,
            artisans: {
              some: {
                userId,
                accepte: null,
              },
            },
          },
        }),
        // Demandes validées (acceptées par le professionnel)
        prisma.demande.count({
          where: {
            ...whereClause,
            artisans: {
              some: {
                userId,
                accepte: true,
              },
            },
          },
        }),
        // Demandes refusées par le professionnel
        prisma.demande.count({
          where: {
            ...whereClause,
            artisans: {
              some: {
                userId,
                accepte: false,
              },
            },
          },
        }),
        // Demandes urgentes (moins de 24h)
        prisma.demande.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({
        total: totalDemandes,
        disponibles: demandesDisponibles,
        assignees: demandesAssignees,
        validees: demandesValidees,
        refusees: demandesRefusees,
        urgentes: demandesUrgentes,
        nouvelles: demandesUrgentes,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/pro/demandes/:id/accept - Accepter une demande
router.post(
  "/demandes/:id/accept",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier si la demande existe
      const demande = await prisma.demande.findUnique({
        where: { id: parseInt(id) },
        include: {
          service: true,
          metier: true,
          createdBy: true,
        },
      });

      if (!demande) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Vérifier si l'artisan a le bon métier/service
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          services: demande.serviceId
            ? { where: { serviceId: demande.serviceId } }
            : undefined,
          metiers: demande.metierId
            ? { where: { metierId: demande.metierId } }
            : undefined,
        },
      });

      if (demande.serviceId && (!user.services || user.services.length === 0)) {
        return res.status(400).json({
          error: "Vous ne proposez pas ce service",
        });
      }

      if (demande.metierId && (!user.metiers || user.metiers.length === 0)) {
        return res.status(400).json({
          error: "Vous ne possédez pas ce métier",
        });
      }

      // Vérifier si une relation DemandeArtisan existe déjà
      let demandeArtisan = await prisma.demandeArtisan.findUnique({
        where: {
          userId_demandeId: {
            userId: userId,
            demandeId: parseInt(id),
          },
        },
        include: {
          user: true,
          demande: true,
        },
      });

      // Si elle n'existe pas, la créer automatiquement
      if (!demandeArtisan) {
        demandeArtisan = await prisma.demandeArtisan.create({
          data: {
            userId: userId,
            demandeId: parseInt(id),
            accepte: true,
          },
          include: {
            user: true,
            demande: true,
          },
        });
      } else {
        // Sinon, simplement la mettre à jour
        demandeArtisan = await prisma.demandeArtisan.update({
          where: {
            userId_demandeId: {
              userId: userId,
              demandeId: parseInt(id),
            },
          },
          data: {
            accepte: true,
          },
          include: {
            user: true,
            demande: true,
          },
        });
      }

      // Créer ou récupérer la conversation associée à la demande
      let conversation = await prisma.conversation.findFirst({
        where: {
          demandeId: parseInt(id),
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            demandeId: parseInt(id),
            titre: `Demande ${demande.service?.libelle || demande.metier?.libelle}`,
            createurId: demande.createdById,
            participants: {
              create: [
                { userId: demande.createdById }, // Client
                { userId: userId }, // Artisan
              ],
            },
          },
        });
      } else {
        // Ajouter l'artisan comme participant s'il ne l'est pas encore
        await prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conversation.id,
              userId: userId,
            },
          },
          update: {},
          create: {
            conversationId: conversation.id,
            userId: userId,
          },
        });
      }

      // Ajouter un message système d’acceptation
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `${demandeArtisan.user.companyName || demandeArtisan.user.firstName} a accepté la demande.`,
          type: "SYSTEM",
          evenementType: "ARTISAN_ACCEPTE",
        },
      });

      res.json({
        message: "Demande acceptée avec succès",
        assignment: demandeArtisan,
        conversationId: conversation.id,
      });
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);


// POST /api/pro/demandes/:id/decline - Refuser une demande
router.post(
  "/demandes/:id/decline",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { raison } = req.body;
      const demande = await prisma.demande.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!demande) {
        return res.status(404).json({
          error: "Demande non trouvée",
        });
      }
      // Vérifier si la demande existe et est assignée au professionnel
      const demandeArtisan = await prisma.demandeArtisan.findUnique({
        where: {
          userId_demandeId: {
            userId: userId,
            demandeId: parseInt(id),
          },
        },
        include: {
          demande: true,
          user: true,
        },
      });

      // Mettre à jour l'assignation
      const updatedAssignment = await prisma.demandeArtisan.upsert({
        where: {
          userId_demandeId: {
            userId: userId,
            demandeId: parseInt(id),
          },
        },
        create: {
          demandeId: parseInt(id),
          userId: userId,
          accepte: false,
          recruited:false,
        },
        update: {
          accepte: false,
        },
      });

      res.json({
        message: "Demande refusée avec succès",
        assignment: updatedAssignment,
      });
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/pro/demandes/:id/apply - Postuler à une demande
router.post(
  "/demandes/:id/apply",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { message, devis } = req.body;

      // Vérifier si la demande existe
      const demande = await prisma.demande.findUnique({
        where: { id: parseInt(id) },
        include: {
          service: true,
          metier: true,
          createdBy: true,
        },
      });

      if (!demande) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Vérifier si le professionnel est déjà assigné
      const existingAssignment = await prisma.demandeArtisan.findUnique({
        where: {
          userId_demandeId: {
            userId: userId,
            demandeId: parseInt(id),
          },
        },
      });

      if (existingAssignment) {
        return res.status(400).json({
          error: "Vous êtes déjà assigné à cette demande",
        });
      }

      // Vérifier la compatibilité du professionnel avec la demande
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          services: {
            where: demande.serviceId
              ? { serviceId: demande.serviceId }
              : undefined,
          },
          metiers: {
            where: demande.metierId
              ? { metierId: demande.metierId }
              : undefined,
          },
        },
      });

      if (demande.serviceId && user.services.length === 0) {
        return res.status(400).json({
          error: "Vous ne proposez pas ce service",
        });
      }

      if (demande.metierId && user.metiers.length === 0) {
        return res.status(400).json({
          error: "Vous ne possédez pas ce métier",
        });
      }

      // Assigner le professionnel à la demande
      const demandeArtisan = await prisma.demandeArtisan.create({
        data: {
          userId: userId,
          demandeId: parseInt(id),
          accepte: true,
          devis: devis,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
          demande: {
            include: {
              createdBy: true,
            },
          },
        },
      });

      // Créer ou mettre à jour la conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          demandeId: parseInt(id),
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            demandeId: parseInt(id),
            titre: `Demande ${demande.service?.libelle || demande.metier?.libelle}`,
            createurId: demande.createdById,
            participants: {
              create: [
                { userId: demande.createdById }, // Client
                { userId: userId }, // Artisan
              ],
            },
          },
        });
      } else {
        // Ajouter l'artisan comme participant
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: userId,
          },
        });
      }

      // Ajouter un message de postulation
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu:
            message ||
            `${user.companyName || user.firstName} a postulé pour cette demande.`,
          type: "TEXT",
          evenementType: "PROPOSITION_DEVIS",
        },
      });

      res.json({
        message: "Postulation envoyée avec succès",
        assignment: demandeArtisan,
        conversationId: conversation.id,
      });
    } catch (error) {
      console.error("Erreur lors de la postulation:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/pro/profile - Récupérer le profil du professionnel
router.get(
  "/profile",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          metiers: {
            include: {
              metier: {
                select: {
                  id: true,
                  libelle: true,
                },
              },
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  libelle: true,
                  description: true,
                  price: true,
                  duration: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json({
        profile: user,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

module.exports = router;
