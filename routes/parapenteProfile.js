// routes/users.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

/**
 * GET /users/parapente
 * Récupère l'utilisateur dont le lastName est "Parapente"
 */
router.get("/", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        lastName: "Parapente",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        userType: true,
        professionalCategory: true,
        companyName: true,
        commercialName: true,
        avatar: true,
        websiteUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur avec lastName = "Parapente"',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erreur récupération utilisateur Parapente :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

module.exports = router;
