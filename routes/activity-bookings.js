const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();

// POST créer une réservation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      activityId,
      bookingDate,
      startTime,
      endTime,
      participants,
      specialRequests,
      participantNames,
      participantEmails,
    } = req.body;

    // Vérifier l'activité
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        creator: true,
      },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activité non trouvée",
      });
    }

    // Vérifier les limites de participants
    if (participants < activity.minParticipants) {
      return res.status(400).json({
        success: false,
        error: `Minimum ${activity.minParticipants} participant(s) requis`,
      });
    }

    if (activity.maxParticipants && participants > activity.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${activity.maxParticipants} participants autorisés`,
      });
    }

    // Calculer le prix total
    let totalAmount = (activity.price || 0) * participants;

    // Créer la réservation
    const booking = await prisma.activityBooking.create({
      data: {
        activityId,
        userId: req.user.id,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        participants: parseInt(participants),
        totalAmount,
        specialRequests,
        participantNames: participantNames || [],
        participantEmails: participantEmails || [],
        status: "pending",
        paymentStatus: "pending",
      },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Mettre à jour le compteur de réservations de l'activité
    await prisma.activity.update({
      where: { id: activityId },
      data: { bookingCount: { increment: 1 } },
    });

    // Créer un paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "eur",
      metadata: {
        bookingId: booking.id,
        activityId,
        userId: req.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Mettre à jour la réservation avec l'ID de paiement
    await prisma.activityBooking.update({
      where: { id: booking.id },
      data: {
        // Note: Ajoutez paymentIntentId à votre modèle si nécessaire
        // paymentIntentId: paymentIntent.id
      },
    });

    res.json({
      success: true,
      data: {
        booking,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de la réservation",
    });
  }
});

// GET mes réservations
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const bookings = await prisma.activityBooking.findMany({
      where,
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        review: true,
      },
      orderBy: { bookedAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.activityBooking.count({ where });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des réservations",
    });
  }
});

// GET réservations de mes activités (pour les professionnels)
router.get("/my-activity-bookings", authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Trouver les activités de l'utilisateur
    const userActivities = await prisma.activity.findMany({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const activityIds = userActivities.map((a) => a.id);

    if (activityIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0,
        },
      });
    }

    const where = {
      activityId: { in: activityIds },
    };
    if (status) where.status = status;

    const bookings = await prisma.activityBooking.findMany({
      where,
      include: {
        activity: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        review: true,
      },
      orderBy: { bookedAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.activityBooking.count({ where });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity bookings:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des réservations",
    });
  }
});

// PUT annuler une réservation
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: {
        activity: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    // Autoriser le client, le propriétaire de l'activité, ou un admin
    const isOwner = booking.userId === req.user.id;
    const isActivityOwner = booking.activity.userId === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isActivityOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à annuler cette réservation",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Réservation déjà annulée",
      });
    }

    // Annuler la réservation
    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: "Réservation annulée avec succès",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'annulation de la réservation",
    });
  }
});

// PUT confirmer une réservation (pour les propriétaires d'activités)
router.put("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: {
        activity: true,
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'activité
    if (booking.activity.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à confirmer cette réservation",
      });
    }

    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
      },
      include: {
        activity: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: "Réservation confirmée avec succès",
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la confirmation de la réservation",
    });
  }
});

// PUT marquer comme complété
router.put("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: {
        activity: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'activité
    if (booking.activity.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorisé",
      });
    }

    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: {
        status: "completed",
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: "Réservation marquée comme complétée",
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de la réservation",
    });
  }
});

module.exports = router;
