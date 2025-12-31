const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseRequestData } = require('../utils/helpers');

// Fonction pour parser les données d'événement
const parseEventData = (data, userId = null) => {
  const parsedData = parseRequestData(data, 'event');
  
  // Convertir les dates
  if (parsedData.date) {
    parsedData.date = new Date(parsedData.date);
  }
  if (parsedData.registrationDeadline) {
    parsedData.registrationDeadline = new Date(parsedData.registrationDeadline);
  }
  if (parsedData.earlyBirdDeadline) {
    parsedData.earlyBirdDeadline = new Date(parsedData.earlyBirdDeadline);
  }

  // Convertir les nombres
  const numberFields = [
    'capacity', 'price', 'discountPrice', 'earlyBirdPrice', 
    'participants', 'revenue'
  ];
  numberFields.forEach(field => {
    if (parsedData[field] !== undefined) {
      parsedData[field] = parseFloat(parsedData[field]) || 0;
    }
  });

  // Assurer que les champs optionnels ont des valeurs par défaut
  if (!parsedData.currency) parsedData.currency = 'EUR';
  if (!parsedData.status) parsedData.status = 'DRAFT';
  if (!parsedData.visibility) parsedData.visibility = 'PUBLIC';
  if (parsedData.featured === undefined) parsedData.featured = false;

  // Gérer le champ time pour compatibilité
  if (parsedData.startTime || parsedData.endTime) {
    parsedData.time = `${parsedData.startTime || ''}${parsedData.endTime ? ` - ${parsedData.endTime}` : ''}`;
  }

  // Associer à l'utilisateur si fourni
  if (userId) {
    parsedData.userId = userId;
  }

  return parsedData;
};

// Formater la réponse pour le frontend
const formatEventResponse = (event) => {
  if (!event) return null;

  // Parser le champ time si nécessaire
  let startTime = event.startTime || '';
  let endTime = event.endTime || '';

  if (event.time && !startTime) {
    const timeParts = event.time.split(' - ');
    startTime = timeParts[0] || '';
    endTime = timeParts[1] || '';
  }

  // Formater les dates
  const formatDate = (date) => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  // Extraire les informations de l'utilisateur si incluses
  const userInfo = event.user ? {
    id: event.user.id,
    firstName: event.user.firstName,
    lastName: event.user.lastName,
    email: event.user.email,
    avatar: event.user.avatar,
    companyName: event.user.companyName
  } : null;

  return {
    ...event,
    startTime,
    endTime,
    // Assurer que les tableaux sont des tableaux
    tags: Array.isArray(event.tags) ? event.tags : [],
    images: Array.isArray(event.images) ? event.images : [],
    highlights: Array.isArray(event.highlights) ? event.highlights : [],
    targetAudience: Array.isArray(event.targetAudience) ? event.targetAudience : [],
    includes: Array.isArray(event.includes) ? event.includes : [],
    notIncludes: Array.isArray(event.notIncludes) ? event.notIncludes : [],
    // Formater les dates
    date: formatDate(event.date),
    registrationDeadline: formatDate(event.registrationDeadline),
    earlyBirdDeadline: formatDate(event.earlyBirdDeadline),
    // Ajouter l'ID si manquant
    id: event.id || event._id,
    // Informations de l'utilisateur
    user: userInfo,
    // Pour la compatibilité
    organizer: event.organizer || (event.user ? `${event.user.firstName} ${event.user.lastName}` : ''),
    contactEmail: event.contactEmail || (event.user ? event.user.email : '')
  };
};

// Récupérer tous les événements avec filtres
exports.getAllEvents = async (req, res, next) => {
  try {
    const { 
      status, 
      category, 
      subCategory,
      featured, 
      search,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      userId, // Nouveau filtre
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'asc',
      includeUser = 'true' // Inclure les infos utilisateur
    } = req.query;

    const where = {};

    // Filtres de base
    if (status) where.status = status;
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (featured !== undefined) where.featured = featured === 'true';
    if (userId) where.userId = userId; // Filtrer par utilisateur
    
    // Filtre par date
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    
    // Filtre par prix
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = parseFloat(priceMin);
      if (priceMax !== undefined) where.price.lte = parseFloat(priceMax);
    }
    
    // Recherche texte
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Options de tri
    const orderBy = {};
    const validSortFields = ['date', 'createdAt', 'price', 'title', 'participants'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.date = 'asc';
    }

    // Configuration de l'inclusion utilisateur
    const include = includeUser === 'true' ? {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          companyName: true
        }
      }
    } : {};

    // Exécuter les requêtes
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include,
        skip,
        take,
        orderBy
      }),
      prisma.event.count({ where })
    ]);

    // Formater les événements
    const formattedEvents = events.map(formatEventResponse);

    res.json({
      success: true,
      data: formattedEvents,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Erreur getAllEvents:', error);
    next(error);
  }
};

