const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { parseRequestData, validateCoordinates } = require("../utils/helpers");

// Fonction pour parser les données de découverte
const parseDiscoveryData = (data, userId = null) => {
  const parsedData = parseRequestData(data, "discovery");

  // Valider et parser les coordonnées
  if (parsedData.coordinates) {
    const coords = validateCoordinates(parsedData.coordinates);
    if (coords) {
      parsedData.coordinates = JSON.stringify(coords);
    } else {
      delete parsedData.coordinates;
    }
  }

  // Convertir les nombres
  const numberFields = [
    "price",
    "rating",
    "sustainabilityRating",
    "maxVisitors",
    "visits",
    "revenue",
    "groupSizeMin",
    "groupSizeMax",
    "ageRestrictionMin",
    "ageRestrictionMax",
  ];
  
  numberFields.forEach((field) => {
    if (parsedData[field] !== undefined) {
      const value = parseFloat(parsedData[field]);
      parsedData[field] = isNaN(value) ? 0 : value;
    }
  });

  // Gérer groupSize si fourni comme objet
  if (parsedData.groupSize && typeof parsedData.groupSize === "object") {
    parsedData.groupSizeMin = parsedData.groupSize.min || 1;
    parsedData.groupSizeMax = parsedData.groupSize.max || 10;
    delete parsedData.groupSize;
  }

  // Gérer ageRestriction si fourni comme objet
  if (parsedData.ageRestriction && typeof parsedData.ageRestriction === "object") {
    parsedData.ageRestrictionMin = parsedData.ageRestriction.min;
    parsedData.ageRestrictionMax = parsedData.ageRestriction.max;
    delete parsedData.ageRestriction;
  }

  // Convertir les booléens
  const booleanFields = [
    "guideIncluded",
    "transportIncluded",
    "mealIncluded",
    "parkingAvailable",
    "wifiAvailable",
    "familyFriendly",
    "petFriendly",
    "wheelchairAccessible",
  ];
  
  booleanFields.forEach((field) => {
    if (parsedData[field] !== undefined) {
      parsedData[field] = Boolean(parsedData[field]);
    }
  });

  // Convertir les champs Json
  const jsonFields = [
    "images",
    "tags",
    "highlights",
    "bestSeason",
    "bestTime",
    "equipment",
    "includes",
    "notIncludes",
    "languages",
    "includedServices",
    "requirements",
    "availableDates",
  ];
  
  jsonFields.forEach((field) => {
    if (parsedData[field] !== undefined) {
      if (Array.isArray(parsedData[field])) {
        parsedData[field] = JSON.stringify(parsedData[field]);
      } else if (typeof parsedData[field] === "string") {
        try {
          JSON.parse(parsedData[field]);
        } catch {
          parsedData[field] = JSON.stringify([parsedData[field]]);
        }
      }
    } else {
      // Valeur par défaut pour les champs Json
      parsedData[field] = JSON.stringify([]);
    }
  });

  // Valeurs par défaut
  if (!parsedData.currency) parsedData.currency = "EUR";
  if (!parsedData.status) parsedData.status = "DRAFT";
  if (parsedData.featured === undefined) parsedData.featured = false;
  
  // Assurer que maxVisitors est défini
  if (!parsedData.maxVisitors && parsedData.groupSizeMax) {
    parsedData.maxVisitors = parsedData.groupSizeMax;
  }
  
  // Valeurs par défaut pour groupSize
  if (!parsedData.groupSizeMin) parsedData.groupSizeMin = 1;
  if (!parsedData.groupSizeMax) parsedData.groupSizeMax = 10;

  // Associer à l'utilisateur si fourni
  if (userId) {
    parsedData.userId = userId;
  }

  return parsedData;
};

