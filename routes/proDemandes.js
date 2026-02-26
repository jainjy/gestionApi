const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/pro/demandes - Récupérer les demandes pour un professionnel
router.get(
  "/",
  authenticateToken,
  requireRole(["professional"]),
  async (req, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      console.log("=================================");
      console.log("🔍 RECHERCHE DE DEMANDES POUR LE PRO");
      console.log("User ID:", userId);
      console.log("Paramètres reçus:", { status, search, page, limit });

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
              service: true,
            },
          },
        },
      });

      if (!userWithServices) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Extraire les IDs des métiers et services du professionnel
      const userMetierIds = userWithServices.metiers.map((m) => m.metierId);
      const userServiceIds = userWithServices.services.map((s) => s.serviceId);

      console.log("Métiers du pro:", userMetierIds);
      console.log("Services du pro:", userServiceIds);

      // ============================================
      // CONSTRUCTION DE LA CLAUSE WHERE MODIFIÉE
      // ============================================
      
      // On veut uniquement les demandes :
      // 1. propertyId = null (pas de demande immobilière)
      // 2. ET artisanId = userId (demandes assignées à l'artisan connecté)
      
      let whereClause = {
        propertyId: null, // Exclure les demandes immobilières
        artisanId: userId // Uniquement les demandes assignées à cet artisan
      };

      // Filtre par statut
      if (status && status !== "Toutes" && status !== "undefined") {
        whereClause.statut = status;
      }

      // Recherche textuelle
      if (search && search.trim() !== "") {
        whereClause.AND = {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { contactNom: { contains: search, mode: "insensitive" } },
            { contactPrenom: { contains: search, mode: "insensitive" } },
            { lieuAdresseVille: { contains: search, mode: "insensitive" } },
          ]
        };
      }

      console.log("📋 Clause WHERE:", JSON.stringify(whereClause, null, 2));

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
              },
            },
            metier: {
              select: {
                id: true,
                libelle: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
                address: true,
                city: true,
                zipCode: true,
                price: true,
                surface: true,
                rooms: true,
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
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

      console.log("📊 RÉSULTATS DE LA REQUÊTE:");
      console.log("Nombre de demandes trouvées:", demandes.length);
      console.log("Total (sans pagination):", total);

      // Transformer les données pour le frontend
      const transformedDemandes = demandes.map((demande) => {
        const artisanAssignment = demande.artisans?.find(
          (a) => a.userId === userId
        );

        // Déterminer le type de demande et construire l'affichage
        let type = "autre";
        let metierLibelle = "Non spécifié";
        let titre = "Demande de service";
        let lieu = "Non spécifié";
        let client = "Client";

        if (demande.property) {
          type = "property";
          metierLibelle = "Immobilier";
          const typeBien = demande.property.type === "RENT" ? "Location" : "Achat";
          titre = `${typeBien} - ${demande.property.title || "Bien immobilier"}`;
          lieu = `${demande.property.zipCode || ""} ${demande.property.city || ""}`.trim() || 
                 demande.property.address || "Non spécifié";
        } else if (demande.service) {
          type = "service";
          metierLibelle = demande.service.metiers?.[0]?.metier?.libelle || "Service";
          titre = `Service: ${demande.service.libelle}`;
          lieu = `${demande.lieuAdresseCp || ""} ${demande.lieuAdresseVille || ""}`.trim();
        } else if (demande.metier) {
          type = "metier";
          metierLibelle = demande.metier.libelle;
          titre = `Demande de ${demande.metier.libelle}`;
          lieu = `${demande.lieuAdresseCp || ""} ${demande.lieuAdresseVille || ""}`.trim();
        }

        // Nom du client
        if (demande.contactPrenom || demande.contactNom) {
          client = `${demande.contactPrenom || ""} ${demande.contactNom || ""}`.trim();
        } else if (demande.createdBy) {
          client = demande.createdBy.companyName || 
                   `${demande.createdBy.firstName || ""} ${demande.createdBy.lastName || ""}`.trim() || 
                   "Client";
        }

        // Calcul de l'urgence
        const now = new Date();
        const daysSinceCreation = Math.floor(
          (now - new Date(demande.createdAt)) / (1000 * 60 * 60 * 24)
        );

        let urgence = "Moyen";
        if (daysSinceCreation <= 1) {
          urgence = "Urgent";
        } else if (daysSinceCreation <= 3) {
          urgence = "Moyen";
        } else {
          urgence = "Faible";
        }

        return {
          id: demande.id,
          titre: titre,
          metier: metierLibelle,
          lieu: lieu,
          statut: demande.statut || "en attente",
          urgence: urgence,
          description: demande.description || "Aucune description fournie",
          date: new Date(demande.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          client: client,
          budget: demande.property?.price ? `${demande.property.price}€` : "Non estimé",
          nouvelle: daysSinceCreation <= 1,
          urgent: urgence === "Urgent",
          type: type,
          assignment: artisanAssignment,
          canAccept: !artisanAssignment || artisanAssignment.accepte === null,
          property: demande.property,
          service: demande.service,
          metier: demande.metier,
          createdAt: demande.createdAt,
        };
      });

      console.log("✅ Réponse envoyée au frontend:", {
        demandesCount: transformedDemandes.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
        }
      });
      console.log("=================================");

      res.json({
        demandes: transformedDemandes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
      
    } catch (error) {
      console.error("❌ ERREUR lors de la récupération des demandes pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/pro/demandes/stats - Statistiques pour le professionnel
router.get(
  "/stats",
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

      if (!userWithServices) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Extraire les IDs des métiers et services du professionnel
      const userMetierIds = userWithServices.metiers.map((m) => m.metierId);
      const userServiceIds = userWithServices.services.map((s) => s.serviceId);

      // Vérifier si le pro est dans l'immobilier
      const isRealEstatePro = userMetierIds.some(id => [324, 326, 327].includes(id)) || 
                              userServiceIds.length > 0;

      // Construire les conditions OR
      const orConditions = [];
      
      if (userServiceIds.length > 0) {
        orConditions.push({
          serviceId: { in: userServiceIds }
        });
      }
      
      if (userMetierIds.length > 0) {
        orConditions.push({
          metierId: { in: userMetierIds }
        });
      }

      // Construire la clause WHERE de base
      let baseWhereClause = {
        OR: orConditions.length > 0 ? orConditions : [{ id: null }],
      };

      // Ajouter la condition propertyId seulement si ce n'est pas un pro immobilier
      if (!isRealEstatePro) {
        baseWhereClause.propertyId = null;
      }

      console.log("📊 Stats WHERE clause:", JSON.stringify(baseWhereClause, null, 2));

      const [
        totalDemandes,
        demandesEnAttente,
        demandesEnCours,
        demandesValidees,
        demandesRefusees,
        demandesTerminees,
        demandesUrgentes,
      ] = await Promise.all([
        prisma.demande.count({ where: baseWhereClause }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            statut: "en attente",
          },
        }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            statut: "en cours",
          },
        }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            statut: "validée",
          },
        }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            statut: "refusée",
          },
        }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            statut: "terminée",
          },
        }),
        prisma.demande.count({
          where: {
            ...baseWhereClause,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Demandes disponibles (non assignées à ce pro)
      const demandesDisponibles = await prisma.demande.count({
        where: {
          ...baseWhereClause,
          artisans: {
            none: {
              userId: userId
            }
          },
          OR: [
            { artisanId: null },
            { artisanId: userId }
          ]
        },
      });

      // Demandes assignées à ce pro
      const demandesAssignees = await prisma.demande.count({
        where: {
          ...baseWhereClause,
          artisans: {
            some: {
              userId: userId
            }
          }
        },
      });

      res.json({
        total: totalDemandes,
        enAttente: demandesEnAttente,
        enCours: demandesEnCours,
        validees: demandesValidees,
        refusees: demandesRefusees,
        terminees: demandesTerminees,
        urgentes: demandesUrgentes,
        nouvelles: demandesUrgentes,
        disponibles: demandesDisponibles,
        assignees: demandesAssignees,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats pro:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/pro/demandes/:id/accept - Accepter une demande
router.post(
  "/:id/accept",
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
            titre: `Demande ${demande.service?.libelle || demande.metier?.libelle || "immobilière"}`,
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
  "/:id/decline",
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
          recruited: false,
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
  "/:id/apply",
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

      // Assigner le professionnel à la demande
      const demandeArtisan = await prisma.demandeArtisan.create({
        data: {
          userId: userId,
          demandeId: parseInt(id),
          accepte: null, // En attente de validation par le client
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
            titre: `Demande ${demande.service?.libelle || demande.metier?.libelle || "immobilière"}`,
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

module.exports = router;