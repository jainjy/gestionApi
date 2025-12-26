const express = require('express');
const router = express.Router();
const { pool } = require('../lib/db1');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/* GEMINI TEXT MODEL */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

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

/* FONCTION DE SCORING TEXTUEL */
function calculateTextScore(item, prompt, tableType) {
  const promptLower = prompt.toLowerCase();
  let score = 0;
  let maxScore = 0;

  // Pondération selon la table (basé sur les champs du code original)
  const fieldWeights = {
    Property: {
      title: 50,
      type: 30,
      price: 20
    },
    Service: {
      libelle: 70,
      description: 30
    },
    Product: {
      name: 40,
      category: 40,
      price: 20
    },
    Metier: {
      libelle: 100
    }
  };

  const weights = fieldWeights[tableType] || {};

  Object.keys(weights).forEach(field => {
    if (item[field] !== undefined && item[field] !== null) {
      const fieldValue = String(item[field]).toLowerCase();
      const weight = weights[field];
      maxScore += weight;

      // Recherche exacte
      if (fieldValue.includes(promptLower)) {
        score += weight;
      }
      // Recherche par mots
      else {
        const promptWords = promptLower.split(/\s+/).filter(w => w.length > 2);
        promptWords.forEach(word => {
          if (fieldValue.includes(word)) {
            score += weight * 0.5;
          }
        });
      }
    }
  });

  // Normalisation du score (0-100%)
  const normalizedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  return Math.min(100, normalizedScore);
}

