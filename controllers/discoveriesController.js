const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseRequestData, validateCoordinates } = require('../utils/helpers');

// Fonction pour parser les données de découverte
const parseDiscoveryData = (data) => {
  const parsedData = parseRequestData(data, 'discovery');
  
  // Valider et parser les coordonnées
  if (parsedData.coordinates) {
    const coords = validateCoordinates(parsedData.coordinates);
    if (coords) {
      parsedData.coordinates = coords;
    } else {
      delete parsedData.coordinates;
    }
  }

  // Convertir les nombres
  const numberFields = [
    'price', 'rating', 'sustainabilityRating', 'maxVisitors',
    'visits', 'revenue', 'groupSizeMin', 'groupSizeMax',
    'ageRestrictionMin', 'ageRestrictionMax'
  ];
  numberFields.forEach(field => {
    if (parsedData[field] !== undefined) {
      parsedData[field] = parseFloat(parsedData[field]) || 0;
    }
  });

  // Gérer groupSize
  if (parsedData.groupSize && typeof parsedData.groupSize === 'object') {
    parsedData.groupSizeMin = parsedData.groupSize.min || 1;
    parsedData.groupSizeMax = parsedData.groupSize.max || 10;
    delete parsedData.groupSize;
  }

  // Gérer ageRestriction
  if (parsedData.ageRestriction && typeof parsedData.ageRestriction === 'object') {
    parsedData.ageRestrictionMin = parsedData.ageRestriction.min;
    parsedData.ageRestrictionMax = parsedData.ageRestriction.max;
    delete parsedData.ageRestriction;
  }

  // Convertir les booléens
  const booleanFields = [
    'guideIncluded', 'transportIncluded', 'mealIncluded',
    'parkingAvailable', 'wifiAvailable', 'familyFriendly',
    'petFriendly', 'wheelchairAccessible'
  ];
  booleanFields.forEach(field => {
    if (parsedData[field] !== undefined) {
      parsedData[field] = Boolean(parsedData[field]);
    }
  });

  // Valeurs par défaut
  if (!parsedData.currency) parsedData.currency = 'EUR';
  if (!parsedData.status) parsedData.status = 'draft';
  if (parsedData.featured === undefined) parsedData.featured = false;
  
  // Assurer que maxVisitors est défini
  if (!parsedData.maxVisitors && parsedData.groupSizeMax) {
    parsedData.maxVisitors = parsedData.groupSizeMax;
  }

  return parsedData;
};

// Formater la réponse pour le frontend
const formatDiscoveryResponse = (discovery) => {
  if (!discovery) return null;

  return {
    ...discovery,
    // Reconstruire groupSize
    groupSize: {
      min: discovery.groupSizeMin || 1,
      max: discovery.groupSizeMax || 10
    },
    // Reconstruire ageRestriction
    ageRestriction: {
      min: discovery.ageRestrictionMin,
      max: discovery.ageRestrictionMax
    },
    // Assurer que les tableaux sont des tableaux
    tags: Array.isArray(discovery.tags) ? discovery.tags : [],
    images: Array.isArray(discovery.images) ? discovery.images : [],
    highlights: Array.isArray(discovery.highlights) ? discovery.highlights : [],
    bestSeason: Array.isArray(discovery.bestSeason) ? discovery.bestSeason : [],
    bestTime: Array.isArray(discovery.bestTime) ? discovery.bestTime : [],
    equipment: Array.isArray(discovery.equipment) ? discovery.equipment : [],
    includes: Array.isArray(discovery.includes) ? discovery.includes : [],
    notIncludes: Array.isArray(discovery.notIncludes) ? discovery.notIncludes : [],
    languages: Array.isArray(discovery.languages) ? discovery.languages : [],
    includedServices: Array.isArray(discovery.includedServices) ? discovery.includedServices : [],
    requirements: Array.isArray(discovery.requirements) ? discovery.requirements : [],
    availableDates: Array.isArray(discovery.availableDates) ? discovery.availableDates : [],
    // S'assurer que coordinates est un objet
    coordinates: discovery.coordinates && typeof discovery.coordinates === 'object' 
      ? discovery.coordinates 
      : { lat: 0, lng: 0 },
    // Ajouter l'ID si manquant
    id: discovery.id || discovery._id
  };
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
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {};

    // Filtres de base
    if (status) where.status = status;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (featured !== undefined) where.featured = featured === 'true';
    
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
    
    // Recherche texte
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Options de tri
    const orderBy = {};
    const validSortFields = ['createdAt', 'rating', 'price', 'title', 'visits', 'revenue'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Exécuter les requêtes
    const [discoveries, total] = await Promise.all([
      prisma.discovery.findMany({
        where,
        skip,
        take,
        orderBy
      }),
      prisma.discovery.count({ where })
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
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Erreur getAllDiscoveries:', error);
    next(error);
  }
};

// Récupérer une découverte par ID
exports.getDiscoveryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }

    // Incrémenter le compteur de visites
    await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { visits: { increment: 1 } }
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery
    });
  } catch (error) {
    console.error('Erreur getDiscoveryById:', error);
    next(error);
  }
};

