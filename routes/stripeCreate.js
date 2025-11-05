const express = require('express')
const router = express.Router()

const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db');
const stripe = require('../utils/stripe');
router.post("/connect-account", async (req, res) => {
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
