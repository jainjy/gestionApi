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
    const { status, autoRenew, endDate, visibilityOption } = req.body;

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

    // Validation de l'option de visibilité
    if (visibilityOption && !["standard", "enhanced"].includes(visibilityOption)) {
      return res
        .status(400)
        .json({ error: "Option de visibilité invalide" });
    }

    const updateData = {
      ...(status && { status }),
      ...(autoRenew !== undefined && { autoRenew }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(visibilityOption && { visibilityOption }),
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

    // Statistiques par option de visibilité
    const standardVisibility = await prisma.subscription.count({
      where: { visibilityOption: "standard" },
    });
    const enhancedVisibility = await prisma.subscription.count({
      where: { visibilityOption: "enhanced" },
    });

    // Calcul du revenu mensuel
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true },
    });

    let revenue = 0;
    activeSubscriptions.forEach((sub) => {
      revenue += sub.plan?.price || 0;
      // Ajouter le prix de visibilité renforcée si applicable
      if (
        sub.visibilityOption === "enhanced" &&
        sub.plan?.enhancedVisibilityPrice
      ) {
        revenue += sub.plan.enhancedVisibilityPrice;
      }
    });

    res.json({
      total,
      active,
      expired,
      pending,
      revenue,
      visibilityStats: {
        standard: standardVisibility,
        enhanced: enhancedVisibility,
      },
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/subscriptions/:id - Obtenir un abonnement spécifique
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
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
    });

    if (!subscription) {
      return res.status(404).json({ error: "Abonnement non trouvé" });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/subscriptions/:id - Supprimer un abonnement
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subscription.delete({
      where: { id },
    });

    res.json({ message: "Abonnement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'abonnement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
