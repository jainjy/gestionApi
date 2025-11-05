const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {

  const { email, subject, message } = req.body;

  console.log("Reponses du req body:", req.body);

  if (!email || !subject || !message) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Site Servo" <${process.env.SMTP_USER}>`,
      to: email,
      replyTo: process.env.SMTP_USER,
      subject,
      text: message,
    });

res.json({
  success: true,
  status: "success",
  message: "Email envoyé avec succès !"
});

  } catch (error) {
    console.error("Erreur Nodemailer:", error);
    res.status(500).json({ error: error.message || "Impossible d'envoyer le mail." });
  }
});

module.exports = router;
