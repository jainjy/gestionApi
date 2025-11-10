const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();

// Fonction pour déterminer la catégorie selon le type d'entité
async function getCategoryFromEntity(entityType, entityId) {
  try {
    switch (entityType) {
      case "product":
        const product = await prisma.product.findUnique({
          where: { id: entityId },
          select: { category: true }
        });
        return product?.category || "products";
      
      case "service":
        const service = await prisma.service.findUnique({
          where: { id: entityId },
          select: { name: true }
        });
        return service?.name || "services";
      
      case "metier":
        const metier = await prisma.metier.findUnique({
          where: { id: entityId },
          select: { name: true }
        });
        return metier?.name || "metiers";
      
      case "property":
        const property = await prisma.property.findUnique({
          where: { id: entityId },
          select: { type: true }
        });
        return property?.type || "immobilier";
      
      default:
        return entityType;
    }
  } catch (error) {
    console.error("Erreur getCategoryFromEntity:", error);
    return entityType;
  }
}

// Fonction pour incrémenter les compteurs de produits
async function incrementProductCounters(productId, action) {
  try {
    const updateData = {};
    
    switch (action) {
      case 'view':
        updateData.viewCount = { increment: 1 };
        break;
      case 'click':
        updateData.clickCount = { increment: 1 };
        break;
      case 'purchase':
        updateData.purchaseCount = { increment: 1 };
        break;
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: updateData
      });
    }
  } catch (error) {
    console.error("Erreur incrémentation compteurs:", error);
  }
}

// Fonction pour mettre à jour les préférences utilisateur
async function updateUserPreferences(userId, category, scoreIncrement) {
  try {
    // Vérifier d'abord si la préférence existe
    const existingPreference = await prisma.userPreference.findUnique({
      where: {
        userId_category: {
          userId,
          category
        }
      }
    });

    if (existingPreference) {
      // Mise à jour si elle existe
      return await prisma.userPreference.update({
        where: {
          userId_category: {
            userId,
            category
          }
        },
        data: {
          interestScore: { increment: scoreIncrement },
          lastUpdated: new Date(),
        }
      });
    } else {
      // Création si elle n'existe pas
      return await prisma.userPreference.create({
        data: {
          userId,
          category,
          interestScore: 0.5 + scoreIncrement,
          lastUpdated: new Date(),
        }
      });
    }
  } catch (error) {
    console.error("❌ Erreur mise à jour préférences:", error);
    throw error;
  }
}

/**
 * POST /api/suggestion/activity
 * Enregistrer une activité utilisateur
 */
router.post("/activity", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { entityType, entityId, action, duration, searchQuery, metadata } = req.body;

    if (!entityType || !entityId || !action) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Enregistrer l'activité
    const activity = await prisma.userActivity.create({
      data: { 
        userId, 
        entityType, 
        entityId, 
        action, 
        duration,
        searchQuery,
        metadata: metadata || {}
      },
    });

    // Incrémenter les compteurs du produit si c'est un produit
    if (entityType === "product") {
      await incrementProductCounters(entityId, action);
    }

    // Calcul du score d'intérêt basé sur l'action
    let scoreIncrement = 0;
    switch (action) {
      case "view":
        scoreIncrement = 0.05;
        break;
      case "click":
        scoreIncrement = 0.1;
        break;
      case "long_view":
        scoreIncrement = 0.15;
        break;
      case "add_to_cart":
        scoreIncrement = 0.25; // Score élevé pour ajout panier
        break;
      case "purchase":
        scoreIncrement = 0.4;
        break;
      case "search":
        scoreIncrement = 0.08;
        break;
      case "favorite":
        scoreIncrement = 0.2;
        break;
      default:
        scoreIncrement = 0.05;
    }

    // Bonus pour vues longues
    if (duration > 30) {
      scoreIncrement += 0.1;
    }

    // Mise à jour des préférences
    const category = await getCategoryFromEntity(entityType, entityId);
    
    const pref = await updateUserPreferences(userId, category, scoreIncrement);

    res.json({ activity, pref });
  } catch (error) {
    console.error("❌ Erreur création activité :", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: "Conflit de données: cette préférence existe déjà" 
      });
    }
    
    res.status(500).json({ error: "Erreur lors de la création de l'activité" });
  }
});

/**
 * POST /api/suggestion/event
 * Enregistrer un événement utilisateur
 */
router.post("/event", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventType, eventData } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: "Type d'événement manquant" });
    }

    const event = await prisma.userEvent.create({
      data: {
        userId,
        eventType,
        eventData: eventData || {},
      },
    });

    res.json({ event });
  } catch (error) {
    console.error("❌ Erreur création événement :", error);
    res.status(500).json({ error: "Erreur lors de la création de l'événement" });
  }
});

/**
 * GET /api/suggestion/preferences
 * Récupérer les préférences utilisateur
 */
router.get("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { interestScore: "desc" },
    });

    res.json(preferences);
  } catch (error) {
    console.error("❌ Erreur récupération préférences :", error);
    res.status(500).json({ error: "Erreur lors de la récupération des préférences" });
  }
});

/**
 * GET /api/suggestion/recommendations
 * Recommandations personnalisées améliorées
 */
