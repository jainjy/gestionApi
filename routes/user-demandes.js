const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/demandes - Récupérer les demandes de l'utilisateur
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, metier, service } = req.query;

    // Clause where pour filtrer les demandes de services (serviceId not null) ET les demandes avec métier
    let whereClause = {
      createdById: userId,
      propertyId: null,
      OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
    };

    // Filtres optionnels
    if (status && status !== "Toutes") {
      whereClause.demandeAcceptee =
        status === "Terminé" ? true : status === "En attente" ? false : null;
    }

    if (service) {
      whereClause.serviceId = parseInt(service);
    }

    if (metier) {
      whereClause.metierId = parseInt(metier);
    }

    const demandes = await prisma.demande.findMany({
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
                metier: true,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map((demande) => {
      const artisansAcceptes = demande.artisans.filter((a) => a.accepte);

      // Déterminer le métier selon le type de demande
      let metierLibelle = "Non spécifié";
      if (demande.service && demande.service.metiers.length > 0) {
        metierLibelle =
          demande.service.metiers[0]?.metier.libelle || "Non spécifié";
      } else if (demande.metier) {
        metierLibelle = demande.metier.libelle;
      }

      // Déterminer le titre selon le type de demande
      let titre = "Demande de service";
      if (demande.service) {
        titre = `Demande ${demande.service.libelle}`;
      } else if (demande.metier) {
        titre = `Demande ${demande.metier.libelle}`;
      }

      // Correction : on utilise TOUJOURS la valeur du champ statut si c'est une string non null/undefined
      const statut =
        typeof demande.statut === "string" && demande.statut.trim() !== ""
          ? demande.statut
          : demande.demandeAcceptee
            ? "Terminé"
            : artisansAcceptes.length > 0
              ? "Devis reçus"
              : demande.artisans.length > 0
                ? "En cours"
                : "En attente";

      return {
        id: demande.id,
        titre: titre,
        metier: metierLibelle,
        lieu: `${demande.lieuAdresseCp} ${demande.lieuAdresseVille}`,
        statut: statut,
        urgence: "Moyen", // À adapter selon vos besoins
        description: demande.description,
        date: demande.createdAt.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        devisCount: artisansAcceptes.length,
        budget: "Non estimé",
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
        propertyId: demande.propertyId,
        dateSouhaitee: demande.dateSouhaitee,
        heureSouhaitee: demande.heureSouhaitee,
        type: demande.serviceId ? "service" : "metier", // Pour identifier le type de demande
      };
    });

    res.json(transformedDemandes);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/demandes/:id/statut - Mettre à jour le statut d'une demande
router.patch("/:id/statut", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    if (!statut) {
      return res.status(400).json({ error: "Le champ statut est requis." });
    }
    // Si on annule la demande, on veut la sauvegarder en historique puis la supprimer
    const lower = String(statut || "").toLowerCase();
    if (
      lower === "annulée" ||
      lower === "annulee" ||
      lower === "annulé" ||
      lower === "annule"
    ) {
      // récupère la demande courante
      const existing = await prisma.demande.findUnique({
        where: { id: parseInt(id, 10) },
      });
      if (!existing)
        return res.status(404).json({ error: "Demande introuvable" });

      // créer un snapshot historique
      try {
        await prisma.demandeHistory.create({
          data: {
            demandeId: existing.id,
            title: "Demande annulée",
            message: "La demande a été annulée et archivée.",
            snapshot: existing,
          },
        });
      } catch (e) {
        console.error("Impossible de créer historique", e);
        // continue quand même
      }

      // supprimer la demande
      await prisma.demande.delete({ where: { id: existing.id } });
      return res.json({ message: "Demande annulée et archivée" });
    }

    // Met à jour le champ "statut" de la demande dans les autres cas
    const updated = await prisma.demande.update({
      where: { id: parseInt(id, 10) },
      data: { statut },
    });
    res.json({ message: "Statut mis à jour", demande: updated });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// routes/demandes.js - Ajouter cette route
router.get("/:id/artisans-stats", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const artisans = await prisma.demandeArtisan.findMany({
      where: {
        demandeId: parseInt(id),
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
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(artisans);
  } catch (error) {
    console.error("Erreur chargement stats artisans:", error);
    res.status(500).json({
      error: "Erreur lors du chargement des statistiques des artisans",
    });
  }
});
// GET /api/demandes/:id - Retourne une demande brute (utilitaire pour debug)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
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
        metier: true,
        artisans: {
          include: {
            user: true,
          },
        },
        createdBy: true,
        property: true,
      },
    });
    if (!demande) return res.status(404).json({ error: "Demande introuvable" });
    res.json(demande);
  } catch (err) {
    console.error("Erreur fetching demande by id", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/demandes - Créer une nouvelle demande
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log(
      "Incoming POST /api/demandes payload:",
      JSON.stringify(req.body)
    );
    let {
      contactNom,
      contactPrenom,
      contactEmail,
      contactTel,
      lieuAdresse,
      lieuAdresseCp,
      lieuAdresseVille,
      optionAssurance,
      description,
      serviceId,
      metierId, // <-- NOUVEAU CHAMP pour les demandes par métier
      nombreArtisans,
      createdById,
      devis,
    } = req.body;

    // Validation : au moins serviceId OU metierId doit être fourni
    if (!serviceId && !metierId) {
      return res.status(400).json({
        error: "Au moins un service ou un métier doit être spécifié",
      });
    }

    const serviceIdInt =
      serviceId !== undefined && serviceId !== null
        ? parseInt(serviceId, 10)
        : null;

    const metierIdInt =
      metierId !== undefined && metierId !== null
        ? parseInt(metierId, 10)
        : null;

    // Prefer server-side authenticated user id (safer) but fall back to body.createdById if provided.
    const authUserId = req.user && req.user.id ? req.user.id : null;
    const createdByIdStr = authUserId || createdById || null;

    // Validation étendue
    if (!createdByIdStr) {
      return res
        .status(400)
        .json({ error: "L'utilisateur (createdById) est requis" });
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res.status(400).json({
        error: "Les informations de contact sont obligatoires",
      });
    }

    let service = null;
    let metier = null;

    // Vérifier que le service existe (si serviceId fourni)
    if (serviceIdInt && !Number.isNaN(serviceIdInt)) {
      service = await prisma.service.findUnique({
        where: { id: serviceIdInt },
        select: { 
          id: true,
          libelle: true,
          metiers: {
            include: {
              metier: {
                select: {
                  libelle: true
                }
              }
            }
          }
        },
      });

      if (!service) {
        return res.status(404).json({ error: "Service non trouvé" });
      }
    }

    // Vérifier que le métier existe (si metierId fourni)
    if (metierIdInt && !Number.isNaN(metierIdInt)) {
      metier = await prisma.metier.findUnique({
        where: { id: metierIdInt },
        select: { 
          id: true,
          libelle: true 
        },
      });

      if (!metier) {
        return res.status(404).json({ error: "Métier non trouvé" });
      }
    }

    // Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: createdByIdStr },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Créer la demande
    const nouvelleDemande = await prisma.demande.create({
      data: {
        contactNom,
        contactPrenom,
        contactEmail,
        contactTel,
        lieuAdresse: lieuAdresse || "",
        lieuAdresseCp: lieuAdresseCp || "",
        lieuAdresseVille: lieuAdresseVille || "",
        optionAssurance: optionAssurance || false,
        description,
        serviceId: serviceIdInt,
        metierId: metierIdInt, // <-- NOUVEAU CHAMP
        // Assurer que la nouvelle demande est marquée en attente par défaut
        statut: "en attente",
        nombreArtisans: nombreArtisans || "UNIQUE",
        createdById: createdByIdStr,
      },
      include: {
        service: {
          select: {
            id: true,
            libelle: true,
            description: true,
            images: true,
            price: true,
            duration: true,
            metiers: {
              include: {
                metier: true,
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
      },
    });

    // CRÉATION AUTOMATIQUE DE LA CONVERSATION POUR LES DEMANDES DE SERVICES OU MÉTIERS
    let conversation = null;
    
    // Créer une conversation pour toutes les demandes (services ou métiers)
    // puisque cette route ne gère pas les demandes immobilières
    if (service || metier) {
      // Déterminer le titre de la conversation
      let titreConversation = "Demande de service";
      if (service) {
        titreConversation = `Demande ${service.libelle}`;
      } else if (metier) {
        titreConversation = `Demande ${metier.libelle}`;
      }

      // Créer la conversation avec seulement le créateur comme participant initial
      // Les artisans seront ajoutés plus tard quand ils accepteront la demande
      conversation = await prisma.conversation.create({
        data: {
          titre: titreConversation,
          demandeId: nouvelleDemande.id,
          createurId: createdByIdStr,
          participants: {
            create: [{ userId: createdByIdStr }] // Seulement le créateur initialement
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Ajouter un message système pour la création de la demande
      let messageContenu = `Nouvelle demande créée.`;
      if (service) {
        messageContenu = `Nouvelle demande de ${service.libelle} créée.`;
      } else if (metier) {
        messageContenu = `Nouvelle demande de ${metier.libelle} créée.`;
      }
      
      if (description) {
        messageContenu += ` Description : ${description}`;
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: createdByIdStr,
          contenu: messageContenu,
          type: 'SYSTEM',
          evenementType: 'DEMANDE_ENVOYEE'
        }
      });
    }

    const response = {
      message: "Demande créée avec succès",
      demande: nouvelleDemande
    };

    // Ajouter les infos de conversation si créée
    if (conversation) {
      response.conversation = {
        id: conversation.id,
        titre: conversation.titre,
        participants: conversation.participants
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error);

    if (error.code === "P2003") {
      return res.status(400).json({ error: "Référence invalide" });
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/demandes/:id/history - Ajouter une entrée d'historique pour une demande
router.post("/:id/history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { entry } = req.body;
    if (!entry) return res.status(400).json({ error: "entry required" });

    // For now, we do a lightweight implementation: return the given entry as the server history.
    // TODO: persist to DB (add DemandeHistory model) for real persistence.
    const serverHistory = [entry];
    res.status(201).json({ history: serverHistory });
  } catch (err) {
    console.error("Erreur saving history", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/demandes/stats - Statistiques des demandes
router.get("/stats/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const totalDemandes = await prisma.demande.count({
      where: {
        createdById: userId,
        propertyId: null,
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
      },
    });

    const demandesEnCours = await prisma.demande.count({
      where: {
        createdById: userId,
        propertyId: null,
        demandeAcceptee: false,
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
        artisans: {
          some: {},
        },
      },
    });

    const demandesAvecDevis = await prisma.demande.count({
      where: {
        createdById: userId,
        propertyId: null,
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
        artisans: {
          some: {
            accepte: true,
          },
        },
      },
    });

    const demandesTerminees = await prisma.demande.count({
      where: {
        createdById: userId,
        propertyId: null,
        OR: [{ serviceId: { not: null } }, { metierId: { not: null } }],
        demandeAcceptee: true,
      },
    });

    res.json({
      total: totalDemandes,
      enCours: demandesEnCours,
      avecDevis: demandesAvecDevis,
      terminees: demandesTerminees,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
