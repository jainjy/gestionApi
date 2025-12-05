const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// INSERTION D'UNE DEMANDE DROIT DE FAMILLE
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceType, sousType, description } = req.body;

    // Vérifier le service "Droit de famille"
    const service = await prisma.service.findFirst({
      where: { libelle: "Droit de famille" }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service 'Droit de famille' introuvable."
      });
    }

    const demande = await prisma.droitFamille.create({
      data: {
        userId,
        serviceId: service.id,
        serviceType,
        sousType,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: "Demande enregistrée avec succès",
      data: demande
    });

  } catch (error) {
    console.error("Erreur insertion DroitFamille:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});

// GET : Récupérer les demandes d’un utilisateur connecté
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const demandes = await prisma.droitFamille.findMany({
      where: { userId },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: demandes
    });

  } catch (error) {
    console.error("Erreur get DroitFamille:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