// Fonction helper pour parser les champs Json
const parseJsonField = (field) => {
  if (!field) return [];
  try {
    if (Array.isArray(field)) return field;
    if (typeof field === "string") {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (typeof field === "object") return Object.values(field);
    return [];
  } catch (error) {
    return [];
  }
};

// Formater la réponse pour le frontend
const formatDiscoveryResponse = (discovery) => {
  if (!discovery) return null;

  // Extraire les informations de l'utilisateur si incluses
  const userInfo = discovery.user
    ? {
        id: discovery.user.id,
        firstName: discovery.user.firstName,
        lastName: discovery.user.lastName,
        email: discovery.user.email,
        avatar: discovery.user.avatar,
        companyName: discovery.user.companyName,
        phone: discovery.user.phone,
      }
    : null;

  // Parser les coordonnées
  let coordinates = { lat: 0, lng: 0 };
  if (discovery.coordinates) {
    try {
      if (typeof discovery.coordinates === "string") {
        coordinates = JSON.parse(discovery.coordinates);
      } else if (typeof discovery.coordinates === "object") {
        coordinates = discovery.coordinates;
      }
    } catch (error) {
      console.error("Erreur parsing coordinates:", error);
    }
  }

  const formatted = {
    ...discovery,
    // Reconstruire groupSize
    groupSize: {
      min: discovery.groupSizeMin || 1,
      max: discovery.groupSizeMax || 10,
    },
    // Reconstruire ageRestriction
    ageRestriction: {
      min: discovery.ageRestrictionMin,
      max: discovery.ageRestrictionMax,
    },
    // Parser tous les champs Json
    tags: parseJsonField(discovery.tags),
    images: parseJsonField(discovery.images),
    highlights: parseJsonField(discovery.highlights),
    bestSeason: parseJsonField(discovery.bestSeason),
    bestTime: parseJsonField(discovery.bestTime),
    equipment: parseJsonField(discovery.equipment),
    includes: parseJsonField(discovery.includes),
    notIncludes: parseJsonField(discovery.notIncludes),
    languages: parseJsonField(discovery.languages),
    includedServices: parseJsonField(discovery.includedServices),
    requirements: parseJsonField(discovery.requirements),
    availableDates: parseJsonField(discovery.availableDates),
    // Coordonnées
    coordinates: coordinates,
    // Ajouter l'ID si manquant
    id: discovery.id,
    // Informations de l'utilisateur
    user: userInfo,
    // Pour la compatibilité
    organizer:
      discovery.organizer ||
      (discovery.user
        ? `${discovery.user.firstName} ${discovery.user.lastName}`
        : ""),
    contactEmail:
      discovery.contactEmail || (discovery.user ? discovery.user.email : ""),
    // Assurer que rating est un nombre
    rating: discovery.rating || 0,
  };

  return formatted;
};

// Récupérer toutes les découvertes avec filtres
exports.getAllDiscoveries = async (req, res, next) => {
  try {
    const {
      status,
      type,
      difficulty,
      featured,
      search,
      priceMin,
      priceMax,
      ratingMin,
      ratingMax,
      userId,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeUser = "true",
    } = req.query;

    const where = {};

    // Filtres de base
    if (status) where.status = status;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (featured !== undefined) where.featured = featured === "true";
    if (userId) where.userId = userId;

    // Filtre par prix
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = parseFloat(priceMin);
      if (priceMax !== undefined) where.price.lte = parseFloat(priceMax);
    }

    // Filtre par note
    if (ratingMin !== undefined || ratingMax !== undefined) {
      where.rating = {};
      if (ratingMin !== undefined) where.rating.gte = parseFloat(ratingMin);
      if (ratingMax !== undefined) where.rating.lte = parseFloat(ratingMax);
    }

    // Recherche texte - Éviter d'utiliser `has` sur les champs Json
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { organizer: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Options de tri
    const orderBy = {};
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "price",
      "title",
      "visits",
      "revenue",
    ];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Configuration de l'inclusion utilisateur
    const include =
      includeUser === "true"
        ? {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                companyName: true,
              },
            },
          }
        : {};

    // Exécuter les requêtes
    const [discoveries, total] = await Promise.all([
      prisma.discovery.findMany({
        where,
        include,
        skip,
        take,
        orderBy,
      }),
      prisma.discovery.count({ where }),
    ]);

    // Formater les découvertes
    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    res.json({
      success: true,
      data: formattedDiscoveries,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Erreur getAllDiscoveries:", error);
    next(error);
  }
};

