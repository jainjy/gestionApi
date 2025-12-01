// const express = require('express');
// const router = express.Router();
// const { prisma } = require('../lib/db');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const { z } = require('zod');
// const NodeCache = require('node-cache');

// // Initialisation de Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// // Cache pour les suggestions (5 minutes)
// const suggestionCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// // Schémas de validation avec Zod
// const SuggestionRequestSchema = z.object({
//   query: z.string().min(1).max(100).trim(),
//   userId: z.string().optional(),
//   limit: z.number().min(1).max(20).optional().default(8),
//   includeCorrections: z.boolean().optional().default(true),
//   includeTrending: z.boolean().optional().default(true)
// });

// const LogRequestSchema = z.object({
//   userId: z.string().optional(),
//   query: z.string().min(1).max(200),
//   resultsCount: z.number().int().nonnegative().optional(),
//   entityType: z.string().optional(),
//   entityId: z.string().optional()
// });

// // Fonction utilitaire pour générer une clé de cache
// const generateCacheKey = (query, userId, options = {}) => {
//   return `suggestions:${query.toLowerCase()}:${userId || 'anonymous'}:${JSON.stringify(options)}`;
// };

// // Fonction pour obtenir les corrections orthographiques améliorées
// async function getSpellingCorrections(query) {
//   const cacheKey = `corrections:${query}`;
//   const cached = suggestionCache.get(cacheKey);
//   if (cached) return cached;

//   try {
//     const prompt = `Tu es un expert en orthographe et sémantique française. 
// Corrige les erreurs potentielles dans cette requête de recherche et propose des variantes contextuelles.

// Règles :
// 1. Identifie les fautes d'orthographe, de grammaire et les abréviations
// 2. Propose des corrections naturelles
// 3. Ajoute des variantes sémantiquement proches
// 4. Conserve l'intention de recherche

// Format de réponse : UNIQUEMENT une liste de corrections séparées par des pipes (|), sans explication.

// Exemples :
// - Input: "mason paris" → Output: "maçon paris|maison paris|maçonnerie paris"
// - Input: "electricien lyon" → Output: "électricien lyon|électricité lyon|installation électrique lyon"
// - Input: "apartement a louer" → Output: "appartement à louer|location appartement|appartement en location"

// Requête à corriger: "${query}"

// Corrections :`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text().trim();
    
//     // Nettoyage et traitement des résultats
//     const corrections = text.split('|')
//       .map(s => s.trim())
//       .filter(s => {
//         // Filtrer les résultats non pertinents
//         if (!s || s.length < 2) return false;
//         if (s.toLowerCase() === query.toLowerCase()) return false;
//         if (s.length > 100) return false; // Limiter la longueur
//         return true;
//       })
//       .slice(0, 5); // Limiter à 5 corrections maximum
    
//     // Mettre en cache
//     suggestionCache.set(cacheKey, corrections, 600); // 10 minutes pour les corrections
    
//     return corrections;
//   } catch (error) {
//     console.error("Erreur lors de la génération des corrections orthographiques:", error);
    
//     // Fallback : correction basique
//     const basicCorrections = [];
//     const commonTypos = {
//       'appartement': ['appartement', 'apartment', 'appart'],
//       'electricien': ['électricien', 'electricité', 'électrique'],
//       'plombier': ['plombier', 'plomberie', 'plomb'],
//       'renovation': ['rénovation', 'renovation', 'rénover'],
//       'maison': ['maison', 'maisons', 'villa']
//     };
    
//     // Chercher des corrections basiques basées sur des mots communs
//     Object.keys(commonTypos).forEach(correctWord => {
//       if (query.toLowerCase().includes(correctWord.substring(0, 4))) {
//         basicCorrections.push(...commonTypos[correctWord]
//           .map(word => query.replace(new RegExp(correctWord, 'i'), word)));
//       }
//     });
    
//     return [...new Set(basicCorrections)].slice(0, 3);
//   }
// }

// // Fonction pour l'auto-complétion contextuelle avancée
// async function getContextualSuggestions(query, userId = null, limit = 8) {
//   const cacheKey = `contextual:${query}:${limit}`;
//   const cached = suggestionCache.get(cacheKey);
//   if (cached) return cached;

//   try {
//     const prompt = `Tu es un assistant de recherche expert pour une plateforme multi-services française.
// Génère des suggestions de recherche pertinentes, complètes et utiles.

