const express = require("express");
const router = express.Router();
const oliplusEmailService = require("../services/oliplusEmailService");
const { authenticateToken } = require("../middleware/auth");

// POST - Envoyer email de bienvenue utilisateur
router.post("/send-user-welcome", async (req, res) => {
    try {
        const { email, userName } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'user-welcome',
            data: { userName }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Email de bienvenue envoyé avec succès"
        });
    } catch (error) {
        console.error("Error sending welcome email:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de l'email de bienvenue"
        });
    }
});

// POST - Envoyer confirmation RGPD
router.post("/send-rgpd-confirmation", async (req, res) => {
    try {
        const { email, userName } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'rgpd-confirmation',
            data: { userName }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Confirmation RGPD envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending RGPD confirmation:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la confirmation RGPD"
        });
    }
});

// POST - Envoyer confirmation de paiement
router.post("/send-payment-confirmation", async (req, res) => {
    try {
        const { email, userName, serviceName, amount, transactionId } = req.body;
        
        if (!email || !amount || !transactionId) {
            return res.status(400).json({
                success: false,
                error: "Email, montant et référence de transaction requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'payment-confirmation',
            data: { 
                userName, 
                serviceName: serviceName || "Service Oliplus",
                amount, 
                date: new Date().toLocaleDateString('fr-FR'),
                transactionId 
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Confirmation de paiement envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending payment confirmation:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la confirmation de paiement"
        });
    }
});

// POST - Envoyer alerte de sécurité
router.post("/send-security-alert", async (req, res) => {
    try {
        const { email, userName, location, action } = req.body;
        
        if (!email || !location || !action) {
            return res.status(400).json({
                success: false,
                error: "Email, localisation et action requises"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'security-alert',
            data: { 
                userName,
                date: new Date().toLocaleString('fr-FR'),
                location,
                action
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Alerte de sécurité envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending security alert:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de l'alerte de sécurité"
        });
    }
});

// POST - Envoyer mise à jour CGU
router.post("/send-cgu-update", async (req, res) => {
    try {
        const { email, userName, effectiveDate } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'cgu-update',
            data: { 
                userName,
                effectiveDate: effectiveDate || new Date().toLocaleDateString('fr-FR')
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Notification CGU envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending CGU update:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la notification CGU"
        });
    }
});

// POST - Envoyer bienvenue prestataire
router.post("/send-provider-welcome", async (req, res) => {
    try {
        const { email, providerName } = req.body;
        
        if (!email || !providerName) {
            return res.status(400).json({
                success: false,
                error: "Email et nom du prestataire requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-welcome',
            data: { providerName }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Email de bienvenue prestataire envoyé avec succès"
        });
    } catch (error) {
        console.error("Error sending provider welcome:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de l'email de bienvenue prestataire"
        });
    }
});

// POST - Envoyer confirmation RGPD prestataire
router.post("/send-provider-rgpd", async (req, res) => {
    try {
        const { email, providerName } = req.body;
        
        if (!email || !providerName) {
            return res.status(400).json({
                success: false,
                error: "Email et nom du prestataire requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-rgpd',
            data: { providerName }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Confirmation RGPD prestataire envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending provider RGPD:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la confirmation RGPD prestataire"
        });
    }
});

// POST - Envoyer facturation prestataire
router.post("/send-provider-billing", async (req, res) => {
    try {
        const { email, providerName, amount, period, transactionId } = req.body;
        
        if (!email || !providerName || !amount || !transactionId) {
            return res.status(400).json({
                success: false,
                error: "Email, nom, montant et référence de transaction requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-billing',
            data: { 
                providerName,
                amount,
                period: period || "Mensuelle",
                transactionId 
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Facturation prestataire envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending provider billing:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la facturation prestataire"
        });
    }
});

// POST - Envoyer sécurité prestataire
router.post("/send-provider-security", async (req, res) => {
    try {
        const { email, providerName, location, action } = req.body;
        
        if (!email || !providerName || !location || !action) {
            return res.status(400).json({
                success: false,
                error: "Email, nom, localisation et action requises"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-security',
            data: { 
                providerName,
                date: new Date().toLocaleString('fr-FR'),
                location,
                action
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Alerte sécurité prestataire envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending provider security:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de l'alerte sécurité prestataire"
        });
    }
});

// POST - Envoyer CGU prestataire
router.post("/send-provider-cgu", async (req, res) => {
    try {
        const { email, providerName, effectiveDate } = req.body;
        
        if (!email || !providerName) {
            return res.status(400).json({
                success: false,
                error: "Email et nom du prestataire requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-cgu',
            data: { 
                providerName,
                effectiveDate: effectiveDate || new Date().toLocaleDateString('fr-FR')
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Notification CGU prestataire envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending provider CGU:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la notification CGU prestataire"
        });
    }
});

// POST - Envoyer onboarding prestataire
router.post("/send-provider-onboarding", async (req, res) => {
    try {
        const { email, providerName, status } = req.body;
        
        if (!email || !providerName) {
            return res.status(400).json({
                success: false,
                error: "Email et nom du prestataire requis"
            });
        }

        const result = await oliplusEmailService.sendOliplusEmail({
            to: email,
            template: 'provider-onboarding',
            data: { 
                providerName,
                status: status || 'validated'
            }
        });
        
        res.json({
            success: true,
            data: result,
            message: "Notification onboarding prestataire envoyée avec succès"
        });
    } catch (error) {
        console.error("Error sending provider onboarding:", error);
        res.status(500).json({
            success: false,
            error: "Erreur lors de l'envoi de la notification onboarding"
        });
    }
});

module.exports = router;