// Récupérer les découvertes de l'utilisateur connecté
exports.getMyDiscoveries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      type,
      difficulty,
      featured,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const where = { userId };

    // Filtres
    if (status) where.status = status;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (featured !== undefined) where.featured = featured === "true";

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Options de tri
    const orderBy = {};
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "price",
      "title",
      "visits",
      "revenue",
    ];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [discoveries, total] = await Promise.all([
      prisma.discovery.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        skip,
        take,
        orderBy,
      }),
      prisma.discovery.count({ where }),
    ]);

    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    res.json({
      success: true,
      data: formattedDiscoveries,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Erreur getMyDiscoveries:", error);
    next(error);
  }
};

// Récupérer une découverte par ID
exports.getDiscoveryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            companyName: true,
            phone: true,
          },
        },
      },
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    // Incrémenter le compteur de visites
    await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { visits: { increment: 1 } },
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
    });
  } catch (error) {
    console.error("Erreur getDiscoveryById:", error);
    next(error);
  }
};

// Créer une découverte
exports.createDiscovery = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const discoveryData = parseDiscoveryData(req.body, userId);

    // Vérifier si une découverte similaire existe
    const existingDiscovery = await prisma.discovery.findFirst({
      where: {
        title: discoveryData.title,
        type: discoveryData.type,
        location: discoveryData.location,
        userId: userId,
      },
    });

    if (existingDiscovery) {
      return res.status(409).json({
        success: false,
        message: "Une découverte similaire existe déjà",
      });
    }

    const discovery = await prisma.discovery.create({
      data: discoveryData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.status(201).json({
      success: true,
      data: formattedDiscovery,
      message: "Découverte créée avec succès",
    });
  } catch (error) {
    console.error("Erreur création découverte:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Erreur de contrainte unique",
      });
    }

    next(error);
  }
};

// Middleware pour vérifier la propriété
exports.checkDiscoveryOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    // Autoriser le professional ou le propriétaire
    if (discovery.userId !== userId && userRole !== "professional") {
      return res.status(403).json({
        success: false,
        message: "Non autorisé à modifier cette découverte",
      });
    }

    req.discovery = discovery;
    next();
  } catch (error) {
    console.error("Erreur checkDiscoveryOwnership:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

// Mettre à jour une découverte
exports.updateDiscovery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const discoveryData = parseDiscoveryData(req.body, userId);

    // Supprimer les champs qui ne doivent pas être mis à jour
    delete discoveryData.visits;
    delete discoveryData.revenue;
    delete discoveryData.createdAt;

    // Mettre à jour la découverte
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: discoveryData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: "Découverte mise à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur mise à jour découverte:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    next(error);
  }
};

// Supprimer une découverte
exports.deleteDiscovery = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Supprimer la découverte
    await prisma.discovery.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Découverte supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression découverte:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    next(error);
  }
};

// Mettre à jour le statut "featured"
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    // Mettre à jour le statut featured
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { featured: !!featured },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: featured
        ? "Découverte mise en avant avec succès"
        : "Découverte retirée des favoris avec succès",
    });
  } catch (error) {
    console.error("Erreur toggleFeatured:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    next(error);
  }
};

// Mettre à jour le statut d'une découverte
exports.updateDiscoveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED", "ACTIVE"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Statut invalide. Valeurs autorisées: DRAFT, PUBLISHED, ARCHIVED, ACTIVE",
      });
    }

    // Mettre à jour le statut
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: `Statut de la découverte mis à jour: ${status}`,
    });
  } catch (error) {
    console.error("Erreur updateDiscoveryStatus:", error);
    next(error);
  }
};

// Mettre à jour la note d'une découverte
exports.updateDiscoveryRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    // Valider la note
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "La note doit être entre 0 et 5",
      });
    }

    // Calculer la nouvelle note moyenne
    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) },
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: "Découverte non trouvée",
      });
    }

    const newRating =
      discovery.rating === 0 ? rating : (discovery.rating + rating) / 2;

    // Mettre à jour la note
    const updatedDiscovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: {
        rating: parseFloat(newRating.toFixed(1)),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: formatDiscoveryResponse(updatedDiscovery),
      message: "Note mise à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur updateDiscoveryRating:", error);
    next(error);
  }
};