// CONTEXTE DE LA PLATEFORME :
// - Immobilier : location, achat, vente (appartements, maisons, locaux)
// - Services professionnels : artisans, prestataires (plombiers, électriciens, etc.)
// - Produits : électroménager, meubles, matériaux
// - Articles de blog : conseils, tutoriels, actualités

// DIRECTIVES :
// 1. Propose des requêtes complètes et naturelles en français
// 2. Varie les types de suggestions (spécifiques, générales, alternatives)
// 3. Inclus des localisations pertinentes si approprié
// 4. Priorise l'utilité pour l'utilisateur
// 5. Limite à ${limit} suggestions maximum

// EXEMPLES :
// Pour "appart" : 
// - appartement à louer Paris 15ème
// - studio meublé centre ville Lyon
// - location appartement 3 pièces Bordeaux
// - achat appartement neuf avec terrasse

// Pour "plombier" :
// - plombier urgence Paris 24/7
// - débouchage canalisation Lyon
// - installation sanitaire devis gratuit
// - réparation fuite d'eau à domicile

// Requête de l'utilisateur : "${query}"

// Suggestions (une par ligne, sans numérotation) :`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text().trim();
    
//     const suggestions = text.split('\n')
//       .map(line => line.trim())
//       .filter(line => {
//         if (!line || line.length < 3) return false;
//         if (line.toLowerCase() === query.toLowerCase()) return false;
//         if (line.length > 150) return false; // Limiter la longueur
//         // Vérifier que c'est une phrase cohérente
//         return /^[a-zA-ZÀ-ÿ0-9\s,'\-\.]+$/u.test(line);
//       })
//       .slice(0, limit);

//     // Mettre en cache
//     suggestionCache.set(cacheKey, suggestions, 300);
    
//     return suggestions;
//   } catch (error) {
//     console.error("Erreur lors de la génération des suggestions contextuelles:", error);
//     return [];
//   }
// }

// // Fonction pour obtenir les suggestions basées sur l'historique utilisateur
// async function getUserBasedSuggestions(query, userId, limit = 3) {
//   if (!userId) return [];

//   try {
//     // Rechercher dans l'historique de l'utilisateur
//     const userSearches = await prisma.userActivity.findMany({
//       where: {
//         userId,
//         action: 'SEARCH',
//         searchQuery: {
//           not: null,
//           contains: query.substring(0, Math.min(4, query.length))
//         }
//       },
//       select: {
//         searchQuery: true,
//         createdAt: true,
//         metadata: true
//       },
//       orderBy: {
//         createdAt: 'desc'
//       },
//       distinct: ['searchQuery'],
//       take: 10
//     });

//     // Pondérer par date et pertinence
//     const now = Date.now();
//     const suggestions = userSearches
//       .map(activity => {
//         const age = now - new Date(activity.createdAt).getTime();
//         const ageScore = Math.max(0, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // Décroissance sur 30 jours
        
//         const similarity = calculateSimilarity(query, activity.searchQuery);
//         const totalScore = (ageScore * 0.3) + (similarity * 0.7);
        
//         return {
//           text: activity.searchQuery,
//           score: totalScore,
//           type: 'user_history'
//         };
//       })
//       .filter(item => item.score > 0.3) // Seuil minimum
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit)
//       .map(item => item.text);

//     return suggestions;
//   } catch (error) {
//     console.error("Erreur lors de la récupération de l'historique utilisateur:", error);
//     return [];
//   }
// }

// // Fonction pour obtenir les tendances populaires
// async function getPopularSuggestions(query, limit = 3) {
//   try {
//     const cacheKey = `popular:${query}:${limit}`;
//     const cached = suggestionCache.get(cacheKey);
//     if (cached) return cached;

//     const popularSearches = await prisma.userActivity.groupBy({
//       by: ['searchQuery'],
//       where: {
//         action: 'SEARCH',
//         searchQuery: {
//           not: null,
//           contains: query.substring(0, Math.min(3, query.length))
//         },
//         createdAt: {
//           gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
//         }
//       },
//       _count: {
//         searchQuery: true
//       },
//       orderBy: {
//         _count: {
//           searchQuery: 'desc'
//         }
//       },
//       take: limit * 2 // Prendre plus pour filtrer
//     });

