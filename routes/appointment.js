const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// ✅ Garder cette route telle quelle
router.get("/appointment", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            id: true,
            libelle: true,
            price: true,
            description: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous" });
  }
});

// ✅ CORRIGER : Supprimer /api/ devant ces routes
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: {
          select: { id: true, libelle: true, price: true, description: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Erreur détails réservation :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des détails" });
  }
});

// ✅ CORRIGER : Supprimer /api/ devant ces routes
router.patch("/:id/reschedule", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    console.log("📅 Données reçues pour reprogrammation:", { id, date, time });

    if (!date || !time) {
      return res.status(400).json({ error: "Date et heure requises" });
    }

    // Vérifier si le rendez-vous existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      console.log("❌ Rendez-vous non trouvé:", id);
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Vérifier que l'utilisateur est propriétaire du rendez-vous
    if (existingAppointment.userId !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // ✅ CORRECTION : Convertir la string en objet Date
    const dateObject = new Date(date);
    
    // Vérifier que la date est valide
    if (isNaN(dateObject.getTime())) {
      return res.status(400).json({ error: "Format de date invalide" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { 
        date: dateObject, // ✅ Maintenant un objet Date
        time 
      },
    });

    console.log("✅ Rendez-vous reprogrammé:", updated);
    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Erreur reprogrammation :", error);
    console.error("Stack trace:", error.stack);
    
    // Message d'erreur plus détaillé
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }
    
    res.status(500).json({ 
      error: "Erreur lors de la reprogrammation",
      details: error.message 
    });
  }
});
// ✅ CORRIGER : Supprimer /api/ devant ces routes
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Erreur annulation :", error);
    res.status(500).json({ error: "Erreur lors de l'annulation" });
  }
});

module.exports = router;