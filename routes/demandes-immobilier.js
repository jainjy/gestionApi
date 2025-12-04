const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// POST /api/demandes/immobilier - Créer une nouvelle demande
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
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
      nombreArtisans,
      createdById,
      propertyId,
      dateSouhaitee,
      heureSouhaitee,
      artisanId,
    } = req.body;

    // Validation de base
    if (!serviceId || !createdById) {
      return res
        .status(400)
        .json({ error: "serviceId et createdById sont requis" });
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res
        .status(400)
        .json({ error: "Les informations de contact sont obligatoires" });
    }

    // Vérifier si c'est une demande de service (propertyId est null pour les services)
    const isDemandeService = !propertyId;

    let service = null;
    if (isDemandeService) {
      service = await prisma.service.findUnique({
        where: { id: parseInt(serviceId) },
        select: {
          libelle: true,
          metiers: {
            include: {
              metier: {
                select: {
                  libelle: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        return res.status(404).json({ error: "Service non trouvé" });
      }
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
        serviceId: parseInt(serviceId),
        statut: "en attente",
        nombreArtisans: nombreArtisans || "UNIQUE",
        createdById,
        propertyId,
        artisanId,
        dateSouhaitee:
          dateSouhaitee && heureSouhaitee
            ? new Date(dateSouhaitee + "T" + heureSouhaitee + ":00.000Z")
            : dateSouhaitee
              ? new Date(dateSouhaitee + "T00:00:00.000Z")
              : null,
        heureSouhaitee: heureSouhaitee || null,
      },
      include: {
        property: {
          include: {
            owner: {
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
        },
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
        artisan: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            commercialName: true,
          },
        },
      },
    });

    let conversation = null;

    if (isDemandeService) {
      const participants = [{ userId: createdById }];

      if (artisanId) {
        participants.push({ userId: artisanId });
      }

      conversation = await prisma.conversation.create({
        data: {
          titre: `Demande ${service.libelle}`,
          demandeId: nouvelleDemande.id,
          createurId: createdById,
          participants: {
            create: participants,
          },
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
                  email: true,
                },
              },
            },
          },
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: createdById,
          contenu: `Nouvelle demande de ${service.libelle} créée. ${description ? `Description : ${description}` : ""}`,
          type: "SYSTEM",
          evenementType: "DEMANDE_ENVOYEE",
        },
      });

      if (artisanId) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            expediteurId: createdById,
            contenu: `Cette demande vous est spécialement adressée. Merci de prendre contact avec le client dans les plus brefs délais.`,
            type: "SYSTEM",
            evenementType: "GENERIC",
          },
        });
      }
    }

    const response = {
      message: "Demande créée avec succès",
      demande: nouvelleDemande,
    };

    if (isDemandeService && conversation) {
      response.conversation = {
        id: conversation.id,
        titre: conversation.titre,
        participants: conversation.participants,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/demandes/immobilier/user/:userId - Récupérer les demandes de visite envoyées par un utilisateur
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let whereClause = {
      createdById: userId,
      NOT: {
        propertyId: null,
        statut: "archivée",
      },
    };

    if (status) {
      whereClause.statut = status;
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            owner: {
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

    const transformedDemandes = demandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut || "en attente",
      description: demande.description,
      date: demande.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt,
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/demandes/immobilier/owner/:userId - Récupérer les demandes de visite pour les propriétés d'un utilisateur
router.get("/owner/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
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
    });

    const propertyIds = userProperties.map((p) => p.id);
    const propertiesMap = new Map(userProperties.map((p) => [p.id, p]));

    let whereClause = {
      propertyId: {
        in: propertyIds,
      },
    };

    if (status) {
      whereClause.statut = status;
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: true,
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

    const enrichedDemandes = demandes.map((demande) => {
      const property = propertiesMap.get(demande.propertyId);
      return {
        ...demande,
        property: property
          ? {
              ...demande.property,
              owner: property.owner,
            }
          : demande.property,
      };
    });

    const transformedDemandes = enrichedDemandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut || "en attente",
      description: demande.description,
      date: demande.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt,
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/demandes/immobilier/:id/statut - CORRIGÉ
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    console.log(`🔄 [BACKEND] Changement statut demande ${id} -> ${statut}`);

    // CORRECTION: Utiliser 'createdBy' au lieu de 'user'
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        createdBy: true  // CORRIGÉ
      }
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Mettre à jour le statut
    const updatedDemande = await prisma.demande.update({
      where: { id: parseInt(id) },
      data: { statut },
      include: {
        property: true,
        createdBy: true  // CORRIGÉ
      }
    });

    console.log(`✅ [BACKEND] Demande ${id} mise à jour: ${statut}`);

    // NOTE: La création de réservation se fait dans ListingsPage.jsx
    // quand le prestataire marque le bien comme "loué"
    // Cette route gère seulement la validation/refus de la demande

    res.json({
      message: 'Statut mis à jour avec succès',
      demande: updatedDemande
    });

  } catch (error) {
    console.error('❌ [BACKEND] Erreur mise à jour statut:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message 
    });
  }
});

