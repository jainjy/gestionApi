const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// Récupérer tous les événements de l'agenda
router.get("/evenements", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les demandes
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [{ createdById: userId }, { artisanId: userId }],
      },
      include: {
        service: true,
        metier: true,
        property: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        artisans: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Récupérer les demandes artisan
    const demandesArtisan = await prisma.demandeArtisan.findMany({
      where: {
        userId: userId,
      },
      include: {
        demande: {
          include: {
            service: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Récupérer les rendez-vous
    const rendezVous = await prisma.appointment.findMany({
      where: {
        userId: userId,
      },
      include: {
        service: true,
      },
    });

    // Récupérer les devis
    const devis = await prisma.devis.findMany({
      where: {
        OR: [{ clientId: userId }, { prestataireId: userId }],
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        demande: true,
      },
    });

    // Récupérer les commandes
    const commandes = await prisma.order.findMany({
      where: {
        userId: userId,
      },
    });

    // Récupérer les réservations tourisme
    const reservations = await prisma.tourismeBooking.findMany({
      where: {
        userId: userId,
      },
      include: {
        listing: true,
      },
    });

    // Récupérer les audits
    const audits = await prisma.audit.findMany({
      where: {
        userId: userId,
      },
    });

    // Transformer les données en format standardisé
    const evenements = [];

    // Transformer les demandes
    demandes.forEach((demande) => {
      evenements.push({
        id: `demande-${demande.id}`,
        titre: `Demande ${demande.service?.libelle || "de service"}`,
        type: "DEMANDE",
        statut: demande.statut?.toUpperCase() || "EN_ATTENTE",
        date:
          demande.dateSouhaitee?.toISOString().split("T")[0] ||
          demande.createdAt.toISOString().split("T")[0],
        heureDebut: demande.heureSouhaitee,
        description: demande.description,
        client: demande.createdBy
          ? {
              nom: `${demande.createdBy.firstName} ${demande.createdBy.lastName}`,
              email: demande.createdBy.email,
              telephone: demande.createdBy.phone,
            }
          : null,
        lieu: demande.lieuAdresse,
        couleur: "#3B82F6",
        metadata: {
          demandeId: demande.id,
          serviceId: demande.serviceId,
          metierId: demande.metierId,
          propertyId: demande.propertyId,
        },
      });
    });

    // Transformer les demandes artisan
    demandesArtisan.forEach((demandeArtisan) => {
      evenements.push({
        id: `demande-artisan-${demandeArtisan.userId}-${demandeArtisan.demandeId}`,
        titre: `Rendez-vous Artisan - ${demandeArtisan.demande.service?.libelle || "Service"}`,
        type: "DEMANDE_ARTISAN",
        statut: demandeArtisan.accepte
          ? "CONFIRME"
          : demandeArtisan.recruited
            ? "TERMINE"
            : "EN_ATTENTE",
        date:
          demandeArtisan.rdv?.toISOString().split("T")[0] ||
          demandeArtisan.createdAt.toISOString().split("T")[0],
        heureDebut: demandeArtisan.rdv
          ? demandeArtisan.rdv.toTimeString().split(" ")[0].substring(0, 5)
          : null,
        description:
          demandeArtisan.rdvNotes ||
          `Demande artisan pour ${demandeArtisan.demande.service?.libelle}`,
        client: demandeArtisan.demande.createdBy
          ? {
              nom: `${demandeArtisan.demande.createdBy.firstName} ${demandeArtisan.demande.createdBy.lastName}`,
              email: demandeArtisan.demande.createdBy.email,
              telephone: demandeArtisan.demande.createdBy.phone,
            }
          : null,
        lieu: demandeArtisan.demande.lieuAdresse,
        couleur: "#F59E0B",
        metadata: {
          userId: demandeArtisan.userId,
          demandeId: demandeArtisan.demandeId,
          travauxTermines: demandeArtisan.travauxTermines,
          factureConfirmee: demandeArtisan.factureConfirmee,
        },
      });
    });

    // Transformer les rendez-vous
    rendezVous.forEach((rdv) => {
      evenements.push({
        id: `rdv-${rdv.id}`,
        titre: `Rendez-vous ${rdv.service.libelle}`,
        type: "RENDEZ_VOUS",
        statut: rdv.status.toUpperCase(),
        date: rdv.date.toISOString().split("T")[0],
        heureDebut: rdv.time,
        description: rdv.message,
        couleur: "#8B5CF6",
        metadata: {
          serviceId: rdv.serviceId,
          message: rdv.message,
        },
      });
    });

    // Transformer les devis
    devis.forEach((devis) => {
      evenements.push({
        id: `devis-${devis.id}`,
        titre: `Devis ${devis.numero}`,
        type: "DEVIS",
        statut: devis.status.toUpperCase(),
        date: devis.dateCreation.toISOString().split("T")[0],
        dateValidite: devis.dateValidite.toISOString().split("T")[0],
        montant: devis.montantTTC,
        description: devis.description,
        client: devis.client
          ? {
              nom: `${devis.client.firstName} ${devis.client.lastName}`,
              email: devis.client.email,
              telephone: devis.client.phone,
            }
          : null,
        couleur: "#10B981",
        metadata: {
          numero: devis.numero,
          montantHT: devis.montantHT,
          tva: devis.tva,
          demandeId: devis.demandeId,
        },
      });
    });

    // Transformer les commandes
    commandes.forEach((commande) => {
      evenements.push({
        id: `commande-${commande.id}`,
        titre: `Commande ${commande.orderNumber}`,
        type: "COMMANDE",
        statut: commande.status.toUpperCase(),
        date: commande.createdAt.toISOString().split("T")[0],
        montant: commande.totalAmount,
        description: `Commande ${commande.orderNumber}`,
        couleur: "#F59E0B",
        metadata: {
          orderNumber: commande.orderNumber,
          paymentStatus: commande.paymentStatus,
        },
      });
    });

    // Transformer les réservations
    reservations.forEach((reservation) => {
      evenements.push({
        id: `reservation-${reservation.id}`,
        titre: `Réservation ${reservation.listing.title}`,
        type: "RESERVATION",
        statut: reservation.status.toUpperCase(),
        date: reservation.checkIn.toISOString().split("T")[0],
        heureDebut: "16:00", // Heure standard check-in
        description: `Réservation ${reservation.listing.title}`,
        lieu: reservation.listing.city,
        couleur: "#6366F1",
        metadata: {
          checkIn: reservation.checkIn.toISOString().split("T")[0],
          checkOut: reservation.checkOut.toISOString().split("T")[0],
          guests: reservation.guests,
          totalAmount: reservation.totalAmount,
        },
      });
    });

    // Transformer les audits
    audits.forEach((audit) => {
      evenements.push({
        id: `audit-${audit.id}`,
        titre: `Audit ${audit.titre}`,
        type: "AUDIT",
        statut: audit.statut.toUpperCase(),
        date: audit.dateAudit.toISOString().split("T")[0],
        description: audit.description,
        couleur: "#6B7280",
        metadata: {
          type: audit.type,
          responsable: audit.responsable,
        },
      });
    });

    res.json({
      success: true,
      evenements: evenements,
    });
  } catch (error) {
    console.error("Erreur récupération événements:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des événements",
    });
  }
});

module.exports = router;
