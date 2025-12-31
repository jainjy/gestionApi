// routes/conseils.js - ROUTES POUR BONS PLANS & CONSEILS
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// === MIDDLEWARE POUR PRÉVENIR CORB ===
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ==============================================
// ROUTES PUBLIQUES
// ==============================================

/**
 * @route GET /api/conseils/categories
 * @description Récupérer toutes les catégories de conseils
 * @access Public
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.conseilCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true
      }
    });

    // Ajouter le comptage manuellement
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.conseil.count({
          where: {
            category: category.name,
            isActive: true
          }
        });
        
        return {
          ...category,
          conseilsCount: count
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error("❌ Erreur récupération catégories conseils:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
      data: []
    });
  }
});

/**
 * @route GET /api/conseils
 * @description Récupérer tous les conseils (avec filtres)
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      limit = 20,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire les filtres
    const where = {
      isActive: true
    };

    if (category && category !== "tous") {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { content: { has: search } }
      ];
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    // Récupérer les conseils
    const conseils = await prisma.conseil.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: parseInt(limit)
    });

    // Récupérer le total pour la pagination
    const total = await prisma.conseil.count({ where });

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    // Formatage des données pour le frontend
    const formattedConseils = conseils.map(conseil => ({
      id: conseil.id,
      title: conseil.title,
      category: conseil.category,
      difficulty: conseil.difficulty,
      duration: conseil.duration,
      description: conseil.description,
      content: conseil.content,
      icon: conseil.icon,
      color: conseil.color,
      urgency: conseil.urgency,
      views: convertBigInt(conseil.views).toLocaleString('fr-FR'),
      saves: convertBigInt(conseil.saves).toLocaleString('fr-FR'),
      expert: conseil.expert,
      location: conseil.location,
      isFeatured: conseil.isFeatured,
      author: conseil.author ? {
        name: `${conseil.author.firstName} ${conseil.author.lastName}`,
        avatar: conseil.author.avatar,
        company: conseil.author.companyName
      } : null,
      createdAt: conseil.createdAt
    }));

    res.json({
      success: true,
      data: formattedConseils,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseils:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des conseils",
      data: []
    });
  }
});

/**
 * @route GET /api/conseils/featured
 * @description Récupérer les conseils en vedette
 * @access Public
 */
router.get("/featured", async (req, res) => {
  try {
    const conseils = await prisma.conseil.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    const formattedConseils = conseils.map(conseil => ({
      id: conseil.id,
      title: conseil.title,
      category: conseil.category,
      difficulty: conseil.difficulty,
      duration: conseil.duration,
      description: conseil.description,
      icon: conseil.icon,
      color: conseil.color,
      urgency: conseil.urgency,
      views: convertBigInt(conseil.views).toLocaleString('fr-FR'),
      saves: convertBigInt(conseil.saves).toLocaleString('fr-FR'),
      expert: conseil.expert,
      location: conseil.location
    }));

    res.json({
      success: true,
      data: formattedConseils
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseils vedette:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des conseils vedette",
      data: []
    });
  }
});

/**
 * @route GET /api/conseils/:id
 * @description Récupérer un conseil spécifique
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const conseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
            email: true
          }
        }
      }
    });

    if (!conseil || !conseil.isActive) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    // Incrémenter le compteur de vues
    await prisma.conseil.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } }
    });

    // Enregistrer la vue dans l'historique (si utilisateur connecté)
    const userId = req.user?.id;
    if (userId) {
      try {
        await prisma.conseilView.create({
          data: {
            conseilId: parseInt(id),
            userId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (viewError) {
        console.log("Note: Vue déjà enregistrée ou erreur mineure");
      }
    }

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    // Formater la réponse
    const formattedConseil = {
      id: conseil.id,
      title: conseil.title,
      category: conseil.category,
      difficulty: conseil.difficulty,
      duration: conseil.duration,
      description: conseil.description,
      content: conseil.content,
      icon: conseil.icon,
      color: conseil.color,
      urgency: conseil.urgency,
      views: convertBigInt(conseil.views).toLocaleString('fr-FR'),
      saves: convertBigInt(conseil.saves).toLocaleString('fr-FR'),
      expert: conseil.expert,
      location: conseil.location,
      isFeatured: conseil.isFeatured,
      author: conseil.author ? {
        id: conseil.author.id,
        name: `${conseil.author.firstName} ${conseil.author.lastName}`,
        avatar: conseil.author.avatar,
        company: conseil.author.companyName,
        email: conseil.author.email
      } : null,
      createdAt: conseil.createdAt,
      updatedAt: conseil.updatedAt
    };

    res.json({
      success: true,
      data: formattedConseil
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du conseil"
    });
  }
});

/**
 * @route GET /api/conseils/stats/global
 * @description Récupérer les statistiques globales
 * @access Public
 */
