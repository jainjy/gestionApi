// routes/contratsTypes.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// Récupérer tous les contrats types de l'utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const contrats = await prisma.contratType.findMany({
      where: { userId: req.user.id },
      orderBy: { derniereModification: "desc" },
    });

    res.json(contrats);
  } catch (error) {
    console.error("Erreur récupération contrats types:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des contrats types" });
  }
});

// Créer un contrat type
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { nom, description, contenu, variables } = req.body;

    const contrat = await prisma.contratType.create({
      data: {
        nom,
        description,
        contenu,
        variables,
        utilise: 0,
        derniereModification: new Date(),
        userId: req.user.id,
      },
    });

    res.json(contrat);
  } catch (error) {
    console.error("Erreur création contrat type:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création du contrat type" });
  }
});

// Modifier un contrat type
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, contenu, variables } = req.body;

    const contrat = await prisma.contratType.update({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        nom,
        description,
        contenu,
        variables,
        derniereModification: new Date(),
      },
    });

    res.json(contrat);
  } catch (error) {
    console.error("Erreur modification contrat type:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification du contrat type" });
  }
});

// Supprimer un contrat type
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contratType.delete({
      where: {
        id,
        userId: req.user.id,
      },
    });

    res.json({ message: "Contrat type supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression contrat type:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du contrat type" });
  }
});

module.exports = router;
