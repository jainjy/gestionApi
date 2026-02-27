const nodemailer = require('nodemailer');

class EmailRelanceService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Envoie un email de relance à un artisan
   */
  async envoyerRelance(artisan, conversation, messageRelance, type) {
    try {
      const sujet = type === 'J+2' 
        ? `📝 Relance - Demande #${conversation.demandeId}`
        : `🔔 Suivi nécessaire - Demande #${conversation.demandeId}`;

      const html = this.genererEmailRelance(artisan, conversation, messageRelance, type);

      const mailOptions = {
        from: `"Assistance Artisan" <${process.env.SMTP_USER}>`,
        to: artisan.email,
        subject: sujet,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email relance envoyé à ${artisan.email}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  genererEmailRelance(artisan, conversation, messageRelance, type) {
    const couleurs = {
      'J+2': { bg: '#F0F8FF', border: '#6B8E23' },
      'J+5': { bg: '#FFF0F0', border: '#CD5C5C' }
    };

    const couleur = couleurs[type] || couleurs['J+2'];

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B4513;">Relance automatique</h2>
      
      <p>Bonjour ${artisan.firstName || 'Artisan'},</p>
      
      <p>${type === 'J+2' 
        ? 'Il y a 2 jours, vous avez échangé avec un client. Une relance pourrait être opportune.'
        : 'Cela fait 5 jours sans nouvelle de votre part sur cette conversation. Une relance est recommandée.'
      }</p>
      
      <div style="background: ${couleur.bg}; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid ${couleur.border};">
        <p style="margin: 0; font-style: italic; color: #333;">"${messageRelance}"</p>
      </div>
      
      <p>Vous pouvez utiliser ce message ou personnaliser votre propre relance.</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/pro/discussions/${conversation.demandeId}" 
           style="background: #6B8E23; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">
          Voir la discussion
        </a>
      </div>
      
      <hr style="border: 1px solid #D3D3D3;">
      <p style="color: #666; font-size: 12px;">
        Email automatique pour vous aider à rester réactif.
      </p>
    </div>
    `;
  }
}

module.exports = new EmailRelanceService();