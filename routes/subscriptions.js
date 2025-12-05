const { authenticateToken } =require("../middleware/auth");
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");



// Dans routes/subscriptions.js
router.post("/renew", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;
    
    // Vérifier l'abonnement actuel
    const currentSubscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true }
    });

    if (!currentSubscription) {
      return res.status(404).json({ error: "Aucun abonnement trouvé" });
    }

    // Déterminer le plan à utiliser
    const targetPlanId = planId || currentSubscription.planId;
    
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(targetPlanId) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    // Créer une transaction de renouvellement
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        subscriptionId: currentSubscription.id,
        amount: plan.price,
        currency: "eur",
        provider: "stripe",
        status: "pending",
        description: `Renouvellement abonnement: ${plan.name}`,
        referenceType: "subscription_renewal",
        metadata: {
          planId: plan.id,
          planName: plan.name,
          renewal: true,
        },
      },
    });

    res.json({
      success: true,
      message: "Transaction de renouvellement créée",
      transactionId: transaction.id,
      planDetails: {
        name: plan.name,
        price: plan.price,
      },
    });

  } catch (error) {
    console.error("Erreur renouvellement abonnement:", error);
    res.status(500).json({ error: "Erreur lors du renouvellement" });
  }
});

module.exports = router;