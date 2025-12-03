const express = require('express');
const router = express.Router();
const { pool } = require('../lib/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/* GEMINI SETUP */
let embedModel;
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
} catch (err) {
  console.error("Erreur Gemini:", err);
}

async function generateEmbeddingsForAllTables() {
  console.log('⚡ Génération automatique des embeddings pour toutes les tables...');
  for (const table of tables) {
    try {
      const colConcat = table.columns.map(c => `"${c}"`).join(` || ' ' || `);
      const querySelect = `
        SELECT id, ${colConcat} AS text
        FROM "${table.name}"
        WHERE embedding IS NULL
      `;
      const rows = (await pool.query(querySelect)).rows;

      for (const row of rows) {
        const text = row.text || '';
        if (!text) continue;
        const embedding = await generateEmbedding(text);
        const embeddingArray = `[${embedding.join(',')}]`;

        await pool.query(
          `UPDATE "${table.name}" SET embedding = $1 WHERE id = $2`,
          [embeddingArray, row.id]
        );
        console.log(`✅ Embedding généré pour ${table.name} id=${row.id}`);
      }
    } catch (err) {
      console.error(`❌ Erreur génération embeddings pour ${table.name}:`, err.message);
    }
  }
  console.log('🎉 Tous les embeddings ont été générés !');
}

/* EMBEDDINGS */
async function generateEmbedding(text) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

/* PROFESSIONNELS PREMIUM */
async function getPremiumUsers() {
  const query = `
    SELECT u.id
    FROM "User" u
    LEFT JOIN "Subscription" s ON s."userId" = u.id
    LEFT JOIN "Transaction" t ON t."userId" = u.id
    WHERE u.role = 'professional'
    AND s.status = 'active'
    AND t.status = 'paid'
  `;
  const rows = (await pool.query(query)).rows;
  return rows.map(r => r.id);
}

/* TABLES A RECHERCHER */
const tables = [
  { name: "Metier", columns: ["libelle"], ownerField: null },
  { name: "Product", columns: ["name", "category", "price", "quantity"], ownerField: "userId" },
  { name: "Property", columns: ["title", "type", "price"], ownerField: "ownerId" },
  { name: "Service", columns: ["libelle"], ownerField: "createdById" },
];

/* ROUTE PRINCIPALE */
router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt)
    return res.status(400).json({ error: "Prompt manquant" });

  try {
    const embedding = await generateEmbedding(prompt);
    const vector = `[${embedding.join(',')}]`;

    const premiumUsers = await getPremiumUsers();
    let allResults = [];

    /* RECHERCHE DANS CHAQUE TABLE */
    for (const table of tables) {
      const colConcat = table.columns.map(c => `"${c}"`).join(` || ' ' || `);

      const query = `
        SELECT
          *,
          embedding::text AS embedding,
          (embedding <=> '${vector}'::vector) AS distance,
          '${table.name}' AS source_table,
          ${table.ownerField ? `"${table.ownerField}"` : "NULL"} AS ownerId
        FROM "${table.name}"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> '${vector}'::vector
        LIMIT 10
      `;

      const rows = (await pool.query(query)).rows;

      const mapped = rows.map(r => ({
        ...r,
        similarity: (1 - r.distance) * 100,
        isPremiumOwner: table.ownerField
          ? premiumUsers.includes(r.ownerid || r.ownerId)
          : false,
        clickScore: r.clickcount || r.viewcount || 0
      }));

      allResults.push(...mapped);
    }

    /* TRIS BOOSTÉS */
    allResults.sort((a, b) => {
      if (a.isPremiumOwner !== b.isPremiumOwner)
        return b.isPremiumOwner - a.isPremiumOwner;

      if (a.clickScore !== b.clickScore)
        return b.clickScore - a.clickScore;

      return b.similarity - a.similarity;
    });

    res.json({
      success: true,
      count: allResults.length,
      results: allResults
    });

  } catch (error) {
    console.error("Erreur recherche premium:", error);
    res.status(500).json({ error: error.message });
  }
});
generateEmbeddingsForAllTables();

module.exports = router;
