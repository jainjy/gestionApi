const express = require("express");
const router = express.Router();
const oliplusEmailService = require("../services/oliplusEmailService");

// Fonction utilitaire pour vérifier le service email
const verifyEmailService = () => {
  console.log("Service email:", oliplusEmailService ? "OK" : "NULL");
  console.log("Transporter:", oliplusEmailService?.transporter ? "OK" : "NULL");

  if (!oliplusEmailService || !oliplusEmailService.transporter) {
    console.error("❌ Service email non initialisé");
    return false;
  }
  return true;
};

// Fonction utilitaire pour formater les erreurs
const formatErrorResponse = (error, routeName) => {
  console.error(`❌ ERREUR CRITIQUE dans ${routeName}:`);
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);

  if (error.code) console.error("Code:", error.code);
  if (error.responseCode) console.error("Code réponse:", error.responseCode);
  if (error.command) console.error("Commande:", error.command);

  return {
    success: false,
    error: `Erreur lors de l'envoi de l'email ${routeName}`,
    details: process.env.NODE_ENV === "production" ? undefined : error.message,
  };
};

// POST - Envoyer email de bienvenue utilisateur
router.post("/send-user-welcome", async (req, res) => {
  console.log("=== DÉBUT /send-user-welcome ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, userName } = req.body;

    if (!email) {
      console.log("❌ Email manquant");
      return res.status(400).json({
        success: false,
        error: "Email requis",
      });
    }

    console.log("📧 Préparation email pour:", email);
    console.log("👤 Nom utilisateur:", userName);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "user-welcome",
      data: { userName },
    });

    console.log("✅ Email envoyé avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Email de bienvenue envoyé avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-user-welcome");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-user-welcome ===");
  }
});

// POST - Envoyer confirmation RGPD
router.post("/send-rgpd-confirmation", async (req, res) => {
  console.log("=== DÉBUT /send-rgpd-confirmation ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, userName } = req.body;

    if (!email) {
      console.log("❌ Email manquant");
      return res.status(400).json({
        success: false,
        error: "Email requis",
      });
    }

    console.log("📧 Préparation email RGPD pour:", email);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "rgpd-confirmation",
      data: { userName },
    });

    console.log("✅ Email RGPD envoyé avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Confirmation RGPD envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-rgpd-confirmation");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-rgpd-confirmation ===");
  }
});

// POST - Envoyer confirmation de paiement
router.post("/send-payment-confirmation", async (req, res) => {
  console.log("=== DÉBUT /send-payment-confirmation ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, userName, serviceName, amount, transactionId } = req.body;

    if (!email || !amount || !transactionId) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        amount: !!amount,
        transactionId: !!transactionId,
      });
      return res.status(400).json({
        success: false,
        error: "Email, montant et référence de transaction requis",
      });
    }

    console.log("📧 Préparation confirmation paiement pour:", email);
    console.log("💰 Montant:", amount);
    console.log("🔖 Transaction ID:", transactionId);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "payment-confirmation",
      data: {
        userName,
        serviceName: serviceName || "Service Oliplus",
        amount,
        date: new Date().toLocaleDateString("fr-FR"),
        transactionId,
      },
    });

    console.log("✅ Email paiement envoyé avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Confirmation de paiement envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(
      error,
      "/send-payment-confirmation"
    );
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-payment-confirmation ===");
  }
});

// POST - Envoyer alerte de sécurité
router.post("/send-security-alert", async (req, res) => {
  console.log("=== DÉBUT /send-security-alert ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, userName, location, action } = req.body;

    if (!email || !location || !action) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        location: !!location,
        action: !!action,
      });
      return res.status(400).json({
        success: false,
        error: "Email, localisation et action requises",
      });
    }

    console.log("📧 Préparation alerte sécurité pour:", email);
    console.log("📍 Localisation:", location);
    console.log("⚡ Action:", action);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "security-alert",
      data: {
        userName,
        date: new Date().toLocaleString("fr-FR"),
        location,
        action,
      },
    });

    console.log("✅ Alerte sécurité envoyée avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Alerte de sécurité envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-security-alert");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-security-alert ===");
  }
});