// Récupérer les événements de l'utilisateur connecté
exports.getMyEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      status, 
      category,
      featured,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    const where = { userId };

    // Filtres
    if (status) where.status = status;
    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Options de tri
    const orderBy = {};
    const validSortFields = ['date', 'createdAt', 'price', 'title', 'participants'];
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.date = 'asc';
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        },
        skip,
        take,
        orderBy
      }),
      prisma.event.count({ where })
    ]);

    const formattedEvents = events.map(formatEventResponse);

    res.json({
      success: true,
      data: formattedEvents,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Erreur getMyEvents:', error);
    next(error);
  }
};

// Récupérer un événement par ID
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
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
            phone: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    const formattedEvent = formatEventResponse(event);

    res.json({
      success: true,
      data: formattedEvent
    });
  } catch (error) {
    console.error('Erreur getEventById:', error);
    next(error);
  }
};

// Créer un événement
exports.createEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventData = parseEventData(req.body, userId);

    // Vérifier si un événement similaire existe
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        userId: userId
      }
    });

    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: 'Un événement similaire existe déjà'
      });
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const formattedEvent = formatEventResponse(event);

    res.status(201).json({
      success: true,
      data: formattedEvent,
      message: 'Événement créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création événement:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de contrainte unique'
      });
    }
    
    next(error);
  }
};

// Middleware pour vérifier la propriété
exports.checkEventOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Autoriser l'professional ou le propriétaire
    if (event.userId !== userId && userRole !== 'professional') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cet événement'
      });
    }

    req.event = event;
    next();
  } catch (error) {
    console.error('Erreur checkEventOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un événement
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const eventData = parseEventData(req.body, userId);

    // Mettre à jour l'événement
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: eventData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const formattedEvent = formatEventResponse(event);

    res.json({
      success: true,
      data: formattedEvent,
      message: 'Événement mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour événement:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    next(error);
  }
};

// Supprimer un événement
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Supprimer l'événement
    await prisma.event.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
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
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { featured: !!featured },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const formattedEvent = formatEventResponse(event);

    res.json({
      success: true,
      data: formattedEvent,
      message: featured ? 
        'Événement mis en avant avec succès' : 
        'Événement retiré des favoris avec succès'
    });
  } catch (error) {
    console.error('Erreur toggleFeatured:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    next(error);
  }
};

// Mettre à jour le statut d'un événement
exports.updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs autorisées: DRAFT, ACTIVE, UPCOMING, COMPLETED, CANCELLED, ARCHIVED'
      });
    }

    // Mettre à jour le statut
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    const formattedEvent = formatEventResponse(event);

    res.json({
      success: true,
      data: formattedEvent,
      message: `Statut de l'événement mis à jour: ${status}`
    });
  } catch (error) {
    console.error('Erreur updateEventStatus:', error);
    next(error);
  }
};

// Augmenter le nombre de participants
exports.incrementParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { count = 1 } = req.body;

    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        participants: {
          increment: parseInt(count)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: formatEventResponse(event),
      message: `Nombre de participants augmenté de ${count}`
    });
  } catch (error) {
    console.error('Erreur incrementParticipants:', error);
    next(error);
  }
};

