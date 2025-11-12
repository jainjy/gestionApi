// routes/audit.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ➕ POST /api/audit - Ajouter un nouvel audit
router.post("/", async (req, res) => {
  try {
    const { titre, description, type, dateAudit, responsable, statut } = req.body;

    if (!titre || !type || !responsable) {
      return res.status(400).json({ message: "Champs requis manquants : titre, type, responsable." });
    }

    const audit = await prisma.audit.create({
      data: {
        titre,
        description,
        type,
        dateAudit: dateAudit ? new Date(dateAudit) : undefined,
        responsable,
        statut: statut || "en cours",
      },
    });

    res.status(201).json({ message: "Audit ajouté avec succès", audit });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un audit :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router;
