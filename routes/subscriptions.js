const { authenticateToken } =require("../middleware/auth");
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");



//POST api/subscription/renew
router.post("/renew", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier l'abonnement actuel
    const currentSubscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true }
    });

    if (!currentSubscription) {
      return res.status(404).json({ error: "Aucun abonnement trouvé" });
    }

    if (currentSubscription.status !== 'expired') {
      return res.status(400).json({ error: "L'abonnement n'est pas expiré" });
    }

    // Logique de renouvellement
    // Cela pourrait créer un nouvel abonnement ou mettre à jour l'existant
    const renewedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        status: 'pending', // ou 'active' selon votre logique
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        autoRenew: true
      },
      include: { plan: true }
    });

    res.json({
      success: true,
      message: "Abonnement renouvelé avec succès",
      subscription: renewedSubscription
    });

  } catch (error) {
    console.error("Erreur renouvellement abonnement:", error);
    res.status(500).json({ error: "Erreur lors du renouvellement" });
  }
});

module.exports = router;