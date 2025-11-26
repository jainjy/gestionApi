const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware CORS pour cette route spécifique
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// OPTIONS pour les requêtes preflight
router.options('*', (req, res) => {
  res.sendStatus(200);
});

// GET /api/tourisme - Récupérer tous les hébergements avec filtres
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête reçue pour /api/tourisme', req.query);
    
    const {
      destination,
      type,
      minPrice,
      maxPrice,
      minRating,
      guests,
      amenities,
      instantBook,
      featured,
      page = 1,
      limit = 12
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction des filtres
    const where = {
      available: true
    };

    if (destination) {
      where.OR = [
        { city: { contains: destination, mode: 'insensitive' } },
        { title: { contains: destination, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (guests) {
      where.maxGuests = { gte: parseInt(guests) };
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      where.amenities = { hasEvery: amenitiesArray };
    }

    if (instantBook === 'true') {
      where.instantBook = true;
    }

    if (featured === 'true') {
      where.featured = true;
    }

  
    // Récupération des données
    const [listings, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { rating: 'desc' }
      }),
      prisma.tourisme.count({ where })
    ]);

    

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
    console.error('❌ Erreur récupération tourisme:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des hébergements',
      details: error.message
    });
  }
});

// GET /api/tourisme/featured - Hébergements en vedette
router.get('/featured', async (req, res) => {
  try {
    const featuredListings = await prisma.tourisme.findMany({
      where: {
        featured: true,
        available: true
      },
      take: 6,
      orderBy: { rating: 'desc' }
    });

    console.log(`✅ ${featuredListings.length} hébergements featured trouvés`);

    res.json({
      success: true,
      data: featuredListings
    });
  } catch (error) {
    console.error('❌ Erreur récupération featured:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des hébergements en vedette',
      details: error.message
    });
  }
});

// GET /api/tourisme/destinations - Destinations populaires
router.get('/destinations', async (req, res) => {
  try {
    console.log('🌍 Requête reçue pour /api/tourisme/destinations');
    
    const destinations = await prisma.tourisme.groupBy({
      by: ['city'],
      _count: {
        id: true
      },
      _avg: {
        price: true,
        rating: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const formattedDestinations = destinations.map(dest => ({
      city: dest.city,
      count: dest._count.id,
      avgPrice: Math.round(dest._avg.price || 0),
      avgRating: dest._avg.rating || 0
    }));

    console.log(`✅ ${formattedDestinations.length} destinations trouvées`);

    res.json({
      success: true,
      data: formattedDestinations
    });

  } catch (error) {
    console.error('❌ Erreur récupération destinations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des destinations',
      details: error.message
    });
  }
});

// GET /api/tourisme/:id - Récupérer un hébergement spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Requête reçue pour /api/tourisme/${id}`);

    const listing = await prisma.tourisme.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Hébergement non trouvé'
      });
    }

    console.log(`✅ Hébergement ${id} trouvé`);

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('❌ Erreur récupération détail:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'hébergement',
      details: error.message
    });
  }
});

// POST /api/tourisme - Créer un nouvel hébergement
router.post('/', async (req, res) => {
  try {
    console.log('➕ Requête POST reçue pour /api/tourisme');
    
    const {
      idUnique,
      idPrestataire,
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
      cancellationPolicy
    } = req.body;

    // Validation des données requises
    if (!idUnique || !idPrestataire || !title || !type || !price || !city || !images || !maxGuests) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants'
      });
    }

    const newListing = await prisma.tourisme.create({
      data: {
        idUnique,
        idPrestataire,
        title,
        type,
        price: parseFloat(price),
        city,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        images: Array.isArray(images) ? images : [images],
        amenities: Array.isArray(amenities) ? amenities : [],
        maxGuests: parseInt(maxGuests),
        description,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area: area ? parseInt(area) : null,
        instantBook: Boolean(instantBook),
        cancellationPolicy: cancellationPolicy || 'moderate'
      }
    });

    console.log(`✅ Hébergement créé: ${newListing.id}`);

    res.status(201).json({
      success: true,
      data: newListing,
      message: 'Hébergement créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création tourisme:', error);
    
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

// PUT /api/tourisme/:id - Mettre à jour un hébergement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`✏️ Requête PUT reçue pour /api/tourisme/${id}`);

    // Conversion des types si nécessaire
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.maxGuests) updateData.maxGuests = parseInt(updateData.maxGuests);
    if (updateData.bedrooms) updateData.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = parseInt(updateData.bathrooms);
    if (updateData.area) updateData.area = parseInt(updateData.area);

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: updateData
    });

    console.log(`✅ Hébergement ${id} mis à jour`);

    res.json({
      success: true,
      data: updatedListing,
      message: 'Hébergement mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour tourisme:', error);
    
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

// DELETE /api/tourisme/:id - Supprimer un hébergement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Requête DELETE reçue pour /api/tourisme/${id}`);

    await prisma.tourisme.delete({
      where: { id }
    });

    console.log(`✅ Hébergement ${id} supprimé`);

    res.json({
      success: true,
      message: 'Hébergement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression tourisme:', error);
    
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
// Dans routes/tourisme.js - Ajouter ces routes

// GET /api/tourisme/touristic-places - Récupérer uniquement les lieux touristiques
router.get('/touristic-places', async (req, res) => {
  try {
    console.log('🏛️ Requête reçue pour les lieux touristiques');
    
    const {
      category,
      city,
      featured,
      page = 1,
      limit = 12
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      isTouristicPlace: true
    };

    if (category && category !== 'tous') {
      where.category = category;
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      };
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    const [places, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { rating: 'desc' }
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

// GET /api/tourisme/prestataire/:prestataireId/touristic-places - Lieux d'un prestataire
router.get('/prestataire/:prestataireId/touristic-places', async (req, res) => {
  try {
    const { prestataireId } = req.params;
    
    console.log(`👨‍💼 Lieux touristiques du prestataire: ${prestataireId}`);

    const places = await prisma.tourisme.findMany({
      where: {
        idPrestataire: prestataireId,
        isTouristicPlace: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ ${places.length} lieux trouvés pour le prestataire`);

    res.json({
      success: true,
      data: places
    });

  } catch (error) {
    console.error('❌ Erreur récupération lieux prestataire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des lieux du prestataire',
      details: error.message
    });
  }
});

module.exports = router;