const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

router.get("/my-services", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // id du compte connecté

    const appointments = await prisma.appointment.findMany({
      where: {
        service: {
          users: {
            some: {
              userId: userId
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            libelle: true,
            price: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Erreur récupération appointments :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations",
      error: error.message
    });
  }
});

module.exports = router;