//     // Filtrer et scorer
//     const suggestions = popularSearches
//       .map(item => ({
//         text: item.searchQuery,
//         score: Math.min(item._count.searchQuery / 100, 1),
//         count: item._count.searchQuery
//       }))
//       .filter(item => {
//         // Filtrer les suggestions trop différentes
//         const similarity = calculateSimilarity(query, item.text);
//         return similarity > 0.2;
//       })
//       .sort((a, b) => b.score - a.score)
//       .slice(0, limit)
//       .map(item => ({
//         text: item.text,
//         score: item.score,
//         count: item.count
//       }));

//     // Mettre en cache (10 minutes pour les tendances)
//     suggestionCache.set(cacheKey, suggestions, 600);
    
//     return suggestions;
//   } catch (error) {
//     console.error("Erreur lors de la récupération des tendances:", error);
//     return [];
//   }
// }

// // Fonction utilitaire : calcul de similarité (Jaccard simplifié)
// function calculateSimilarity(str1, str2) {
//   if (!str1 || !str2) return 0;
  
//   const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
//   const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
//   if (words1.size === 0 || words2.size === 0) return 0;
  
//   const intersection = new Set([...words1].filter(x => words2.has(x)));
//   const union = new Set([...words1, ...words2]);
  
//   return intersection.size / union.size;
// }

// // Route principale pour les suggestions intelligentes
// router.post('/intelligent', async (req, res) => {
//   try {
//     // Validation des entrées
//     const validationResult = SuggestionRequestSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       return res.status(400).json({
//         error: "Données de requête invalides",
//         details: validationResult.error.format()
//       });
//     }

//     const { query, userId, limit, includeCorrections, includeTrending } = validationResult.data;
    
//     // Vérifier la clé de cache
//     const cacheKey = generateCacheKey(query, userId, { limit, includeCorrections, includeTrending });
//     const cachedResponse = suggestionCache.get(cacheKey);
    
//     if (cachedResponse) {
//       return res.json({
//         ...cachedResponse,
//         cached: true,
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Exécuter les différentes sources de suggestions en parallèle
//     const [
//       contextualSuggestions,
//       spellingCorrections,
//       userSuggestions,
//       popularSuggestions
//     ] = await Promise.allSettled([
//       getContextualSuggestions(query, userId, Math.ceil(limit * 0.6)),
//       includeCorrections ? getSpellingCorrections(query) : Promise.resolve([]),
//       getUserBasedSuggestions(query, userId, Math.ceil(limit * 0.3)),
//       includeTrending ? getPopularSuggestions(query, Math.ceil(limit * 0.3)) : Promise.resolve([])
//     ]);

//     // Traiter les résultats (avec gestion des erreurs)
//     const autoComplete = [
//       ...(contextualSuggestions.status === 'fulfilled' ? contextualSuggestions.value : []),
//       ...(userSuggestions.status === 'fulfilled' ? userSuggestions.value : []),
//     ];

//     const corrections = spellingCorrections.status === 'fulfilled' ? spellingCorrections.value : [];
//     const popular = includeTrending && popularSuggestions.status === 'fulfilled' 
//       ? popularSuggestions.value
//       : [];

//     // Dédupliquer et limiter
//     const uniqueAutoComplete = Array.from(new Set(autoComplete))
//       .filter(item => item && item.trim().length > 0)
//       .slice(0, limit);

//     const response = {
//       query,
//       autoComplete: uniqueAutoComplete,
//       corrections: corrections.filter(c => c && c.trim().length > 0),
//       popular: popular.filter(p => p && p.text && p.text.trim().length > 0),
//       metadata: {
//         totalSuggestions: uniqueAutoComplete.length + corrections.length + popular.length,
//         hasUserHistory: userSuggestions.status === 'fulfilled' && userSuggestions.value.length > 0,
//         hasSpellingCorrections: corrections.length > 0,
//         hasPopularSuggestions: popular.length > 0,
//         timestamp: new Date().toISOString()
//       }
//     };

//     // Mettre en cache la réponse
//     suggestionCache.set(cacheKey, response, 300); // 5 minutes

//     res.json(response);
//   } catch (error) {
//     console.error("Erreur critique dans la route /intelligent:", error);
    
//     // Réponse de fallback
//     res.status(500).json({
//       error: "Erreur interne du serveur",
//       autoComplete: [],
//       corrections: [],
//       popular: [],
//       fallback: true
//     });
//   }
// });

