// services/emailService.js
const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
// À adapter selon votre service d'email (SendGrid, Mailgun, SMTP, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Envoie un email
 * @param {Object} options - Options de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Contenu HTML
 * @param {string} options.text - Contenu texte brut (optionnel)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Votre Société" <${process.env.EMAIL_FROM || 'noreply@votre-site.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Conversion HTML en texte simple si non fourni
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email envoyé: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw error;
  }
};

module.exports = { sendEmail };