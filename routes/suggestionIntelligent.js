const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const prisma = new PrismaClient();

// Configuration du rate limiting
const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par fenêtre
  message: {
    error: "Trop de requêtes d'activité, veuillez réessayer dans 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const recommendationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requêtes max par minute
  message: {
    error: "Trop de requêtes de recommandations, veuillez réessayer dans une minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    if (!productId) {
      console.warn("⚠️ Aucun productId fourni à incrementProductCounters");
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      console.warn(`⚠️ Produit introuvable (ID: ${productId}) — compteur non mis à jour`);
      return;
    }

    const updateData = {};
    switch (action) {
      case "view":
        updateData.viewCount = { increment: 1 };
        break;
      case "click":
        updateData.clickCount = { increment: 1 };
        break;
      case "purchase":
        updateData.purchaseCount = { increment: 1 };
        break;
      default:
        console.warn(`⚠️ Action inconnue "${action}" — aucun compteur mis à jour`);
        return;
    }

    await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    console.log(`✅ Compteur "${action}" incrémenté pour le produit ${productId}`);
  } catch (error) {
    console.error("❌ Erreur incrémentation compteurs:", error.message);
  }
}

// Fonction pour calculer le score d'intérêt
function calculateScoreIncrement(action, duration) {
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
      scoreIncrement = 0.25;
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

  return scoreIncrement;
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
 * POST /api/suggestion/activity/batch
 * Enregistrer plusieurs activités en une requête
 */
router.post("/activity/batch", authenticateToken, activityLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activities } = req.body;

    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({ error: "Tableau d'activités manquant" });
    }

    console.log(`📦 Traitement de ${activities.length} activités en batch`);

    const results = [];
    const errors = [];
    
    for (const activityData of activities) {
      const { entityType, entityId, action, duration, searchQuery, metadata, timestamp } = activityData;

      if (!entityType || !entityId || !action) {
        errors.push({ activity: activityData, error: "Champs manquants" });
        continue;
      }

      try {
        // Utiliser le timestamp fourni ou maintenant
        const activityTimestamp = timestamp ? new Date(timestamp) : new Date();

        // Enregistrer l'activité
        const activity = await prisma.userActivity.create({
          data: { 
            userId, 
            entityType, 
            entityId, 
            action, 
            duration,
            searchQuery,
            metadata: metadata || {},
            createdAt: activityTimestamp
          },
        });

        // Incrémenter les compteurs du produit si c'est un produit
        if (entityType === "product") {
          await incrementProductCounters(entityId, action);
        }

        // Mise à jour des préférences
        const category = await getCategoryFromEntity(entityType, entityId);
        const scoreIncrement = calculateScoreIncrement(action, duration);
        
        const pref = await updateUserPreferences(userId, category, scoreIncrement);

        results.push({ activity, pref });
      } catch (error) {
        console.error("Erreur création activité batch:", error);
        errors.push({ activity: activityData, error: error.message });
      }
    }

    res.json({ 
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors: errors.slice(0, 10) // Limiter les erreurs retournées
    });
  } catch (error) {
    console.error("❌ Erreur création activités batch:", error);
    res.status(500).json({ 
      error: "Erreur lors de la création des activités",
      details: error.message 
    });
  }
});

/**
 * POST /api/suggestion/activity
 * Enregistrer une activité utilisateur
 */
