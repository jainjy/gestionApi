// utils/emailService.js
const nodemailer = require('nodemailer');

// Configuration simple pour le développement
const createTransporter = () => {
  // Si des variables d'environnement sont définies, utiliser un vrai transporteur
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Sinon, utiliser un transporteur de test (pour le développement)
  console.log('⚠️ Mode DEV: EmailService en mode test');
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 Email simulé (DEV):');
      console.log('À:', mailOptions.to);
      console.log('Sujet:', mailOptions.subject);
      console.log('Contenu:', mailOptions.html || mailOptions.text);
      console.log('---');
      return { messageId: 'dev-mode-' + Date.now() };
    },
    verify: async () => {
      console.log('✅ EmailService en mode développement');
      return true;
    }
  };
};

const transporter = createTransporter();

// Fonction principale pour envoyer des emails
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log(`📧 Tentative d'envoi d'email à: ${to}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Test Dev" <test@example.com>',
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à: ${to}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    return { 
      success: false, 
      error: error.message,
      details: 'En mode développement, les emails sont simulés'
    };
  }
};

// Fonctions spécifiques
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Ce lien expirera dans 1 heure.</p>
    `
  });
};

const sendWelcomeEmail = async (email, firstName) => {
  return sendEmail({
    to: email,
    subject: 'Bienvenue sur notre plateforme !',
    html: `
      <h2>Bienvenue ${firstName} !</h2>
      <p>Votre compte a été créé avec succès.</p>
      <p>Nous sommes heureux de vous accueillir sur notre plateforme.</p>
    `
  });
};

const sendNotificationEmail = async (email, titre, message) => {
  return sendEmail({
    to: email,
    subject: `Notification : ${titre}`,
    html: `
      <h2>${titre}</h2>
      <div>${message}</div>
    `
  });
};

// Vérifier la configuration au démarrage
(async () => {
  try {
    await transporter.verify();
    console.log('✅ EmailService initialisé avec succès');
  } catch (error) {
    console.log('⚠️ EmailService en mode développement');
  }
})();

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  transporter
};