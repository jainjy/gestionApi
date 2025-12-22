const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const prisma = new PrismaClient();

// POST: Créer une réservation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehiculeId,
      datePrise,
      dateRetour,
      lieuPrise,
      lieuRetour,
      nombreConducteurs,
      kilometrageOption,
      extras,
      nomClient,
      emailClient,
      telephoneClient,
      numeroPermis,
      adresseClient,
    } = req.body;

    // Vérifier le véhicule
    const vehicule = await prisma.vehicule.findUnique({
      where: { id: vehiculeId },
      include: { prestataire: true },
    });

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        error: "Véhicule non trouvé",
      });
    }

    if (!vehicule.disponible) {
      return res.status(400).json({
        success: false,
        error: "Ce véhicule n'est pas disponible",
      });
    }

    // Vérifier les disponibilités
    const datePriseObj = new Date(datePrise);
    const dateRetourObj = new Date(dateRetour);

    // Vérifier s'il y a des conflits de disponibilité
    const conflitsDisponibilite = await prisma.disponibiliteVehicule.findFirst({
      where: {
        vehiculeId,
        OR: [
          {
            dateDebut: { lte: dateRetourObj },
            dateFin: { gte: datePriseObj },
            disponible: false,
          },
        ],
      },
    });

    if (conflitsDisponibilite) {
      return res.status(400).json({
        success: false,
        error: "Le véhicule n'est pas disponible pour ces dates",
      });
    }

    // Vérifier s'il y a des réservations en conflit
    const conflitsReservations = await prisma.reservationVehicule.findFirst({
      where: {
        vehiculeId,
        statut: { in: ["en_attente", "confirmee", "en_cours"] },
        OR: [
          {
            datePrise: { lte: dateRetourObj },
            dateRetour: { gte: datePriseObj },
          },
        ],
      },
    });

    if (conflitsReservations) {
      return res.status(400).json({
        success: false,
        error: "Le véhicule est déjà réservé pour ces dates",
      });
    }

    // Calculer le nombre de jours
    const nombreJours = Math.ceil(
      (dateRetourObj - datePriseObj) / (1000 * 60 * 60 * 24)
    );

    if (nombreJours < 1) {
      return res.status(400).json({
        success: false,
        error: "La durée de location doit être d'au moins 1 jour",
      });
    }

    // Calculer les prix
    const prixVehicule = vehicule.prixJour * nombreJours;
    let prixExtras = 0;

    if (extras && Array.isArray(extras)) {
      // Simuler le calcul des extras (à adapter selon vos besoins)
      prixExtras = extras.reduce((total, extra) => {
        switch (extra) {
          case "gps":
            return total + 5 * nombreJours;
          case "siège-bébé":
            return total + 8 * nombreJours;
          case "wifi":
            return total + 10 * nombreJours;
          case "assurance-tous-risques":
            return total + 15 * nombreJours;
          case "conduite-additionnelle":
            return total + 12 * nombreJours;
          default:
            return total;
        }
      }, 0);
    }

    const fraisService = prixVehicule * 0.1; // 10% de frais de service
    const totalHT = prixVehicule + prixExtras + fraisService;
    const totalTTC = totalHT * 1.2; // TVA 20%

    // Créer la réservation
    const reservation = await prisma.reservationVehicule.create({
      data: {
        vehiculeId,
        clientId: userId,
        prestataireId: vehicule.prestataireId,
        datePrise: datePriseObj,
        dateRetour: dateRetourObj,
        lieuPrise: lieuPrise || vehicule.ville,
        lieuRetour: lieuRetour || vehicule.ville,
        nombreJours,
        nombreConducteurs: nombreConducteurs || 1,
        kilometrageOption: kilometrageOption || "standard",
        extras: extras || {},
        nomClient: nomClient || req.user.firstName + " " + req.user.lastName,
        emailClient: emailClient || req.user.email,
        telephoneClient: telephoneClient || req.user.phone,
        numeroPermis,
        adresseClient,
        prixVehicule,
        prixExtras,
        fraisService,
        totalHT,
        totalTTC,
        cautionBloquee: vehicule.caution,
        statut: "en_attente",
        statutPaiement: "en_attente",
      },
      include: {
        vehicule: {
          select: {
            marque: true,
            modele: true,
            images: true,
            prestataire: {
              select: {
                companyName: true,
                commercialName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Créer une notification pour le prestataire
    await prisma.notification.create({
      data: {
        userId: vehicule.prestataireId,
        type: "nouvelle_reservation",
        title: "Nouvelle réservation de véhicule",
        message: `${reservation.nomClient} a réservé votre ${vehicule.marque} ${vehicule.modele} du ${new Date(datePrise).toLocaleDateString()} au ${new Date(dateRetour).toLocaleDateString()}`,
        relatedEntity: "ReservationVehicule",
        relatedEntityId: reservation.id,
      },
    });

    // Notification Socket.io
    if (req.io) {
      req.io.to(`user:${vehicule.prestataireId}`).emit("new-reservation", {
        type: "vehicule_reservation",
        reservationId: reservation.id,
        vehicule: `${vehicule.marque} ${vehicule.modele}`,
        client: reservation.nomClient,
        dates: `${datePrise} au ${dateRetour}`,
        montant: totalTTC,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: reservation,
      message: "Réservation créée avec succès",
    });
  } catch (error) {
    console.error("Erreur création réservation:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de la réservation",
    });
  }
});

// GET: Réservations d'un utilisateur
router.get("/mes-reservations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { statut, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [{ clientId: userId }, { prestataireId: userId }],
    };

    if (statut) {
      where.statut = statut;
    }

    const total = await prisma.reservationVehicule.count({ where });

    const reservations = await prisma.reservationVehicule.findMany({
      where,
      include: {
        vehicule: {
          select: {
            marque: true,
            modele: true,
            images: true,
            typeVehicule: true,
            transmission: true,
            carburant: true,
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: reservations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des réservations",
    });
  }
});

// GET: Détails d'une réservation
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await prisma.reservationVehicule.findUnique({
      where: { id },
      include: {
        vehicule: {
          include: {
            prestataire: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                commercialName: true,
                avatar: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                zipCode: true,
              },
            },
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            zipCode: true,
          },
        },
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true,
            avatar: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            zipCode: true,
          },
        },
        avisVehicule: {
          where: { clientId: userId },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    // Vérifier les autorisations
    if (
      reservation.clientId !== userId &&
      reservation.prestataireId !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à voir cette réservation",
      });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error("Erreur récupération réservation:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la réservation",
    });
  }
});