// POST - Envoyer mise à jour CGU
router.post("/send-cgu-update", async (req, res) => {
  console.log("=== DÉBUT /send-cgu-update ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, userName, effectiveDate } = req.body;

    if (!email) {
      console.log("❌ Email manquant");
      return res.status(400).json({
        success: false,
        error: "Email requis",
      });
    }

    console.log("📧 Préparation CGU update pour:", email);
    console.log("📅 Date effective:", effectiveDate || "Aujourd'hui");

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "cgu-update",
      data: {
        userName,
        effectiveDate: effectiveDate || new Date().toLocaleDateString("fr-FR"),
      },
    });

    console.log("✅ Email CGU envoyé avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Notification CGU envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-cgu-update");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-cgu-update ===");
  }
});

// POST - Envoyer bienvenue prestataire
router.post("/send-provider-welcome", async (req, res) => {
  console.log("=== DÉBUT /send-provider-welcome ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName } = req.body;

    if (!email || !providerName) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
      });
      return res.status(400).json({
        success: false,
        error: "Email et nom du prestataire requis",
      });
    }

    console.log("📧 Préparation bienvenue prestataire pour:", email);
    console.log("👔 Nom prestataire:", providerName);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "provider-welcome",
      data: { providerName },
    });

    console.log(
      "✅ Bienvenue prestataire envoyé avec succès:",
      result.messageId
    );

    res.json({
      success: true,
      data: result,
      message: "Email de bienvenue prestataire envoyé avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-provider-welcome");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-welcome ===");
  }
});

// POST - Envoyer confirmation RGPD prestataire
router.post("/send-provider-rgpd", async (req, res) => {
  console.log("=== DÉBUT /send-provider-rgpd ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName } = req.body;

    console.log("Email:", email);
    console.log("ProviderName:", providerName);

    if (!email || !providerName) {
      console.log("❌ Validation échouée - champs manquants");
      return res.status(400).json({
        success: false,
        error: "Email et nom du prestataire requis",
        details: {
          emailProvided: !!email,
          providerNameProvided: !!providerName,
        },
      });
    }

    // Validation du format d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Format d'email invalide:", email);
      return res.status(400).json({
        success: false,
        error: "Format d'email invalide",
      });
    }

    console.log("✅ Validation réussie, préparation de l'email...");

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const emailData = {
      to: email,
      template: "provider-rgpd",
      data: { providerName },
    };

    console.log("Données email:", emailData);

    const result = await oliplusEmailService.sendOliplusEmail(emailData);

    console.log(
      "✅ Email RGPD prestataire envoyé avec succès:",
      result.messageId
    );

    res.json({
      success: true,
      data: result,
      message: `Confirmation RGPD prestataire envoyée avec succès à ${email}`,
    });
  } catch (error) {
    console.error("❌ ERREUR dans /send-provider-rgpd:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    if (error.message && error.message.includes("Template")) {
      return res.status(500).json({
        success: false,
        error: "Erreur de configuration du template d'email",
        details: error.message,
      });
    }

    if (error.code) {
      console.error("Code:", error.code);
      return res.status(500).json({
        success: false,
        error: "Erreur d'envoi d'email",
        details: `Code: ${error.code}`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la confirmation RGPD prestataire",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    console.log("=== FIN /send-provider-rgpd ===");
  }
});

// POST - Envoyer facturation prestataire
router.post("/send-provider-billing", async (req, res) => {
  console.log("=== DÉBUT /send-provider-billing ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName, amount, period, transactionId } = req.body;

    if (!email || !providerName || !amount || !transactionId) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
        amount: !!amount,
        transactionId: !!transactionId,
      });
      return res.status(400).json({
        success: false,
        error: "Email, nom, montant et référence de transaction requis",
      });
    }

    console.log("📧 Préparation facturation pour:", email);
    console.log("👔 Prestataire:", providerName);
    console.log("💰 Montant:", amount);
    console.log("📅 Période:", period || "Mensuelle");

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "provider-billing",
      data: {
        providerName,
        amount,
        period: period || "Mensuelle",
        transactionId,
      },
    });

    console.log(
      "✅ Facturation prestataire envoyée avec succès:",
      result.messageId
    );

    res.json({
      success: true,
      data: result,
      message: "Facturation prestataire envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-provider-billing");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-billing ===");
  }
});

