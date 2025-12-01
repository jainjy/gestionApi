const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/activities - Liste toutes les activités (public)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      level,
      location,
      minPrice,
      maxPrice,
      guideId,
      featured,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let where = {
      status: 'active'
    };

    // Filtres
    if (category) {
      where.categoryId = category;
    }
    if (level) {
      where.level = level;
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (guideId) {
      where.guideId = guideId;
    }
    if (featured) {
      where.featured = featured === 'true';
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Tri
    const orderBy = {};
    if (sortBy === 'rating') orderBy.rating = sortOrder;
    else if (sortBy === 'price') orderBy.price = sortOrder;
    else if (sortBy === 'title') orderBy.title = sortOrder;
    else orderBy.createdAt = sortOrder;

    // Compter le total
    const total = await prisma.activity.count({ where });

    // Récupérer les activités
    const activities = await prisma.activity.findMany({
      where,
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phone: true
              }
            }
          }
        },
        category: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        availability: {
          where: {
            date: { gte: new Date() },
            status: 'available',
            bookedSlots: { lt: prisma.activityAvailability.fields.slots }
          },
          take: 3,
          orderBy: { date: 'asc' }
        },
        favorites: {
          select: { userId: true }
        },
        statistics: true
      },
      orderBy,
      skip,
      take: parseInt(limit)
    });

    // Formater la réponse
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      icon: activity.icon,
      image: activity.image,
      price: activity.price,
      duration: activity.duration,
      level: activity.level,
      maxParticipants: activity.maxParticipants,
      minParticipants: activity.minParticipants,
      location: activity.location,
      latitude: activity.latitude,
      longitude: activity.longitude,
      meetingPoint: activity.meetingPoint,
      included: activity.included,
      requirements: activity.requirements,
      highlights: activity.highlights,
      featured: activity.featured,
      rating: activity.rating,
      reviewCount: activity.reviewCount,
      viewCount: activity.viewCount,
      guide: activity.guide,
      upcomingAvailability: activity.availability,
      isFavorite: req.user ? activity.favorites.some(f => f.userId === req.user.id) : false,
      favoriteCount: activity.favorites.length,
      stats: {
        participants: `${activity.minParticipants}-${activity.maxParticipants} personnes`,
        duration: activity.duration,
        level: activity.level
      },
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    }));

    res.json({
      success: true,
      data: formattedActivities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activities/categories - Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.activityCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { activities: { where: { status: 'active' } } }
        }
      }
    });

    res.json({
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        count: cat._count.activities
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activities/:id - Récupérer une activité par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Incrémenter le compteur de vues
    await prisma.activity.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phone: true,
                companyName: true
              }
            },
            availability: {
              where: { isActive: true },
              orderBy: { dayOfWeek: 'asc' }
            }
          }
        },
        category: true,
        media: {
          orderBy: { sortOrder: 'asc' }
        },
        faqs: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        availability: {
          where: {
            date: { gte: new Date() },
            status: 'available',
            bookedSlots: { lt: prisma.activityAvailability.fields.slots }
          },
          orderBy: { date: 'asc' },
          take: 10
        },
        favorites: {
          select: { userId: true }
        },
        statistics: true,
        promotions: {
          where: {
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    // Formater les features (basé sur les champs existants)
    const features = [
      ...activity.included,
      ...activity.highlights
    ];

    const formattedActivity = {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      icon: activity.icon,
      image: activity.image,
      price: activity.price,
      duration: activity.duration,
      level: activity.level,
      maxParticipants: activity.maxParticipants,
      minParticipants: activity.minParticipants,
      location: activity.location,
      latitude: activity.latitude,
      longitude: activity.longitude,
      meetingPoint: activity.meetingPoint,
      included: activity.included,
      requirements: activity.requirements,
      highlights: activity.highlights,
      status: activity.status,
      featured: activity.featured,
      rating: activity.rating,
      reviewCount: activity.reviewCount,
      viewCount: activity.viewCount,
      guide: activity.guide,
      media: activity.media,
      faqs: activity.faqs,
      reviews: activity.reviews,
      availability: activity.availability,
      promotions: activity.promotions,
      features: features,
      isFavorite: req.user ? activity.favorites.some(f => f.userId === req.user.id) : false,
      favoriteCount: activity.favorites.length,
      stats: {
        participants: `${activity.minParticipants}-${activity.maxParticipants} personnes`,
        duration: activity.duration,
        level: activity.level
      },
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    };

    res.json({ success: true, data: formattedActivity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/activities - Créer une nouvelle activité (professional seulement)
router.post('/', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      icon,
      image,
      price,
      duration,
      level,
      maxParticipants,
      minParticipants,
      location,
      latitude,
      longitude,
      meetingPoint,
      included,
      requirements,
      highlights,
      featured,
      status
    } = req.body;

    // Vérifier si l'utilisateur est un guide
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id }
    });

    if (!guide) {
      // Créer automatiquement un profil guide si inexistant
      const newGuide = await prisma.activityGuide.create({
        data: {
          userId: req.user.id,
          bio: `Guide spécialisé en ${req.body.categoryId || 'activités'}`
        }
      });
      req.guide = newGuide;
    } else {
      req.guide = guide;
    }

    // Créer l'activité
    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        categoryId,
        icon: icon || '🏔️',
        image,
        price: price ? parseFloat(price) : null,
        duration: duration || '3-8 heures',
        level: level || 'Tous niveaux',
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : 8,
        minParticipants: minParticipants ? parseInt(minParticipants) : 2,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        meetingPoint,
        included: included || [],
        requirements: requirements || [],
        highlights: highlights || [],
        featured: featured || false,
        status: status || 'active',
        guideId: req.guide.id
      },
      include: {
        guide: {
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
        },
        category: true
      }
    });

    // Créer les statistiques pour l'activité
    await prisma.activityStatistics.create({
      data: {
        activityId: activity.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Activité créée avec succès',
      data: activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/activities/:id - Mettre à jour une activité
router.put('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que l'activité appartient au guide
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { guide: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    if (activity.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Mettre à jour l'activité
    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        guide: {
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
        },
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Activité mise à jour avec succès',
      data: updatedActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/activities/:id - Supprimer une activité
router.delete('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'activité appartient au guide
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { guide: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    if (activity.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Supprimer l'activité
    await prisma.activity.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Activité supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/activities/:id/faq - Ajouter une FAQ à une activité
router.post('/:id/faq', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    // Vérifier que l'activité appartient au guide
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { guide: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    if (activity.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Créer la FAQ
    const faq = await prisma.activityFAQ.create({
      data: {
        activityId: id,
        question,
        answer,
        order: 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'FAQ ajoutée avec succès',
      data: faq
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activities/guide/my-activities - Récupérer les activités du guide connecté
router.get('/guide/my-activities', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id },
      include: {
        activities: {
          include: {
            category: true,
            reviews: true,
            bookings: {
              where: { status: { not: 'cancelled' } },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            statistics: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide non trouvé' });
    }

    res.json({
      success: true,
      data: {
        guide,
        activities: guide.activities,
        stats: {
          totalActivities: guide.activities.length,
          totalBookings: guide.activities.reduce((sum, activity) => sum + activity.bookings.length, 0),
          totalRevenue: guide.activities.reduce((sum, activity) => {
            const activityRevenue = activity.bookings.reduce((bookingSum, booking) => 
              bookingSum + (booking.totalAmount || 0), 0);
            return sum + activityRevenue;
          }, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;