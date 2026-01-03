const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const { verifyInternalSignature } = require("../middleware/internalAuth");

// 1. LA CIBLE : La route qui reçoit et vérifie la signature
router.post("/receive-check", verifyInternalSignature, (req, res) => {
    console.log("✅ Validation réussie ! Données reçues :", req.body);
    res.json({
        success: true,
        message: "L'API a validé la signature interne",
        receivedData: req.body
    });
});

// 2. L'EXPÉDITEUR : La route qui génère la signature et envoie la requête
router.get("/trigger-send", async (req, res) => {
    const secret = process.env.INTERNAL_SERVICE_SECRET || "mon_secret_temporaire";
    const dataToSend = {
        orderId: "CMD-2026-XYZ",
        status: "EN_COURS_DE_LIVRAISON",
        courier: "Jean Express"
    };

    // Génération de la signature HMAC
    const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(dataToSend))
        .digest("hex");

    try {
        // On s'auto-appelle sur la route "receive-check" 
        // (Remplacez localhost:3001 par l'URL de votre API de livraison en prod)
        const response = await axios.post(
          `${process.env.AUTRE_API_URL || "http://localhost:3001"}/api/test-internal/receive-check`,
          dataToSend,
          {
            headers: {
              "x-service-signature": signature,
              "Content-Type": "application/json",
            },
          }
        );

        res.json({
            info: "Test d'envoi effectué",
            apiResponse: response.data
        });
    } catch (error) {
        console.error("Erreur lors du test :", error.response?.data || error.message);
        res.status(500).json({
            error: "Échec de la communication interne",
            details: error.response?.data
        });
    }
});

module.exports = router;