// POST - Envoyer sécurité prestataire
router.post("/send-provider-security", async (req, res) => {
  console.log("=== DÉBUT /send-provider-security ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName, location, action } = req.body;

    if (!email || !providerName || !location || !action) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
        location: !!location,
        action: !!action,
      });
      return res.status(400).json({
        success: false,
        error: "Email, nom, localisation et action requises",
      });
    }

    console.log("📧 Préparation sécurité prestataire pour:", email);
    console.log("👔 Prestataire:", providerName);
    console.log("📍 Localisation:", location);
    console.log("⚡ Action:", action);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "provider-security",
      data: {
        providerName,
        date: new Date().toLocaleString("fr-FR"),
        location,
        action,
      },
    });

    console.log(
      "✅ Alerte sécurité prestataire envoyée avec succès:",
      result.messageId
    );

    res.json({
      success: true,
      data: result,
      message: "Alerte sécurité prestataire envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-provider-security");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-security ===");
  }
});

// POST - Envoyer CGU prestataire
router.post("/send-provider-cgu", async (req, res) => {
  console.log("=== DÉBUT /send-provider-cgu ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName, effectiveDate } = req.body;

    if (!email || !providerName) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
      });
      return res.status(400).json({
        success: false,
        error: "Email et nom du prestataire requis",
      });
    }

    console.log("📧 Préparation CGU prestataire pour:", email);
    console.log("👔 Prestataire:", providerName);
    console.log("📅 Date effective:", effectiveDate || "Aujourd'hui");

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "provider-cgu",
      data: {
        providerName,
        effectiveDate: effectiveDate || new Date().toLocaleDateString("fr-FR"),
      },
    });

    console.log("✅ CGU prestataire envoyé avec succès:", result.messageId);

    res.json({
      success: true,
      data: result,
      message: "Notification CGU prestataire envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(error, "/send-provider-cgu");
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-cgu ===");
  }
});

// POST - Envoyer onboarding prestataire
router.post("/send-provider-onboarding", async (req, res) => {
  console.log("=== DÉBUT /send-provider-onboarding ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName, status } = req.body;

    if (!email || !providerName) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
      });
      return res.status(400).json({
        success: false,
        error: "Email et nom du prestataire requis",
      });
    }

    console.log("📧 Préparation onboarding pour:", email);
    console.log("👔 Prestataire:", providerName);
    console.log("📊 Statut:", status || "validated");

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendOliplusEmail({
      to: email,
      template: "provider-onboarding",
      data: {
        providerName,
        status: status || "validated",
      },
    });

    console.log(
      "✅ Onboarding prestataire envoyé avec succès:",
      result.messageId
    );

    res.json({
      success: true,
      data: result,
      message: "Notification onboarding prestataire envoyée avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(
      error,
      "/send-provider-onboarding"
    );
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-onboarding ===");
  }
});

// POST - Envoyer pack complet prestataire
router.post("/send-provider-welcome-pack", async (req, res) => {
  console.log("=== DÉBUT /send-provider-welcome-pack ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Body:", req.body);

  try {
    const { email, providerName } = req.body;

    if (!email || !providerName) {
      console.log("❌ Données manquantes:", {
        email: !!email,
        providerName: !!providerName,
      });
      return res.status(400).json({
        success: false,
        error: "Email et nom du prestataire requis",
      });
    }

    console.log("📧 Préparation pack bienvenue pour:", email);
    console.log("👔 Prestataire:", providerName);

    if (!verifyEmailService()) {
      return res.status(500).json({
        success: false,
        error: "Service email non disponible",
      });
    }

    const result = await oliplusEmailService.sendProviderWelcomePack(
      email,
      providerName
    );

    console.log("✅ Pack bienvenue envoyé avec succès:", result);

    res.json({
      success: true,
      data: result,
      message: "Pack de bienvenue prestataire envoyé avec succès",
    });
  } catch (error) {
    const errorResponse = formatErrorResponse(
      error,
      "/send-provider-welcome-pack"
    );
    res.status(500).json(errorResponse);
  } finally {
    console.log("=== FIN /send-provider-welcome-pack ===");
  }
});

module.exports = router;
