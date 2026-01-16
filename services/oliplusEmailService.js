const nodemailer = require("nodemailer");
require("dotenv").config();

class OliplusEmailService {
  constructor() {
    // Gestion correcte de la variable secure
    let secureValue = false;
    if (process.env.SMTP_SECURE) {
      secureValue =
        process.env.SMTP_SECURE === "true" ||
        process.env.SMTP_SECURE === "1" ||
        process.env.SMTP_SECURE === true;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: secureValue,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.emailConfigs = {
      "user-welcome": {
        from: process.env.SMTP_NOREPLY || process.env.SMTP_USER,
        subject:
          "Création de votre compte Oliplus - Informations sur vos données personnelles",
      },
      "rgpd-confirmation": {
        from: process.env.SMTP_NOREPLY || process.env.SMTP_USER,
        subject:
          "Confirmation de votre demande concernant vos données personnelles",
      },
      "payment-confirmation": {
        from: process.env.SMTP_NOREPLY || process.env.SMTP_USER,
        subject: "Confirmation de paiement - Oliplus",
      },
      "security-alert": {
        from: process.env.SMTP_SECURITY || process.env.SMTP_USER,
        subject: "Alerte de sécurité - Activité inhabituelle détectée",
      },
      "cgu-update": {
        from: process.env.SMTP_COMMUNICATION || process.env.SMTP_USER,
        subject: "Mise à jour des Conditions Générales – Oliplus",
      },
      "provider-welcome": {
        from: process.env.SMTP_COMMUNICATION || process.env.SMTP_USER,
        subject:
          "Création de votre compte prestataire Oliplus – Données personnelles",
      },
      "provider-rgpd": {
        from: process.env.SMTP_COMMUNICATION || process.env.SMTP_USER,
        subject: "Traitement de votre demande - Données prestataire Oliplus",
      },
      "provider-billing": {
        from: process.env.SMTP_NOREPLY || process.env.SMTP_USER,
        subject: "Confirmation de facturation - Compte prestataire Oliplus",
      },
      "provider-security": {
        from: process.env.SMTP_SECURITY || process.env.SMTP_USER,
        subject: "Alerte de sécurité - Compte prestataire Oliplus",
      },
      "provider-cgu": {
        from: process.env.SMTP_COMMUNICATION || process.env.SMTP_USER,
        subject: "Mise à jour des conditions prestataires - Oliplus",
      },
      "provider-onboarding": {
        from: process.env.SMTP_COMMUNICATION || process.env.SMTP_USER,
        subject: "Validation de votre compte prestataire Oliplus",
      },
    };
  }

  getTemplate(templateName, data) {
    const templates = {
      "user-welcome": `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur Oliplus</h1>
            </div>
            <div class="content">
              <p>Bonjour${data.userName ? ` ${data.userName}` : ""},</p>
              <p>Votre compte Oliplus a bien été créé.</p>
              <p>Dans le cadre de l'utilisation de la plateforme Oliplus, certaines données personnelles sont collectées et traitées (identité, coordonnées, informations de connexion), uniquement dans le but de fournir les services proposés.</p>
              <p>Vos données sont :</p>
              <ul>
                <li>utilisées de manière strictement nécessaire,</li>
                <li>stockées de façon sécurisée,</li>
                <li>jamais revendues à des tiers.</li>
              </ul>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment des droits suivants :</p>
              <ul>
                <li>droit d'accès,</li>
                <li>droit de rectification,</li>
                <li>droit de suppression,</li>
                <li>droit d'opposition.</li>
              </ul>
              <p>Vous pouvez exercer vos droits en écrivant à : <a href="mailto:communication@oliplus.re">communication@oliplus.re</a></p>
              <p>Pour plus d'informations, consultez notre politique de confidentialité depuis la plateforme.</p>
              <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
              <br>
              <p>L'équipe Oliplus</p>
            </div>
            <div class="footer">
              <p>Émetteur : ${process.env.SMTP_NOREPLY || process.env.SMTP_USER}</p>
              <p>© ${new Date().getFullYear()} Oliplus. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
        `,

      "rgpd-confirmation": `
        <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                
                <body>
                    <div class="container">
                        <div class="content">
                        <p>Bonjour${data.userName ? ` ${data.userName}` : ""},</p>
                        <p>Nous accusons réception de votre demande relative à vos données personnelles.</p>
                        <p>Conformément au RGPD, votre demande est prise en charge et sera traitée dans un délai maximum de 30 jours à compter de la réception de ce message.</p>
                        <p>Si des informations complémentaires sont nécessaires pour confirmer votre identité, nous vous contacterons.</p>
                        <p>Pour toute question complémentaire, vous pouvez répondre directement à cet email.</p>
                        <p>Cordialement,</p>
                        <p>Le délégué à la protection des données</p>
                        
                        <br>
                        <p>L'équipe Oliplus</p>
                        </div>
                        <div class="footer">
                        <p>Émetteur : ${process.env.SMTP_NOREPLY || process.env.SMTP_USER}</p>
                        <p>© ${new Date().getFullYear()} Oliplus. Tous droits réservés.</p>
                        </div>
                    </div>
                </body>
            </html>
        `,

      "payment-confirmation": `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>Confirmation de Paiement</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
              <p>Bonjour${data.userName ? ` ${data.userName}` : ""},</p>
              <p>Nous vous confirmons la bonne réception de votre paiement sur la plateforme Oliplus.</p>
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Récapitulatif :</h3>
                <p><strong>Service :</strong> ${data.serviceName || "[Nom du service / abonnement]"}</p>
                <p><strong>Montant :</strong> ${data.amount ? `${data.amount} €` : "[Montant] €"}</p>
                <p><strong>Date :</strong> ${data.date || "[Date]"}</p>
                <p><strong>Référence :</strong> ${data.transactionId || "[ID transaction]"}</p>
              </div>
              <p>Votre facture est disponible dans votre espace personnel.</p>
              <p>En cas de question relative à la facturation ou à votre abonnement, vous pouvez contacter notre service dédié à l'adresse suivante : <a href="mailto:support@oliplus.re">support@oliplus.re</a></p>
              <p>Merci pour votre confiance.</p>
              <br>
              <p>L'équipe Oliplus</p>
            </div>
          </div>
        </body>
        </html>
        `,

      "security-alert": `
        <!DOCTYPE html>
        <html>
        <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>⚠️ Alerte de Sécurité</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
              <p>Bonjour${data.userName ? ` ${data.userName}` : ""},</p>
              <p>Une activité inhabituelle a été détectée sur votre compte Oliplus.</p>
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff416c;">
                <h3>Détails :</h3>
                <p><strong>Date et heure :</strong> ${data.date || "[Date / Heure]"}</p>
                <p><strong>Localisation approximative :</strong> ${data.location || "[Pays / Ville]"}</p>
                <p><strong>Action :</strong> ${data.action || "Connexion ou tentative d'accès"}</p>
              </div>
              <p>Si vous êtes à l'origine de cette action, aucune démarche n'est nécessaire.</p>
              <p>Dans le cas contraire, nous vous recommandons :</p>
              <ul>
                <li>de modifier immédiatement votre mot de passe,</li>
                <li>de vérifier les connexions actives depuis votre compte.</li>
              </ul>
              <p>Pour toute question liée à la sécurité, contactez-nous à : <a href="mailto:security@oliplus.re">security@oliplus.re</a></p>
              <p>La protection de vos données est une priorité pour Oliplus.</p>
              <p><em>Ceci est un message automatique.</em></p>
              <br>
              <p>L'équipe sécurité Oliplus</p>
            </div>
          </div>
        </body>
        </html>
        `,

      "cgu-update": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Mise à jour des Conditions Générales</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.userName ? ` ${data.userName}` : ""},</p>
                            <p>Nous vous informons qu'une mise à jour des Conditions Générales d'Utilisation et/ou de Vente de la plateforme Oliplus a été effectuée.</p>
                            <p>Ces modifications entrent en vigueur à compter du : ${data.effectiveDate || "[Date]"}</p>
                            <p>Nous vous invitons à consulter les nouvelles conditions depuis votre espace personnel ou directement sur la plateforme.</p>
                            <p>L'utilisation continue de la plateforme vaut acceptation des nouvelles conditions.</p>
                            <p>Pour toute question juridique, vous pouvez nous contacter à : <a href="mailto:direction@oliplus.re">direction@oliplus.re</a></p>
                            <br>
                            <p>Cordialement,</p>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      // Envoyer confirmation RGPD prestataire
      "provider-welcome": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Création de votre compte prestataire Oliplus</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Votre compte prestataire sur la plateforme Oliplus a bien été créé.</p>
                            
                            <p>Dans le cadre de votre référencement et de la mise en relation avec les utilisateurs, Oliplus collecte et traite certaines données professionnelles et personnelles, notamment :</p>
                            <ul>
                                <li>identité du responsable,</li>
                                <li>coordonnées professionnelles,</li>
                                <li>informations légales et commerciales,</li>
                                <li>données de connexion.</li>
                            </ul>

                            <p>Ces données sont strictement utilisées pour :</p>
                            <ul>
                                <li>la gestion de votre compte prestataire,</li>
                                <li>la mise en relation avec les utilisateurs,</li>
                                <li>la facturation et le suivi contractuel,</li>
                                <li>le respect des obligations légales.</li>
                            </ul>

                            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment d'un droit d'accès, de rectification, de suppression et d'opposition.</p>

                            <p>Toute demande relative à vos données peut être adressée à : <a href="mailto:communication@oliplus.re">communication@oliplus.re</a></p>
                            <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                            <br>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      "provider-rgpd": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Traitement de votre demande – Données prestataire Oliplus</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Nous accusons réception de votre demande relative aux données associées à votre compte prestataire Oliplus.</p>
                    
                            <p>Votre demande sera traitée dans un délai maximal de 30 jours, conformément au RGPD.</p>
                            <p>Nous attirons votre attention sur le fait que certaines données peuvent être conservées lorsque leur conservation est nécessaire au respect d'obligations légales, comptables ou contractuelles.</p>

                            <p>En cas de besoin, nous pourrons vous demander des éléments complémentaires afin de vérifier votre identité ou votre qualité de représentant légal.</p>
                            
                            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez à tout moment d'un droit d'accès, de rectification, de suppression et d'opposition.</p>

                            <p>Cordialement,</p>
                            <p>Service Protection des Données</p>
                            <br>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      "provider-billing": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Confirmation de facturation – Compte prestataire Oliplus</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Nous vous confirmons la prise en compte de votre paiement sur la plateforme Oliplus.</p>
                            
                            <p>Détails de la transaction :</p>
                            <ul>
                                <li>Type de service : Abonnement / commission prestataire</li>
                                <li>Montant : ${data.amount ? `${data.amount} €` : "[Montant] €"}</li>
                                <li>Période concernée : ${data.period || "[Mensuelle / Annuelle]"}</li>
                                <li>Référence : ${data.transactionId || "[ID transaction]"}</li>
                            </ul>

                            <p>La facture correspondante est disponible dans votre espace prestataire.</p>

                            <p>Pour toute question relative à votre abonnement, votre commission ou vos factures, vous pouvez contacter notre service dédié à :  <a href="mailto:communication@oliplus.re">communication@oliplus.re</a></p>
                            <br>
                            <p>Cordialement,</p>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      "provider-security": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Alerte de sécurité – Compte prestataire Oliplus</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Une action sensible ou une tentative de connexion inhabituelle a été détectée sur votre compte prestataire Oliplus.</p>
                            
                            <p>Informations disponibles :</p>
                            <ul>
                                <li>Date et heure : ${data.date || "[Date / Heure]"}</li>
                                <li>Type d'action : ${data.action || "Connexion / modification de données / changement de coordonnées"}</li>
                                <li>Localisation approximative : ${data.location || "[Pays / Ville]"}</li>
                            </ul>

                            <p>Si vous êtes à l'origine de cette action, aucune démarche n'est requise.</p>

                            <p>Dans le cas contraire, nous vous recommandons de :</p>
                            <ul>
                                <li>modifier immédiatement votre mot de passe,</li>
                                <li>vérifier l'exactitude de vos informations professionnelles,</li>
                                <li>contacter notre service sécurité.</li>
                            </ul>
                            
                            <p>Contact sécurité : <a href="mailto:security@oliplus.re">security@oliplus.re</a></p>
                            <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                            <br>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      "provider-cgu": `
            <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Mise à jour des conditions prestataires – Oliplus</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Nous vous informons qu'une mise à jour des Conditions Générales applicables aux prestataires de la plateforme Oliplus a été effectuée.</p>
                            
                            <p>Ces conditions encadrent notamment :</p>
                            <ul>
                                <li>les règles de référencement,</li>
                                <li>les obligations du prestataire,</li>
                                <li>les commissions et modalités de facturation,</li>
                                <li>les responsabilités respectives des parties</li>
                            </ul>

                            <p>Les nouvelles conditions entrent en vigueur à compter du : ${data.effectiveDate || "[Date]"}</p>

                            <p>L'utilisation continue de votre compte prestataire vaut acceptation pleine et entière des nouvelles conditions.</p>
                            
                            <p>Pour toute question juridique, vous pouvez contacter :  <a href="mailto:direction@oliplus.re">direction@oliplus.re</a></p>
                            <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
                            <br>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,

      "provider-onboarding": `
                <!DOCTYPE html>
                <html>
                    <body>
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Validation de Compte Prestataire</h1>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p>Bonjour${data.providerName ? ` ${data.providerName}` : ""},</p>
                            <p>Votre dossier prestataire a été examiné par nos équipes.</p>
                            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                                <h3>Statut :</h3>
                                <p><strong>${data.status === "validated" ? "✅ Compte validé" : "📝 Informations complémentaires requises"}</strong></p>
                            </div>
                            ${
                              data.status === "validated"
                                ? "<p>Une fois validé, votre profil sera visible auprès des utilisateurs de la plateforme Oliplus.</p>"
                                : "<p>Veuillez fournir les informations supplémentaires demandées pour finaliser la validation de votre compte.</p>"
                            }
                            <p>Nous vous rappelons que vous êtes seul responsable :</p>
                            <ul>
                                <li>des informations publiées,</li>
                                <li>des prestations réalisées,</li>
                                <li>du respect des obligations légales et professionnelles applicables à votre activité.</li>
                            </ul>
                            <p>Pour toute question relative à votre référencement, vous pouvez contacter : <a href="mailto:onboarding@oliplus.re">onboarding@oliplus.re</a></p>
                            <p>Bienvenue sur Oliplus.</p>
                            <br>
                            <p>L'équipe Oliplus</p>
                            </div>
                        </div>
                    </body>
                </html>
        `,
    };

    return (
      templates[templateName] || `<p>Template ${templateName} non trouvé</p>`
    );
  }

  async sendOliplusEmail(emailData) {
    console.log("=== SERVICE EMAIL APPELÉ ===");
    console.log("Template demandé:", emailData.template);
    console.log("Destinataire:", emailData.to);
    console.log("Données:", emailData.data);

    try {
      const config = this.emailConfigs[emailData.template];
      if (!config) {
        console.error(`❌ Template ${emailData.template} non configuré`);
        console.log("Templates disponibles:", Object.keys(this.emailConfigs));
        throw new Error(`Template ${emailData.template} non configuré`);
      }

      console.log("✅ Template trouvé:", config);
      console.log("From email:", config.from);

      const htmlContent = this.getTemplate(emailData.template, emailData.data);
      console.log(
        "HTML généré (premiers 200 chars):",
        htmlContent?.substring(0, 200)
      );

      const mailOptions = {
        from: `Oliplus <${config.from}>`,
        to: emailData.to,
        subject: config.subject,
        html: htmlContent,
      };

      console.log("Options mail:", mailOptions);

      console.log("Envoi en cours...");
      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Email ${emailData.template} envoyé à ${emailData.to}:`,
        info.messageId
      );
      console.log("Réponse:", info.response);

      return {
        success: true,
        messageId: info.messageId,
        to: emailData.to,
        template: emailData.template,
      };
    } catch (error) {
      console.error(`❌ ERREUR CRITIQUE dans sendOliplusEmail:`);
      console.error("Template:", emailData.template);
      console.error("À:", emailData.to);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);

      // Détails SMTP
      if (error.responseCode) {
        console.error("Code réponse SMTP:", error.responseCode);
      }
      if (error.response) {
        console.error("Réponse SMTP:", error.response);
      }

      throw error;
    }
  }

  async sendProviderWelcomePack(providerEmail, providerName) {
    const emails = [
      {
        to: providerEmail,
        template: "provider-welcome",
        data: { providerName },
      },
      {
        to: providerEmail,
        template: "provider-onboarding",
        data: { providerName, status: "validated" },
      },
    ];

    const results = [];
    for (const email of emails) {
      try {
        const result = await this.sendOliplusEmail(email);
        results.push({ email: email.template, success: true, result });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          email: email.template,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new OliplusEmailService();
