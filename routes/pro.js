// routes/pro.js - VERSION COMPLÈTE CORRIGÉE
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// ============================================
// ROUTES SPÉCIFIQUES PAR CATÉGORIE
// ============================================


async function getProfessionalsByMetiers(res, req, metierFilters, category) {
  try {
    const { page = 1, limit = 12, city } = req.query;
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    console.log(`📍 Requête /pro/${category}`);

    // 1️⃣ Chercher les métiers correspondants
    const metiers = await prisma.metier.findMany({
      where: {
        OR: metierFilters.map(word => ({
          libelle: { contains: word, mode: "insensitive" }
        }))
      },
      select: { id: true, libelle: true }
    });

    const metierIds = metiers.map(m => m.id);

    // 2️⃣ Construire la condition WHERE
    const where = {
      OR: [
        { role: "professional" },
        { userType: "PRESTATAIRE" }
      ],
      ...(city && {
        city: { contains: city, mode: "insensitive" }
      }),

      ...(metierIds.length > 0 && {
        metiers: { some: { metierId: { in: metierIds } } }
      })
    };

    // 3️⃣ Récupérer les professionnels AVEC LEUR POSITION
    const professionals = await prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        companyName: true,
        commercialName: true,
        city: true,
        zipCode: true,
        address: true,

        // ⭐⭐ Position récupérée ⭐⭐
        latitude: true,
        longitude: true,

        createdAt: true,

        metiers: {
          include: { metier: { select: { id: true, libelle: true } } }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });

    const total = await prisma.user.count({ where });

    return res.json({
      success: true,
      data: professionals,
      category,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      },
      searchInfo: {
        matchingMetiers: metiers.length,
        metierNames: metiers.map(m => m.libelle)
      }
    });

  } catch (error) {
    console.error(`❌ Erreur route ${category}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erreur lors de la récupération des ${category}`,
      error: error.message
    });
  }
}

router.get("/agences", (req, res) =>
  getProfessionalsByMetiers(
    res, 
    req, 
    ["agenc", "agence"],   // Mots-clés métier
    "agences"
  )
);
router.get("/constructeurs", (req, res) =>
  getProfessionalsByMetiers(
    res, 
    req, 
    ["construct", "maçon", "charpent", "batiment"],
    "constructeurs"
  )
);

router.get("/plombiers", (req, res) =>
  getProfessionalsByMetiers(
    res, 
    req, 
    ["plomb", "plomber", "sanitaire"],
    "plombiers"
  )
);



// ============================================
// ROUTE PRINCIPALE (tous les professionnels)
// ============================================

// GET - Récupérer tous les professionnels
router.get("/", async (req, res) => {
  console.log("🔍 Requête /api/pro reçue avec query:", req.query);
  
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      metierId,
      city
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire les filtres de base pour les professionnels
    const where = {
      OR: [
        { role: "professional" },
        { userType: "PRESTATAIRE" }
      ]
    };

    console.log("✅ Condition de base appliquée");

    // Filtre par recherche (uniquement si search n'est pas vide)
    if (search && search.trim() !== "") {
      console.log("🔎 Recherche activée:", search);
      
      const searchConditions = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];

      searchConditions.push(
        { companyName: { contains: search, mode: 'insensitive' } }
      );

      searchConditions.push(
        { commercialName: { contains: search, mode: 'insensitive' } }
      );

      where.AND = [
        { OR: where.OR },
        { OR: searchConditions }
      ];
      
      delete where.OR;
    }

    // Filtre par métier ID
    if (metierId && !isNaN(parseInt(metierId))) {
      console.log("🏷️ Filtre métier par ID:", metierId);
      where.metiers = {
        some: {
          metierId: parseInt(metierId)
        }
      };
    }

    // Filtre par ville
    if (city && city.trim() !== "") {
      console.log("📍 Filtre ville:", city);
      where.city = { 
        contains: city.trim(), 
        mode: 'insensitive' 
      };
    }

    console.log("📊 Filtres WHERE finaux:", JSON.stringify(where, null, 2));

    // Récupérer les professionnels
    const professionals = await prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        companyName: true,
        commercialName: true,
        userType: true,
        role: true,
        address: true,
        city: true,
        zipCode: true,
        createdAt: true,
        metiers: {
          include: {
            metier: {
              select: {
                id: true,
                libelle: true
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    console.log(`✅ ${professionals.length} professionnels récupérés`);

    // Ensuite, compter le total
    const total = await prisma.user.count({ where });
    console.log(`📈 Total de professionnels: ${total}`);

    // Formater la réponse
    const response = {
      success: true,
      data: professionals,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      },
      meta: {
        retrievedAt: new Date().toISOString()
      }
    };

    console.log("📤 Réponse envoyée avec succès");
    res.json(response);

  } catch (error) {
    console.error("❌ Erreur globale:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des professionnels",
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          code: error.code,
          timestamp: new Date().toISOString()
        }
      })
    });
  }
});

// ============================================
// ROUTES UTILITAIRES
// ============================================

// Route de test
router.get("/test", (req, res) => {
  console.log("✅ Route /test appelée");
  res.json({
    success: true,
    message: "Route /api/pro fonctionne correctement",
    timestamp: new Date().toISOString()
  });
});

// Route de santé
router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      error: error.message
    });
  }
});

// Route pour lister toutes les catégories disponibles
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      {
        id: "agences",
        name: "Agences",
        endpoint: "/api/pro/agences",
        description: "Agences immobilières et professionnelles",
        icon: "🏢",
        searchTerms: ["agenc", "agence"]
      },
      {
        id: "constructeurs",
        name: "Constructeurs",
        endpoint: "/api/pro/constructeurs",
        description: "Constructeurs, maçons, charpentiers",
        icon: "🏗️",
        searchTerms: ["construct", "maçon", "charpent", "batiment"]
      },
      {
        id: "plombiers",
        name: "Plombiers",
        endpoint: "/api/pro/plombiers",
        description: "Plombiers et professionnels sanitaires",
        icon: "🔧",
        searchTerms: ["plomb", "plomber", "sanitaire"]
      }
    ];

    // Compter le nombre de professionnels par catégorie
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        let where = {
          OR: [
            { role: "professional" },
            { userType: "PRESTATAIRE" }
          ]
        };

        // Trouver les métiers correspondants
        const metiers = await prisma.metier.findMany({
          where: {
            OR: category.searchTerms.map(term => ({
              libelle: { contains: term, mode: 'insensitive' }
            }))
          },
          select: { id: true }
        });

        const metierIds = metiers.map(m => m.id);
        
        if (metierIds.length > 0) {
          where.metiers = {
            some: {
              metierId: {
                in: metierIds
              }
            }
          };
        }

        const count = await prisma.user.count({ where });

        return {
          ...category,
          count,
          available: count > 0
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
      totalCategories: categoriesWithCount.length
    });

  } catch (error) {
    console.error("❌ Erreur route categories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories"
    });
  }
});

module.exports = router;