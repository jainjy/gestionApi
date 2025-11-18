const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");
const { authenticateToken } = require("../middleware/auth");

// Middleware CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

router.options('*', (req, res) => {
  res.sendStatus(200);
});

// GET /api/admin/tourisme - Récupérer tous les hébergements ET lieux touristiques
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête admin reçue pour /api/admin/tourisme', req.query);
    
    const {
      page = 1,
      limit = 12,
      search,
      type,
      category,
      city,
      available,
      featured,
      isTouristicPlace
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction des filtres
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    if (isTouristicPlace !== undefined) {
      where.isTouristicPlace = isTouristicPlace === 'true';
    }

    // Récupération des données
    const [listings, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          bookings: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true
            }
          }
        }
      }),
      prisma.tourisme.count({ where })
    ]);

    console.log(`✅ ${listings.length} éléments trouvés pour l'admin`);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération admin tourisme:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des éléments',
      details: error.message
    });
  }
});

// GET /api/admin/tourisme/accommodations - Récupérer uniquement les hébergements
router.get('/accommodations', async (req, res) => {
  try {
    console.log('🏨 Requête hébergements reçue');
    
    const {
      page = 1,
      limit = 12,
      search,
      type,
      city,
      available,
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      isTouristicPlace: false
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    const [accommodations, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          bookings: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true
            }
          }
        }
      }),
      prisma.tourisme.count({ where })
    ]);

    console.log(`✅ ${accommodations.length} hébergements trouvés`);

    res.json({
      success: true,
      data: accommodations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération hébergements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des hébergements',
      details: error.message
    });
  }
});

// GET /api/admin/tourisme/places - Récupérer uniquement les lieux touristiques
router.get('/places', async (req, res) => {
  try {
    console.log('🏛️ Requête lieux touristiques reçue');
    
    const {
      page = 1,
      limit = 12,
      search,
      category,
      city,
      available,
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      isTouristicPlace: true
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    const [places, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          bookings: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true
            }
          }
        }
      }),
      prisma.tourisme.count({ where })
    ]);

    console.log(`✅ ${places.length} lieux touristiques trouvés`);

    res.json({
      success: true,
      data: places,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération lieux touristiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des lieux touristiques',
      details: error.message
    });
  }
});

