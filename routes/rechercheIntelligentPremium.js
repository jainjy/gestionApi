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
    },
    Professional: {
      companyName: 40,
      commercialName: 40,
      city: 20
    }
  };

  const weights = fieldWeights[tableType] || {};

  Object.keys(weights).forEach(field => {
    if (item[field] !== undefined && item[field] !== null) {
      const fieldValue = String(item[field]).toLowerCase();
      const weight = weights[field];
      maxScore += weight;

      if (fieldValue.includes(promptLower)) {
        score += weight;
      } else {
        const promptWords = promptLower.split(/\s+/).filter(w => w.length > 2);
        promptWords.forEach(word => {
          if (fieldValue.includes(word)) {
            score += weight * 0.5;
          }
        });
      }
    }
  });

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
    /* 1️⃣ CHARGER LES DONNÉES */
    const client = await pool.connect();

    let properties, services, products, metiers, professionals;

    try {
      // Récupérer les données existantes
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

      // Récupérer les professionnels (uniquement role='professional')
      professionals = await client.query(`
        SELECT 
          u.id,
          u."firstName",
          u."lastName",
          u."companyName",
          u."commercialName",
          u.city,
          u."userType",
          u."professionalCategory",
          u."createdAt"
        FROM "User" u
        WHERE u.role = 'professional'
        AND u.status = 'active'
      `);

      // Récupérer les relations UtilisateurService pour savoir quels services les pros offrent
      const userServices = await client.query(`
        SELECT us."userId", us."serviceId", s.libelle as "serviceName"
        FROM "UtilisateurService" us
        INNER JOIN "Service" s ON s.id = us."serviceId"
        WHERE us."isAvailable" = true
      `);

      // Récupérer les relations UtilisateurMetier pour savoir quels métiers les pros ont
      const userMetiers = await client.query(`
        SELECT um."userId", um."metierId", m.libelle as "metierName"
        FROM "UtilisateurMetier" um
        INNER JOIN "Metier" m ON m.id = um."metierId"
      `);

      // Attacher les services et métiers aux professionnels
      professionals.rows = professionals.rows.map(pro => {
        const proServices = userServices.rows
          .filter(us => us.userId === pro.id)
          .map(us => ({
            id: us.serviceId,
            name: us.serviceName
          }));
        
        const proMetiers = userMetiers.rows
          .filter(um => um.userId === pro.id)
          .map(um => ({
            id: um.metierId,
            name: um.metierName
          }));
        
        return {
          ...pro,
          services: proServices,
          metiers: proMetiers,
          // Créer un texte de recherche combiné pour faciliter la recherche
          searchText: [
            pro.firstName,
            pro.lastName,
            pro.companyName,
            pro.commercialName,
            pro.city,
            pro.userType,
            pro.professionalCategory,
            ...proServices.map(s => s.name),
            ...proMetiers.map(m => m.name)
          ].filter(Boolean).join(' ').toLowerCase()
        };
      });

    } finally {
      client.release();
    }

    /* 2️⃣ FILTRAGE TEXTUEL LOCAL */
    const localFilterResults = [];

    // Filtrer les propriétés
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

    // Filtrer les services
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

    // Filtrer les produits
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

    // Filtrer les métiers
    metiers.rows.forEach(metier => {
      if (metier.libelle.toLowerCase().includes(prompt.toLowerCase())) {
        localFilterResults.push({
          table: "Metier",
          item: metier,
          score: calculateTextScore(metier, prompt, "Metier")
        });
      }
    });

    // Filtrer les professionnels (Nouveau)
    professionals.rows.forEach(professional => {
      // Vérifier si le prompt correspond au professionnel directement
      const directMatch = [
        professional.firstName,
        professional.lastName,
        professional.companyName,
        professional.commercialName,
        professional.city,
        professional.userType,
        professional.professionalCategory
      ].some(field => 
        field && field.toLowerCase().includes(prompt.toLowerCase())
      );

      // Vérifier si le prompt correspond à un de ses services/métiers
      const serviceMatch = professional.services.some(service =>
        service.name.toLowerCase().includes(prompt.toLowerCase())
      );

      const metierMatch = professional.metiers.some(metier =>
        metier.name.toLowerCase().includes(prompt.toLowerCase())
      );

      if (directMatch || serviceMatch || metierMatch) {
        localFilterResults.push({
          table: "Professional",
          item: professional,
          score: calculateTextScore(professional, prompt, "Professional"),
          matchType: serviceMatch ? "service" : metierMatch ? "metier" : "direct"
        });
      }
    });

    /* 3️⃣ CONTEXTE POUR L'IA */
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
      })),
      Professional: professionals.rows.map(p => ({
        id: p.id,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        companyName: p.companyName || p.commercialName,
        city: p.city,
        type: p.userType,
        category: p.professionalCategory,
        services: p.services.map(s => s.name),
        metiers: p.metiers.map(m => m.name)
      }))
    };

    /* 4️⃣ PROMPT IA AMÉLIORÉ */
    const iaPrompt = `
Tu es un moteur de recherche pour une plateforme d'agence immobilière et services.

Tu dois analyser la demande et retourner les éléments pertinents, y compris les professionnels qui proposent des services ou métiers correspondants.

Règles importantes :
1. Si la recherche correspond à un métier (ex: "plombier", "électricien"), inclure les professionnels ayant ce métier
2. Si la recherche correspond à un service (ex: "réparation", "nettoyage"), inclure les professionnels offrant ce service
3. Les professionnels sont identifiés par table="Professional"
4. Pour les professionnels, spécifier le type de correspondance : "direct", "service" ou "metier"

Demande utilisateur : "${prompt}"

Format requis (tableau d'objets) :
[
  { "table": "Property", "id": "id_value", "relevanceScore": 85 },
  { "table": "Service", "id": "id_value", "relevanceScore": 70 },
  { "table": "Professional", "id": "id_value", "relevanceScore": 90, "matchType": "service" }
]

Tables disponibles :
1. Property : title, type, price, city, description
2. Service : libelle, description
3. Product : name, category, price
4. Metier : libelle
5. Professional : nom, entreprise, ville, services, métiers

Données disponibles :
${JSON.stringify(context, null, 2)}
`;

    let aiResults = [];
    try {
      const result = await model.generateContent(iaPrompt);
      let responseText = result.response.text().trim();

      responseText = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^\[/, '[')
        .replace(/\]$/, ']')
        .trim();

      const parsedResults = JSON.parse(responseText);
      if (Array.isArray(parsedResults)) {
        aiResults = parsedResults.slice(0, 40); // Augmenté pour inclure plus de résultats
      }
    } catch (iaError) {
      console.warn("IA fallback, utilisation du filtrage local:", iaError.message);
      aiResults = localFilterResults.map(r => ({
        table: r.table,
        id: r.item.id,
        relevanceScore: r.score,
        matchType: r.matchType || "direct"
      })).slice(0, 40);
    }

    /* 5️⃣ RÉCUPÉRATION DES DONNÉES COMPLÈTES */
    const premiumUsers = await getPremiumUsers();
    let results = [];

    for (const aiItem of aiResults) {
      let item;
      let ownerField;
      let tableType = aiItem.table;

      switch (tableType) {
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
        case "Professional":
          item = professionals.rows.find(p => p.id === aiItem.id);
          ownerField = item?.id; // Pour un pro, l'owner c'est lui-même
          break;
      }

      if (!item) continue;

      // Calculer le score textuel
      const textScore = aiItem.relevanceScore || 
                       calculateTextScore(item, prompt, tableType);
      
      const clickScore = 0;

      // Construire l'objet résultat
      const resultItem = {
        table: tableType,
        ...item,
        similarity: Math.round(textScore),
        isPremiumOwner: ownerField ? premiumUsers.includes(ownerField) : false,
        clickScore: clickScore
      };

      // Ajouter des informations spécifiques selon le type
      if (tableType === "Professional") {
        resultItem.matchType = aiItem.matchType || "direct";
        resultItem.professionalType = item.userType || item.professionalCategory;
        resultItem.associatedServices = item.services;
        resultItem.associatedMetiers = item.metiers;
      } else if (tableType === "Service" && item.createdById) {
        // Pour les services, on peut aussi inclure le pro qui l'a créé
        const serviceCreator = professionals.rows.find(p => p.id === item.createdById);
        if (serviceCreator) {
          resultItem.creatorInfo = {
            id: serviceCreator.id,
            name: `${serviceCreator.firstName || ''} ${serviceCreator.lastName || ''}`.trim(),
            companyName: serviceCreator.companyName
          };
        }
      } else if (tableType === "Metier") {
        // Pour les métiers, trouver les pros qui ont ce métier
        const prosWithThisMetier = professionals.rows.filter(p => 
          p.metiers.some(m => m.id === item.id)
        );
        if (prosWithThisMetier.length > 0) {
          resultItem.associatedProfessionals = prosWithThisMetier.map(p => ({
            id: p.id,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            companyName: p.companyName
          })).slice(0, 3); // Limiter à 3 pros pour ne pas surcharger
        }
      }

      results.push(resultItem);
    }

    /* 6️⃣ TRI MULTI-CRITÈRES */
    results.sort((a, b) => {
      // 1. Premium first
      if (a.isPremiumOwner !== b.isPremiumOwner) {
        return b.isPremiumOwner - a.isPremiumOwner;
      }

      // 2. Popularité
      if (a.clickScore !== b.clickScore) {
        return b.clickScore - a.clickScore;
      }

      // 3. Pertinence
      return b.similarity - a.similarity;
    });

    /* 7️⃣ FORMATAGE FINAL */
    const formattedResults = results.map(r => {
      const baseItem = {
        id: r.id,
        source_table: r.table,
        similarity: r.similarity,
        isPremiumOwner: r.isPremiumOwner,
        clickScore: r.clickScore,
        ...r
      };

      // Nettoyer l'objet
      delete baseItem.table;
      delete baseItem.searchText;
      
      return baseItem;
    });

    res.json({
      success: true,
      count: formattedResults.length,
      results: formattedResults,
      summary: {
        properties: formattedResults.filter(r => r.source_table === "Property").length,
        services: formattedResults.filter(r => r.source_table === "Service").length,
        products: formattedResults.filter(r => r.source_table === "Product").length,
        metiers: formattedResults.filter(r => r.source_table === "Metier").length,
        professionals: formattedResults.filter(r => r.source_table === "Professional").length
      }
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