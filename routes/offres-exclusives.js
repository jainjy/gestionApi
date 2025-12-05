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
          category: true
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
          listingType: true
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
          isOrganic: true
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);

    console.log('📊 Statistiques récupération:');
    console.log('  - Tourisme:', tourismeOffres.length, 'offres');
    console.log('  - Immobilier:', propertyOffres.length, 'offres');
    console.log('  - Produits:', productOffres.length, 'offres');

    // Transformer les données pour un format uniforme
    const offres = [
      ...tourismeOffres.map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.2,
        price: item.price,
        discount: Math.round((1 - item.price / (item.price * 1.2)) * 100),
        category: item.isTouristicPlace ? 'Activité' : 'Hébergement',
        type: 'Voyage',
        city: item.city,
        rating: item.rating,
        images: item.images || [],
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
        category: 'Immobilier',
        type: 'Immobilier', // Type fixe pour le frontend
        city: item.city,
        images: item.images || [],
        description: item.description,
        provider: 'property',
        features: [
          `${item.surface || 'N/A'}m²`,
          `${item.rooms || 'N/A'} pièces`,
          item.listingType || 'Non spécifié'
        ].filter(f => !f.includes('N/A'))
      })),

      ...productOffres.map(item => {
        // CORRECTION : Si la catégorie est "immobilier", le type doit être "Immobilier"
        const catLower = (item.category || '').toLowerCase();
        const type = catLower.includes('immobilier') ? 'Immobilier' : 'Produit';
        const category = catLower.includes('immobilier') ? 'Immobilier' : (item.category || 'shopping');
        
        return {
          id: item.id,
          title: item.name,
          originalPrice: item.comparePrice || item.price * 1.4,
          price: item.price,
          discount: item.comparePrice ? 
            Math.round((1 - item.price / item.comparePrice) * 100) : 
            Math.round((1 - item.price / (item.price * 1.4)) * 100),
          category: category,
          type: type, // Type déterminé dynamiquement
          brand: item.brand,
          images: item.images || [],
          description: item.description,
          provider: 'product',
          features: [
            item.brand,
            item.isOrganic ? 'Bio' : null,
            item.subcategory
          ].filter(Boolean),
          isProduct: type === 'Produit'
        };
      })
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
    console.error('❌ Erreur récupération offres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des offres'
    });
  }
});

// Récupérer les offres flash (meilleures réductions)
router.get('/flash', async (req, res) => {
  try {
    console.log('🔄 Début récupération offres flash...');
    
    const offresFlash = await Promise.all([
      // Tourisme avec meilleures réductions
      prisma.tourisme.findMany({
        where: {
          available: true
        },
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          images: true,
          type: true,
          isTouristicPlace: true
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
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
          images: true,
          brand: true
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),

      // Propriétés avec réductions - VERSION CORRIGÉE
      prisma.property.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          images: true,
          listingType: true,
          surface: true,
          rooms: true
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    console.log('📊 Résultats récupération:');
    console.log('  - Tourisme:', offresFlash[0].length, 'offres');
    console.log('  - Produits:', offresFlash[1].length, 'offres');
    console.log('  - Immobilier:', offresFlash[2].length, 'offres');
    
    // Afficher les détails des propriétés récupérées
    if (offresFlash[2].length > 0) {
      console.log('🏠 Détails des propriétés:');
      offresFlash[2].forEach((prop, i) => {
        console.log(`  ${i+1}. ${prop.title} - ${prop.price}€ - ${prop.city} (${prop.listingType})`);
      });
    } else {
      console.log('⚠️ Aucune propriété trouvée dans la base de données!');
    }

    // AJOUTER DES OFFRES DE TEST SI LA BASE EST VIDE
    let propertiesData = offresFlash[2];
    if (propertiesData.length === 0) {
      console.log('➕ Ajout d\'offres immobilier de test améliorées...');
      propertiesData = [
        {
          id: 'test-immobilier-1-' + Date.now(),
          title: 'Appartement Luxueux Centre-Ville',
          price: 450000,
          city: 'Paris 16ème',
          images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
          listingType: 'vente',
          surface: 85,
          rooms: 3
        },
        {
          id: 'test-immobilier-2-' + Date.now(),
          title: 'Villa avec Piscine et Jardin',
          price: 750000,
          city: 'Nice',
          images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
          listingType: 'vente',
          surface: 150,
          rooms: 5
        },
        {
          id: 'test-immobilier-3-' + Date.now(),
          title: 'Studio Meublé Proche Métro',
          price: 850,
          city: 'Lyon',
          images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'],
          listingType: 'location',
          surface: 30,
          rooms: 1
        }
      ];
    }

    const flashOffres = [
      ...offresFlash[0].map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.5,
        price: item.price,
        discount: 50,
        category: item.isTouristicPlace ? 'Activité' : 'Hébergement',
        type: 'Voyage',
        city: item.city,
        images: item.images || [],
        timeLeft: '02:15:30',
        features: item.isTouristicPlace ? 
          ['Dernière minute', 'Annulation gratuite'] : 
          ['WiFi gratuit', 'Petit déjeuner'],
        isProduct: false
      })),

      ...offresFlash[1].map(item => {
        // CORRECTION : Vérifier si la catégorie contient "immobilier"
        const catLower = (item.category || '').toLowerCase();
        const type = catLower.includes('immobilier') ? 'Immobilier' : 'Produit';
        const category = catLower.includes('immobilier') ? 'Immobilier' : (item.category || 'shopping');
        
        return {
          id: item.id,
          title: item.name,
          originalPrice: item.comparePrice,
          price: item.price,
          discount: Math.round((1 - item.price / item.comparePrice) * 100),
          category: category,
          type: type,
          images: item.images || [],
          timeLeft: '01:45:20',
          features: [
            'Livraison offerte', 
            'Garantie',
            item.brand ? `Marque: ${item.brand}` : null
          ].filter(Boolean),
          brand: item.brand,
          isProduct: type === 'Produit'
        };
      }),

      ...propertiesData.map(item => ({
        id: item.id,
        title: item.title,
        originalPrice: item.price * 1.3,
        price: item.price,
        discount: 30,
        category: 'Immobilier',
        type: 'Immobilier',
        city: item.city,
        images: item.images || [],
        timeLeft: '04:30:15',
        features: [
          'Visite immédiate', 
          'Financement',
          item.listingType === 'location' ? 'Location' : 'Vente',
          item.surface ? `${item.surface}m²` : null,
          item.rooms ? `${item.rooms} pièces` : null
        ].filter(Boolean),
        isProduct: false
      }))
    ];

    console.log('✅ Total offres flash générées:', flashOffres.length);
    console.log('🏠 Offres immobilier dans les données:', 
      flashOffres.filter(o => o.type === 'Immobilier').length
    );

    res.json({
      success: true,
      data: flashOffres.slice(0, 12)
    });

  } catch (error) {
    console.error('❌ Erreur récupération offres flash:', error);
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
        }) || 3
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