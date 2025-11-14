const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

// GET /api/admin/tourisme - Récupérer tous les hébergements
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête admin reçue pour /api/admin/tourisme', req.query);
    
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

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
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

    console.log(`✅ ${listings.length} hébergements trouvés pour l'admin`);

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
      error: 'Erreur lors de la récupération des hébergements',
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
      availableListings,
      featuredListings,
      totalBookings,
      averageRating
    ] = await Promise.all([
      prisma.tourisme.count(),
      prisma.tourisme.count({ where: { available: true } }),
      prisma.tourisme.count({ where: { featured: true } }),
      prisma.tourismeBooking.count(),
      prisma.tourisme.aggregate({
        _avg: {
          rating: true
        }
      })
    ]);

    // Statistiques par type
    const listingsByType = await prisma.tourisme.groupBy({
      by: ['type'],
      _count: {
        id: true
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
      availableListings,
      featuredListings,
      totalBookings,
      averageRating: averageRating._avg.rating || 0,
      listingsByType,
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
 // POST /api/admin/tourisme - Créer un nouvel hébergement
router.post('/', async (req, res) => {
  try {
    console.log('➕ Requête POST admin reçue pour /api/admin/tourisme', req.body);
    
    const {
      title,
      type,
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
      reviewCount = 0
    } = req.body;

    // Validation des données requises
    if (!title || !type || !price || !city || !maxGuests) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants: title, type, price, city, maxGuests'
      });
    }

    // Générer des IDs uniques
    const idUnique = `T${Date.now()}`;
    const idPrestataire = `P${Date.now()}`;

    const newListing = await prisma.tourisme.create({
      data: {
        idUnique,
        idPrestataire,
        title,
        type,
        price: parseFloat(price),
        city,
        lat: lat ? parseFloat(lat) : 0,
        lng: lng ? parseFloat(lng) : 0,
        images: Array.isArray(images) ? images : (images ? [images] : []),
        amenities: Array.isArray(amenities) ? amenities : [],
        maxGuests: parseInt(maxGuests),
        description: description || '',
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseInt(area) : null,
        instantBook: Boolean(instantBook),
        cancellationPolicy: cancellationPolicy || 'moderate',
        featured: Boolean(featured),
        available: Boolean(available),
        rating: parseFloat(rating),
        reviewCount: parseInt(reviewCount)
      },
      include: {
        bookings: true
      }
    });

    console.log(`✅ Hébergement créé par admin: ${newListing.id}`);

    res.status(201).json({
      success: true,
      data: newListing,
      message: 'Hébergement créé avec succès'
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
      error: 'Erreur lors de la création de l\'hébergement',
      details: error.message
    });
  }
});

// PUT /api/admin/tourisme/:id - Mettre à jour un hébergement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`✏️ Requête PUT admin reçue pour /api/admin/tourisme/${id}`, updateData);

    // Vérifier que l'hébergement existe
    const existingListing = await prisma.tourisme.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({
        success: false,
        error: 'Hébergement non trouvé'
      });
    }

    // Filtrer uniquement les champs valides pour la mise à jour
    const validFields = [
      'title', 'type', 'price', 'city', 'lat', 'lng', 'images', 
      'amenities', 'maxGuests', 'description', 'bedrooms', 'bathrooms', 
      'area', 'instantBook', 'cancellationPolicy', 'featured', 
      'available', 'rating', 'reviewCount'
    ];

    const filteredData = {};
    
    for (const field of validFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    // Conversion des types si nécessaire
    if (filteredData.price) filteredData.price = parseFloat(filteredData.price);
    if (filteredData.maxGuests) filteredData.maxGuests = parseInt(filteredData.maxGuests);
    if (filteredData.bedrooms !== undefined) filteredData.bedrooms = filteredData.bedrooms ? parseInt(filteredData.bedrooms) : null;
    if (filteredData.bathrooms !== undefined) filteredData.bathrooms = filteredData.bathrooms ? parseInt(filteredData.bathrooms) : null;
    if (filteredData.area !== undefined) filteredData.area = filteredData.area ? parseInt(filteredData.area) : null;
    if (filteredData.rating) filteredData.rating = parseFloat(filteredData.rating);
    if (filteredData.reviewCount) filteredData.reviewCount = parseInt(filteredData.reviewCount);

    // Gérer les tableaux
    if (filteredData.images && !Array.isArray(filteredData.images)) {
      filteredData.images = [filteredData.images];
    }
    if (filteredData.amenities && !Array.isArray(filteredData.amenities)) {
      filteredData.amenities = [filteredData.amenities];
    }

    // Convertir les booléens
    if (filteredData.instantBook !== undefined) filteredData.instantBook = Boolean(filteredData.instantBook);
    if (filteredData.featured !== undefined) filteredData.featured = Boolean(filteredData.featured);
    if (filteredData.available !== undefined) filteredData.available = Boolean(filteredData.available);

    console.log('📝 Données filtrées pour mise à jour:', filteredData);

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: filteredData,
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
    });

    console.log(`✅ Hébergement ${id} mis à jour par admin`);

    res.json({
      success: true,
      data: updatedListing,
      message: 'Hébergement mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour admin tourisme:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Hébergement non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'hébergement',
      details: error.message
    });
  }
});

 // DELETE /api/admin/tourisme/:id - Supprimer un hébergement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Requête DELETE admin reçue pour /api/admin/tourisme/${id}`);

    // Vérifier que l'hébergement existe
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
        error: 'Hébergement non trouvé'
      });
    }

    // Vérifier s'il y a des réservations actives
    const activeBookings = existingListing.bookings.filter(
      booking => booking.status === 'pending' || booking.status === 'confirmed'
    );

    if (activeBookings.length > 0) {
  return res.status(400).json({
    success: false,
    error: "Impossible de supprimer cet hébergement : une ou plusieurs réservations actives sont associées."
  });
}


    // Supprimer via l'id interne
    await prisma.tourisme.delete({
      where: { id: existingListing.id }
    });

    console.log(`✅ Hébergement ${existingListing.id} supprimé`);

    res.json({
      success: true,
      message: 'Hébergement supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression admin tourisme:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Hébergement non trouvé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'hébergement',
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
        error: 'Hébergement non trouvé'
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
      message: `Hébergement ${updatedListing.available ? 'activé' : 'désactivé'} avec succès`
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
        error: 'Hébergement non trouvé'
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
      message: `Hébergement ${updatedListing.featured ? 'mis en vedette' : 'retiré des vedettes'} avec succès`
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