// PUT: Mettre à jour le statut d'une réservation
router.put("/:id/statut", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { statut, raisonAnnulation } = req.body;

    const reservation = await prisma.reservationVehicule.findUnique({
      where: { id },
      include: {
        vehicule: true,
        client: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    // Vérifier les autorisations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      reservation.prestataireId !== userId &&
      reservation.clientId !== userId &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cette réservation",
      });
    }

    // Logique de validation des statuts
    const allowedStatusTransitions = {
      en_attente: ["confirmee", "annulee"],
      confirmee: ["en_cours", "annulee"],
      en_cours: ["terminee"],
      terminee: [],
      annulee: [],
    };

    if (!allowedStatusTransitions[reservation.statut]?.includes(statut)) {
      return res.status(400).json({
        success: false,
        error: "Transition de statut non autorisée",
      });
    }

    const updateData = {
      statut,
      updatedAt: new Date(),
    };

    if (statut === "annulee") {
      updateData.dateAnnulation = new Date();
      updateData.raisonAnnulation = raisonAnnulation;

      // Si annulée par le client, remboursement possible selon les conditions
      if (reservation.clientId === userId) {
        const joursAvantLocation = Math.ceil(
          (reservation.datePrise - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (joursAvantLocation > 7) {
          updateData.statutPaiement = "rembourse";
        } else {
          updateData.statutPaiement = "annule";
        }
      }
    }

    if (statut === "en_cours") {
      // Enregistrer le kilométrage de départ
      updateData.kilometrageDepart = req.body.kilometrageDepart;
      updateData.carburantDepart = req.body.carburantDepart || "plein";
      updateData.etatDepart = req.body.etatDepart || {};
    }

    if (statut === "terminee") {
      // Enregistrer le kilométrage de retour et l'état
      updateData.kilometrageRetour = req.body.kilometrageRetour;
      updateData.carburantRetour = req.body.carburantRetour;
      updateData.etatRetour = req.body.etatRetour || {};
      updateData.statutPaiement = "paye"; // Le paiement est considéré comme terminé
    }

    const updatedReservation = await prisma.reservationVehicule.update({
      where: { id },
      data: updateData,
    });

    // Créer des notifications
    const notificationMessage = {
      confirmee: `Votre réservation pour ${reservation.vehicule.marque} ${reservation.vehicule.modele} a été confirmée`,
      annulee: `La réservation pour ${reservation.vehicule.marque} ${reservation.vehicule.modele} a été annulée`,
      en_cours: `La location de ${reservation.vehicule.marque} ${reservation.vehicule.modele} a débuté`,
      terminee: `La location de ${reservation.vehicule.marque} ${reservation.vehicule.modele} est terminée`,
    };

    if (notificationMessage[statut]) {
      // Notification au client
      await prisma.notification.create({
        data: {
          userId: reservation.clientId,
          type: `reservation_${statut}`,
          title: "Mise à jour de réservation",
          message: notificationMessage[statut],
          relatedEntity: "ReservationVehicule",
          relatedEntityId: id,
        },
      });

      // Notification au prestataire (sauf si c'est lui qui a fait le changement)
      if (reservation.prestataireId !== userId) {
        await prisma.notification.create({
          data: {
            userId: reservation.prestataireId,
            type: `reservation_${statut}`,
            title: "Mise à jour de réservation",
            message: notificationMessage[statut],
            relatedEntity: "ReservationVehicule",
            relatedEntityId: id,
          },
        });
      }

      // Socket.io
      if (req.io) {
        [reservation.clientId, reservation.prestataireId].forEach(
          (targetId) => {
            if (targetId !== userId) {
              req.io.to(`user:${targetId}`).emit("reservation-updated", {
                reservationId: id,
                statut,
                message: notificationMessage[statut],
                timestamp: new Date().toISOString(),
              });
            }
          }
        );
      }
    }

    res.json({
      success: true,
      data: updatedReservation,
      message: "Statut de réservation mis à jour",
    });
  } catch (error) {
    console.error("Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du statut",
    });
  }
});