router.get("/recommendations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 8, type = "all" } = req.query;
    const limitNum = parseInt(limit);

    console.log(`🎯 Génération recommandations pour user: ${userId}, limit: ${limitNum}`);

    // 1. Récupérer les préférences utilisateur
    const userPreferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { interestScore: "desc" },
      take: 5
    });

    console.log(`📊 Préférences trouvées: ${userPreferences.length}`);

    // 2. Récupérer l'historique récent (30 jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivities = await prisma.userActivity.findMany({
      where: { 
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    console.log(`📈 Activités récentes: ${recentActivities.length}`);

    let recommendations = [];
    const viewedEntityIds = recentActivities.map(activity => activity.entityId);

    // 3. Recommandations basées sur le panier
    const cartActivities = recentActivities.filter(activity => 
      activity.action === "add_to_cart"
    );
    
    if (cartActivities.length > 0) {
      const cartEntityIds = cartActivities.map(activity => activity.entityId);
      
      // Produits similaires à ceux dans le panier
      const cartProducts = await prisma.product.findMany({
        where: { 
          id: { in: cartEntityIds },
          status: "active"
        }
      });

      if (cartProducts.length > 0) {
        const cartCategories = [...new Set(cartProducts.map(p => p.category))];
        
        const cartRecs = await prisma.product.findMany({
          where: {
            category: { in: cartCategories },
            id: { notIn: [...viewedEntityIds, ...recommendations.map(r => r.id)] },
            status: "active"
          },
          take: limitNum - recommendations.length,
          orderBy: { createdAt: "desc" }
        });
        
        recommendations.push(...cartRecs);
        console.log(`🛒 Recommandations panier: ${cartRecs.length}`);
      }
    }

    // 4. Recommandations basées sur les préférences
    if (userPreferences.length > 0 && recommendations.length < limitNum) {
      const topCategories = userPreferences.map(pref => pref.category);
      
      const preferenceRecs = await prisma.product.findMany({
        where: {
          OR: [
            { category: { in: topCategories } },
            { name: { contains: topCategories[0], mode: 'insensitive' } }
          ],
          id: { notIn: [...viewedEntityIds, ...recommendations.map(r => r.id)] },
          status: "active"
        },
        take: limitNum - recommendations.length,
        orderBy: { createdAt: "desc" }
      });
      
      recommendations.push(...preferenceRecs);
      console.log(`❤️ Recommandations préférences: ${preferenceRecs.length}`);
    }

    // 5. Recommandations basées sur l'historique de vues
    if (recentActivities.length > 0 && recommendations.length < limitNum) {
      const viewActivities = recentActivities.filter(activity => 
        ["view", "long_view", "click"].includes(activity.action)
      );
      
      if (viewActivities.length > 0) {
        const viewedProducts = await prisma.product.findMany({
          where: { 
            id: { in: viewActivities.map(activity => activity.entityId) },
            status: "active"
          }
        });

        if (viewedProducts.length > 0) {
          const viewCategories = [...new Set(viewedProducts.map(p => p.category))];
          
          const viewRecs = await prisma.product.findMany({
            where: {
              category: { in: viewCategories },
              id: { notIn: [...viewedEntityIds, ...recommendations.map(r => r.id)] },
              status: "active"
            },
            take: limitNum - recommendations.length,
            orderBy: { createdAt: "desc" }
          });
          
          recommendations.push(...viewRecs);
          console.log(`👀 Recommandations historique: ${viewRecs.length}`);
        }
      }
    }

    // 6. Fallback: recommandations populaires
    if (recommendations.length < limitNum) {
      const remainingLimit = limitNum - recommendations.length;
      
      // Vérifier si viewCount existe dans le modèle
      const productSample = await prisma.product.findFirst();
      const hasViewCount = productSample && productSample.viewCount !== undefined;
      
      let popularRecs;
      
      if (hasViewCount) {
        // Utiliser viewCount si disponible
        popularRecs = await prisma.product.findMany({
          where: {
            id: { notIn: recommendations.map(r => r.id) },
            status: "active"
          },
          take: remainingLimit,
          orderBy: [
            { viewCount: "desc" },
            { createdAt: "desc" }
          ]
        });
      } else {
        // Fallback sur createdAt
        popularRecs = await prisma.product.findMany({
          where: {
            id: { notIn: recommendations.map(r => r.id) },
            status: "active"
          },
          take: remainingLimit,
          orderBy: { createdAt: "desc" }
        });
      }
      
      recommendations.push(...popularRecs);
      console.log(`🌟 Recommandations populaires: ${popularRecs.length}`);
    }

    // 7. Dédupliquer et limiter
    const uniqueRecs = recommendations.reduce((acc, current) => {
      if (!acc.find(item => item.id === current.id)) {
        acc.push(current);
      }
      return acc;
    }, []).slice(0, limitNum);

    console.log(`✅ Recommandations finales: ${uniqueRecs.length}`);

    // 8. Ajouter des métadonnées de similarité
    const recommendationsWithScore = uniqueRecs.map(rec => ({
      ...rec,
      similarity: Math.random() * 0.3 + 0.7 // Score simulé entre 0.7 et 1.0
    }));

    res.json(recommendationsWithScore);
  } catch (error) {
    console.error("❌ Erreur getRecommendations :", error);
    res.status(500).json({ 
      error: "Erreur lors de la génération des recommandations",
      details: error.message 
    });
  }
});

/**
 * GET /api/suggestion/trending
 * Produits tendance (pour utilisateurs non connectés ou en complément)
 */
router.get("/trending", async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const limitNum = parseInt(limit);

    // Vérifier si viewCount existe
    const productSample = await prisma.product.findFirst();
    const hasViewCount = productSample && productSample.viewCount !== undefined;

    let trendingProducts;

    if (hasViewCount) {
      trendingProducts = await prisma.product.findMany({
        where: { status: "active" },
        take: limitNum,
        orderBy: [
          { viewCount: "desc" },
          { createdAt: "desc" }
        ]
      });
    } else {
      trendingProducts = await prisma.product.findMany({
        where: { status: "active" },
        take: limitNum,
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(trendingProducts);
  } catch (error) {
    console.error("❌ Erreur récupération produits tendance:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des produits tendance" });
  }
});

module.exports = router;