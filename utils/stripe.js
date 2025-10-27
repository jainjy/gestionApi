const Stripe = require("stripe");

// Initialisation de Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover", // Utilisez la version la plus récente
});

module.exports = stripe;