// Créer une découverte
exports.createDiscovery = async (req, res, next) => {
  try {
    const discoveryData = parseDiscoveryData(req.body);

    // Vérifier si une découverte similaire existe
    const existingDiscovery = await prisma.discovery.findFirst({
      where: {
        title: discoveryData.title,
        type: discoveryData.type,
        location: discoveryData.location
      }
    });

    if (existingDiscovery) {
      return res.status(409).json({
        success: false,
        message: 'Une découverte similaire existe déjà'
      });
    }

    const discovery = await prisma.discovery.create({
      data: discoveryData
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.status(201).json({
      success: true,
      data: formattedDiscovery,
      message: 'Découverte créée avec succès'
    });
  } catch (error) {
    console.error('Erreur création découverte:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de contrainte unique'
      });
    }
    
    next(error);
  }
};

// Mettre à jour une découverte
exports.updateDiscovery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const discoveryData = parseDiscoveryData(req.body);

    // Vérifier si la découverte existe
    const existingDiscovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDiscovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }

    // Mettre à jour la découverte
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: discoveryData
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: 'Découverte mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour découverte:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }
    
    next(error);
  }
};

// Supprimer une découverte
exports.deleteDiscovery = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier si la découverte existe
    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }

    // Supprimer la découverte
    await prisma.discovery.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Découverte supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression découverte:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
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

    // Vérifier si la découverte existe
    const existingDiscovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDiscovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvé'
      });
    }

    // Mettre à jour le statut featured
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { featured: !!featured }
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: featured ? 
        'Découverte mise en avant avec succès' : 
        'Découverte retirée des favoris avec succès'
    });
  } catch (error) {
    console.error('Erreur toggleFeatured:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
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

    const validStatuses = ['draft', 'published', 'archived', 'active'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Vérifier si la découverte existe
    const existingDiscovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDiscovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }

    // Mettre à jour le statut
    const discovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    const formattedDiscovery = formatDiscoveryResponse(discovery);

    res.json({
      success: true,
      data: formattedDiscovery,
      message: `Statut de la découverte mis à jour: ${status}`
    });
  } catch (error) {
    console.error('Erreur updateDiscoveryStatus:', error);
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
        message: 'La note doit être entre 0 et 5'
      });
    }

    // Vérifier si la découverte existe
    const discovery = await prisma.discovery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!discovery) {
      return res.status(404).json({
        success: false,
        message: 'Découverte non trouvée'
      });
    }

    // Calculer la nouvelle note moyenne
    const newRating = discovery.rating === 0 ? 
      rating : 
      (discovery.rating + rating) / 2;

    // Mettre à jour la note
    const updatedDiscovery = await prisma.discovery.update({
      where: { id: parseInt(id) },
      data: { 
        rating: parseFloat(newRating.toFixed(1)),
        // Ici, vous pourriez aussi enregistrer la review dans une table séparée
      }
    });

    res.json({
      success: true,
      data: formatDiscoveryResponse(updatedDiscovery),
      message: 'Note mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateDiscoveryRating:', error);
    next(error);
  }
};