// Obtenir les statistiques
exports.getDiscoveryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Clause WHERE
    const where = userRole === "professional" ? {} : { userId };

    // 1. Statistiques de base
    const totals = {
      total: await prisma.discovery.count({ where }),
      published: await prisma.discovery.count({
        where: { ...where, status: "PUBLISHED" },
      }),
      active: await prisma.discovery.count({
        where: { ...where, status: "ACTIVE" },
      }),
      draft: await prisma.discovery.count({
        where: { ...where, status: "DRAFT" },
      }),
      archived: await prisma.discovery.count({
        where: { ...where, status: "ARCHIVED" },
      }),
      featured: await prisma.discovery.count({
        where: { ...where, featured: true },
      }),
    };

    // 2. Agrégations financières
    const financialAgg = await prisma.discovery.aggregate({
      where: {
        ...where,
        status: { in: ["PUBLISHED", "ACTIVE"] },
      },
      _sum: {
        revenue: true,
      },
      _avg: {
        price: true,
        rating: true,
      },
    });

    // 3. Agrégations visites
    const visitsAgg = await prisma.discovery.aggregate({
      where,
      _sum: {
        visits: true,
      },
    });

    // 4. Récupérer les découvertes pour calculer les répartitions
    const discoveries = await prisma.discovery.findMany({
      where,
      select: {
        type: true,
        difficulty: true,
        status: true,
        rating: true,
        visits: true,
        revenue: true,
      },
    });

    // 5. Calculer les répartitions manuellement
    const breakdown = {
      byType: {},
      byDifficulty: {},
      byStatus: {},
    };

    discoveries.forEach((discovery) => {
      // Par type
      const type = discovery.type || "Non spécifié";
      if (!breakdown.byType[type]) {
        breakdown.byType[type] = {
          count: 0,
          visits: 0,
          revenue: 0,
          totalRating: 0,
          countWithRating: 0,
        };
      }
      breakdown.byType[type].count++;
      breakdown.byType[type].visits += discovery.visits || 0;
      breakdown.byType[type].revenue += discovery.revenue || 0;
      if (discovery.rating > 0) {
        breakdown.byType[type].totalRating += discovery.rating;
        breakdown.byType[type].countWithRating++;
      }

      // Par difficulté
      const difficulty = discovery.difficulty || "Non spécifié";
      if (!breakdown.byDifficulty[difficulty]) {
        breakdown.byDifficulty[difficulty] = {
          count: 0,
          totalRating: 0,
          countWithRating: 0,
        };
      }
      breakdown.byDifficulty[difficulty].count++;
      if (discovery.rating > 0) {
        breakdown.byDifficulty[difficulty].totalRating += discovery.rating;
        breakdown.byDifficulty[difficulty].countWithRating++;
      }

      // Par statut
      const status = discovery.status || "Non spécifié";
      if (!breakdown.byStatus[status]) {
        breakdown.byStatus[status] = 0;
      }
      breakdown.byStatus[status]++;
    });

    // 6. Calculer les moyennes
    Object.keys(breakdown.byType).forEach((type) => {
      const data = breakdown.byType[type];
      data.averageRating =
        data.countWithRating > 0
          ? parseFloat((data.totalRating / data.countWithRating).toFixed(1))
          : 0;
      delete data.totalRating;
      delete data.countWithRating;
    });

    Object.keys(breakdown.byDifficulty).forEach((difficulty) => {
      const data = breakdown.byDifficulty[difficulty];
      data.averageRating =
        data.countWithRating > 0
          ? parseFloat((data.totalRating / data.countWithRating).toFixed(1))
          : 0;
      delete data.totalRating;
      delete data.countWithRating;
    });

    // 7. Découvertes en vedette
    const featuredDiscoveries = await prisma.discovery.findMany({
      where: {
        ...where,
        featured: true,
        status: { in: ["PUBLISHED", "ACTIVE"] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      take: 5,
      orderBy: { rating: "desc" },
    });

    // 8. Formater les résultats
    const stats = {
      totals,
      financials: {
        totalRevenue: financialAgg._sum.revenue || 0,
        averagePrice: parseFloat((financialAgg._avg.price || 0).toFixed(2)),
        averageRating: parseFloat((financialAgg._avg.rating || 0).toFixed(1)),
      },
      visits: {
        total: visitsAgg._sum.visits || 0,
        averagePerDiscovery:
          totals.total > 0
            ? parseFloat((visitsAgg._sum.visits || 0) / totals.total).toFixed(1)
            : 0,
      },
      breakdown,
      featuredDiscoveries: featuredDiscoveries.map(formatDiscoveryResponse),
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur getDiscoveryStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques",
      error: error.message,
    });
  }
};

