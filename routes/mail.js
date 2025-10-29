const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // ton email serveur
        pass: process.env.EMAIL_PASS, // mot de passe ou App Password
      },
    });

    await transporter.sendMail({
      from: `"Site Contact" <${process.env.EMAIL_USER}>`, // ton email serveur
      to: "randrianantenainamioraharilaza@gmail.com", // email du listing
      replyTo: email, // l'email du client connecté
      subject,
      text: message,
    });

    res.json({ success: true, message: "Email envoyé !" });
  }catch (error) {
  console.error("Erreur Nodemailer :", error);
  res.status(500).json({ error: error.message || "Impossible d'envoyer le mail." });
}

});

module.exports = router;
