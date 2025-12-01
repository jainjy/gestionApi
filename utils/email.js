const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, template, data }) => {
  try {
    let html = '';

    // Template pour le contact guide
    if (template === 'guide-contact') {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Nouveau message de contact</h2>
          <p>Bonjour <strong>${data.guideName}</strong>,</p>
          <p>Vous avez reçu un nouveau message concernant votre activité <strong>"${data.activityTitle}"</strong>.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <p><strong>De:</strong> ${data.userName}</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Téléphone:</strong> ${data.userPhone || 'Non renseigné'}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #dee2e6;">${data.message}</p>
          </div>
          <p><strong>Date:</strong> ${data.contactDate}</p>
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe SERVO</strong>
          </p>
        </div>
      `;
    }

    // Template pour confirmation de réservation
    if (template === 'booking-confirmation') {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #28a745; text-align: center;">Confirmation de réservation</h2>
          <p>Bonjour <strong>${data.userName}</strong>,</p>
          <p>Votre réservation pour l'activité <strong>"${data.activityTitle}"</strong> a été confirmée.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p><strong>Date:</strong> ${data.bookingDate}</p>
            <p><strong>Heure:</strong> ${data.bookingTime}</p>
            <p><strong>Participants:</strong> ${data.participants}</p>
            <p><strong>Lieu de rendez-vous:</strong> ${data.meetingPoint}</p>
            <p><strong>Montant total:</strong> ${data.totalAmount}€</p>
          </div>
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
            Nous vous souhaitons une excellente expérience !<br>
            <strong>L'équipe SERVO</strong>
          </p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };