const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/admin/demandes - Récupérer toutes les demandes pour l'admin
router.get(
  "/demandes",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;

      let whereClause = {
        // Filtrer seulement les demandes avec serviceId OU metierId non null
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
        propertyId: null, // Exclure les demandes immobilières
      };

      // Filtre par statut
      if (status && status !== "Toutes") {
        switch (status) {
          case "En attente":
            whereClause.demandeAcceptee = false;
            whereClause.artisans = { none: {} };
            break;
          case "En cours":
            whereClause.demandeAcceptee = false;
            whereClause.artisans = { some: {} };
            break;
          case "Validée":
            whereClause.demandeAcceptee = true;
            break;
          case "Refusée":
            whereClause.demandeAcceptee = false;
            break;
        }
      }

      // Recherche
      if (search) {
        whereClause.OR = [
          ...(whereClause.OR || []), // Conserver le filtre existant
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

      // Transformer les données pour le frontend admin
      const transformedDemandes = demandes.map((demande) => {
        const artisansAcceptes = demande.artisans.filter((a) => a.accepte);
        const artisansEnAttente = demande.artisans.filter(
          (a) => a.accepte === null || a.accepte === false
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

        // Déterminer le statut
        let statut = "En attente";
        let urgence = "Moyen";

        if (demande.demandeAcceptee) {
          statut = "Terminée";
        } else if (artisansAcceptes.length > 0) {
          statut = "Validée";
        } else if (demande.artisans.length > 0) {
          statut = "En cours";
        }

        // Déterminer l'urgence basée sur la date de création
        const now = new Date();
        const daysSinceCreation = Math.floor(
          (now - demande.createdAt) / (1000 * 60 * 60 * 24)
        );

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
          artisans: demande.artisans,
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
      console.error(
        "Erreur lors de la récupération des demandes admin:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/admin/demandes/stats - Statistiques pour l'admin
router.get(
  "/demandes/stats",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const whereClause = {
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
        propertyId: null,
      };

      const [
        totalDemandes,
        demandesEnAttente,
        demandesEnCours,
        demandesValidees,
        demandesUrgentes,
      ] = await Promise.all([
        prisma.demande.count({ where: whereClause }),
        prisma.demande.count({
          where: {
            ...whereClause,
            demandeAcceptee: false,
            artisans: { none: {} },
          },
        }),
        prisma.demande.count({
          where: {
            ...whereClause,
            demandeAcceptee: false,
            artisans: { some: {} },
          },
        }),
        prisma.demande.count({
          where: {
            ...whereClause,
            demandeAcceptee: true,
          },
        }),
        prisma.demande.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Statistiques par type
      const [demandesServices, demandesMetiers] = await Promise.all([
        prisma.demande.count({
          where: {
            serviceId: { not: null },
            propertyId: null,
          },
        }),
        prisma.demande.count({
          where: {
            metierId: { not: null },
            propertyId: null,
          },
        }),
      ]);

      res.json({
        total: totalDemandes,
        enAttente: demandesEnAttente,
        enCours: demandesEnCours,
        validees: demandesValidees,
        urgentes: demandesUrgentes,
        nouvelles: demandesUrgentes, // Même calcul que urgentes
        parType: {
          services: demandesServices,
          metiers: demandesMetiers,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats admin:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT /api/admin/demandes/:id/validate - Valider une demande
router.put(
  "/demandes/:id/validate",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const demande = await prisma.demande.update({
        where: { id: parseInt(id) },
        data: {
          demandeAcceptee: true,
        },
        include: {
          service: {
            select: {
              id: true,
              libelle: true,
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
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          artisans: {
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
        },
      });

      res.json({
        message: "Demande validée avec succès",
        demande,
      });
    } catch (error) {
      console.error("Erreur lors de la validation de la demande:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT /api/admin/demandes/:id/assign - Assigner à un artisan
router.put(
  "/demandes/:id/assign",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { artisanId } = req.body;

      if (!artisanId) {
        return res.status(400).json({ error: "L'ID de l'artisan est requis" });
      }

      // Vérifier si la demande existe
      const demande = await prisma.demande.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          serviceId: true,
          metierId: true,
        },
      });

      if (!demande) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }

      // Vérifier si l'artisan existe
      const artisan = await prisma.user.findUnique({
        where: { id: artisanId },
        select: {
          id: true,
          services: {
            select: { serviceId: true },
          },
          metiers: {
            select: { metierId: true },
          },
        },
      });

      if (!artisan) {
        return res.status(404).json({ error: "Artisan non trouvé" });
      }

      // Vérifier la compatibilité selon le type de demande
      if (demande.serviceId) {
        const hasService = artisan.services.some(
          (us) => us.serviceId === demande.serviceId
        );
        if (!hasService) {
          return res.status(400).json({
            error: "Cet artisan ne propose pas ce service",
          });
        }
      } else if (demande.metierId) {
        const hasMetier = artisan.metiers.some(
          (um) => um.metierId === demande.metierId
        );
        if (!hasMetier) {
          return res.status(400).json({
            error: "Cet artisan ne possède pas ce métier",
          });
        }
      }

      // Vérifier si l'artisan n'est pas déjà assigné
      const existingAssignment = await prisma.demandeArtisan.findUnique({
        where: {
          userId_demandeId: {
            userId: artisanId,
            demandeId: parseInt(id),
          },
        },
      });

      if (existingAssignment) {
        return res
          .status(400)
          .json({ error: "Cet artisan est déjà assigné à cette demande" });
      }

      // Assigner l'artisan à la demande
      const demandeArtisan = await prisma.demandeArtisan.create({
        data: {
          userId: artisanId,
          demandeId: parseInt(id),
          accepte: null,
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
        },
      });

      res.json({
        message: "Artisan assigné avec succès",
        assignment: demandeArtisan,
      });
    } catch (error) {
      console.error("Erreur lors de l'assignation de l'artisan:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/admin/artisans - Récupérer les artisans pour l'assignation
router.get(
  "/artisans",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { metierId, serviceId, demandeId } = req.query;

      let whereClause = {
        OR: [{ userType: "PRESTATAIRE" }, { role: "artisan" }],
      };

      // Si on a une demandeId, on peut filtrer les artisans compatibles
      if (demandeId) {
        const demande = await prisma.demande.findUnique({
          where: { id: parseInt(demandeId) },
          select: { serviceId: true, metierId: true },
        });

        if (demande) {
          if (demande.serviceId) {
            whereClause.services = {
              some: {
                serviceId: demande.serviceId,
              },
            };
          } else if (demande.metierId) {
            whereClause.metiers = {
              some: {
                metierId: demande.metierId,
              },
            };
          }
        }
      } else {
        // Filtres standards
        if (metierId) {
          whereClause.metiers = {
            some: {
              metierId: parseInt(metierId),
            },
          };
        }

        if (serviceId) {
          whereClause.services = {
            some: {
              serviceId: parseInt(serviceId),
            },
          };
        }
      }

      const artisans = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone: true,
          city: true,
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
                },
              },
            },
          },
        },
        orderBy: {
          companyName: "asc",
        },
      });

      res.json(artisans);
    } catch (error) {
      console.error("Erreur lors de la récupération des artisans:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

module.exports = router;
