const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db');
const stripe = require('../utils/stripe');

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // ex: 1000 = 10€
      currency: "eur",
      automatic_payment_methods: {
        enabled: true, // Apple Pay + Google Pay auto
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/connect-account', async (req, res) => {
  try {
    const { userId, email } = req.body;

    // 1️⃣ Crée le compte Express
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    // (Optionnel) sauvegarde le compte dans ta base
    // await prisma.user.update({ where: { id: userId }, data: { stripeAccountId: account.id } });

    // 2️⃣ Crée le lien d’onboarding (redirige l’utilisateur vers Stripe)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/onboarding/success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error("❌ Stripe Connect error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/account-info/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await stripe.accounts.retrieve(accountId);
    res.json(account);
  } catch (error) {
    console.error("❌ Stripe Retrieve Account error:", error);
    res.status(500).json({ error: error.message });
  }});
module.exports = router;

