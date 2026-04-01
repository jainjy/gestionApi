// routes/subscriptions.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subscriptions/my-subscription
// Retourne l'abonnement actif de l'utilisateur connecté avec les détails du plan
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my-subscription", authenticateToken, async (req, res) => {
    console.log("Attempts to get my subscription : ", req.user.id);
  try {
    const userId = req.user.id;

    // Récupérer l'abonnement actif le plus récent
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            enhancedVisibilityPrice: true,
            interval: true,
            features: true,
            planType: true,
            professionalCategory: true,
            userTypes: true,
            popular: true,
            color: true,
            icon: true,
            isVisibilityEnhanced: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    });


    // Aucun abonnement trouvé
    if (!subscription) {
      return res.status(200).json({
        success: true,
        subscription: null,
        message: "Aucun abonnement actif",
      });
    }

    // Vérifier si l'abonnement est encore valide (date de fin)
    const isExpired =
      subscription.endDate && new Date(subscription.endDate) < new Date();

    if (isExpired) {
      // Mettre à jour le statut en BDD
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "expired" },
      });

      return res.status(200).json({
        success: true,
        subscription: null,
        message: "Abonnement expiré",
      });
    }

    // Calculer les jours restants
    const daysRemaining = subscription.endDate
      ? Math.ceil(
          (new Date(subscription.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    // Réponse enrichie
    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        visibilityOption: subscription.visibilityOption,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        daysRemaining,
        plan: subscription.plan,
        lastTransaction: subscription.transactions[0] || null,
      },
    });
  } catch (error) {
    console.error("Erreur GET /my-subscription:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'abonnement",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subscriptions/history
// Historique complet des abonnements de l'utilisateur
// ─────────────────────────────────────────────────────────────────────────────
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            interval: true,
            planType: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error("Erreur GET /history:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'historique",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscriptions/cancel
// Annuler l'auto-renouvellement de l'abonnement actif
// ─────────────────────────────────────────────────────────────────────────────
router.post("/cancel", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Aucun abonnement actif à annuler",
      });
    }

    // Désactiver l'auto-renouvellement (l'abonnement reste actif jusqu'à endDate)
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { autoRenew: false },
    });

    return res.status(200).json({
      success: true,
      message:
        "Auto-renouvellement désactivé. Votre abonnement reste actif jusqu'au " +
        new Date(subscription.endDate).toLocaleDateString("fr-FR"),
      subscription: updated,
    });
  } catch (error) {
    console.error("Erreur POST /cancel:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'annulation",
    });
  }
});

module.exports = router;