router.post("/activity", authenticateToken, activityLimiter, async (req, res) => {
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

    // Calcul du score d'intérêt
    const scoreIncrement = calculateScoreIncrement(action, duration);

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
 * Recommandations personnalisées améliorées - TOUS TYPES
 */
router.get("/recommendations", authenticateToken, recommendationLimiter, async (req, res) => {
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
    const viewedEntities = recentActivities.map(activity => ({
      entityType: activity.entityType,
      entityId: activity.entityId
    }));

    // 3. Recommandations basées sur le panier
    const cartActivities = recentActivities.filter(activity => 
      activity.action === "add_to_cart"
    );
    
    if (cartActivities.length > 0) {
      const cartEntities = cartActivities.map(activity => ({
        entityType: activity.entityType,
        entityId: activity.entityId
      }));
      
      // Pour chaque type d'entité dans le panier
      for (const entity of cartEntities) {
        if (recommendations.length >= limitNum) break;
        
        let similarItems = [];
        const entityType = entity.entityType;
        
        try {
          switch (entityType) {
            case "product":
              similarItems = await prisma.product.findMany({
                where: { 
                  id: { not: entity.entityId },
                  status: "active"
                },
                take: 2
              });
              break;
            case "service":
              similarItems = await prisma.service.findMany({
                where: { 
                  id: { not: entity.entityId }
                },
                take: 2
              });
              break;
            case "metier":
              similarItems = await prisma.metier.findMany({
                where: { 
                  id: { not: entity.entityId }
                },
                take: 2
              });
              break;
            case "property":
              similarItems = await prisma.property.findMany({
                where: { 
                  id: { not: entity.entityId },
                  isActive: true
                },
                take: 2
              });
              break;
          }
          
          recommendations.push(...similarItems.map(item => ({
            ...item,
            entityType: entityType,
            sourceType: getSourceType(entityType),
            recommendationSource: "panier"
          })));
        } catch (error) {
          console.error(`❌ Erreur récupération ${entityType}:`, error.message);
        }
      }
      console.log(`🛒 Recommandations panier: ${recommendations.length}`);
    }

    // 4. Recommandations basées sur les préférences
    if (userPreferences.length > 0 && recommendations.length < limitNum) {
      const topCategories = userPreferences.map(pref => pref.category);
      const remainingLimitPref = limitNum - recommendations.length;
      
      // Répartir entre les différents types d'entités
      const limitPerType = Math.ceil(remainingLimitPref / 4);
      
      try {
        // Produits - Recherche par category et name
        const productRecs = await prisma.product.findMany({
          where: {
            OR: [
              { category: { in: topCategories } },
              { name: { contains: topCategories[0], mode: 'insensitive' } }
            ],
            status: "active"
          },
          take: limitPerType
        });
        
        // Services - Recherche par libelle et description
        const serviceRecs = await prisma.service.findMany({
          where: {
            OR: [
              { libelle: { contains: topCategories[0], mode: 'insensitive' } },
              { description: { contains: topCategories[0], mode: 'insensitive' } }
            ]
          },
          take: limitPerType
        });
        
        // Métiers - Recherche par libelle
        const metierRecs = await prisma.metier.findMany({
          where: {
            libelle: { contains: topCategories[0], mode: 'insensitive' }
          },
          take: limitPerType
        });
        
        // Propriétés - Recherche par type, title et city
        const propertyRecs = await prisma.property.findMany({
          where: {
            OR: [
              { type: { in: topCategories } },
              { title: { contains: topCategories[0], mode: 'insensitive' } },
              { city: { contains: topCategories[0], mode: 'insensitive' } }
            ],
            isActive: true
          },
          take: limitPerType
        });
        
        recommendations.push(
          ...productRecs.map(item => ({ 
            ...item, 
            entityType: "product",
            sourceType: "Produit",
            recommendationSource: "préférences"
          })),
          ...serviceRecs.map(item => ({ 
            ...item, 
            entityType: "service",
            sourceType: "Service", 
            recommendationSource: "préférences"
          })),
          ...metierRecs.map(item => ({ 
            ...item, 
            entityType: "metier",
            sourceType: "Métier",
            recommendationSource: "préférences"
          })),
          ...propertyRecs.map(item => ({ 
            ...item, 
            entityType: "property",
            sourceType: "Immobilier",
            recommendationSource: "préférences"
          }))
        );
        
        console.log(`❤️ Recommandations préférences - Produits: ${productRecs.length}, Services: ${serviceRecs.length}, Métiers: ${metierRecs.length}, Propriétés: ${propertyRecs.length}`);
      } catch (error) {
        console.error("❌ Erreur recommandations préférences:", error.message);
        // Fallback sur les produits seulement
        const productRecs = await prisma.product.findMany({
          where: {
            OR: [
              { category: { in: topCategories } },
              { name: { contains: topCategories[0], mode: 'insensitive' } }
            ],
            status: "active"
          },
          take: remainingLimitPref
        });
        recommendations.push(...productRecs.map(item => ({ 
          ...item, 
          entityType: "product",
          sourceType: "Produit",
          recommendationSource: "préférences"
        })));
      }
    }

    // 5. Recommandations basées sur l'historique de vues
    if (recentActivities.length > 0 && recommendations.length < limitNum) {
      const viewActivities = recentActivities.filter(activity => 
        ["view", "long_view", "click"].includes(activity.action)
      );
      
      if (viewActivities.length > 0) {
        // Grouper par type d'entité
        const viewedByType = {};
        viewActivities.forEach(activity => {
          if (!viewedByType[activity.entityType]) {
            viewedByType[activity.entityType] = [];
          }
          viewedByType[activity.entityType].push(activity.entityId);
        });

        try {
          // Pour chaque type d'entité dans l'historique
          for (const [entityType, entityIds] of Object.entries(viewedByType)) {
            if (recommendations.length >= limitNum) break;

            let similarItems = [];
            const alreadyRecommendedIds = recommendations
              .filter(rec => rec.entityType === entityType)
              .map(rec => rec.id);

            switch (entityType) {
              case "product":
                // Récupérer les produits vus pour obtenir leurs catégories
                const viewedProducts = await prisma.product.findMany({
                  where: { 
                    id: { in: entityIds },
                    status: "active"
                  }
                });
                
                if (viewedProducts.length > 0) {
                  const viewCategories = [...new Set(viewedProducts.map(p => p.category))];
                  
                  similarItems = await prisma.product.findMany({
                    where: {
                      category: { in: viewCategories },
                      id: { notIn: [...entityIds, ...alreadyRecommendedIds] },
                      status: "active"
                    },
                    take: 2
                  });
                }
                break;

              case "service":
                similarItems = await prisma.service.findMany({
                  where: {
                    id: { notIn: [...entityIds, ...alreadyRecommendedIds] }
                  },
                  take: 2
                });
                break;

              case "metier":
                similarItems = await prisma.metier.findMany({
                  where: {
                    id: { notIn: [...entityIds, ...alreadyRecommendedIds] }
                  },
                  take: 2
                });
                break;

              case "property":
                similarItems = await prisma.property.findMany({
                  where: {
                    id: { notIn: [...entityIds, ...alreadyRecommendedIds] },
                    isActive: true
                  },
                  take: 2
                });
                break;
            }
            
            recommendations.push(...similarItems.map(item => ({
              ...item,
              entityType: entityType,
              sourceType: getSourceType(entityType),
              recommendationSource: "historique"
            })));
          }
          console.log(`👀 Recommandations historique: ${viewActivities.length} activités traitées`);
        } catch (error) {
          console.error("❌ Erreur recommandations historique:", error.message);
        }
      }
    }

    // 6. Fallback: recommandations populaires de tous types
    if (recommendations.length < limitNum) {
      const remainingLimit = limitNum - recommendations.length;
      const limitPerType = Math.ceil(remainingLimit / 4);
      
      try {
        const [productRecs, serviceRecs, metierRecs, propertyRecs] = await Promise.all([
          // Produits populaires (par viewCount ou createdAt)
          prisma.product.findMany({
            where: { status: "active" },
            take: limitPerType,
            orderBy: [
              { viewCount: "desc" },
              { createdAt: "desc" }
            ]
          }),
          // Services récents
          prisma.service.findMany({
            take: limitPerType,
            orderBy: { id: "desc" }
          }),
          // Métiers récents
          prisma.metier.findMany({
            take: limitPerType,
            orderBy: { id: "desc" }
          }),
          // Propriétés actives et featured
          prisma.property.findMany({
            where: { isActive: true },
            take: limitPerType,
            orderBy: [
              { isFeatured: "desc" },
              { createdAt: "desc" }
            ]
          })
        ]);
        
        recommendations.push(
          ...productRecs.map(item => ({ 
            ...item, 
            entityType: "product",
            sourceType: "Produit",
            recommendationSource: "populaire"
          })),
          ...serviceRecs.map(item => ({ 
            ...item, 
            entityType: "service",
            sourceType: "Service",
            recommendationSource: "populaire"
          })),
          ...metierRecs.map(item => ({ 
            ...item, 
            entityType: "metier",
            sourceType: "Métier",
            recommendationSource: "populaire"
          })),
          ...propertyRecs.map(item => ({ 
            ...item, 
            entityType: "property",
            sourceType: "Immobilier",
            recommendationSource: "populaire"
          }))
        );
        
        console.log(`🌟 Recommandations populaires - Produits: ${productRecs.length}, Services: ${serviceRecs.length}, Métiers: ${metierRecs.length}, Propriétés: ${propertyRecs.length}`);
      } catch (error) {
        console.error("❌ Erreur recommandations populaires:", error.message);
        // Fallback sur les produits seulement
        const productRecs = await prisma.product.findMany({
          where: { status: "active" },
          take: remainingLimit,
          orderBy: { createdAt: "desc" }
        });
        recommendations.push(...productRecs.map(item => ({ 
          ...item, 
          entityType: "product",
          sourceType: "Produit",
          recommendationSource: "populaire"
        })));
      }
    }

    // 7. Dédupliquer et limiter
    const uniqueRecs = recommendations.reduce((acc, current) => {
      const key = `${current.entityType}-${current.id}`;
      if (!acc.find(item => `${item.entityType}-${item.id}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []).slice(0, limitNum);

    console.log(`✅ Recommandations finales avant randomisation: ${uniqueRecs.length}`);
// === 8. Sélection pondérée selon les préférences utilisateur ===
// ✅ Sélection pondérée qui renforce les catégories dominantes
function weightedRandomRecommendations(recs, preferences, limit) {
  // Extraire les "poids" depuis les préférences utilisateur
  const weights = {
    product: preferences.filter(p => p.category.toLowerCase().includes("produit")).length,
    service: preferences.filter(p => p.category.toLowerCase().includes("service")).length,
    metier: preferences.filter(p => p.category.toLowerCase().includes("métier") || p.category.toLowerCase().includes("metier")).length,
    property: preferences.filter(p => p.category.toLowerCase().includes("propriété") || p.category.toLowerCase().includes("immobilier")).length
  };

  // Si un type est dominant, on lui donne une pondération supplémentaire
  const maxWeight = Math.max(...Object.values(weights));
  for (const key in weights) {
    if (weights[key] === maxWeight && maxWeight > 0) {
      weights[key] = weights[key] * 1.8; // ⚖️ accentuer la préférence dominante
    } else {
      weights[key] = weights[key] || 1;
    }
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const allocation = {};
  for (const [type, weight] of Object.entries(weights)) {
    allocation[type] = Math.round((weight / totalWeight) * limit);
  }

  // Grouper les recommandations par type d'entité
  const grouped = recs.reduce((acc, rec) => {
    if (!acc[rec.entityType]) acc[rec.entityType] = [];
    acc[rec.entityType].push(rec);
    return acc;
  }, {});

  const selected = [];

  // Sélectionner selon l’allocation pondérée
  for (const [type, items] of Object.entries(grouped)) {
    const count = allocation[type] || 0;
    const shuffled = items.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, count));
  }

  // Compléter s’il manque des éléments (fallback aléatoire)
  while (selected.length < limit && recs.length > selected.length) {
    const remaining = recs.filter(r => !selected.includes(r));
    const randomItem = remaining[Math.floor(Math.random() * remaining.length)];
    if (randomItem) selected.push(randomItem);
  }

  return selected.slice(0, limit);
}
 
// Application de la pondération
const weightedRecs = weightedRandomRecommendations(uniqueRecs, userPreferences, limitNum);

// === 9. Formattage final ===
const recommendationsWithScore = weightedRecs.map(rec => {
  let displayName = '';
  let displayImage = '';
  let displayDescription = '';

  switch (rec.entityType) {
    case "product":
      displayName = rec.name;
      displayImage = rec.images && rec.images.length > 0 ? rec.images[0] : '';
      displayDescription = rec.description || '';
      break;
    case "service":
      displayName = rec.libelle;
      displayImage = rec.image || '';
      displayDescription = rec.description || '';
      break;
    case "metier":
      displayName = rec.libelle;
      displayImage = rec.image || '';
      displayDescription = rec.description || '';
      break;
    case "property":
      displayName = rec.title;
      displayImage = rec.images && rec.images.length > 0 ? rec.images[0] : '';
      displayDescription = rec.description || '';
      break;
    default:
      displayName = rec.name || rec.libelle || rec.title || 'Sans nom';
      displayImage = rec.images && rec.images.length > 0 ? rec.images[0] : rec.image || '';
      displayDescription = rec.description || '';
  }

  return {
    id: rec.id,
    name: displayName,
    description: displayDescription,
    price: rec.price,
    images: displayImage ? [displayImage] : [],
    category: rec.category,
    type: rec.entityType,
    sourceType: rec.sourceType || getSourceType(rec.entityType),
    recommendationSource: rec.recommendationSource || "général",
    similarity: Math.random() * 0.3 + 0.7,
    viewCount: rec.viewCount || 0,
    personalizationScore: Math.random() * 0.5 + 0.5,
    popularityScore: Math.random() * 0.8 + 0.2,
    ...(rec.entityType === "property" && {
      city: rec.city,
      type: rec.type,
      isFeatured: rec.isFeatured
    }),
    ...(rec.entityType === "service" && {
      libelle: rec.libelle
    }),
    ...(rec.entityType === "metier" && {
      libelle: rec.libelle
    })
  };
});

console.log(`🎉 Recommandations finales pondérées: ${recommendationsWithScore.length} items`);

const typeCounts = recommendationsWithScore.reduce((acc, rec) => {
  acc[rec.sourceType] = (acc[rec.sourceType] || 0) + 1;
  return acc;
}, {});
console.log(`📊 Distribution pondérée des types:`, typeCounts);

res.json(recommendationsWithScore);

  } catch (error) {
    console.error("❌ Erreur critique recommandations:", error);
    res.status(500).json({ 
      error: "Erreur lors de la génération des recommandations",
      details: error.message 
    });
  }
});

// Fonction utilitaire pour obtenir le type de source
function getSourceType(entityType) {
  const sourceMap = {
    "product": "Produit",
    "service": "Service", 
    "metier": "Métier",
    "property": "Immobilier"
  };
  return sourceMap[entityType] || "Autre";
}

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