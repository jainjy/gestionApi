// routes/professional-settings.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// GET - Récupérer les paramètres professionnels de l'utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await prisma.professionalSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Paramètres professionnels non trouvés",
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Erreur récupération paramètres:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des paramètres",
    });
  }
});

// POST - Créer des paramètres professionnels
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    // Vérifier si l'utilisateur a le rôle professionnel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, userType: true },
    });

    if (
      !user ||
      (user.role !== "professional" && !user.userType?.includes("PRESTATAIRE"))
    ) {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux professionnels",
      });
    }

    // Vérifier si des paramètres existent déjà
    const existingSettings = await prisma.professionalSettings.findUnique({
      where: { userId },
    });

    if (existingSettings) {
      return res.status(400).json({
        success: false,
        error: "Paramètres déjà existants",
      });
    }

    const settings = await prisma.professionalSettings.create({
      data: {
        userId,
        ...settingsData,
      },
    });

    res.json({
      success: true,
      data: settings,
      message: "Paramètres professionnels créés avec succès",
    });
  } catch (error) {
    console.error("Erreur création paramètres:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création des paramètres",
    });
  }
});

// PUT - Mettre à jour les paramètres professionnels
router.put("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    // Vérifier si les paramètres existent
    const existingSettings = await prisma.professionalSettings.findUnique({
      where: { userId },
    });

    let settings;

    if (existingSettings) {
      // Mise à jour
      settings = await prisma.professionalSettings.update({
        where: { userId },
        data: {
          ...settingsData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Création si inexistant
      settings = await prisma.professionalSettings.create({
        data: {
          userId,
          ...settingsData,
        },
      });
    }

    res.json({
      success: true,
      data: settings,
      message: "Paramètres sauvegardés avec succès",
    });
  } catch (error) {
    console.error("Erreur sauvegarde paramètres:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la sauvegarde des paramètres",
    });
  }
});

module.exports = router;