router.get("/stats/global", async (req, res) => {
  try {
    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    // Fonction pour convertir les résultats SQL raw
    const convertRawResults = (results) => {
      if (!Array.isArray(results)) return results;
      return results.map(item => {
        const newItem = {};
        for (const key in item) {
          newItem[key] = convertBigInt(item[key]);
        }
        return newItem;
      });
    };

    const [
      totalConseils,
      totalCategories,
      totalViewsAgg,
      totalSavesAgg,
      topCategoriesRaw
    ] = await Promise.all([
      prisma.conseil.count({ where: { isActive: true } }),
      prisma.conseilCategory.count({ where: { isActive: true } }),
      prisma.conseil.aggregate({
        where: { isActive: true },
        _sum: { views: true }
      }),
      prisma.conseil.aggregate({
        where: { isActive: true },
        _sum: { saves: true }
      }),
      prisma.$queryRaw`
        SELECT category, COUNT(*) as count
        FROM "Conseil"
        WHERE "isActive" = true
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `
    ]);

    // Convertir topCategoriesRaw
    const topCategories = convertRawResults(topCategoriesRaw);

    const stats = {
      totalConseils,
      totalCategories,
      totalViews: convertBigInt(totalViewsAgg._sum.views) || 0,
      totalSaves: convertBigInt(totalSavesAgg._sum.saves) || 0,
      topCategories: topCategories || []
    };

    res.json({
      success: true,
      data: {
        totalConseils: stats.totalConseils,
        totalCategories: stats.totalCategories,
        totalViews: stats.totalViews,
        totalSaves: stats.totalSaves,
        topCategories: stats.topCategories
      }
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats globales:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      data: {
        totalConseils: 0,
        totalCategories: 0,
        totalViews: 0,
        totalSaves: 0,
        topCategories: []
      }
    });
  }
});
/**
 * @route GET /api/conseils/search/suggestions
 * @description Récupérer des suggestions de recherche
 * @access Public
 */
router.get("/search/suggestions", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await prisma.conseil.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true
      },
      take: 10,
      orderBy: { views: "desc" }
    });

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error("❌ Erreur suggestions recherche:", error);
    res.json({
      success: true,
      data: []
    });
  }
});

// ==============================================
// ROUTES UTILISATEUR CONNECTÉ
// ==============================================

/**
 * @route POST /api/conseils/:id/save
 * @description Sauvegarder un conseil
 * @access Private
 */
router.post("/:id/save", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier si le conseil existe
    const conseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!conseil || !conseil.isActive) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    // Vérifier si déjà sauvegardé
    const existingSave = await prisma.conseilSave.findUnique({
      where: {
        conseilId_userId: {
          conseilId: parseInt(id),
          userId
        }
      }
    });

    let message;
    let saved;

    if (existingSave) {
      // Retirer la sauvegarde
      await prisma.conseilSave.delete({
        where: { id: existingSave.id }
      });

      // Décrémenter le compteur
      await prisma.conseil.update({
        where: { id: parseInt(id) },
        data: { saves: { decrement: 1 } }
      });

      message = "Conseil retiré de vos sauvegardes";
      saved = false;
    } else {
      // Ajouter la sauvegarde
      await prisma.conseilSave.create({
        data: {
          conseilId: parseInt(id),
          userId
        }
      });

      // Incrémenter le compteur
      await prisma.conseil.update({
        where: { id: parseInt(id) },
        data: { saves: { increment: 1 } }
      });

      message = "Conseil sauvegardé avec succès";
      saved = true;
    }

    // Récupérer le nouveau compteur
    const updatedConseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) },
      select: { saves: true }
    });

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    res.json({
      success: true,
      message,
      data: {
        saved,
        saves: convertBigInt(updatedConseil.saves)
      }
    });

  } catch (error) {
    console.error("❌ Erreur sauvegarde conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la sauvegarde du conseil"
    });
  }
});

