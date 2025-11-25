// routes/admin-subscriptions.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès non autorisé" });
  }
  next();
};

// GET /api/admin/subscriptions - Liste tous les abonnements
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
          },
        },
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(subscriptions);
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnements:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/subscriptions/:id - Mettre à jour un abonnement
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autoRenew, endDate } = req.body;

    // Validation de la date d'expiration
    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        return res.status(400).json({ error: "Date d'expiration invalide" });
      }

      // S'assurer que la date d'expiration est dans le futur
      if (endDateObj <= new Date()) {
        return res
          .status(400)
          .json({ error: "La date d'expiration doit être dans le futur" });
      }
    }

    const updateData = {
      ...(status && { status }),
      ...(autoRenew !== undefined && { autoRenew }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    // Si le statut devient actif et qu'aucune date d'expiration n'est fournie,
    // définir une date d'expiration par défaut (30 jours)
    if (status === "active" && !endDate) {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { id },
      });

      if (
        existingSubscription &&
        (!existingSubscription.endDate ||
          existingSubscription.endDate <= new Date())
      ) {
        updateData.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours
      }
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: true,
      },
    });

    res.json(updatedSubscription);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/subscriptions/stats - Statistiques des abonnements
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const total = await prisma.subscription.count();
    const active = await prisma.subscription.count({
      where: { status: "active" },
    });
    const expired = await prisma.subscription.count({
      where: { status: "expired" },
    });
    const pending = await prisma.subscription.count({
      where: { status: "pending" },
    });

    // Calcul du revenu mensuel
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true },
    });

    const revenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan?.price || 0);
    }, 0);

    res.json({
      total,
      active,
      expired,
      pending,
      revenue,
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