// GET: Vérifier la disponibilité
router.get("/vehicule/:vehiculeId/disponibilite", async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    const { dateDebut, dateFin } = req.query;

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        error: "Les dates de début et de fin sont requises",
      });
    }

    const dateDebutObj = new Date(dateDebut);
    const dateFinObj = new Date(dateFin);

    // Vérifier les disponibilités bloquées
    const indisponibilites = await prisma.disponibiliteVehicule.findFirst({
      where: {
        vehiculeId,
        disponible: false,
        OR: [
          {
            dateDebut: { lte: dateFinObj },
            dateFin: { gte: dateDebutObj },
          },
        ],
      },
    });

    // Vérifier les réservations existantes
    const reservationsConflits = await prisma.reservationVehicule.findFirst({
      where: {
        vehiculeId,
        statut: { in: ["en_attente", "confirmee", "en_cours"] },
        OR: [
          {
            datePrise: { lte: dateFinObj },
            dateRetour: { gte: dateDebutObj },
          },
        ],
      },
    });

    const disponible = !indisponibilites && !reservationsConflits;

    res.json({
      success: true,
      data: {
        disponible,
        indisponibilite: indisponibilites
          ? {
              raison: "Période d'indisponibilité programmée",
              dateDebut: indisponibilites.dateDebut,
              dateFin: indisponibilites.dateFin,
            }
          : null,
        reservationConflit: reservationsConflits
          ? {
              datePrise: reservationsConflits.datePrise,
              dateRetour: reservationsConflits.dateRetour,
              statut: reservationsConflits.statut,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Erreur vérification disponibilité:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de la disponibilité",
    });
  }
});

module.exports = router;