/**
 * @route POST /api/conseils/:id/bookmark
 * @description Ajouter/retirer un bookmark
 * @access Private
 */
router.post("/:id/bookmark", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingBookmark = await prisma.conseilBookmark.findUnique({
      where: {
        conseilId_userId: {
          conseilId: parseInt(id),
          userId
        }
      }
    });

    let message;
    let bookmarked;

    if (existingBookmark) {
      // Retirer le bookmark
      await prisma.conseilBookmark.delete({
        where: { id: existingBookmark.id }
      });

      message = "Conseil retiré des favoris";
      bookmarked = false;
    } else {
      // Ajouter le bookmark
      await prisma.conseilBookmark.create({
        data: {
          conseilId: parseInt(id),
          userId
        }
      });

      message = "Conseil ajouté aux favoris";
      bookmarked = true;
    }

    res.json({
      success: true,
      message,
      data: { bookmarked }
    });

  } catch (error) {
    console.error("❌ Erreur bookmark conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la gestion du bookmark"
    });
  }
});

/**
 * @route GET /api/conseils/user/saved
 * @description Récupérer les conseils sauvegardés par l'utilisateur
 * @access Private
 */
router.get("/user/saved", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const savedConseils = await prisma.conseilSave.findMany({
      where: { userId },
      include: {
        conseil: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    const conseils = savedConseils
      .filter(item => item.conseil && item.conseil.isActive)
      .map(item => ({
        id: item.conseil.id,
        title: item.conseil.title,
        category: item.conseil.category,
        difficulty: item.conseil.difficulty,
        duration: item.conseil.duration,
        description: item.conseil.description,
        icon: item.conseil.icon,
        color: item.conseil.color,
        urgency: item.conseil.urgency,
        views: convertBigInt(item.conseil.views).toLocaleString('fr-FR'),
        saves: convertBigInt(item.conseil.saves).toLocaleString('fr-FR'),
        expert: item.conseil.expert,
        location: item.conseil.location,
        savedAt: item.createdAt,
        author: item.conseil.author ? {
          name: `${item.conseil.author.firstName} ${item.conseil.author.lastName}`,
          avatar: item.conseil.author.avatar
        } : null
      }));

    res.json({
      success: true,
      data: conseils,
      count: conseils.length
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseils sauvegardés:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des conseils sauvegardés",
      data: []
    });
  }
});

/**
 * @route GET /api/conseils/user/bookmarked
 * @description Récupérer les conseils bookmarkés par l'utilisateur
 * @access Private
 */
router.get("/user/bookmarked", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarkedConseils = await prisma.conseilBookmark.findMany({
      where: { userId },
      include: {
        conseil: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    const conseils = bookmarkedConseils
      .filter(item => item.conseil && item.conseil.isActive)
      .map(item => ({
        id: item.conseil.id,
        title: item.conseil.title,
        category: item.conseil.category,
        difficulty: item.conseil.difficulty,
        duration: item.conseil.duration,
        description: item.conseil.description,
        icon: item.conseil.icon,
        color: item.conseil.color,
        urgency: item.conseil.urgency,
        views: convertBigInt(item.conseil.views).toLocaleString('fr-FR'),
        saves: convertBigInt(item.conseil.saves).toLocaleString('fr-FR'),
        expert: item.conseil.expert,
        location: item.conseil.location,
        bookmarkedAt: item.createdAt,
        author: item.conseil.author ? {
          name: `${item.conseil.author.firstName} ${item.conseil.author.lastName}`,
          avatar: item.conseil.author.avatar
        } : null
      }));

    res.json({
      success: true,
      data: conseils,
      count: conseils.length
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseils bookmarkés:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des conseils bookmarkés",
      data: []
    });
  }
});

/**
 * @route GET /api/conseils/user/stats
 * @description Récupérer les statistiques de l'utilisateur
 * @access Private
 */
router.get("/user/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [savedCount, bookmarkedCount, viewedCount] = await Promise.all([
      prisma.conseilSave.count({ where: { userId } }),
      prisma.conseilBookmark.count({ where: { userId } }),
      prisma.conseilView.count({ where: { userId } })
    ]);

    // Catégories préférées
    const favoriteCategories = await prisma.$queryRaw`
      SELECT c.category as name, COUNT(*) as count
      FROM "ConseilSave" cs
      JOIN "Conseil" c ON cs."conseilId" = c.id
      WHERE cs."userId" = ${userId}
      GROUP BY c.category
      ORDER BY count DESC
      LIMIT 3
    `;

    res.json({
      success: true,
      data: {
        savedCount,
        bookmarkedCount,
        viewedCount,
        favoriteCategories: favoriteCategories || []
      }
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats utilisateur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      data: {
        savedCount: 0,
        bookmarkedCount: 0,
        viewedCount: 0,
        favoriteCategories: []
      }
    });
  }
});