/* ROUTE PRINCIPALE */
router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Recherche invalide (minimum 3 caractères)" });
  }

  try {
    /* 1️⃣ CHARGER LES DONNÉES AVEC LES CHAMPS EXISTANTS */
  const client = await pool.connect();

    let properties, services, products, metiers;

    try {
      properties = await client.query(`
        SELECT id, title, type, price, city, description, "ownerId"
        FROM "Property"
      `);

      services = await client.query(`
        SELECT id, libelle, description, "createdById"
        FROM "Service"
      `);

      products = await client.query(`
        SELECT id, name, category, price, "userId"
        FROM "Product"
      `);

      metiers = await client.query(`
        SELECT id, libelle
        FROM "Metier"
      `);

    } finally {
      client.release(); // ⬅️ OBLIGATOIRE
    }


    /* 2️⃣ FILTRAGE TEXTUEL LOCAL (backup si l'IA échoue) */
    const localFilterResults = [];

    // Filtrer les propriétés (basé sur les champs existants)
    properties.rows.forEach(property => {
      const searchableText = [
        property.title,
        property.type,
        property.city,
        property.description
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(prompt.toLowerCase())) {
        localFilterResults.push({
          table: "Property",
          item: property,
          score: calculateTextScore(property, prompt, "Property")
        });
      }
    });

    // Filtrer les services (basé sur les champs existants)
    services.rows.forEach(service => {
      const searchableText = [
        service.libelle,
        service.description
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(prompt.toLowerCase())) {
        localFilterResults.push({
          table: "Service",
          item: service,
          score: calculateTextScore(service, prompt, "Service")
        });
      }
    });

    // Filtrer les produits (basé sur les champs existants)
    products.rows.forEach(product => {
      const searchableText = [
        product.name,
        product.category
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(prompt.toLowerCase())) {
        localFilterResults.push({
          table: "Product",
          item: product,
          score: calculateTextScore(product, prompt, "Product")
        });
      }
    });

    // Filtrer les métiers (basé sur les champs existants)
    metiers.rows.forEach(metier => {
      if (metier.libelle.toLowerCase().includes(prompt.toLowerCase())) {
        localFilterResults.push({
          table: "Metier",
          item: metier,
          score: calculateTextScore(metier, prompt, "Metier")
        });
      }
    });

    /* 3️⃣ CONTEXTE POUR L'IA (uniquement les champs existants) */
    const context = {
      Property: properties.rows.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        price: p.price,
        city: p.city,
        description: p.description || ""
      })),
      Service: services.rows.map(s => ({
        id: s.id,
        libelle: s.libelle,
        description: s.description || ""
      })),
      Product: products.rows.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price
      })),
      Metier: metiers.rows.map(m => ({
        id: m.id,
        libelle: m.libelle
      }))
    };

    /* 4️⃣ PROMPT IA SIMPLIFIÉ */
    const iaPrompt = `
Tu es un moteur de recherche pour une plateforme d'agence immobilière et services.

Si la demande utilisateur contient :
- une faute d’orthographe
- un mot mal écrit
- un mot partiellement écrit


  Tu dois automatiquement :
  - identifier le mot corrigé le plus proche
  - privilégier la similarité de sens plutôt que la similarité exacte du mot
  - ne jamais rejeter une demande uniquement à cause d’une faute

  Analyse cette demande et retourne les éléments pertinents sous forme de tableau JSON.

  Demande utilisateur : "${prompt}"

  Format requis (tableau d'objets) :
  [
    { "table": "Property", "id": "id_value", "relevanceScore": 85 },
    { "table": "Service", "id": "id_value", "relevanceScore": 70 }
  ]

  Tables disponibles et leurs champs :
  1. Property : title, type, price, city, description
  2. Service : libelle, description
  3. Product : name, category, price
  4. Metier : libelle

Données disponibles :
${JSON.stringify(context, null, 2)}
`;

    let aiResults = [];
    try {
      const result = await model.generateContent(iaPrompt);
      let responseText = result.response.text().trim();

      // Nettoyage de la réponse
      responseText = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^\[/, '[')
        .replace(/\]$/, ']')
        .trim();

      // Parsing sécurisé
      const parsedResults = JSON.parse(responseText);
      if (Array.isArray(parsedResults)) {
        aiResults = parsedResults.slice(0, 30); // Limite à 30
      }
    } catch (iaError) {
      console.warn("IA fallback, utilisation du filtrage local:", iaError.message);
      // Fallback : utiliser les résultats du filtrage local
      aiResults = localFilterResults.map(r => ({
        table: r.table,
        id: r.item.id,
        relevanceScore: r.score
      })).slice(0, 30);
    }

    /* 5️⃣ RÉCUPÉRATION DES DONNÉES COMPLÈTES */
    const premiumUsers = await getPremiumUsers();
    let results = [];

    for (const aiItem of aiResults) {
      let item;
      let ownerField;

      switch (aiItem.table) {
        case "Property":
          item = properties.rows.find(p => p.id === aiItem.id);
          ownerField = item?.ownerId;
          break;
        case "Service":
          item = services.rows.find(s => s.id === aiItem.id);
          ownerField = item?.createdById;
          break;
        case "Product":
          item = products.rows.find(p => p.id === aiItem.id);
          ownerField = item?.userId;
          break;
        case "Metier":
          item = metiers.rows.find(m => m.id === aiItem.id);
          ownerField = null;
          break;
      }

      if (!item) continue;

      // Calculer le score textuel (reprise de la logique originale)
      const textScore = aiItem.relevanceScore || 
                       calculateTextScore(item, prompt, aiItem.table);
      
      // Utiliser clickScore = 0 par défaut (comme dans l'original si pas de viewcount/clickcount)
      const clickScore = 0;

      results.push({
        table: aiItem.table,
        ...item,
        similarity: Math.round(textScore), // Même champ que l'original
        isPremiumOwner: ownerField ? premiumUsers.includes(ownerField) : false,
        clickScore: clickScore // Valeur par défaut
      });
    }

    /* 6️⃣ TRI MULTI-CRITÈRES (identique à la logique vectorielle originale) */
    results.sort((a, b) => {
      // 1. Premium first (identique)
      if (a.isPremiumOwner !== b.isPremiumOwner) {
        return b.isPremiumOwner - a.isPremiumOwner;
      }

      // 2. Popularité (clickScore - identique à l'original)
      if (a.clickScore !== b.clickScore) {
        return b.clickScore - a.clickScore;
      }

      // 3. Pertinence (similarity - remplace la distance vectorielle)
      return b.similarity - a.similarity;
    });

    /* 7️⃣ FORMATAGE DE LA RÉPONSE (identique au format original) */
    const formattedResults = results.map(r => ({
      id: r.id,
      source_table: r.table,
      similarity: r.similarity,
      isPremiumOwner: r.isPremiumOwner,
      clickScore: r.clickScore,
      // Inclure tous les champs originaux selon la table
      ...r
    })).map(({ table, ...rest }) => rest); // Retirer le champ table dupliqué

    res.json({
      success: true,
      count: formattedResults.length,
      results: formattedResults
    });

  } catch (error) {
    console.error("Erreur recherche textuelle:", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { pool } = require('../lib/db');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require('dotenv').config();

// /* GEMINI SETUP */
// let embedModel;
// try {
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
// } catch (err) {
//   console.error("Erreur Gemini:", err);
// }

// async function generateEmbeddingsForAllTables() {
//   console.log('⚡ Génération automatique des embeddings pour toutes les tables...');
//   for (const table of tables) {
//     try {
//       const colConcat = table.columns.map(c => `"${c}"`).join(` || ' ' || `);
//       const querySelect = `
//         SELECT id, ${colConcat} AS text
//         FROM "${table.name}"
//         WHERE embedding IS NULL
//       `;
//       const rows = (await pool.query(querySelect)).rows;

//       for (const row of rows) {
//         const text = row.text || '';
//         if (!text) continue;
//         const embedding = await generateEmbedding(text);
//         const embeddingArray = `[${embedding.join(',')}]`;

//         await pool.query(
//           `UPDATE "${table.name}" SET embedding = $1 WHERE id = $2`,
//           [embeddingArray, row.id]
//         );
//         console.log(`✅ Embedding généré pour ${table.name} id=${row.id}`);
//       }
//     } catch (err) {
//       console.error(`❌ Erreur génération embeddings pour ${table.name}:`, err.message);
//     }
//   }
//   console.log('🎉 Tous les embeddings ont été générés !');
// }

// /* EMBEDDINGS */
// async function generateEmbedding(text) {
//   const result = await embedModel.embedContent(text);
//   return result.embedding.values;
// }

// /* PROFESSIONNELS PREMIUM */
// async function getPremiumUsers() {
//   const query = `
//     SELECT u.id
//     FROM "User" u
//     LEFT JOIN "Subscription" s ON s."userId" = u.id
//     LEFT JOIN "Transaction" t ON t."userId" = u.id
//     WHERE u.role = 'professional'
//     AND s.status = 'active'
//     AND t.status = 'paid'
//   `;
//   const rows = (await pool.query(query)).rows;
//   return rows.map(r => r.id);
// }

// /* TABLES A RECHERCHER */
// const tables = [
//   { name: "Metier", columns: ["libelle"], ownerField: null },
//   { name: "Product", columns: ["name", "category", "price", "quantity"], ownerField: "userId" },
//   { name: "Property", columns: ["title", "type", "price"], ownerField: "ownerId" },
//   { name: "Service", columns: ["libelle"], ownerField: "createdById" },
// ];

// /* ROUTE PRINCIPALE */
// router.post("/", async (req, res) => {
//   const { prompt } = req.body;

//   if (!prompt)
//     return res.status(400).json({ error: "Prompt manquant" });

//   try {
//     const embedding = await generateEmbedding(prompt);
//     const vector = `[${embedding.join(',')}]`;

//     const premiumUsers = await getPremiumUsers();
//     let allResults = [];

//     /* RECHERCHE DANS CHAQUE TABLE */
//     for (const table of tables) {
//       const colConcat = table.columns.map(c => `"${c}"`).join(` || ' ' || `);

//       const query = `
//         SELECT
//           *,
//           embedding::text AS embedding,
//           (embedding <=> '${vector}'::vector) AS distance,
//           '${table.name}' AS source_table,
//           ${table.ownerField ? `"${table.ownerField}"` : "NULL"} AS ownerId
//         FROM "${table.name}"
//         WHERE embedding IS NOT NULL
//         ORDER BY embedding <=> '${vector}'::vector
//         LIMIT 10
//       `;

//       const rows = (await pool.query(query)).rows;

//       const mapped = rows.map(r => ({
//         ...r,
//         similarity: (1 - r.distance) * 100,
//         isPremiumOwner: table.ownerField
//           ? premiumUsers.includes(r.ownerid || r.ownerId)
//           : false,
//         clickScore: r.clickcount || r.viewcount || 0
//       }));

//       allResults.push(...mapped);
//     }

//     /* TRIS BOOSTÉS */
//     allResults.sort((a, b) => {
//       if (a.isPremiumOwner !== b.isPremiumOwner)
//         return b.isPremiumOwner - a.isPremiumOwner;

//       if (a.clickScore !== b.clickScore)
//         return b.clickScore - a.clickScore;

//       return b.similarity - a.similarity;
//     });

//     res.json({
//       success: true,
//       count: allResults.length,
//       results: allResults
//     });

//   } catch (error) {
//     console.error("Erreur recherche premium:", error);
//     res.status(500).json({ error: error.message });
//   }
// });
// generateEmbeddingsForAllTables();

// module.exports = router;