exports.getEventStats = async (req, res, next) => {
  try {
    console.log('📊 getEventStats - Début');
    
    // Vérification de l'authentification
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }
    
    const userId = req.user.id; // Déjà un String
    const userRole = req.user.role;
    
    // Construire la clause WHERE
    let where = {};
    
    if (userRole !== 'professional') {
      // Pour les non-professionals, seulement leurs événements
      where = { userId: userId };
    } else {
      // Pour les professionals, tous les événements
      where = {};
    }
    
    console.log('WHERE clause for stats:', JSON.stringify(where));
    
    // 1. Statistiques de base
    const totals = {
      total: await prisma.event.count({ where }),
      active: await prisma.event.count({ where: { ...where, status: 'ACTIVE' } }),
      upcoming: await prisma.event.count({ where: { ...where, status: 'UPCOMING' } }),
      completed: await prisma.event.count({ where: { ...where, status: 'COMPLETED' } }),
      draft: await prisma.event.count({ where: { ...where, status: 'DRAFT' } }),
      archived: await prisma.event.count({ where: { ...where, status: 'ARCHIVED' } }),
      cancelled: await prisma.event.count({ where: { ...where, status: 'CANCELLED' } }),
      featured: await prisma.event.count({ where: { ...where, featured: true } })
    };
    
    // 2. Agrégations financières
    const financialAgg = await prisma.event.aggregate({
      where: { 
        ...where,
        status: { in: ['ACTIVE', 'COMPLETED'] }
      },
      _sum: {
        revenue: true,
        price: true
      },
      _avg: {
        price: true,
        participants: true
      }
    });
    
    // 3. Agrégations participants
    const participantAgg = await prisma.event.aggregate({
      where,
      _sum: {
        participants: true,
        capacity: true
      }
    });
    
    // 4. Statistiques par catégorie
    const eventsByCategory = await prisma.event.groupBy({
      by: ['category'],
      where,
      _count: {
        _all: true
      },
      _sum: {
        participants: true,
        revenue: true
      }
    });
    
    // 5. Statistiques par statut
    const eventsByStatus = await prisma.event.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true
      }
    });
    
    // 6. Formater les résultats
    const stats = {
      totals,
      financials: {
        totalRevenue: financialAgg._sum.revenue || 0,
        averagePrice: financialAgg._avg.price || 0,
        averageParticipants: financialAgg._avg.participants || 0
      },
      participants: {
        total: participantAgg._sum.participants || 0,
        totalCapacity: participantAgg._sum.capacity || 0,
        utilizationRate: participantAgg._sum.capacity > 0 
          ? ((participantAgg._sum.participants || 0) / participantAgg._sum.capacity * 100).toFixed(1)
          : 0
      },
      breakdown: {
        byCategory: eventsByCategory.reduce((acc, item) => {
          acc[item.category || 'Non catégorisé'] = {
            count: item._count._all,
            participants: item._sum.participants || 0,
            revenue: item._sum.revenue || 0
          };
          return acc;
        }, {}),
        byStatus: eventsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count._all;
          return acc;
        }, {})
      }
    };
    
    console.log('📊 getEventStats - Succès');
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur dans getEventStats:', error);
    
    // Envoyer une erreur détaillée
    const errorResponse = {
      success: false,
      error: 'Erreur lors du calcul des statistiques',
      message: error.message
    };
    
    // Ajouter des détails en développement
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        code: error.code,
        meta: error.meta,
        stack: error.stack
      };
    }
    
    res.status(500).json(errorResponse);
  }
};

// Recherche avancée d'événements
exports.searchEvents = async (req, res, next) => {
  try {
    const { 
      query,
      categories = [],
      dateRange = {},
      priceRange = {},
      status = [],
      featured,
      userId, // Nouveau paramètre
      limit = 20,
      offset = 0,
      includeUser = true
    } = req.body;

    const where = {};

    // Filtrer par utilisateur si fourni
    if (userId) {
      where.userId = userId;
    }

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
    if (categories && categories.length > 0) {
      where.OR = categories.map(cat => ({ category: cat }));
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    // Filtre par date
    if (dateRange.start || dateRange.end) {
      where.date = {};
      if (dateRange.start) where.date.gte = new Date(dateRange.start);
      if (dateRange.end) where.date.lte = new Date(dateRange.end);
    }

    // Filtre par prix
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      where.price = {};
      if (priceRange.min !== undefined) where.price.gte = parseFloat(priceRange.min);
      if (priceRange.max !== undefined) where.price.lte = parseFloat(priceRange.max);
    }

    // Configuration de l'inclusion utilisateur
    const include = includeUser ? {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          companyName: true
        }
      }
    } : {};

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { date: 'asc' }
      }),
      prisma.event.count({ where })
    ]);

    const formattedEvents = events.map(formatEventResponse);

    res.json({
      success: true,
      data: formattedEvents,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur searchEvents:', error);
    next(error);
  }
};

// Exporter les événements
exports.exportEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { format = 'json', filters = {} } = req.query;
    
    const where = {};
    
    // Si pas professional, exporter seulement les événements de l'utilisateur
    if (userRole !== 'professional') {
      where.userId = userId;
    }
    
    // Appliquer les filtres
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    const formattedEvents = events.map(formatEventResponse);

    if (format === 'csv') {
      // Implémenter l'export CSV ici
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=events.csv');
      // ... logique CSV
      res.send('CSV export à implémenter');
    } else {
      res.json({
        success: true,
        data: formattedEvents,
        count: formattedEvents.length,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erreur exportEvents:', error);
    next(error);
  }
};

// Obtenir les statistiques d'un utilisateur spécifique
exports.getUserEventStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const [
      total,
      active,
      upcoming,
      completed,
      totalRevenue,
      totalParticipants
    ] = await Promise.all([
      prisma.event.count({ where: { userId } }),
      prisma.event.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.event.count({ where: { userId, status: 'UPCOMING' } }),
      prisma.event.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.event.aggregate({
        _sum: { revenue: true },
        where: { userId, status: { in: ['COMPLETED', 'ACTIVE'] } }
      }),
      prisma.event.aggregate({
        _sum: { participants: true },
        where: { userId }
      })
    ]);

    const stats = {
      total,
      active,
      upcoming,
      completed,
      totalRevenue: totalRevenue._sum.revenue || 0,
      totalParticipants: totalParticipants._sum.participants || 0,
      averageParticipantsPerEvent: total > 0 ? (totalParticipants._sum.participants || 0) / total : 0,
      completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getUserEventStats:', error);
    next(error);
  }
};