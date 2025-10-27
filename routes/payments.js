const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const stripe = require("../utils/stripe");

// Créer un PaymentIntent
router.post("/create", async (req, res) => {
  try {
    const {
      userId,
      amount,
      currency = "eur",
      description,
      referenceType,
      referenceId,
    } = req.body;

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe prend en centimes
      currency,
      description,
      metadata: {
        userId,
        referenceType,
        referenceId,
      },
    });

    // Créer la transaction en base
    await prisma.transaction.create({
      data: {
        userId,
        provider: "stripe",
        providerId: paymentIntent.id,
        amount,
        currency,
        status: "created",
        description,
        referenceType,
        referenceId,
        metadata: paymentIntent.metadata,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