// ==============================================
// ROUTES ADMIN
// ==============================================

/**
 * @route GET /api/conseils/admin/all
 * @description Récupérer tous les conseils (admin)
 * @access Private (Admin seulement)
 */
router.get("/admin/all", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const {
      category,
      status,
      search,
      limit = 50,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire les filtres
    const where = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (status && status !== "all") {
      if (status === "active") {
        where.isActive = true;
      } else if (status === "inactive") {
        where.isActive = false;
      } else if (status === "featured") {
        where.isFeatured = true;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { expert: { contains: search, mode: "insensitive" } }
      ];
    }

    // Récupérer les conseils
    const [conseils, total] = await Promise.all([
      prisma.conseil.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              conseilSaves: true,
              conseilViews: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.conseil.count({ where })
    ]);

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    // Formater la réponse
    const formattedConseils = conseils.map(conseil => ({
      id: conseil.id,
      title: conseil.title,
      category: conseil.category,
      difficulty: conseil.difficulty,
      duration: conseil.duration,
      description: conseil.description,
      content: conseil.content,
      icon: conseil.icon,
      color: conseil.color,
      urgency: conseil.urgency,
      views: convertBigInt(conseil.views),
      saves: convertBigInt(conseil.saves),
      expert: conseil.expert,
      location: conseil.location,
      isFeatured: conseil.isFeatured,
      isActive: conseil.isActive,
      sortOrder: conseil.sortOrder,
      author: conseil.author ? {
        id: conseil.author.id,
        name: `${conseil.author.firstName} ${conseil.author.lastName}`,
        email: conseil.author.email
      } : null,
      stats: {
        saves: conseil._count.conseilSaves,
        views: conseil._count.conseilViews
      },
      createdAt: conseil.createdAt,
      updatedAt: conseil.updatedAt
    }));

    res.json({
      success: true,
      data: formattedConseils,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("❌ Erreur récupération conseils admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des conseils",
      data: []
    });
  }
});

/**
 * @route POST /api/conseils/admin/create
 * @description Créer un nouveau conseil
 * @access Private (Admin seulement)
 */
router.post("/admin/create", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const {
      title,
      category,
      difficulty,
      duration,
      description,
      content,
      icon,
      color,
      urgency,
      expert,
      location,
      isFeatured = false,
      isActive = true,
      sortOrder = 0
    } = req.body;

    // Validation
    if (!title || !category || !description || !content) {
      return res.status(400).json({
        success: false,
        error: "Les champs titre, catégorie, description et contenu sont requis"
      });
    }

    // Créer le conseil
    const conseil = await prisma.conseil.create({
      data: {
        title,
        category,
        difficulty: difficulty || "Débutant",
        duration: duration || "5 min",
        description,
        content: Array.isArray(content) ? content : [content],
        icon: icon || "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
        color: color || "emerald",
        urgency: urgency || "Important",
        expert: expert || "Expert local",
        location: location || "Tous les cirques",
        isFeatured,
        isActive,
        sortOrder,
        authorId: req.user.id,
        views: 0,
        saves: 0
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Conseil créé avec succès",
      data: conseil
    });

  } catch (error) {
    console.error("❌ Erreur création conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création du conseil",
      details: error.message
    });
  }
});

