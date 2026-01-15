// routes/subscription-payments.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");
const stripe = require("../utils/stripe");

// POST /api/subscription-payments/create-payment-intent
router.post("/create-payment-intent", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({ error: "ID du plan requis" });
    }

    // 1️⃣ Récupérer le plan depuis la BDD
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(planId) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    // 2️⃣ CALCUL DU MONTANT CÔTÉ SERVEUR
    const amount = plan.price; // source de vérité

    // 3️⃣ Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
    });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // 4️⃣ Création du PaymentIntent sécurisé
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      customer: customerId,
      description: `Abonnement: ${plan.name}`,
      metadata: {
        userId,
        planId,
        planName: plan.name,
        type: "subscription",
      },
      automatic_payment_methods: { enabled: true },
    });

    // 5️⃣ Enregistrer la transaction avec montant serveur
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "eur",
        provider: "stripe",
        providerId: paymentIntent.id, // ⚠️ C'est le paymentIntentId
        status: "pending",
        referenceType: "subscription",
        metadata: {
          planId,
          planName: plan.name,
          planPrice: plan.price,
          planInterval: plan.interval,
        },
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // ✅ Ajouter cette ligne
      transactionId: transaction.id,
      plan: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur paiement" });
  }
});

// POST /api/subscription-payments/confirm-upgrade
router.post("/confirm-upgrade", authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "PaymentIntent ID requis",
      });
    }

    // Récupérer le PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Paiement non réussi",
        status: paymentIntent.status,
      });
    }

    // Récupérer les métadonnées du plan
    const planId = paymentIntent.metadata.planId;
    const planName = paymentIntent.metadata.planName;

    if (!planId) {
      return res.status(400).json({
        error: "ID du plan manquant dans les métadonnées",
      });
    }

    // Vérifier l'abonnement actuel
    const currentSubscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(planId) },
    });

    if (!plan) {
      return res.status(404).json({
        error: "Plan d'abonnement non trouvé",
      });
    }

    let subscription;

    if (currentSubscription) {
      // Mettre à jour l'abonnement existant
      subscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planId: parseInt(planId),
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          autoRenew: true,
        },
        include: { plan: true },
      });
    } else {
      // Créer un nouvel abonnement
      subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          planId: parseInt(planId),
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          autoRenew: true,
        },
        include: { plan: true },
      });
    }

    // Mettre à jour la transaction - CORRIGÉ
    const transaction = await prisma.transaction.findFirst({
      where: { providerId: paymentIntentId },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "completed",
          subscriptionId: subscription.id,
          metadata: {
            ...paymentIntent.metadata,
            subscriptionId: subscription.id,
            upgraded: true,
            paymentMethod: paymentIntent.payment_method_types[0] || "card",
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Abonnement mis à jour avec succès",
      subscription: subscription,
      paymentMethod: paymentIntent.payment_method_types[0] || "card",
    });
  } catch (error) {
    console.error("Erreur confirmation upgrade:", error);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'abonnement",
    });
  }
});

module.exports = router;
