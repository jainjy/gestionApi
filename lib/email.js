const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true si tu utilises le port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"SERVO" <no-reply@servo.mg>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe SERVO',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 SERVO</h1>
            <p>Super-app de l'habitat</p>
          </div>
          <div class="content">
            <h2>Réinitialisation de mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe SERVO.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Ce lien expirera dans <strong>24 heures</strong>.</p>
            <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
            <div class="footer">
              <p>© 2024 SERVO. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès à:', email);
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}

module.exports = { sendPasswordResetEmail };
