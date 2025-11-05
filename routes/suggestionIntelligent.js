const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * POST /api/suggestion/activity
 * Enregistrer une activité utilisateur (vue, clic, achat…)
 */
router.post("/activity", async (req, res) => {
  try {
    const { userId, entityType, entityId, action } = req.body;

    const activity = await prisma.userActivity.create({
      data: { userId, entityType, entityId, action },
    });

    // Mise à jour automatique des préférences
    const category = entityType; // adapter selon le type réel
    const pref = await prisma.userPreference.upsert({
      where: { userId_category: { userId, category } },
      update: {
        interestScore: { increment: 0.1 },
        lastUpdated: new Date(),
      },
      create: {
        userId,
        category,
        interestScore: 0.6,
        lastUpdated: new Date(),
      },
    });

    res.json({ activity, pref });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création de l'activité" });
  }
});

/**
 * POST /api/suggestion/event
 * Enregistrer un événement utilisateur (recherche, filtre, scroll…)
 */
router.post("/event", async (req, res) => {
  try {
    const { userId, eventType, eventData } = req.body;

    const event = await prisma.userEvent.create({
      data: { userId, eventType, eventData },
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création de l'événement" });
  }
});

/**
 * GET /api/suggestion/preferences/:userId
 * Récupérer les préférences mises à jour
 */
router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { interestScore: "desc" },
    });

    res.json(preferences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des préférences" });
  }
});

/**
 * GET /api/suggestion/recommendations/:userId
 * Retourner les recommandations personnalisées
 * Exemple : pour les produits (adapter pour services/metiers)
 */
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer dernières activités
    const lastActivities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (lastActivities.length === 0) return res.json([]);

    const entityIds = lastActivities.map(a => a.entityId);

    // Récupérer les embeddings des produits consultés
    const items = await prisma.$queryRaw`
      SELECT id, name, embedding
      FROM "Product"
      WHERE id = ANY(${entityIds})
    `;

    // Calculer embedding moyen
    const avgEmbedding = items[0].embedding.map((_, i) =>
      items.reduce((sum, item) => sum + item.embedding[i], 0) / items.length
    );

    // Rechercher éléments similaires via pgvector
    const recommendations = await prisma.$queryRaw`
      SELECT id, name, category, description
      FROM "Product"
      WHERE id <> ALL(${entityIds})
      ORDER BY embedding <-> ${avgEmbedding}
      LIMIT 10
    `;

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la génération des recommandations" });
  }
});

module.exports = router;
