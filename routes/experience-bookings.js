const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateToken } = require("../middleware/auth");

/**
 * Récupérer les réservations d'un utilisateur
 * GET /api/experience-bookings/user
 */
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.experienceBooking.findMany({
      where: {
        userId: req.userId,
      },
      include: {
        experience: {
          include: {
            guide: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des réservations",
    });
  }
});

/**
 * Annuler une réservation
 * PUT /api/experience-bookings/:id/cancel
 */
router.put("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.experienceBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Réservation non trouvée",
      });
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à annuler cette réservation",
      });
    }

    // Vérifier si l'annulation est possible (au moins 48h avant)
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursBeforeCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (hoursBeforeCheckIn < 48) {
      return res.status(400).json({
        success: false,
        error: "Annulation impossible moins de 48h avant la date de début",
      });
    }

    const updatedBooking = await prisma.experienceBooking.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
      include: {
        experience: {
          select: {
            title: true,
          },
        },
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

module.exports = router;