// // Route pour les tendances globales
// router.get('/trending', async (req, res) => {
//   try {
//     const { limit = 15, period = 'week' } = req.query;
//     const parsedLimit = Math.min(parseInt(limit) || 15, 50);
    
//     // Calcul de la période
//     let daysAgo = 7; // Par défaut : une semaine
//     if (period === 'day') daysAgo = 1;
//     if (period === 'month') daysAgo = 30;
    
//     const cacheKey = `trending:${period}:${parsedLimit}`;
//     const cached = suggestionCache.get(cacheKey);
    
//     if (cached) {
//       return res.json({
//         ...cached,
//         cached: true
//       });
//     }

//     const trending = await prisma.userActivity.groupBy({
//       by: ['searchQuery'],
//       where: {
//         action: 'SEARCH',
//         searchQuery: { 
//           not: null,
//           notIn: ['', ' ', 'recherche', 'search'] // Exclure les requêtes vides
//         },
//         createdAt: {
//           gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
//         }
//       },
//       _count: {
//         searchQuery: true
//       },
//       orderBy: {
//         _count: {
//           searchQuery: 'desc'
//         }
//       },
//       take: parsedLimit
//     });

//     const suggestions = trending.map((item, index) => ({
//       query: item.searchQuery,
//       count: item._count.searchQuery,
//       rank: index + 1,
//       popularity: Math.min(item._count.searchQuery / 100, 1) // Score normalisé
//     }));

//     const response = {
//       period,
//       total: suggestions.length,
//       suggestions,
//       generatedAt: new Date().toISOString()
//     };

//     // Mettre en cache (2 minutes pour les tendances)
//     suggestionCache.set(cacheKey, response, 120);
    
//     res.json(response);
//   } catch (error) {
//     console.error("Erreur dans /trending:", error);
//     res.status(500).json({ 
//       error: "Erreur lors de la récupération des tendances",
//       suggestions: []
//     });
//   }
// });

// // Route pour enregistrer une activité de recherche
// router.post('/log', async (req, res) => {
//   try {
//     // Validation
//     const validationResult = LogRequestSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       return res.status(400).json({
//         error: "Données de log invalides",
//         details: validationResult.error.format()
//       });
//     }

//     const { userId, query, resultsCount, entityType, entityId } = validationResult.data;
    
//     // Enregistrer l'activité
//     if (userId) {
//       await prisma.userActivity.create({
//         data: {
//           userId,
//           entityType: entityType || 'SEARCH',
//           entityId: entityId || `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//           action: 'SEARCH',
//           searchQuery: query.substring(0, 200), // Limiter la longueur
//           metadata: {
//             resultsCount: resultsCount || 0,
//             timestamp: new Date().toISOString(),
//             userAgent: req.headers['user-agent'],
//             ip: req.ip
//           }
//         }
//       });
//     }

//     // Invalider les caches pertinents
//     const cacheKeysToDelete = [
//       `trending:week:*`,
//       `trending:day:*`,
//       `popular:${query.substring(0, 3)}:*`
//     ];
    
//     cacheKeysToDelete.forEach(pattern => {
//       suggestionCache.keys().forEach(key => {
//         if (key.startsWith(pattern.replace('*', ''))) {
//           suggestionCache.del(key);
//         }
//       });
//     });

//     res.json({ 
//       success: true, 
//       message: "Recherche enregistrée avec succès",
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error("Erreur lors de l'enregistrement de la recherche:", error);
//     // Ne pas renvoyer d'erreur 500 pour ne pas perturber l'UX
//     res.json({ 
//       success: false, 
//       error: "Échec de l'enregistrement",
//       fallback: true
//     });
//   }
// });

// // Route de santé
// router.get('/health', (req, res) => {
//   const cacheStats = suggestionCache.getStats();
  
//   res.json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     cache: {
//       hits: cacheStats.hits,
//       misses: cacheStats.misses,
//       keys: cacheStats.keys,
//       size: cacheStats.vsize
//     },
//     services: {
//       prisma: 'connected',
//       gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
//     }
//   });
// });

// // Route pour vider le cache (admin uniquement)
// router.post('/cache/clear', async (req, res) => {
//   // Vérification basique (à renforcer en production)
//   const { secret } = req.body;
//   if (secret !== process.env.ADMIN_SECRET) {
//     return res.status(403).json({ error: "Accès non autorisé" });
//   }