/**
 * @route PUT /api/conseils/admin/update/:id
 * @description Mettre à jour un conseil
 * @access Private (Admin seulement)
 */
router.put("/admin/update/:id", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si le conseil existe
    const existingConseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingConseil) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    // Convertir content en array si nécessaire
    if (updateData.content && !Array.isArray(updateData.content)) {
      updateData.content = [updateData.content];
    }

    // Mettre à jour le conseil
    const updatedConseil = await prisma.conseil.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: "Conseil mis à jour avec succès",
      data: updatedConseil
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du conseil",
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/conseils/admin/delete/:id
 * @description Supprimer un conseil
 * @access Private (Admin seulement)
 */
router.delete("/admin/delete/:id", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const { id } = req.params;

    // Vérifier si le conseil existe
    const existingConseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingConseil) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    // Supprimer les relations d'abord
    await Promise.all([
      prisma.conseilSave.deleteMany({
        where: { conseilId: parseInt(id) }
      }),
      prisma.conseilBookmark.deleteMany({
        where: { conseilId: parseInt(id) }
      }),
      prisma.conseilView.deleteMany({
        where: { conseilId: parseInt(id) }
      })
    ]);

    // Supprimer le conseil
    await prisma.conseil.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: "Conseil supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur suppression conseil:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du conseil",
      details: error.message
    });
  }
});

/**
 * @route PUT /api/conseils/admin/toggle-featured/:id
 * @description Basculer le statut "en vedette" d'un conseil
 * @access Private (Admin seulement)
 */
router.put("/admin/toggle-featured/:id", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const { id } = req.params;

    const conseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!conseil) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    const updatedConseil = await prisma.conseil.update({
      where: { id: parseInt(id) },
      data: { isFeatured: !conseil.isFeatured }
    });

    res.json({
      success: true,
      message: `Conseil ${updatedConseil.isFeatured ? 'mis en vedette' : 'retiré des vedettes'}`,
      data: { isFeatured: updatedConseil.isFeatured }
    });

  } catch (error) {
    console.error("❌ Erreur toggle featured:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification du statut"
    });
  }
});

/**
 * @route PUT /api/conseils/admin/toggle-active/:id
 * @description Basculer le statut actif d'un conseil
 * @access Private (Admin seulement)
 */
router.put("/admin/toggle-active/:id", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const { id } = req.params;

    const conseil = await prisma.conseil.findUnique({
      where: { id: parseInt(id) }
    });

    if (!conseil) {
      return res.status(404).json({
        success: false,
        error: "Conseil non trouvé"
      });
    }

    const updatedConseil = await prisma.conseil.update({
      where: { id: parseInt(id) },
      data: { isActive: !conseil.isActive }
    });

    res.json({
      success: true,
      message: `Conseil ${updatedConseil.isActive ? 'activé' : 'désactivé'}`,
      data: { isActive: updatedConseil.isActive }
    });

  } catch (error) {
    console.error("❌ Erreur toggle active:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification du statut"
    });
  }
});

/**
 * @route GET /api/conseils/admin/stats
 * @description Récupérer les statistiques admin
 * @access Private (Admin seulement)
 */
