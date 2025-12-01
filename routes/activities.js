const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const prisma = new PrismaClient();

// GET toutes les activités avec filtres
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      level,
      minPrice,
      maxPrice,
      location,
      featured,
      guideId,
      limit = 12,
      page = 1
    } = req.query;

    const skip = (page - 1) * limit;
    
    const where = {
      status: 'active'
    };

    // Filtre par catégorie
    if (category && category !== 'all') {
      const categoryRecord = await prisma.activityCategory.findFirst({
        where: { name: category }
      });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // Filtre par recherche
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (level) where.level = level;
    if (guideId) where.guideId = guideId;
    if (featured === 'true') where.featured = true;

    // Filtre par prix
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        guide: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        category: true,
        availability: {
          where: {
            date: { gte: new Date() },
            status: 'available',
            bookedSlots: { lt: prisma.activityAvailability.fields.slots }
          },
          orderBy: { date: 'asc' },
          take: 1
        },
        statistics: true,
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 3
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            bookings: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.activity.count({ where });

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des activités'
    });
  }
});

// GET activité par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

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
                avatar: true,
                phone: true,
                email: true
              }
            }
          }
        },
        category: true,
        availability: {
          where: {
            date: { gte: new Date() },
            status: 'available'
          },
          orderBy: { date: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        media: {
          orderBy: { sortOrder: 'asc' }
        },
        faqs: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        statistics: true,
        _count: {
          select: {
            favorites: true,
            bookings: {
              where: { status: 'completed' }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activité non trouvée'
      });
    }

    // Vérifier si l'utilisateur a mis en favori
    let isFavorite = false;
    if (userId) {
      const favorite = await prisma.activityFavorite.findUnique({
        where: {
          userId_activityId: {
            userId,
            activityId: id
          }
        }
      });
      isFavorite = !!favorite;
    }

    // Incrémenter le compteur de vues
    await prisma.activity.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        ...activity,
        isFavorite
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'activité'
    });
  }
});

// GET catégories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.activityCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            activities: {
              where: { status: 'active' }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories'
    });
  }
});

// POST nouvelle activité (pour les professionnels)
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      icon,
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
      faqs
    } = req.body;

    // 🔥 MODIFICATION : Vérifier que l'utilisateur est un professionnel
    if (req.user.role !== 'professional') {
      return res.status(403).json({
        success: false,
        error: 'Vous devez être un professionnel pour créer des activités'
      });
    }

    // 🔄 NOUVELLE APPROCHE : Création automatique et robuste du profil guide
    let guide;
    try {
      // Essayer de trouver un guide existant
      guide = await prisma.activityGuide.findUnique({
        where: { userId: req.user.id }
      });

      // Si pas de guide, en créer un automatiquement avec des valeurs par défaut
      if (!guide) {
        console.log(`🆕 Création automatique du profil guide pour l'utilisateur: ${req.user.id}`);
        
        guide = await prisma.activityGuide.create({
          data: {
            userId: req.user.id,
            bio: `Professionnel ${req.user.firstName} ${req.user.lastName}`,
            specialties: ['Activités diverses'],
            languages: ['Français'],
            experience: 1,
            certifications: ['Professionnel certifié'],
            isVerified: false, // Non vérifié par défaut
            hourlyRate: null, // Pas de tarif horaire par défaut
            rating: 0,
            reviewCount: 0
          }
        });
        console.log(`✅ Profil guide créé avec ID: ${guide.id}`);
      }
    } catch (guideError) {
      console.error('❌ Erreur lors de la création du guide:', guideError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la configuration du profil guide'
      });
    }

    const mainImage = req.files?.[0]?.path || req.body.image;

    // 🔄 AMÉLIORATION : Validation des données avant création
    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Titre, description et catégorie sont obligatoires'
      });
    }

    // Créer l'activité
    const activity = await prisma.activity.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        icon: icon || null,
        image: mainImage,
        price: price ? parseFloat(price) : null,
        duration: duration || '2 heures',
        level: level || 'Tous niveaux',
        maxParticipants: parseInt(maxParticipants) || 10,
        minParticipants: parseInt(minParticipants) || 1,
        location: location || 'Non spécifié',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        meetingPoint: meetingPoint || 'À définir',
        included: included ? JSON.parse(included) : [],
        requirements: requirements ? JSON.parse(requirements) : [],
        highlights: highlights ? JSON.parse(highlights) : [],
        featured: featured === 'true',
        guideId: guide.id,
        statistics: {
          create: {}
        }
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                phone: true
              }
            }
          }
        },
        category: true
      }
    });

    // Gérer les médias supplémentaires
    if (req.files && req.files.length > 1) {
      const mediaData = req.files.slice(1).map((file, index) => ({
        activityId: activity.id,
        url: file.path,
        type: 'image',
        sortOrder: index,
        isPrimary: false
      }));

      await prisma.activityMedia.createMany({
        data: mediaData
      });
    }

    // Gérer les FAQ
    if (faqs) {
      try {
        const faqData = JSON.parse(faqs).map((faq, index) => ({
          activityId: activity.id,
          question: faq.question,
          answer: faq.answer,
          order: index,
          isActive: true
        }));

        await prisma.activityFAQ.createMany({
          data: faqData
        });
      } catch (faqError) {
        console.warn('⚠️ Erreur lors de la création des FAQ:', faqError);
      }
    }

    // Notifier via WebSocket
    if (req.io) {
      req.io.emit('new-activity', {
        type: 'NEW_ACTIVITY',
        activity,
        message: `Nouvelle activité créée: ${title}`
      });
    }

    console.log(`🎉 Activité créée avec succès: ${activity.id}`);
    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activité créée avec succès'
    });
  } catch (error) {
    console.error('❌ Error creating activity:', error);
    
    // 🔄 AMÉLIORATION : Message d'erreur plus détaillé
    let errorMessage = 'Erreur lors de la création de l\'activité';
    if (error.code === 'P2002') {
      errorMessage = 'Une activité avec ce titre existe déjà';
    } else if (error.code === 'P2003') {
      errorMessage = 'Catégorie ou guide invalide';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT mettre à jour une activité
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Vérifier que l'utilisateur est le propriétaire de l'activité
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { 
        guide: true,
        category: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activité non trouvée'
      });
    }

    // 🔥 MODIFICATION : Autoriser les professionnels propriétaires OU les admins
    if (activity.guide.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à modifier cette activité'
      });
    }

    // Gérer l'upload d'image principale
    if (req.files?.[0]) {
      updateData.image = req.files[0].path;
    }

    // Parser les tableaux JSON
    if (updateData.included) updateData.included = JSON.parse(updateData.included);
    if (updateData.requirements) updateData.requirements = JSON.parse(updateData.requirements);
    if (updateData.highlights) updateData.highlights = JSON.parse(updateData.highlights);

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
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
      data: updatedActivity,
      message: 'Activité mise à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'activité'
    });
  }
});

// 🔄 NOUVELLE ROUTE : Activités d'un guide spécifique
router.get('/guide/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await prisma.activity.findMany({
      where: {
        guide: {
          userId: userId
        },
        status: 'active'
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        category: true,
        statistics: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            bookings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching guide activities:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des activités du guide'
    });
  }
});

module.exports = router;