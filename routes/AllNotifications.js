const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

// ======================================================
// 🔹 Récupérer les notifications
// ======================================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    // Vérifie que req.user existe bien
    if (!req.user || !req.user.id) {
      console.warn("❌ Aucun utilisateur détecté dans req.user");
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    console.log("👤 Récupération des notifications pour :", req.user.email);

    // Récupère uniquement les notifications de l'utilisateur connecté
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id // Filtre par l'ID de l'utilisateur
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("❌ Erreur récupération notifications:", err);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     // Vérifie que req.user existe bien
//     if (!req.user || !req.user.id) {
//       console.warn("❌ Aucun utilisateur détecté dans req.user");
//       return res.status(401).json({
//         success: false,
//         message: "Utilisateur non authentifié",
//       });
//     }

//     console.log("👤 Récupération des notifications pour l'utilisateur ID :", req.user.id);

//     // Affiche uniquement les notifications du user
//     const notifications = await prisma.notification.findMany({
//       where: { userId: req.user.id },   // 👈 IMPORTANT
//       orderBy: { createdAt: "desc" },
//     });

//     res.json({ success: true, data: notifications });
//   } catch (err) {
//     console.error("❌ Erreur récupération notifications:", err);
//     res.status(500).json({
//       success: false,
//       message: "Erreur interne du serveur",
//       error: err.message,
//     });
//   }
// });
 
// ======================================================
// 🔹 Marquer une notification comme lue
// ======================================================

router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notifId = Number(req.params.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // 🔍 Vérifie si la notification existe
    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: `Notification ${notifId} introuvable`,
      });
    }

    // 🔒 Vérifie si l’utilisateur a le droit
    if (req.user.role !== "admin" && notif.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé à cette notification",
      });
    }

    // ✅ Met à jour la notification
    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { read: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ Erreur markAsRead:", err);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

// ======================================================
// 🔹 Supprimer une notification
// ======================================================
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const notifId = Number(req.params.id);

    // Vérifie que la notification existe et appartient à l'utilisateur
    const notif = await prisma.notification.findUnique({
      where: { id: notifId },
    });

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable",
      });
    }

    // Si l'utilisateur n'est pas admin et tente de supprimer celle d'un autre
    if (req.user.role !== "admin" && notif.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette notification",
      });
    }

    // Suppression
    await prisma.notification.delete({
      where: { id: notifId },
    });

    res.json({
      success: true,
      message: "Notification supprimée avec succès",
    });
  } catch (err) {
    console.error("❌ Erreur suppression notification:", err);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

// ======================================================
// DELETE /api/notifications/all
// ======================================================

router.delete("/all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // ID de l'utilisateur connecté

    // Si admin → il peut supprimer toutes les notifications du système
    if (req.user.role === "admin") {
      await prisma.notification.deleteMany();
      return res.json({
        success: true,
        message: "Toutes les notifications ont été supprimées (admin).",
      });
    }

    // Sinon → ne supprime que les notifications du user
    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: "Toutes vos notifications ont été supprimées.",
    });
  } catch (err) {
    console.error("❌ Erreur suppression notifications:", err);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
});

module.exports = router;
