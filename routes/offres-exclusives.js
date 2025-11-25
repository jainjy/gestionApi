// routes/offres-exclusives.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');

// Récupérer toutes les offres exclusives
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    // Récupérer les offres depuis les différentes tables
    const [tourismeOffres, propertyOffres, productOffres] = await Promise.all([
      // Offres Tourisme
      prisma.tourisme.findMany({
        where: {
          available: true,
          ...(category && { type: category })
        },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          city: true,
          rating: true,
          reviewCount: true,
          images: true,
          description: true,
          isTouristicPlace: true,
          category: true,
          provider: 'tourisme'
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),

      // Offres Immobilier
      prisma.property.findMany({
        where: {
          isActive: true,
          ...(category && { type: category })
        },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          city: true,
          images: true,
          description: true,
          surface: true,
          rooms: true,
          listingType: true,
          provider: 'property'
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),

      // Offres Produits
      prisma.product.findMany({
        where: {
          status: 'published',
          ...(category && { category: category })
        },
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          category: true,
          subcategory: true,
          images: true,
          description: true,
          brand: true,
          isOrganic: true,
          provider: 'product'
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Transformer les données pour un format uniforme
    const offres = [
      ...tourismeOffres.map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.2, // Simulation de réduction
        price: item.price,
        discount: Math.round((1 - item.price / (item.price * 1.2)) * 100),
        category: item.isTouristicPlace ? 'Activité' : 'Hébergement',
        type: item.type,
        city: item.city,
        rating: item.rating,
        images: item.images,
        description: item.description,
        provider: 'tourisme',
        features: item.isTouristicPlace ? 
          ['Entrée incluse', 'Guide audio'] : 
          ['WiFi gratuit', 'Petit déjeuner']
      })),

      ...propertyOffres.map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.3,
        price: item.price,
        discount: Math.round((1 - item.price / (item.price * 1.3)) * 100),
        category: item.listingType === 'location' ? 'Location' : 'Vente',
        type: 'Immobilier',
        city: item.city,
        images: item.images,
        description: item.description,
        provider: 'property',
        features: [
          `${item.surface}m²`,
          `${item.rooms} pièces`,
          item.listingType
        ]
      })),

      ...productOffres.map(item => ({
        id: item.id,
        title: item.name,
        originalPrice: item.comparePrice || item.price * 1.4,
        price: item.price,
        discount: item.comparePrice ? 
          Math.round((1 - item.price / item.comparePrice) * 100) : 
          Math.round((1 - item.price / (item.price * 1.4)) * 100),
        category: item.category,
        type: 'Produit',
        brand: item.brand,
        images: item.images,
        description: item.description,
        provider: 'product',
        features: [
          item.brand,
          item.isOrganic ? 'Bio' : null,
          item.subcategory
        ].filter(Boolean)
      }))
    ];

    // Trier par discount (meilleures offres en premier)
    offres.sort((a, b) => b.discount - a.discount);

    res.json({
      success: true,
      data: offres.slice(0, parseInt(limit)),
      total: offres.length,
      page: parseInt(page)
    });

  } catch (error) {
    console.error('Erreur récupération offres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des offres'
    });
  }
});

// Récupérer les offres flash (meilleures réductions)
router.get('/flash', async (req, res) => {
  try {
    const offresFlash = await Promise.all([
      // Tourisme avec meilleures réductions
      prisma.tourisme.findMany({
        where: {
          available: true,
          price: { lt: 100 } // Prix bas pour simuler les soldes
        },
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          images: true,
          type: true
        },
        take: 4,
        orderBy: { price: 'asc' }
      }),

      // Produits avec comparePrice (soldes)
      prisma.product.findMany({
        where: {
          status: 'published',
          comparePrice: { not: null }
        },
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          category: true,
          images: true
        },
        take: 4,
        orderBy: { createdAt: 'desc' }
      }),

      // Propriétés avec réductions
      prisma.property.findMany({
        where: {
          isActive: true,
          price: { lt: 100000 } // Prix bas pour soldes
        },
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          images: true,
          listingType: true
        },
        take: 4,
        orderBy: { price: 'asc' }
      })
    ]);

    const flashOffres = [
      ...offresFlash[0].map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.5,
        price: item.price,
        discount: 50, // Simulation flash
        category: 'Voyage',
        type: item.type,
        images: item.images,
        timeLeft: '02:15:30',
        features: ['Dernière minute', 'Annulation gratuite']
      })),

      ...offresFlash[1].map(item => ({
        id: item.id,
        title: item.name,
        originalPrice: item.comparePrice,
        price: item.price,
        discount: Math.round((1 - item.price / item.comparePrice) * 100),
        category: item.category,
        type: 'Produit',
        images: item.images,
        timeLeft: '01:45:20',
        features: ['Livraison offerte', 'Garantie']
      })),

      ...offresFlash[2].map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.3,
        price: item.price,
        discount: 30,
        category: 'Immobilier',
        type: item.listingType,
        images: item.images,
        timeLeft: '04:30:15',
        features: ['Visite immédiate', 'Financement']
      }))
    ];

    res.json({
      success: true,
      data: flashOffres.slice(0, 8) // Limiter à 8 offres flash
    });

  } catch (error) {
    console.error('Erreur récupération offres flash:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des offres flash'
    });
  }
});

// Récupérer les statistiques des offres
router.get('/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      // Nombre total d'offres
      prisma.tourisme.count({ where: { available: true } }),
      prisma.property.count({ where: { isActive: true } }),
      prisma.product.count({ where: { status: 'published' } }),

      // Réduction moyenne
      prisma.product.aggregate({
        where: { comparePrice: { not: null } },
        _avg: {
          price: true,
          comparePrice: true
        }
      })
    ]);

    const totalOffres = stats[0] + stats[1] + stats[2];
    const reductionMoyenne = stats[3]._avg.comparePrice ? 
      Math.round((1 - stats[3]._avg.price / stats[3]._avg.comparePrice) * 100) : 50;

    res.json({
      success: true,
      data: {
        totalOffres,
        reductionMoyenne: `${reductionMoyenne}%`,
        offresFlash: 24,
        membresSatisfaits: 10000
      }
    });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Récupérer les catégories d'offres
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'voyages',
        name: 'Voyages & Billets',
        description: 'Billets d\'avion à prix cassés et séjours exclusifs',
        count: await prisma.tourisme.count({
          where: { 
            available: true,
            type: { in: ['hotel', 'apartment', 'villa'] }
          }
        })
      },
      {
        id: 'shopping',
        name: 'Shopping Soldé',
        description: 'Meubles et produits avec réductions exceptionnelles',
        count: await prisma.product.count({
          where: { 
            status: 'published',
            category: { in: ['furniture', 'home', 'electronics'] }
          }
        })
      },
      {
        id: 'loisirs',
        name: 'Activités & Loisirs',
        description: 'Expériences uniques et activités touristiques',
        count: await prisma.tourisme.count({
          where: { 
            available: true,
            isTouristicPlace: true 
          }
        })
      },
      {
        id: 'immobilier',
        name: 'Immobilier',
        description: 'Appartements et maisons à prix réduits',
        count: await prisma.property.count({
          where: { isActive: true }
        })
      }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

module.exports = router;