// GET /api/demandes/immobilier/property/:propertyId - CORRIGÉ
router.get("/property/:propertyId", authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    console.log(`🔍 [BACKEND] Recherche demandes pour propriété: ${propertyId}`);
    
    // NE PAS utiliser parseInt() car propertyId est un UUID (string)
    const demandes = await prisma.demande.findMany({
      where: {
        propertyId: propertyId,  // ✅ Utiliser directement le string
        statut: { in: ['validée', 'en attente'] }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            rentType: true  // ✅ CORRIGÉ: utiliser rentType au lieu de locationType
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ [BACKEND] ${demandes.length} demandes trouvées`);
    
    const formattedDemandes = demandes.map(demande => ({
      id: demande.id,
      statut: demande.statut,
      clientId: demande.createdById,
      contactEmail: demande.contactEmail,
      contactPrenom: demande.contactPrenom,
      contactNom: demande.contactNom,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      createdAt: demande.createdAt,
      property: demande.property
    }));
    
    res.json(formattedDemandes);
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur récupération demandes:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/demandes/immobilier/:id - Supprimer ou archiver une demande selon le contexte
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        property: true,
        createdBy: true,
      },
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande introuvable" });
    }

    const isRequestCreator = demande.createdById === req.user.id;
    const isPropertyOwner = demande.property?.ownerId === req.user.id;

    if (isRequestCreator) {
      await prisma.demande.delete({
        where: { id: parseInt(id, 10) },
      });
      res.json({ message: "Demande supprimée définitivement" });
    } else if (isPropertyOwner) {
      await prisma.demandeHistory.create({
        data: {
          demandeId: demande.id,
          title: "Demande archivée",
          message: `Demande archivée pour le bien: ${demande.property?.title || "Non spécifié"}`,
          snapshot: demande,
        },
      });

      await prisma.demande.update({
        where: { id: parseInt(id, 10) },
        data: {
          statut: "archivée",
          archived: true,
          isRead: true,
        },
      });
      res.json({ message: "Demande archivée avec succès" });
    } else {
      res.status(403).json({ error: "Non autorisé à supprimer cette demande" });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la suppression/archivage de la demande:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/demandes/immobilier/:id/history - Obtenir l'historique d'une demande
router.get("/:id/history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.demandeHistory.findMany({
      where: { demandeId: parseInt(id, 10) },
      orderBy: { createdAt: "desc" },
    });
    res.json(history);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/demandes/immobilier/user/:userId/history - Obtenir l'historique de toutes les demandes d'un utilisateur
router.get("/user/:userId/history", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const demandes = await prisma.demande.findMany({
      where: {
        createdById: userId,
        NOT: { propertyId: null },
      },
      select: { id: true },
    });

    const demandeIds = demandes.map((d) => d.id);

    const history = await prisma.demandeHistory.findMany({
      where: {
        demandeId: { in: demandeIds },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(history);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;