// Obtenir les statistiques des découvertes
exports.getDiscoveryStats = async (req, res, next) => {
  try {
    const [
      total,
      published,
      active,
      draft,
      archived,
      totalRevenue,
      totalVisits,
      averageRating,
      discoveriesByType,
      discoveriesByDifficulty,
      discoveriesByStatus,
      featuredDiscoveries,
      recentDiscoveries,
      topRatedDiscoveries
    ] = await Promise.all([
      // Totaux
      prisma.discovery.count(),
      prisma.discovery.count({ where: { status: 'published' } }),
      prisma.discovery.count({ where: { status: 'active' } }),
      prisma.discovery.count({ where: { status: 'draft' } }),
      prisma.discovery.count({ where: { status: 'archived' } }),
      
      // Agréggats financiers
      prisma.discovery.aggregate({
        _sum: { revenue: true },
        where: { status: { in: ['published', 'active'] } }
      }),
      
      // Visites
      prisma.discovery.aggregate({ _sum: { visits: true } }),
      prisma.discovery.aggregate({ _avg: { rating: true } }),
      
      // Groupements
      prisma.discovery.groupBy({
        by: ['type'],
        _count: true,
        _sum: { visits: true, revenue: true },
        _avg: { rating: true }
      }),
      
      prisma.discovery.groupBy({
        by: ['difficulty'],
        _count: true,
        _avg: { rating: true }
      }),
      
      prisma.discovery.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Découvertes en vedette
      prisma.discovery.findMany({
        where: { featured: true, status: { in: ['published', 'active'] } },
        take: 5,
        orderBy: { rating: 'desc' }
      }),
      
      // Découvertes récentes
      prisma.discovery.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Meilleures notes
      prisma.discovery.findMany({
        where: { rating: { gt: 0 } },
        take: 5,
        orderBy: { rating: 'desc' }
      })
    ]);

    // Formater les statistiques
    const stats = {
      totals: {
        total,
        published,
        active,
        draft,
        archived,
        featured: featuredDiscoveries.length
      },
      financials: {
        totalRevenue: totalRevenue._sum.revenue || 0,
        averageRevenue: total > 0 ? parseFloat((totalRevenue._sum.revenue || 0) / total).toFixed(2) : 0,
        totalVisits: totalVisits._sum.visits || 0
      },
      ratings: {
        averageRating: parseFloat((averageRating._avg.rating || 0).toFixed(1)),
        topRatedCount: topRatedDiscoveries.length
      },
      breakdown: {
        byType: discoveriesByType.reduce((acc, curr) => {
          acc[curr.type] = {
            count: curr._count,
            visits: curr._sum.visits || 0,
            revenue: curr._sum.revenue || 0,
            averageRating: parseFloat((curr._avg.rating || 0).toFixed(1))
          };
          return acc;
        }, {}),
        byDifficulty: discoveriesByDifficulty.reduce((acc, curr) => {
          acc[curr.difficulty] = {
            count: curr._count,
            averageRating: parseFloat((curr._avg.rating || 0).toFixed(1))
          };
          return acc;
        }, {}),
        byStatus: discoveriesByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {})
      },
      featuredDiscoveries: featuredDiscoveries.map(formatDiscoveryResponse),
      recentDiscoveries: recentDiscoveries.map(formatDiscoveryResponse),
      topRatedDiscoveries: topRatedDiscoveries.map(formatDiscoveryResponse)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getDiscoveryStats:', error);
    next(error);
  }
};

