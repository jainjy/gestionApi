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
      where: { libelle: "Droit de famille" },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service 'Droit de famille' introuvable.",
      });
    }

    const demande = await prisma.droitFamille.create({
      data: {
        userId,
        serviceId: service.id,
        serviceType,
        sousType,
        description,
         status: "pending", 
      }
    });

    res.status(201).json({
      success: true,
      message: "Demande enregistrée avec succès",
      data: demande,
    });
  } catch (error) {
    console.error("Erreur insertion DroitFamille:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// GET : Récupérer les demandes d’un utilisateur connecté
router.get("/", async (req, res) => {
  try {
    const demandes = await prisma.droitFamille.findMany({
      include: {
        service: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: demandes,
    });
  } catch (error) {
    console.error("Erreur get DroitFamille:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});


// CHANGER LE STATUT D'UNE DEMANDE DROIT FAMILLE
router.put("/update/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID invalide"
      });
    }

    const allowedStatus = ["pending", "valider", "Annuler"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide. Statuts autorisés : pending, valider, Annuler"
      });
    }

    const updated = await prisma.droitFamille.update({
      where: { id },
      data: { status }
    });

    return res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur update status droitFamille:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});



module.exports = router;
