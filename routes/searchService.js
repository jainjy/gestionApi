const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

/**
 * POST /api/search
 * Body: { query: string }
 */
router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({ message: "Requête invalide" });
    }

    // 1️⃣ Charger tous les services (PostgreSQL)
    const { rows: services } = await pool.query(`
     SELECT
    s.id,
    s.libelle,
    s.description,
    c.name AS category,
    STRING_AGG(m.libelle, ', ') AS metiers
    FROM "Service" s
    LEFT JOIN "Category" c ON c.id = s."categoryId"
    LEFT JOIN "MetierService" sm ON sm."serviceId" = s.id
    LEFT JOIN "Metier" m ON m.id = sm."metierId"
    GROUP BY s.id, c.name;

    `);

    // 2️⃣ Contexte envoyé à Gemini
    const servicesContext = services.map((s) => ({
      id: s.id,
      name: s.libelle,
      description: s.description,
      category: s.category,
      metiers: s.metiers ? s.metiers.split(", ") : [],
    }));

    // 3️⃣ Prompt IA
    const prompt = `
Tu es un moteur de recherche intelligent.
Analyse la demande utilisateur et retourne TOUS les services associés logiquement.
Même si les mots exacts ne sont pas présents.

RÈGLES STRICTES :
- Retourne UNIQUEMENT un tableau JSON d'IDs (ex: [1,2,3])
- Aucun texte
- Aucune explication

Demande utilisateur :
"${query}"

Liste des services :
${JSON.stringify(servicesContext)}
`;

    const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();

        // 🔥 Nettoyage markdown Gemini
        responseText = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();


    // 4️⃣ Parser la réponse IA
        let serviceIds;
        try {
        serviceIds = JSON.parse(responseText);
        if (!Array.isArray(serviceIds)) throw new Error();
        } catch {
        return res.status(500).json({
            message: "Réponse IA invalide",
            raw: responseText,
        });
        }


    // 5️⃣ Filtrer les services
    const matchedServices = services.filter((s) =>
      serviceIds.includes(s.id)
    );

    res.json({
      query,
      count: matchedServices.length,
      services: matchedServices,
    });
  } catch (error) {
    console.error("Erreur recherche IA Gemini :", error);
    res.status(500).json({ message: "Erreur serveur IA" });
  }
});

module.exports = router;