// Rechercher des découvertes par tags (attention: limitation avec Json)
exports.searchByTags = async (req, res, next) => {
  try {
    const { tags, userId } = req.query;

    if (!tags) {
      return res.status(400).json({
        success: false,
        message: "Tags requis pour la recherche",
      });
    }

    const tagArray = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim());

    const where = {
      status: { in: ["PUBLISHED", "ACTIVE"] },
    };

    // Filtrer par utilisateur si fourni
    if (userId) {
      where.userId = userId;
    }

    const discoveries = await prisma.discovery.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });

    // Filtrer manuellement par tags (limitation de Prisma avec Json)
    const filteredDiscoveries = discoveries.filter((discovery) => {
      const discoveryTags = parseJsonField(discovery.tags);
      return tagArray.some((tag) =>
        discoveryTags.some(
          (discoveryTag) =>
            discoveryTag.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(discoveryTag.toLowerCase())
        )
      );
    });

    const formattedDiscoveries = filteredDiscoveries.map(formatDiscoveryResponse);

    res.json({
      success: true,
      data: formattedDiscoveries,
      count: formattedDiscoveries.length,
      tags: tagArray,
    });
  } catch (error) {
    console.error("Erreur searchByTags:", error);
    next(error);
  }
};

// Recherche avancée de découvertes
exports.searchDiscoveries = async (req, res, next) => {
  try {
    const {
      query,
      types = [],
      difficulties = [],
      amenities = {},
      priceRange = {},
      ratingRange = {},
      status = [],
      featured,
      userId,
      limit = 20,
      offset = 0,
      includeUser = true,
    } = req.body;

    const where = {};

    // Filtrer par utilisateur si fourni
    if (userId) {
      where.userId = userId;
    }

    // Recherche texte
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { organizer: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filtres
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (difficulties && difficulties.length > 0) {
      where.difficulty = { in: difficulties };
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    // Filtres d'aménités
    const amenityFields = [
      "guideIncluded",
      "transportIncluded",
      "mealIncluded",
      "parkingAvailable",
      "wifiAvailable",
      "familyFriendly",
      "petFriendly",
      "wheelchairAccessible",
    ];

    amenityFields.forEach((amenity) => {
      if (amenities[amenity] !== undefined) {
        where[amenity] = amenities[amenity];
      }
    });

    // Filtre par prix
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      where.price = {};
      if (priceRange.min !== undefined)
        where.price.gte = parseFloat(priceRange.min);
      if (priceRange.max !== undefined)
        where.price.lte = parseFloat(priceRange.max);
    }

    // Filtre par note
    if (ratingRange.min !== undefined || ratingRange.max !== undefined) {
      where.rating = {};
      if (ratingRange.min !== undefined)
        where.rating.gte = parseFloat(ratingRange.min);
      if (ratingRange.max !== undefined)
        where.rating.lte = parseFloat(ratingRange.max);
    }

    // Configuration de l'inclusion utilisateur
    const include = includeUser
      ? {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              companyName: true,
            },
          },
        }
      : {};

    const [discoveries, total] = await Promise.all([
      prisma.discovery.findMany({
        where,
        include,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { rating: "desc" },
      }),
      prisma.discovery.count({ where }),
    ]);

    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    res.json({
      success: true,
      data: formattedDiscoveries,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Erreur searchDiscoveries:", error);
    next(error);
  }
};

// Exporter les découvertes
exports.exportDiscoveries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { format = "json", filters = {} } = req.query;

    const where = {};

    // Si pas professional, exporter seulement les découvertes de l'utilisateur
    if (userRole !== "professional") {
      where.userId = userId;
    }

    // Appliquer les filtres
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.difficulty) where.difficulty = filters.difficulty;

    const discoveries = await prisma.discovery.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    if (format === "csv") {
      const { Parser } = require("json2csv");

      // Définir les champs CSV
      const fields = [
        "id",
        "title",
        "type",
        "location",
        "city",
        "difficulty",
        "duration",
        "price",
        "currency",
        "rating",
        "status",
        "featured",
        "organizer",
        "contactEmail",
        "contactPhone",
        "visits",
        "revenue",
        "maxVisitors",
        "groupSizeMin",
        "groupSizeMax",
        "guideIncluded",
        "transportIncluded",
        "mealIncluded",
        "createdAt",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
        "user.companyName",
      ];

      const opts = { fields };

      try {
        const parser = new Parser(opts);
        const csv = parser.parse(
          formattedDiscoveries.map((discovery) => ({
            ...discovery,
            "user.id": discovery.user?.id || "",
            "user.firstName": discovery.user?.firstName || "",
            "user.lastName": discovery.user?.lastName || "",
            "user.email": discovery.user?.email || "",
            "user.companyName": discovery.user?.companyName || "",
            createdAt: discovery.createdAt
              ? new Date(discovery.createdAt).toISOString()
              : "",
            guideIncluded: discovery.guideIncluded ? "Oui" : "Non",
            transportIncluded: discovery.transportIncluded ? "Oui" : "Non",
            mealIncluded: discovery.mealIncluded ? "Oui" : "Non",
            featured: discovery.featured ? "Oui" : "Non",
            tags: Array.isArray(discovery.tags)
              ? discovery.tags.join("; ")
              : "",
            highlights: Array.isArray(discovery.highlights)
              ? discovery.highlights.join("; ")
              : "",
          }))
        );

        const filename = `discoveries_export_${new Date()
          .toISOString()
          .split("T")[0]}.csv`;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.status(200).send(csv);
      } catch (error) {
        console.error("Erreur génération CSV:", error);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la génération du fichier CSV",
        });
      }
    } else {
      res.json({
        success: true,
        data: formattedDiscoveries,
        count: formattedDiscoveries.length,
        exportedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Erreur exportDiscoveries:", error);
    next(error);
  }
};

// Obtenir les découvertes à proximité
exports.getNearbyDiscoveries = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Coordonnées (lat, lng) requises",
      });
    }

    const discoveries = await prisma.discovery.findMany({
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        coordinates: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      take: 100, // Prendre plus de résultats pour filtrer par distance
    });

    // Fonction pour calculer la distance
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Rayon de la Terre en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Filtrer par distance
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const nearbyDiscoveries = discoveries.filter((discovery) => {
      if (!discovery.coordinates) return false;

      let coordinates;
      try {
        coordinates =
          typeof discovery.coordinates === "string"
            ? JSON.parse(discovery.coordinates)
            : discovery.coordinates;
      } catch {
        return false;
      }

      if (!coordinates.lat || !coordinates.lng) return false;

      const distance = calculateDistance(
        userLat,
        userLng,
        coordinates.lat,
        coordinates.lng
      );
      return distance <= radiusKm;
    });

    // Limiter les résultats
    const limitedDiscoveries = nearbyDiscoveries.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedDiscoveries.map(formatDiscoveryResponse),
      count: limitedDiscoveries.length,
      location: { lat: userLat, lng: userLng },
      radius: radiusKm,
    });
  } catch (error) {
    console.error("Erreur getNearbyDiscoveries:", error);
    next(error);
  }
};

