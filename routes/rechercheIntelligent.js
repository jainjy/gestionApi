// routes/rechercheIntelligent.js
const express = require('express');
const router = express.Router();
const { pool } = require('../lib/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// ======================================
// ⚙️ Initialisation Gemini
// ======================================
let genAI, embedModel;

try {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY manquante');

  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  console.log('✅ API Gemini configurée');
} catch (error) {
  console.error('❌ Erreur configuration Gemini:', error.message);
  process.exit(1);
}

// ======================================
// 🧠 Fonction : Génération d’embedding
// ======================================
async function generateEmbedding(text) {
  try {
    const result = await embedModel.embedContent(text);
    const embedding = result.embedding.values;
    if (!embedding || embedding.length === 0) throw new Error('Embedding vide');
    return embedding;
  } catch (error) {
    console.error('❌ Erreur embedding:', error.message);
    throw error;
  }
}

// ======================================
// 📦 Tables cibles pour recherche
// ======================================
const tables = [
//  { name: 'BlogArticle', columns: ['title', 'slug'] },
  { name: 'Metier', columns: ['libelle'] },
  { name: 'Product', columns: ['name', 'category', 'price', 'quantity'] },
  { name: 'Property', columns: ['title', 'type', 'price'] },
  { name: 'Service', columns: ['libelle'] },
];

// ======================================
// ⚡ Génération automatique des embeddings manquants
// ======================================
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

// ======================================
// 🔎 Route POST /api/recherche-intelligente
// ======================================
router.post('/', async (req, res) => {
  const start = Date.now();
  const { prompt } = req.body;

  if (!prompt || prompt.length < 2)
    return res.status(400).json({ error: 'Prompt invalide' });

  try {
    const embedding = await generateEmbedding(prompt);
    const allResults = [];

    for (const table of tables) {
      const query = `
        SELECT *, embedding <=> $1::vector AS distance, '${table.name}' AS source_table
        FROM "${table.name}"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 5
      `;
      const result = await pool.query(query, [`[${embedding.join(',')}]`]);
      allResults.push(
        ...result.rows.map(row => ({
          ...row,
          relevance: Math.max(0, 1 - row.distance),
          similarity: Math.max(0, (1 - row.distance) * 100),
        }))
      );
    }

    allResults.sort((a, b) => b.relevance - a.relevance);
    const finalResults = allResults.slice(0, 20);

    res.json({
      success: true,
      results: finalResults,
      totalResults: finalResults.length,
      searchTime: `${Date.now() - start}ms`,
    });
  } catch (err) {
    console.error('💥 Erreur recherche:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================================
// 🟢 Génération automatique d’embeddings au démarrage
// ======================================
generateEmbeddingsForAllTables();

module.exports = router;
