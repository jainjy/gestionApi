// routes/subscription-payments.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");
const stripe = require("../utils/stripe");
const oliplusEmailService = require("../services/oliplusEmailService");

// POST /api/subscription-payments/create-payment-intent
router.post("/create-payment-intent", authenticateToken, async (req, res) => {
  try {
    const { planId, visibilityOption } = req.body;
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

    // 2️⃣ CALCUL DU MONTANT SELON L'OPTION DE VISIBILITÉ
    let amount;
    let selectedVisibilityOption = visibilityOption || "standard";

    if (
      selectedVisibilityOption === "enhanced" &&
      plan.enhancedVisibilityPrice
    ) {
      amount = plan.enhancedVisibilityPrice;
    } else {
      amount = plan.price;
    }

    // Vérifier si l'option enhanced est valide
    if (
      selectedVisibilityOption === "enhanced" &&
      !plan.enhancedVisibilityPrice
    ) {
      return res.status(400).json({
        error:
          "L'option de visibilité renforcée n'est pas disponible pour ce plan",
      });
    }

    // 3️⃣ Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : undefined,
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
      description: `Abonnement: ${plan.name} (${selectedVisibilityOption === "enhanced" ? "Visibilité renforcée" : "Standard"})`,
      metadata: {
        userId,
        planId,
        planName: plan.name,
        visibilityOption: selectedVisibilityOption,
        amount: amount.toString(),
        type: "subscription",
      },
      automatic_payment_methods: { enabled: true },
    });

    // 5️⃣ Enregistrer la transaction avec montant et option de visibilité
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: "eur",
        provider: "stripe",
        providerId: paymentIntent.id,
        status: "pending",
        referenceType: "subscription",
        metadata: {
          planId,
          planName: plan.name,
          planPrice: plan.price,
          enhancedVisibilityPrice: plan.enhancedVisibilityPrice,
          selectedVisibilityOption,
          amountPaid: amount,
          planInterval: plan.interval,
          isVisibilityEnhanced: selectedVisibilityOption === "enhanced",
        },
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId: transaction.id,
      plan: {
        name: plan.name,
        price: plan.price,
        enhancedVisibilityPrice: plan.enhancedVisibilityPrice,
        interval: plan.interval,
        supportsEnhancedVisibility: !!plan.enhancedVisibilityPrice,
      },
      visibilityOption: selectedVisibilityOption,
      amount,
    });
  } catch (error) {
    console.error("Erreur création PaymentIntent:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
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

    // Récupérer les métadonnées
    const planId = paymentIntent.metadata.planId;
    const planName = paymentIntent.metadata.planName;
    const visibilityOption =
      paymentIntent.metadata.visibilityOption || "standard";
    const amount = parseFloat(paymentIntent.metadata.amount) || 0;

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

    // Calculer la date de fin
    const endDate = new Date();
    if (plan.interval === "year") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Par défaut mois
      endDate.setMonth(endDate.getMonth() + 1);
    }

    if (currentSubscription) {
      // Mettre à jour l'abonnement existant
      subscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planId: parseInt(planId),
          status: "active",
          startDate: new Date(),
          endDate: endDate,
          autoRenew: true,
          visibilityOption: visibilityOption,
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
          endDate: endDate,
          autoRenew: true,
          visibilityOption: visibilityOption,
        },
        include: { plan: true },
      });
    }

    // Mettre à jour la transaction
    const transaction = await prisma.transaction.findFirst({
      where: { providerId: paymentIntentId },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "completed",
          subscriptionId: subscription.id,
          amount: amount,
          metadata: {
            ...(transaction.metadata || {}),
            ...paymentIntent.metadata,
            subscriptionId: subscription.id,
            upgraded: true,
            paymentMethod: paymentIntent.payment_method_types[0] || "card",
            visibilityOption: visibilityOption,
            finalAmount: amount,
          },
        },
      });
    }

    // 🔥 Envoyer l'email de confirmation de paiement
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user) {
        await oliplusEmailService.sendOliplusEmail({
          to: user.email,
          template: "payment-confirmation",
          data: {
            userName:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email,
            serviceName: `${planName || plan.name} (${visibilityOption === "enhanced" ? "Visibilité renforcée" : "Standard"})`,
            amount: amount,
            date: new Date().toLocaleDateString("fr-FR"),
            transactionId: paymentIntentId.substring(0, 12),
            visibilityType:
              visibilityOption === "enhanced"
                ? "Visibilité renforcée"
                : "Standard",
          },
        });
        console.log(
          `✅ Email de confirmation de paiement envoyé à ${user.email}`
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de confirmation:",
        emailError
      );
    }

    res.json({
      success: true,
      message: "Abonnement mis à jour avec succès",
      subscription: {
        ...subscription,
        plan,
      },
      visibilityOption: visibilityOption,
      paymentMethod: paymentIntent.payment_method_types[0] || "card",
      amountPaid: amount,
      emailSent: true,
    });
  } catch (error) {
    console.error("Erreur confirmation upgrade:", error);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de l'abonnement",
    });
  }
});

// GET /api/subscription-payments/plan-details/:planId
router.get("/plan-details/:planId", authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parseInt(planId) },
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
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Erreur récupération plan:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