// Obtenir les statistiques d'un utilisateur spécifique
exports.getUserDiscoveryStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [total, published, active, totalRevenue, totalVisits, averageRating] =
      await Promise.all([
        prisma.discovery.count({ where: { userId } }),
        prisma.discovery.count({ where: { userId, status: "PUBLISHED" } }),
        prisma.discovery.count({ where: { userId, status: "ACTIVE" } }),
        prisma.discovery.aggregate({
          _sum: { revenue: true },
          where: { userId, status: { in: ["PUBLISHED", "ACTIVE"] } },
        }),
        prisma.discovery.aggregate({
          _sum: { visits: true },
          where: { userId },
        }),
        prisma.discovery.aggregate({
          _avg: { rating: true },
          where: { userId },
        }),
      ]);

    const stats = {
      total,
      published,
      active,
      totalRevenue: totalRevenue._sum.revenue || 0,
      totalVisits: totalVisits._sum.visits || 0,
      averageRating: parseFloat((averageRating._avg.rating || 0).toFixed(1)),
      revenuePerDiscovery:
        total > 0 ? (totalRevenue._sum.revenue || 0) / total : 0,
      visitsPerDiscovery:
        total > 0 ? (totalVisits._sum.visits || 0) / total : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur getUserDiscoveryStats:", error);
    next(error);
  }
};