//   const keys = suggestionCache.keys();
//   suggestionCache.flushAll();
  
//   res.json({
//     success: true,
//     cleared: keys.length,
//     timestamp: new Date().toISOString()
//   });
// });

// module.exports = router;
//aza fafaina io amboni io 


const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { z } = require('zod');
const NodeCache = require('node-cache');

// Cache pour les suggestions (5 minutes)
const suggestionCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Schémas de validation avec Zod
const SuggestionRequestSchema = z.object({
  query: z.string().min(1).max(100).trim(),
  userId: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(8),
});

// Fonction pour obtenir les suggestions de la base de données
async function getDatabaseSuggestions(query, limit = 8) {
  try {
    // Chercher dans différents types de contenus
    const results = await Promise.allSettled([
      // Rechercher dans les propriétés
      prisma.property.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          title: true,
          city: true,
          type: true
        },
        take: 5
      }),
      
      // Rechercher dans les produits
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          name: true,
          category: true
        },
        take: 5
      }),
      
      // Rechercher dans les services
      prisma.service.findMany({
        where: {
          OR: [
            { libelle: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          libelle: true,
          category: true
        },
        take: 5
      }),
      
      // Rechercher dans les métiers
      prisma.metier.findMany({
        where: {
          OR: [
            { libelle: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          libelle: true,
          category: true
        },
        take: 5
      })
    ]);

    // Traiter et combiner les résultats
    const suggestions = [];
    
    // Propriétés
    if (results[0].status === 'fulfilled') {
      results[0].value.forEach(property => {
        suggestions.push({
          text: `${property.title} ${property.city ? `à ${property.city}` : ''}`,
          type: 'property',
          category: property.type || 'Immobilier'
        });
      });
    }
    
    // Produits
    if (results[1].status === 'fulfilled') {
      results[1].value.forEach(product => {
        suggestions.push({
          text: product.name,
          type: 'product',
          category: product.category || 'Produit'
        });
      });
    }
    
    // Services
    if (results[2].status === 'fulfilled') {
      results[2].value.forEach(service => {
        suggestions.push({
          text: service.libelle,
          type: 'service',
          category: service.category || 'Service'
        });
      });
    }
    
    // Métiers
    if (results[3].status === 'fulfilled') {
      results[3].value.forEach(metier => {
        suggestions.push({
          text: metier.libelle,
          type: 'metier',
          category: metier.category || 'Métier'
        });
      });
    }

    // Dédupliquer et limiter
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.text, s]))
      .values()
    )
    .slice(0, limit);

    return uniqueSuggestions;
  } catch (error) {
    console.error("Erreur récupération suggestions base:", error);
    return [];
  }
}

