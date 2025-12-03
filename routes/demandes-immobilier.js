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
      // Récupérer les informations du service pour la conversation
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
      // Déterminer les participants initiaux
      const participants = [{ userId: createdById }]; // Le créateur de la demande

      // Si un artisan spécifique est ciblé, l'ajouter comme participant
      if (artisanId) {
        participants.push({ userId: artisanId });
      }

      // Créer la conversation seulement pour les services
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

      // Ajouter un message système pour la création de la demande
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: createdById,
          contenu: `Nouvelle demande de ${service.libelle} créée. ${description ? `Description : ${description}` : ""}`,
          type: "SYSTEM",
          evenementType: "DEMANDE_ENVOYEE",
        },
      });

      // Si un artisan spécifique est ciblé, ajouter un message spécial
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

    // Ajouter les infos de conversation seulement pour les services
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
        statut: "archivée", // Ne pas montrer les demandes archivées pour l'utilisateur
      },
    };

    // Filtre par statut si fourni
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

    // D'abord, récupérer toutes les propriétés de l'utilisateur avec leurs propriétaires
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

    // Créer un map des propriétés pour un accès facile plus tard
    const propertiesMap = new Map(userProperties.map((p) => [p.id, p]));

    let whereClause = {
      propertyId: {
        in: propertyIds,
      },
    };

    // Filtre par statut si fourni
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

    // Enrichir les demandes avec les informations du propriétaire
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

// PATCH /api/demandes/:id/statut
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    console.log(`🔄 [BACKEND] Changement statut demande ${id} -> ${statut}`);

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        user: true
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
        user: true
      }
    });

    console.log(`✅ [BACKEND] Demande ${id} mise à jour: ${statut}`);

    // Si le statut est "loué" et qu'il y a une propriété, créer une réservation SAISONNIÈRE
    const statutLower = statut.toLowerCase();
    const statutsLoue = ['loué', 'loue', 'rented', 'location confirmée'];
    
    if (statutsLoue.includes(statutLower) && demande.propertyId) {
      console.log(`🏠 [BACKEND] Déclenchement création réservation pour demande ${id}`);
      
      // Vérifier si la propriété est en location saisonnière
      if (demande.property.locationType === 'saisonnier') {
        
        // Vérifier si une réservation existe déjà
        const existingReservation = await prisma.locationSaisonniere.findFirst({
          where: {
            propertyId: demande.propertyId,
            clientId: demande.userId,
            statut: { in: ['en_attente', 'confirmee', 'en_cours'] }
          }
        });

        if (!existingReservation) {
          // Calculer les dates
          const dateDebut = new Date();
          dateDebut.setDate(dateDebut.getDate() + 7); // Début dans 7 jours
          
          const dateFin = new Date(dateDebut);
          dateFin.setDate(dateFin.getDate() + 7); // 7 nuits

          // Calculer le prix total
          const nuits = 7;
          const prixTotal = (demande.property?.price || 0) * nuits;

          // Créer la réservation
          const reservation = await prisma.locationSaisonniere.create({
            data: {
              propertyId: demande.propertyId,
              clientId: demande.userId,
              dateDebut,
              dateFin,
              prixTotal,
              nombreAdultes: 2,
              nombreEnfants: 0,
              statut: 'confirmee',
              remarques: `Réservation créée automatiquement suite à la visite du ${new Date().toLocaleDateString('fr-FR')} (Demande #${demande.id})`
            },
            include: {
              property: true,
              client: true
            }
          });

          console.log(`✅ [BACKEND] Réservation créée: ${reservation.id}`);

          // Créer un paiement associé
          await prisma.paiementLocation.create({
            data: {
              locationId: reservation.id,
              montant: prixTotal * 0.3,
              methode: 'virement',
              reference: `AUTO-RES-${reservation.id}-${Date.now()}`,
              statut: 'en_attente',
              datePaiement: new Date()
            }
          });

          // Ajouter à l'historique
          await prisma.demandeHistory.create({
            data: {
              demandeId: demande.id,
              title: 'Réservation créée',
              message: `Une réservation saisonnière (#${reservation.id}) a été créée automatiquement`,
              metadata: {
                reservationId: reservation.id,
                dates: `${dateDebut.toLocaleDateString('fr-FR')} - ${dateFin.toLocaleDateString('fr-FR')}`,
                nuits: nuits,
                prixTotal: prixTotal
              }
            }
          });

          // Notifier le client
          await prisma.notification.create({
            data: {
              type: 'reservation_created',
              title: 'Nouvelle réservation',
              message: `Votre réservation pour "${demande.property?.title}" a été créée. Dates: ${dateDebut.toLocaleDateString('fr-FR')} - ${dateFin.toLocaleDateString('fr-FR')}`,
              relatedEntity: 'locationSaisonniere',
              relatedEntityId: String(reservation.id),
              userId: demande.userId,
              read: false
            }
          });

          return res.json({
            message: 'Statut mis à jour et réservation saisonnière créée',
            demande: updatedDemande,
            reservation: reservation,
            notification: 'Le client a été notifié'
          });

        } else {
          console.log(`ℹ️ [BACKEND] Réservation existante déjà: ${existingReservation.id}`);
          
          // Mettre à jour le statut de la réservation existante
          await prisma.locationSaisonniere.update({
            where: { id: existingReservation.id },
            data: { statut: 'confirmee' }
          });

          return res.json({
            message: 'Statut mis à jour et réservation existante confirmée',
            demande: updatedDemande,
            reservation: existingReservation
          });
        }
      } else {
        console.log(`⚠️ [BACKEND] La propriété n'est pas en location saisonnière (type: ${demande.property?.locationType})`);
      }
    }

    res.json({
      message: 'Statut mis à jour',
      demande: updatedDemande
    });

  } catch (error) {
    console.error('❌ [BACKEND] Erreur mise à jour statut:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/demandes/immobilier/:id - Supprimer ou archiver une demande selon le contexte
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // D'abord récupérer la demande avec toutes les informations nécessaires
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

    // Vérifier si l'utilisateur est le propriétaire de la demande ou le propriétaire du bien
    const isRequestCreator = demande.createdById === req.user.id;
    const isPropertyOwner = demande.property?.ownerId === req.user.id;

    if (isRequestCreator) {
      // Si c'est l'utilisateur qui a créé la demande, vraie suppression
      await prisma.demande.delete({
        where: { id: parseInt(id, 10) },
      });
      res.json({ message: "Demande supprimée définitivement" });
    } else if (isPropertyOwner) {
      // Pour le professionnel, juste marquer comme archivée
      await prisma.demandeHistory.create({
        data: {
          demandeId: demande.id,
          title: "Demande archivée",
          message: `Demande archivée pour le bien: ${demande.property?.title || "Non spécifié"}`,
          snapshot: demande,
        },
      });

      // Mettre à jour le statut comme archivée
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
      // Si l'utilisateur n'est ni le créateur ni le propriétaire
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

    // Récupérer toutes les demandes de l'utilisateur
    const demandes = await prisma.demande.findMany({
      where: {
        createdById: userId,
        NOT: { propertyId: null },
      },
      select: { id: true },
    });

    const demandeIds = demandes.map((d) => d.id);

    // Récupérer l'historique pour toutes ces demandes
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
