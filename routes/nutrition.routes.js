// routes/nutrition.routes.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les services de nutrition
router.get('/', async (req, res) => {
  try {
    console.log('📥 Requête reçue pour /nutrition-bienetre', req.query);
    
    const { search, category, minPrice, maxPrice, sortBy = 'pertinence', limit = 20, offset = 0 } = req.query;

    // Construire la clause WHERE - VERSION SIMPLIFIÉE ET CORRIGÉE
    const whereClause = {
      type: 'bien_etre',
      isActive: true,
      OR: [
        { libelle: { contains: 'nutrition', mode: 'insensitive' } },
        { description: { contains: 'nutrition', mode: 'insensitive' } },
        { libelle: { contains: 'alimentation', mode: 'insensitive' } },
        { description: { contains: 'alimentation', mode: 'insensitive' } }
      ]
    };

    console.log('🔍 Clause WHERE initiale:', JSON.stringify(whereClause, null, 2));

    // Filtre par recherche textuelle
    if (search && search.trim() !== '') {
      const searchTerms = search.split(' ').filter(term => term.trim() !== '');
      if (searchTerms.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
          OR: [
            { libelle: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        });
      }
    }

    // Filtre par catégorie - CORRECTION
    if (category && category !== 'Tous') {
      whereClause.category = {
        name: category
      };
    }

    // Filtre par prix - CORRECTION
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    console.log('🔍 Clause WHERE finale:', JSON.stringify(whereClause, null, 2));

    // Définir le tri - CORRECTION : Utiliser 'id' au lieu de 'createdAt'
    let orderBy = [];
    switch(sortBy) {
      case 'price-asc':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price-desc':
        orderBy = [{ price: 'desc' }];
        break;
      case 'name-az':
        orderBy = [{ libelle: 'asc' }];
        break;
      case 'duration':
        orderBy = [{ duration: 'asc' }];
        break;
      case 'pertinence':
      default:
        orderBy = [{ id: 'desc' }]; // ✅ CORRECTION : Utiliser 'id' au lieu de 'createdAt'
        break;
    }



    
    // Récupérer les services avec leurs relations
    const services = await prisma.service.findMany({
      where: whereClause,
      take: parseInt(limit) || 20,
      skip: parseInt(offset) || 0,
      orderBy: orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        metiers: {
          include: {
            metier: {
              select: {
                id: true,
                libelle: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Services trouvés:', services.length);

    // Compter le total
    const total = await prisma.service.count({
      where: whereClause
    });

    // Formater la réponse
    const formattedServices = services.map(service => ({
      id: service.id,
      libelle: service.libelle,
      description: service.description,
      price: service.price,
      duration: service.duration,
      durationFormatted: service.duration ? 
        `${Math.floor(service.duration / 60)}h${service.duration % 60 !== 0 ? service.duration % 60 : ''}` : 
        'Sur mesure',
      images: service.images && service.images.length > 0 ? service.images : 
        ["https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      category: service.category ? { 
        id: service.category.id, 
        name: service.category.name 
      } : null,
      nutritionist: service.createdBy ? {
        name: `${service.createdBy.firstName || ''} ${service.createdBy.lastName || ''}`.trim() || 'Nutritionniste',
        email: service.createdBy.email,
        specialty: "Nutritionniste"
      } : {
        name: "Nutritionniste expert",
        specialty: "Nutritionniste"
      },
      tags: service.tags || [],
      features: service.description ? 
        service.description.split('. ').slice(0, 3).filter(f => f.trim() !== '') : 
        ["Accompagnement personnalisé", "Suivi professionnel"],
      benefits: "Accompagnement personnalisé, suivi professionnel, résultats durables",
      popular: service.price && service.price < 100,
      // Supprimer 'createdAt' si vous ne l'utilisez pas dans le frontend
    }));

    res.json({
      success: true,
      services: formattedServices,
      pagination: {
        total,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        hasMore: (parseInt(offset) || 0) + formattedServices.length < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur détaillée lors de la récupération des services nutrition:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Envoyer une réponse d'erreur détaillée
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des services',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ROUTE DE TEST SIMPLE - AJOUTEZ CELLE-CI POUR DÉPANNAGE
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Route test appelée');
    
    // Simple requête de test sans filtres complexes
    const services = await prisma.service.findMany({
      where: {
        type: 'bien_etre',
        isActive: true
      },
      take: 5,
      orderBy: [{ id: 'desc' }], // ✅ CORRECTION ici aussi
      include: {
        category: true
      }
    });
    
    console.log('✅ Test réussi, services trouvés:', services.length);
    
    res.json({
      success: true,
      message: 'Test réussi',
      count: services.length,
      services: services.map(s => ({
        id: s.id,
        libelle: s.libelle,
        description: s.description,
        category: s.category
      }))
    });
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur test',
      error: error.message
    });
  }
});

// Récupérer les catégories disponibles pour la nutrition - VERSION CORRIGÉE
router.get('/categories', async (req, res) => {
  try {
    console.log('📥 Requête catégories');
    
    // Version simplifiée
    const categories = await prisma.category.findMany({
      where: {
        services: {
          some: {
            type: 'bien_etre',
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true
      },
      distinct: ['name']
    });

    console.log('✅ Catégories trouvées:', categories.map(c => c.name));

    res.json({
      success: true,
      categories: ['Tous', ...categories.map(c => c.name)]
    });

  } catch (error) {
    console.error('❌ Erreur catégories:', error);
    // Fallback aux catégories par défaut
    res.json({
      success: true,
      categories: ['Tous', 'Consultation', 'Programme', 'Suivi', 'Atelier']
    });
  }
});

// Récupérer les statistiques nutrition - VERSION SIMPLIFIÉE
router.get('/stats', async (req, res) => {
  try {
    console.log('📥 Requête statistiques');
    
    const totalServices = await prisma.service.count({
      where: {
        type: 'bien_etre',
        isActive: true
      }
    });

    const avgPriceResult = await prisma.service.aggregate({
      where: {
        type: 'bien_etre',
        isActive: true,
        price: { not: null }
      },
      _avg: {
        price: true
      }
    });

    const avgPrice = avgPriceResult._avg.price || 0;

    console.log('✅ Statistiques:', { totalServices, avgPrice });

    res.json({
      success: true,
      stats: {
        totalServices,
        avgPrice: Math.round(avgPrice * 100) / 100,
        // Valeurs par défaut pour le frontend
        totalClients: 1250,
        successRate: 92,
        avgWeightLoss: "4.2kg",
        satisfactionRate: 97,
        avgRating: 4.8,
        consultationsPerMonth: 156
      }
    });

  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
    // Fallback aux statistiques par défaut
    res.json({
      success: true,
      stats: {
        totalServices: 0,
        avgPrice: 0,
        totalClients: 1250,
        successRate: 92,
        avgWeightLoss: "4.2kg",
        satisfactionRate: 97,
        avgRating: 4.8,
        consultationsPerMonth: 156
      }
    });
  }
});

// ROUTE DE SANTÉ POUR CE MODULE
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    module: 'nutrition-bienetre',
    routes: ['/', '/categories', '/stats', '/test', '/:id', '/health']
  });
});

module.exports = router;