// Rechercher des découvertes par tags
exports.searchByTags = async (req, res, next) => {
  try {
    const { tags, operator = 'OR' } = req.query;
    
    if (!tags) {
      return res.status(400).json({
        success: false,
        message: 'Tags requis pour la recherche'
      });
    }

    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    
    const where = {
      tags: {
        [operator === 'AND' ? 'hasEvery' : 'hasSome']: tagArray
      }
    };

    const discoveries = await prisma.discovery.findMany({
      where,
      orderBy: { rating: 'desc' }
    });

    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    res.json({
      success: true,
      data: formattedDiscoveries,
      count: formattedDiscoveries.length,
      tags: tagArray
    });
  } catch (error) {
    console.error('Erreur searchByTags:', error);
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
      limit = 20,
      offset = 0
    } = req.body;

    const where = {};

    // Recherche texte
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { organizer: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
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
    Object.keys(amenities).forEach(amenity => {
      if (amenities[amenity] !== undefined) {
        where[amenity] = amenities[amenity];
      }
    });

    // Filtre par prix
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      where.price = {};
      if (priceRange.min !== undefined) where.price.gte = parseFloat(priceRange.min);
      if (priceRange.max !== undefined) where.price.lte = parseFloat(priceRange.max);
    }

    // Filtre par note
    if (ratingRange.min !== undefined || ratingRange.max !== undefined) {
      where.rating = {};
      if (ratingRange.min !== undefined) where.rating.gte = parseFloat(ratingRange.min);
      if (ratingRange.max !== undefined) where.rating.lte = parseFloat(ratingRange.max);
    }

    const [discoveries, total] = await Promise.all([
      prisma.discovery.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { rating: 'desc' }
      }),
      prisma.discovery.count({ where })
    ]);

    res.json({
      success: true,
      data: discoveries.map(formatDiscoveryResponse),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur searchDiscoveries:', error);
    next(error);
  }
};

// Exporter les découvertes
exports.exportDiscoveries = async (req, res, next) => {
  try {
    const { format = 'json', filters = {} } = req.query;
    
    const where = {};
    
    // Appliquer les filtres
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.difficulty) where.difficulty = filters.difficulty;

    const discoveries = await prisma.discovery.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const formattedDiscoveries = discoveries.map(formatDiscoveryResponse);

    if (format === 'csv') {
      // Implémenter l'export CSV ici
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=discoveries.csv');
      // ... logique CSV
      res.send('CSV export à implémenter');
    } else {
      res.json({
        success: true,
        data: formattedDiscoveries,
        count: formattedDiscoveries.length,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erreur exportDiscoveries:', error);
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
        message: 'Coordonnées (lat, lng) requises'
      });
    }

    // Note: Cette implémentation est basique. Pour une vraie recherche géospatiale,
    // vous devriez utiliser les fonctions géospatiales de PostgreSQL avec PostGIS
    const discoveries = await prisma.discovery.findMany({
      where: {
        status: { in: ['published', 'active'] },
        coordinates: { not: null }
      },
      take: parseInt(limit)
    });

    // Filtrer par distance (implémentation basique)
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const nearbyDiscoveries = discoveries.filter(discovery => {
      if (!discovery.coordinates || typeof discovery.coordinates !== 'object') return false;
      
      const { lat: discLat, lng: discLng } = discovery.coordinates;
      if (!discLat || !discLng) return false;
      
      // Calcul de distance simple (formule de Haversine simplifiée)
      const distance = calculateDistance(userLat, userLng, discLat, discLng);
      return distance <= radiusKm;
    });

    res.json({
      success: true,
      data: nearbyDiscoveries.map(formatDiscoveryResponse),
      count: nearbyDiscoveries.length,
      location: { lat: userLat, lng: userLng },
      radius: radiusKm
    });
  } catch (error) {
    console.error('Erreur getNearbyDiscoveries:', error);
    next(error);
  }
};

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}