// GET /api/admin/tourisme/stats - Statistiques pour le dashboard admin
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Requête stats reçue pour /api/admin/tourisme/stats');

    const [
      totalListings,
      totalAccommodations,
      totalTouristicPlaces,
      availableListings,
      featuredListings,
      totalBookings,
      averageRating
    ] = await Promise.all([
      prisma.tourisme.count(),
      prisma.tourisme.count({ where: { isTouristicPlace: false } }),
      prisma.tourisme.count({ where: { isTouristicPlace: true } }),
      prisma.tourisme.count({ where: { available: true } }),
      prisma.tourisme.count({ where: { featured: true } }),
      prisma.tourismeBooking.count(),
      prisma.tourisme.aggregate({
        _avg: {
          rating: true
        }
      })
    ]);

    // Statistiques par type d'hébergement
    const accommodationsByType = await prisma.tourisme.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        isTouristicPlace: false
      }
    });

    // Statistiques par catégorie de lieu touristique
    const placesByCategory = await prisma.tourisme.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        isTouristicPlace: true
      }
    });

    // Statistiques par ville
    const listingsByCity = await prisma.tourisme.groupBy({
      by: ['city'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const stats = {
      totalListings,
      totalAccommodations,
      totalTouristicPlaces,
      availableListings,
      featuredListings,
      totalBookings,
      averageRating: averageRating._avg.rating || 0,
      accommodationsByType,
      placesByCategory,
      listingsByCity
    };

    console.log('✅ Statistiques calculées avec succès');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

// POST /api/admin/tourisme - Créer un nouvel élément (hébergement ou lieu touristique)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('➕ Requête POST admin reçue pour /api/admin/tourisme', req.body);
    
    const {
      title,
      type,
      category,
      price,
      city,
      lat,
      lng,
      images,
      amenities,
      maxGuests,
      description,
      bedrooms,
      bathrooms,
      area,
      instantBook,
      cancellationPolicy,
      featured,
      available = true,
      rating = 0,
      reviewCount = 0,
      isTouristicPlace = false,
      openingHours,
      entranceFee,
      website,
      contactInfo
    } = req.body;

    if (!title || !city) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants: title, city'
      });
    }

    if (!isTouristicPlace && (!type || !price || !maxGuests)) {
      return res.status(400).json({
        success: false,
        error: 'Pour les hébergements: type, price, maxGuests sont obligatoires'
      });
    }

    if (isTouristicPlace && !category) {
      return res.status(400).json({
        success: false,
        error: 'Pour les lieux touristiques: category est obligatoire'
      });
    }

    const idUnique = isTouristicPlace ? `PL${Date.now()}` : `T${Date.now()}`;
    const idPrestataire = `P${Date.now()}`;

    const newListing = await prisma.tourisme.create({
      data: {
        idUnique,
        idPrestataire,
        title,
        type: isTouristicPlace ? 'touristic_place' : type,
        category: isTouristicPlace ? category : null,
        price: price ? parseFloat(price) : 0,
        city,
        lat: lat ? parseFloat(lat) : 0,
        lng: lng ? parseFloat(lng) : 0,
        images: Array.isArray(images) ? images : (images ? [images] : []),
        amenities: Array.isArray(amenities) ? amenities : [],
        maxGuests: isTouristicPlace ? 1 : parseInt(maxGuests),
        description: description || '',
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseInt(area) : null,
        instantBook: Boolean(instantBook),
        cancellationPolicy: cancellationPolicy || 'moderate',
        featured: Boolean(featured),
        available: Boolean(available),
        rating: parseFloat(rating),
        reviewCount: parseInt(reviewCount),
        isTouristicPlace: Boolean(isTouristicPlace),
        openingHours: openingHours || '',
        entranceFee: entranceFee || '',
        website: website || '',
        contactInfo: contactInfo || ''
      },
      include: {
        bookings: true
      }
    });

    console.log(`✅ ${isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} créé: ${newListing.id}`);

    // 🔔 Création de la notification pour l'utilisateur connecté
    const io = req.app.get("io");
    await createNotification({
      userId: req.user.id,
      type: "success",
      title: isTouristicPlace ? "Nouveau lieu touristique ajouté" : "Nouvel hébergement ajouté",
      message: `${isTouristicPlace ? 'Le lieu touristique' : 'L\'hébergement'} "${title}" a été ajouté avec succès.`,
      relatedEntity: "tourisme",
      relatedEntityId: newListing.id,
      io
    });

    res.status(201).json({
      success: true,
      data: newListing,
      message: `${isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} créé avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur création admin tourisme:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'ID unique déjà utilisé'
      });
    }

    res.status(500).json({
      success: false,
      error: `Erreur lors de la création ${req.body.isTouristicPlace ? 'du lieu touristique' : 'de l\'hébergement'}`,
      details: error.message
    });
  }
});

// PUT /api/admin/tourisme/:id - Mettre à jour un élément
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`✏️ Requête PUT admin reçue pour /api/admin/tourisme/${id}`, updateData);

    const existingListing = await prisma.tourisme.findUnique({ where: { id } });
    if (!existingListing) {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    const validFields = [
      'title', 'type', 'category', 'price', 'city', 'lat', 'lng', 'images', 
      'amenities', 'maxGuests', 'description', 'bedrooms', 'bathrooms', 
      'area', 'instantBook', 'cancellationPolicy', 'featured', 
      'available', 'rating', 'reviewCount', 'isTouristicPlace',
      'openingHours', 'entranceFee', 'website', 'contactInfo'
    ];

    const filteredData = {};
    for (const field of validFields) {
      if (updateData[field] !== undefined) filteredData[field] = updateData[field];
    }

    // Conversion des types
    if (filteredData.price) filteredData.price = parseFloat(filteredData.price);
    if (filteredData.maxGuests) filteredData.maxGuests = parseInt(filteredData.maxGuests);
    if (filteredData.bedrooms !== undefined) filteredData.bedrooms = filteredData.bedrooms ? parseInt(filteredData.bedrooms) : null;
    if (filteredData.bathrooms !== undefined) filteredData.bathrooms = filteredData.bathrooms ? parseInt(filteredData.bathrooms) : null;
    if (filteredData.area !== undefined) filteredData.area = filteredData.area ? parseInt(filteredData.area) : null;
    if (filteredData.rating) filteredData.rating = parseFloat(filteredData.rating);
    if (filteredData.reviewCount) filteredData.reviewCount = parseInt(filteredData.reviewCount);
    if (filteredData.images && !Array.isArray(filteredData.images)) filteredData.images = [filteredData.images];
    if (filteredData.amenities && !Array.isArray(filteredData.amenities)) filteredData.amenities = [filteredData.amenities];
    if (filteredData.instantBook !== undefined) filteredData.instantBook = Boolean(filteredData.instantBook);
    if (filteredData.featured !== undefined) filteredData.featured = Boolean(filteredData.featured);
    if (filteredData.available !== undefined) filteredData.available = Boolean(filteredData.available);
    if (filteredData.isTouristicPlace !== undefined) filteredData.isTouristicPlace = Boolean(filteredData.isTouristicPlace);

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: filteredData,
      include: {
        bookings: {
          select: { id: true, status: true, checkIn: true, checkOut: true }
        }
      }
    });

    console.log(`✅ Élément ${id} mis à jour par admin`);

    // 🔔 Notification mise à jour
    const io = req.app.get("io");
    await createNotification({
      userId: req.user.id,
      type: "info",
      title: `${updatedListing.isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} mis à jour`,
      message: `${updatedListing.isTouristicPlace ? 'Le lieu touristique' : 'L\'hébergement'} "${updatedListing.title}" a été mis à jour avec succès.`,
      relatedEntity: "tourisme",
      relatedEntityId: updatedListing.id,
      io
    });

    res.json({
      success: true,
      data: updatedListing,
      message: `${updatedListing.isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} mis à jour avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour admin tourisme:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour',
      details: error.message
    });
  }
});