router.get("/admin/stats", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    // Fonction pour convertir BigInt en Number
    const convertBigInt = (value) => {
      return typeof value === 'bigint' ? Number(value) : value;
    };

    // Récupérer toutes les statistiques en parallèle
    const [
      totalConseils,
      activeConseils,
      featuredConseils,
      totalSavesAgg,
      totalViewsAgg,
      recentActivity
    ] = await Promise.all([
      // Total des conseils
      prisma.conseil.count(),
      
      // Conseils actifs
      prisma.conseil.count({ where: { isActive: true } }),
      
      // Conseils en vedette
      prisma.conseil.count({ where: { isFeatured: true, isActive: true } }),
      
      // Total des sauvegardes
      prisma.conseil.aggregate({
        _sum: { saves: true }
      }),
      
      // Total des vues
      prisma.conseil.aggregate({
        _sum: { views: true }
      }),
      
      // Activité récente (derniers 30 jours)
      prisma.conseil.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          title: true,
          category: true,
          views: true,
          saves: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Conseils les plus populaires
    const topConseils = await prisma.conseil.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        category: true,
        views: true,
        saves: true,
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { views: 'desc' },
      take: 5
    });

    // Statistiques par catégorie - utiliser raw query
    const categoryStatsRaw = await prisma.$queryRaw`
      SELECT 
        c.category as name,
        COUNT(*) as total,
        COALESCE(SUM(c.views), 0) as total_views,
        COALESCE(SUM(c.saves), 0) as total_saves,
        COALESCE(AVG(c.views), 0) as avg_views
      FROM "Conseil" c
      WHERE c."isActive" = true
      GROUP BY c.category
      ORDER BY total DESC
    `;

    // Convertir les BigInt dans categoryStats
    const categoryStats = Array.isArray(categoryStatsRaw) ? categoryStatsRaw.map(stat => ({
      name: stat.name,
      total: Number(stat.total),
      total_views: convertBigInt(stat.total_views),
      total_saves: convertBigInt(stat.total_saves),
      avg_views: Number(stat.avg_views)
    })) : [];

    // Statistiques par mois (pour graphique)
    const monthlyStatsRaw = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count,
        COALESCE(SUM(views), 0) as views
      FROM "Conseil"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    // Convertir les BigInt dans monthlyStats
    const monthlyStats = Array.isArray(monthlyStatsRaw) ? monthlyStatsRaw.map(stat => ({
      month: stat.month,
      count: Number(stat.count),
      views: convertBigInt(stat.views)
    })) : [];

    // Convertir les BigInt dans topConseils et recentActivity
    const formattedTopConseils = topConseils.map(conseil => ({
      ...conseil,
      views: convertBigInt(conseil.views),
      saves: convertBigInt(conseil.saves),
      authorName: conseil.author ? 
        `${conseil.author.firstName} ${conseil.author.lastName}` : 
        'Anonyme'
    }));

    const formattedRecentActivity = recentActivity.map(activity => ({
      ...activity,
      views: convertBigInt(activity.views),
      saves: convertBigInt(activity.saves),
      authorName: activity.author ? 
        `${activity.author.firstName} ${activity.author.lastName}` : 
        'Anonyme'
    }));

    res.json({
      success: true,
      data: {
        totals: {
          conseils: totalConseils,
          active: activeConseils,
          featured: featuredConseils,
          saves: convertBigInt(totalSavesAgg._sum.saves) || 0,
          views: convertBigInt(totalViewsAgg._sum.views) || 0
        },
        topConseils: formattedTopConseils,
        categoryStats: categoryStats,
        monthlyStats: monthlyStats,
        recentActivity: formattedRecentActivity
      }
    });

  } catch (error) {
    console.error("❌ Erreur récupération stats admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      data: {
        totals: {
          conseils: 0,
          active: 0,
          featured: 0,
          saves: 0,
          views: 0
        },
        topConseils: [],
        categoryStats: [],
        monthlyStats: [],
        recentActivity: []
      }
    });
  }
});

/**
 * @route POST /api/conseils/admin/categories/create
 * @description Créer une nouvelle catégorie
 * @access Private (Admin seulement)
 */
router.post("/admin/categories/create", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const { name, description, icon, color, sortOrder = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Le nom de la catégorie est requis"
      });
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = await prisma.conseilCategory.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: "Cette catégorie existe déjà"
      });
    }

    const category = await prisma.conseilCategory.create({
      data: {
        name,
        description,
        icon,
        color,
        sortOrder,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Catégorie créée avec succès",
      data: category
    });

  } catch (error) {
    console.error("❌ Erreur création catégorie:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de la catégorie"
    });
  }
});

/**
 * @route GET /api/conseils/admin/categories/all
 * @description Récupérer toutes les catégories (admin)
 * @access Private (Admin seulement)
 */
router.get("/admin/categories/all", authenticateToken, async (req, res) => {
  try {
    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    });

    if (!['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès non autorisé"
      });
    }

    const categories = await prisma.conseilCategory.findMany({
      orderBy: { sortOrder: "asc" }
    });

    // Ajouter le comptage manuellement si besoin
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.conseil.count({
          where: { category: category.name }
        });
        
        return {
          ...category,
          conseilsCount: count
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error("❌ Erreur récupération catégories admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
      data: []
    });
  }
});

module.exports = router;