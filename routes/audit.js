const express = require("express");
const router = express.Router();
const { prisma, pool } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification } = require("../services/notificationService");

/**
  POST /api/audit/add
 Ajouter un nouvel audit
*/
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { titre, description, type, responsable, statut } = req.body;
    const io = req.app.get("io");

    if (!titre || !type || !responsable) {
      return res.status(400).json({
        success: false,
        message: "Les champs titre, type et responsable sont obligatoires.",
      });
    }

    // Insertion de l'audit
    const newAudit = await prisma.audit.create({
      data: {
        titre,
        description,
        type,
        responsable,
        statut: statut || "en cours",
        userId: req.user.id,
      },
      include: { user: true },
    });

    // 🔔 Création automatique d'une notification pour l'utilisateur
    await createNotification({
      userId: req.user.id,
      type: "info",
      title: "Nouvel audit ajouté",
      message: `L’audit "${titre}" a été ajouté avec succès.`,
      relatedEntity: "audit",
      relatedEntityId: String(newAudit.id),
      io,
    });

    res.status(201).json({
      success: true,
      message: "Audit ajouté et notification envoyée",
      data: newAudit,
    });
  } catch (error) {
    console.error("Erreur lors de l'insertion de l'audit:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
});

/**
 * GET /api/audit/all
  Récupère tous les audits avec les informations du user qui les a créés

 */
router.get("/all", authenticateToken, async (req, res) => {
  try {
    const audits = await prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: audits.length,
      data: audits,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des audits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des audits.",
      error: error.message,
    });
  }
});
/**
 *  DELETE /api/audit/:id
 */
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'audit existe
    const audit = await prisma.audit.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Audit non trouvé.",
      });
    }

    // Vérifier les droits : seul le créateur ou un admin peut supprimer
    if (audit.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Vous ne pouvez pas supprimer cet audit.",
      });
    }

    // Suppression de l'audit
    await prisma.audit.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Audit supprimé avec succès.",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'audit:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
      error: error.message,
    });
  }
});



module.exports = router;