// Fonction pour obtenir les recherches populaires
async function getPopularSearches(query, limit = 5) {
  try {
    const popularSearches = await prisma.userActivity.groupBy({
      by: ['searchQuery'],
      where: {
        action: 'SEARCH',
        searchQuery: {
          not: null,
          contains: query.substring(0, Math.min(3, query.length))
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      },
      _count: {
        searchQuery: true
      },
      orderBy: {
        _count: {
          searchQuery: 'desc'
        }
      },
      take: limit * 2
    });

    return popularSearches
      .map(item => ({
        text: item.searchQuery,
        count: item._count.searchQuery,
        type: 'popular',
        score: Math.min(item._count.searchQuery / 50, 1)
      }))
      .filter(item => item.text && item.text.length > 2)
      .slice(0, limit);
  } catch (error) {
    console.error("Erreur récupération recherches populaires:", error);
    return [];
  }
}

// Fonction pour obtenir l'historique utilisateur
async function getUserSearchHistory(userId, query, limit = 4) {
  if (!userId) return [];

  try {
    const userSearches = await prisma.userActivity.findMany({
      where: {
        userId,
        action: 'SEARCH',
        searchQuery: {
          not: null
        }
      },
      select: {
        searchQuery: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      distinct: ['searchQuery'],
      take: 20
    });

    // Filtrer par pertinence si une query est fournie
    let filteredSearches = userSearches;
    if (query) {
      filteredSearches = userSearches.filter(item =>
        item.searchQuery.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Trier par date récente
    return filteredSearches
      .slice(0, limit)
      .map(item => ({
        text: item.searchQuery,
        type: 'history',
        date: item.createdAt.getTime()
      }));
  } catch (error) {
    console.error("Erreur récupération historique utilisateur:", error);
    return [];
  }
}

// Route principale pour les suggestions
router.post('/', async (req, res) => {
  try {
    // Validation des entrées
    const validationResult = SuggestionRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Données de requête invalides",
        details: validationResult.error.format()
      });
    }

    const { query, userId, limit } = validationResult.data;
    
    // Clé de cache
    const cacheKey = `suggestions:${query}:${userId || 'anonymous'}:${limit}`;
    const cachedResponse = suggestionCache.get(cacheKey);
    
    if (cachedResponse) {
      return res.json({
        ...cachedResponse,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Récupérer toutes les suggestions en parallèle
    const [databaseSuggestions, popularSearches, userHistory] = await Promise.all([
      getDatabaseSuggestions(query, Math.ceil(limit * 0.5)),
      getPopularSearches(query, Math.ceil(limit * 0.3)),
      getUserSearchHistory(userId, query, Math.ceil(limit * 0.2))
    ]);

    // Combiner et organiser les suggestions
    const allSuggestions = [
      // Priorité 1: Résultats de la base de données
      ...databaseSuggestions.map((s, i) => ({
        ...s,
        priority: 1,
        order: i
      })),
      
      // Priorité 2: Historique utilisateur
      ...userHistory.map((s, i) => ({
        ...s,
        priority: 2,
        order: i
      })),
      
      // Priorité 3: Recherches populaires
      ...popularSearches.map((s, i) => ({
        ...s,
        priority: 3,
        order: i
      }))
    ];

    // Trier par priorité et ordre
    const sortedSuggestions = allSuggestions
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.order - b.order;
      })
      .slice(0, limit);

    const response = {
      query,
      suggestions: sortedSuggestions,
      metadata: {
        total: sortedSuggestions.length,
        fromDatabase: databaseSuggestions.length,
        fromHistory: userHistory.length,
        fromPopular: popularSearches.length,
        timestamp: new Date().toISOString()
      }
    };

    // Mettre en cache (2 minutes)
    suggestionCache.set(cacheKey, response, 120);

    res.json(response);
  } catch (error) {
    console.error("Erreur suggestions:", error);
    res.status(500).json({
      error: "Erreur serveur",
      suggestions: [],
      fallback: true
    });
  }
});

// Route pour les tendances (recherches populaires)
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 20);
    
    const cacheKey = `trending:${parsedLimit}`;
    const cached = suggestionCache.get(cacheKey);
    
    if (cached) {
      return res.json({
        ...cached,
        cached: true
      });
    }

    const trending = await prisma.userActivity.groupBy({
      by: ['searchQuery'],
      where: {
        action: 'SEARCH',
        searchQuery: { 
          not: null,
          notIn: ['', ' ', 'recherche', 'search']
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
        }
      },
      _count: {
        searchQuery: true
      },
      orderBy: {
        _count: {
          searchQuery: 'desc'
        }
      },
      take: parsedLimit
    });

    const suggestions = trending.map((item, index) => ({
      text: item.searchQuery,
      count: item._count.searchQuery,
      rank: index + 1,
      type: 'trending'
    }));

    const response = {
      total: suggestions.length,
      suggestions,
      generatedAt: new Date().toISOString()
    };

    // Mettre en cache (5 minutes)
    suggestionCache.set(cacheKey, response, 300);
    
    res.json(response);
  } catch (error) {
    console.error("Erreur trending:", error);
    res.status(500).json({ 
      error: "Erreur serveur",
      suggestions: []
    });
  }
});

// Route pour enregistrer une recherche
router.post('/log', async (req, res) => {
  try {
    const { userId, query } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Requête invalide" });
    }
    
    // Enregistrer l'activité si utilisateur connecté
    if (userId) {
      await prisma.userActivity.create({
        data: {
          userId,
          entityType: 'SEARCH',
          entityId: `search_${Date.now()}`,
          action: 'SEARCH',
          searchQuery: query.substring(0, 100),
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'search_bar'
          }
        }
      });
    }
    
    // Invalider le cache des tendances
    suggestionCache.del('trending:10');
    
    res.json({ 
      success: true, 
      message: "Recherche enregistrée"
    });
  } catch (error) {
    console.error("Erreur log:", error);
    res.json({ 
      success: false, 
      error: "Erreur enregistrement"
    });
  }
});

module.exports = router;