// DELETE /api/admin/tourisme/:id - Supprimer un élément
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Requête DELETE admin reçue pour /api/admin/tourisme/${id}`);

    // Vérifier que l'élément existe
    const existingListing = await prisma.tourisme.findFirst({
      where: { 
        OR: [
          { id: id },
          { idUnique: id }
        ]
      },
      include: {
        bookings: true
      }
    });

    if (!existingListing) {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    // Vérifier s'il y a des réservations actives
    const activeBookings = existingListing.bookings.filter(
      booking => booking.status === 'pending' || booking.status === 'confirmed'
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Impossible de supprimer cet élément : une ou plusieurs réservations actives sont associées."
      });
    }

    // Supprimer via l'id interne
    await prisma.tourisme.delete({
      where: { id: existingListing.id }
    });

    console.log(`✅ Élément ${existingListing.id} supprimé`);

    res.json({
      success: true,
      message: `${existingListing.isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} supprimé avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur suppression admin tourisme:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression',
      details: error.message
    });
  }
});

// PATCH /api/admin/tourisme/:id/toggle-availability - Basculer la disponibilité
router.patch('/:id/toggle-availability', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Basculer disponibilité pour /api/admin/tourisme/${id}`);

    const listing = await prisma.tourisme.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: {
        available: !listing.available
      }
    });

    console.log(`✅ Disponibilité basculée pour ${id}: ${updatedListing.available}`);

    res.json({
      success: true,
      data: updatedListing,
      message: `${listing.isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} ${updatedListing.available ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur bascule disponibilité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de disponibilité',
      details: error.message
    });
  }
});

// PATCH /api/admin/tourisme/:id/toggle-featured - Basculer le statut vedette
router.patch('/:id/toggle-featured', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`⭐ Basculer vedette pour /api/admin/tourisme/${id}`);

    const listing = await prisma.tourisme.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Élément non trouvé'
      });
    }

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: {
        featured: !listing.featured
      }
    });

    console.log(`✅ Statut vedette basculé pour ${id}: ${updatedListing.featured}`);

    res.json({
      success: true,
      data: updatedListing,
      message: `${listing.isTouristicPlace ? 'Lieu touristique' : 'Hébergement'} ${updatedListing.featured ? 'mis en vedette' : 'retiré des vedettes'} avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur bascule vedette:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de statut vedette',
      details: error.message
    });
  }
});

module.exports = router;