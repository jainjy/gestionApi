// routes/pro.js - VERSION COMPLÈTE CORRIGÉE
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// ============================================
// ROUTES SPÉCIFIQUES PAR CATÉGORIE
// ============================================

// Route pour les agences (métiers contenant "agenc")
router.get("/agences", async (req, res) => {
  try {
    console.log("🏢 Requête /api/pro/agences reçue");
    const { page = 1, limit = 12, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Trouver les IDs des métiers contenant "agenc"
    const agenceMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: "agenc", mode: 'insensitive' } },
          { libelle: { contains: "agence", mode: 'insensitive' } }
        ]
      },
      select: { 
        id: true,
        libelle: true 
      }
    });

    console.log(`📊 ${agenceMetiers.length} métiers d'agence trouvés`);
    
    const metierIds = agenceMetiers.map(m => m.id);
    
    // Construire les filtres
    const where = {
      OR: [
        { role: "professional" },
        { userType: "PRESTATAIRE" }
      ]
    };

    if (metierIds.length > 0) {
      where.metiers = {
        some: {
          metierId: {
            in: metierIds
          }
        }
      };
    } else {
      // Fallback : rechercher dans le nom de l'entreprise
      where.OR.push(
        { companyName: { contains: "agenc", mode: 'insensitive' } },
        { commercialName: { contains: "agenc", mode: 'insensitive' } },
        { companyName: { contains: "agence", mode: 'insensitive' } },
        { commercialName: { contains: "agence", mode: 'insensitive' } }
      );
    }

    // Filtre par ville
    if (city && city.trim() !== "") {
      where.city = { 
        contains: city.trim(), 
        mode: 'insensitive' 
      };
    }

    console.log("🔍 Filtres WHERE:", JSON.stringify(where, null, 2));

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

    const total = await prisma.user.count({ where });

    console.log(`✅ ${professionals.length} agences récupérées (total: ${total})`);

    res.json({
      success: true,
      data: professionals,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      },
      category: "agences",
      searchInfo: {
        metierFilter: "agenc/agence",
        matchingMetiers: agenceMetiers.length,
        metierNames: agenceMetiers.map(m => m.libelle)
      }
    });

  } catch (error) {
    console.error("❌ Erreur route agences:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des agences",
      message: error.message
    });
  }
});

// Route pour les constructeurs (métiers contenant "construct")
router.get("/constructeurs", async (req, res) => {
  try {
    console.log("🏗️ Requête /api/pro/constructeurs reçue");
    const { page = 1, limit = 12, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Trouver les IDs des métiers contenant "construct"
    const constructeurMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: "construct", mode: 'insensitive' } },
          { libelle: { contains: "maçon", mode: 'insensitive' } },
          { libelle: { contains: "charpent", mode: 'insensitive' } },
          { libelle: { contains: "batiment", mode: 'insensitive' } }
        ]
      },
      select: { 
        id: true,
        libelle: true 
      }
    });

    console.log(`📊 ${constructeurMetiers.length} métiers de construction trouvés`);
    
    const metierIds = constructeurMetiers.map(m => m.id);
    
    const where = {
      OR: [
        { role: "professional" },
        { userType: "PRESTATAIRE" }
      ]
    };

    if (metierIds.length > 0) {
      where.metiers = {
        some: {
          metierId: {
            in: metierIds
          }
        }
      };
    }

    // Filtre par ville
    if (city && city.trim() !== "") {
      where.city = { 
        contains: city.trim(), 
        mode: 'insensitive' 
      };
    }

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

    const total = await prisma.user.count({ where });

    console.log(`✅ ${professionals.length} constructeurs récupérés (total: ${total})`);

    res.json({
      success: true,
      data: professionals,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      },
      category: "constructeurs",
      searchInfo: {
        metierFilter: "construct/maçon/charpent/batiment",
        matchingMetiers: constructeurMetiers.length,
        metierNames: constructeurMetiers.map(m => m.libelle)
      }
    });

  } catch (error) {
    console.error("❌ Erreur route constructeurs:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des constructeurs",
      message: error.message
    });
  }
});

// Route pour les plombiers (métiers contenant "plomb")
router.get("/plombiers", async (req, res) => {
  try {
    console.log("🔧 Requête /api/pro/plombiers reçue");
    const { page = 1, limit = 12, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Trouver les IDs des métiers contenant "plomb"
    const plombierMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: "plomb", mode: 'insensitive' } },
          { libelle: { contains: "plomber", mode: 'insensitive' } },
          { libelle: { contains: "sanitaire", mode: 'insensitive' } }
        ]
      },
      select: { 
        id: true,
        libelle: true 
      }
    });

    console.log(`📊 ${plombierMetiers.length} métiers de plomberie trouvés`);
    
    const metierIds = plombierMetiers.map(m => m.id);
    
    const where = {
      OR: [
        { role: "professional" },
        { userType: "PRESTATAIRE" }
      ]
    };

    if (metierIds.length > 0) {
      where.metiers = {
        some: {
          metierId: {
            in: metierIds
          }
        }
      };
    }

    // Filtre par ville
    if (city && city.trim() !== "") {
      where.city = { 
        contains: city.trim(), 
        mode: 'insensitive' 
      };
    }

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

    const total = await prisma.user.count({ where });

    console.log(`✅ ${professionals.length} plombiers récupérés (total: ${total})`);

    res.json({
      success: true,
      data: professionals,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      },
      category: "plombiers",
      searchInfo: {
        metierFilter: "plomb/plomber/sanitaire",
        matchingMetiers: plombierMetiers.length,
        metierNames: plombierMetiers.map(m => m.libelle)
      }
    });

  } catch (error) {
    console.error("❌ Erreur route plombiers:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des plombiers",
      message: error.message
    });
  }
});

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