// routes/properties.js - VERSION COMPLÈTE AVEC ROUTE SOCIAL
const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')
const { createNotification } = require("../services/notificationService");

// Fonction utilitaire pour mapper les propriétés
const mapPropertyFields = (property) => ({
  ...property,
  socialLoan: property.isPSLA || false,
  isSHLMR: property.isSHLMR || false
});

// Fonction pour déterminer le type de logement social
const determineSocialType = (property) => {
  if (property.isSHLMR) return 'SHLMR';
  if (property.isPSLA) return 'PSLA';
  
  // Vérifier dans les features
  if (property.features && Array.isArray(property.features)) {
    const features = property.features.map(f => f.toUpperCase());
    if (features.includes('SODIAC')) return 'SODIAC';
    if (features.includes('SIDR')) return 'SIDR';
    if (features.includes('SEDRE')) return 'SEDRE';
    if (features.includes('SEMAC')) return 'SEMAC';
  }
  
  // Vérifier dans la description
  if (property.description) {
    const desc = property.description.toUpperCase();
    if (desc.includes('SODIAC')) return 'SODIAC';
    if (desc.includes('SIDR')) return 'SIDR';
    if (desc.includes('SEDRE')) return 'SEDRE';
    if (desc.includes('SEMAC')) return 'SEMAC';
  }
  
  // Vérifier dans le titre
  if (property.title) {
    const title = property.title.toUpperCase();
    if (title.includes('SODIAC')) return 'SODIAC';
    if (title.includes('SIDR')) return 'SIDR';
    if (title.includes('SEDRE')) return 'SEDRE';
    if (title.includes('SEMAC')) return 'SEMAC';
  }
  
  return null;
};

// GET /api/properties - Récupérer les propriétés avec filtres avancés
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      city, 
      minPrice, 
      maxPrice,
      type,
      listingType,
      search,
      userId,
      isSHLMR
    } = req.query

    const where = { isActive: true }
    
    // Gérer le paramètre status
    if (status === 'all') {
      // Si status=all, inclure tous les statuts
      where.status = { in: ['for_sale', 'for_rent', 'pending', 'sold', 'rented'] }
    } else if (status) {
      // Sinon, utiliser le statut fourni
      where.status = status
    } else {
      // Par défaut, afficher seulement les propriétés publiées
      where.status = { in: ['for_sale', 'for_rent'] }
    }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (type) where.type = type
    if (listingType) where.listingType = listingType
    if (userId) where.ownerId = userId

    if (isSHLMR !== undefined) {
      where.isSHLMR = isSHLMR === 'true' || isSHLMR === true
    }
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }

    const properties = await prisma.property.findMany({
      where,
      include: { 
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }, 
        favorites: true 
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedProperties = properties.map(mapPropertyFields);

    res.json(mappedProperties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// GET /api/properties/social - ROUTE NOUVELLE - Récupérer tous les logements sociaux
router.get('/social', async (req, res) => {
  try {
    const {
      status,
      city,
      minPrice,
      maxPrice,
      type,
      listingType,
      search,
      socialType, // 'SHLMR', 'SODIAC', 'SIDR', 'SEDRE', 'SEMAC', 'all'
      limit = 50
    } = req.query;

    // Construire la condition de base
    let where = {
      isActive: true,
      status: { in: ['for_sale', 'for_rent'] } // Par défaut seulement publiés
    };

    // Si un type social spécifique est demandé
    if (socialType && socialType !== 'all') {
      const typeUpper = socialType.toUpperCase();
      
      if (typeUpper === 'SHLMR') {
        where.isSHLMR = true;
      } 
      else if (typeUpper === 'PSLA') {
        where.isPSLA = true;
      }
      // Pour les autres types (SODIAC, SIDR, SEDRE, SEMAC), chercher dans features ou description
      else {
        where.OR = [
          { features: { has: typeUpper } },
          { description: { contains: typeUpper, mode: 'insensitive' } },
          { title: { contains: typeUpper, mode: 'insensitive' } }
        ];
      }
    } 
    // Si aucun type spécifique ou 'all', inclure tous les logements sociaux
    else {
      where.OR = [
        { isSHLMR: true },
        { isPSLA: true },
        {
          OR: [
            { features: { hasSome: ['SODIAC', 'SIDR', 'SEDRE', 'SEMAC'] } },
            { description: { contains: 'SODIAC', mode: 'insensitive' } },
            { description: { contains: 'SIDR', mode: 'insensitive' } },
            { description: { contains: 'SEDRE', mode: 'insensitive' } },
            { description: { contains: 'SEMAC', mode: 'insensitive' } }
          ]
        }
      ];
    }

    // Filtres standard
    if (status) {
      if (status === 'all') {
        where.status = { in: ['for_sale', 'for_rent', 'pending', 'sold', 'rented'] };
      } else {
        where.status = status;
      }
    }
    
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.AND = [
        where,
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
      delete where.OR; // Supprimer le OR précédent s'il existe
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        favorites: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Ajouter le type social déterminé à chaque propriété
    const enhancedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: determineSocialType(property),
        features: property.features || []
      };
    });

    // Si un type social est spécifié et n'est pas SHLMR/PSLA, filtrer à nouveau
    let filteredProperties = enhancedProperties;
    if (socialType && socialType !== 'all' && !['SHLMR', 'PSLA'].includes(socialType.toUpperCase())) {
      filteredProperties = enhancedProperties.filter(property => 
        property.socialType === socialType.toUpperCase()
      );
    }

    res.json({
      success: true,
      count: filteredProperties.length,
      data: filteredProperties
    });
  } catch (error) {
    console.error('Failed to fetch social properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social properties',
      message: error.message
    });
  }
});

// GET /api/properties/social/types - Récupérer les statistiques par type
router.get('/social/types', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        isActive: true,
        status: { in: ['for_sale', 'for_rent'] },
        OR: [
          { isSHLMR: true },
          { isPSLA: true },
          {
            OR: [
              { features: { hasSome: ['SODIAC', 'SIDR', 'SEDRE', 'SEMAC'] } },
              { description: { contains: 'SODIAC', mode: 'insensitive' } },
              { description: { contains: 'SIDR', mode: 'insensitive' } },
              { description: { contains: 'SEDRE', mode: 'insensitive' } },
              { description: { contains: 'SEMAC', mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        isSHLMR: true,
        isPSLA: true,
        features: true,
        description: true,
        title: true,
        city: true,
        price: true
      }
    });

    // Compter les types
    const typeCounts = {
      SHLMR: 0,
      PSLA: 0,
      SODIAC: 0,
      SIDR: 0,
      SEDRE: 0,
      SEMAC: 0,
      TOTAL: 0
    };

    // Compter les propriétés par ville
    const cities = {};

    properties.forEach(property => {
      typeCounts.TOTAL++;
      
      const socialType = determineSocialType(property);
      if (socialType && typeCounts.hasOwnProperty(socialType)) {
        typeCounts[socialType]++;
      }

      // Compter par ville
      if (property.city) {
        cities[property.city] = (cities[property.city] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        counts: typeCounts,
        cities: Object.entries(cities)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count),
        totalProperties: properties.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch social types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social types'
    });
  }
});

// GET /api/properties/psla - Récupérer les propriétés éligibles au Prêt Social Location Accession
router.get('/psla', async (req, res) => {
  try {
    const {
      status,
      city,
      minPrice,
      maxPrice,
      type,
      listingType,
      search,
      limit = 20
    } = req.query;

    const where = {
      isActive: true,
      isPSLA: true
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['for_sale', 'for_rent'] };
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        favorites: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const mappedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: 'PSLA'
      };
    });

    res.json({
      success: true,
      count: mappedProperties.length,
      data: mappedProperties
    });
  } catch (error) {
    console.error('Failed to fetch PSLA properties:', error);
    res.status(500).json({
      error: 'Failed to fetch PSLA properties',
      message: error.message
    });
  }
});

// GET /api/properties/shlmr - Récupérer les propriétés SHLMR
router.get('/shlmr', async (req, res) => {
  try {
    const {
      status,
      city,
      minPrice,
      maxPrice,
      type,
      listingType,
      search,
      limit = 20
    } = req.query;

    const where = {
      isActive: true,
      isSHLMR: true
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['for_sale', 'for_rent'] };
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        favorites: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const mappedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: 'SHLMR'
      };
    });

    res.json({
      success: true,
      count: mappedProperties.length,
      data: mappedProperties
    });
  } catch (error) {
    console.error('Failed to fetch SHLMR properties:', error);
    res.status(500).json({
      error: 'Failed to fetch SHLMR properties',
      message: error.message
    });
  }
});

// POST /api/properties - Créer une nouvelle propriété
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const io = req.app.get("io");

    // Validation
    if (!data.title || !data.type || !data.city) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const userId = req.user.id;

    const propertyData = {
      title: data.title,
      type: data.type,
      description: data.description || '',
      price: data.price ? parseFloat(data.price) : null,
      address: data.address || '',
      city: data.city,
      surface: data.surface ? parseInt(data.surface) : null,
      rooms: data.rooms ? parseInt(data.rooms) : null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
      status: data.status || (data.listingType === 'rent' ? 'for_rent' : 'for_sale'),
      listingType: data.listingType || 'sale',
      rentType: data.rentType || "longue_duree",
      images: data.images || [],
      features: data.features || [],
      ownerId: userId,
      publishedAt: data.status === 'published' ? new Date() : null,
      isPSLA: data.socialLoan || false,
      isSHLMR: data.isSHLMR || false,
      latitude: data.latitude || null,
      longitude: data.longitude || null
    };

    // Si un type social spécifique est fourni, l'ajouter aux features
    if (data.socialType) {
      const socialType = data.socialType.toUpperCase();
      if (!propertyData.features.includes(socialType)) {
        propertyData.features.push(socialType);
      }
    }

    const newProperty = await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    await createNotification({
      userId: userId,
      type: "success",
      title: "Nouvelle propriété ajoutée",
      message: `La propriété "${data.title}" a été créée avec succès.`,
      relatedEntity: "property",
      relatedEntityId: String(newProperty.id),
      io,
    });

    const responseProperty = mapPropertyFields(newProperty);
    responseProperty.socialType = determineSocialType(newProperty);

    res.status(201).json({
      success: true,
      message: "Propriété ajoutée et notification envoyée",
      data: responseProperty,
    });
  } catch (error) {
    console.error('Failed to create property:', error);
    res.status(500).json({
      error: 'Failed to create property',
      message: error.message
    });
  }
});

// GET /api/properties/user/:userId - Récupérer les propriétés d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const where = {
      ownerId: userId,
      isActive: true
    }

    const { status, type } = req.query
    
    if (status === 'all') {
      where.status = { in: ['for_sale', 'for_rent', 'pending', 'sold', 'rented'] }
    } else if (status) {
      where.status = status
    } else {
      where.status = { in: ['for_sale', 'for_rent'] }
    }

    if (type) where.type = type

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        favorites: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: determineSocialType(property)
      };
    });

    res.json(mappedProperties)
  } catch (error) {
    console.error('Failed to fetch user properties:', error)
    res.status(500).json({ error: 'Failed to fetch user properties' })
  }
})

// GET /api/properties/admin/all - Récupérer toutes les propriétés pour l'admin
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.' })
    }

    const {
      status,
      city,
      minPrice,
      maxPrice,
      type,
      listingType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const where = {}

    if (status) where.status = status
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (type) where.type = type
    if (listingType) where.listingType = listingType

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { owner: { firstName: { contains: search, mode: 'insensitive' } } },
        { owner: { lastName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            userType: true
          }
        },
        favorites: {
          select: { id: true, userId: true }
        }
      },
      orderBy: { [sortBy]: sortOrder }
    })

    const mappedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: determineSocialType(property),
        favoriteCount: property.favorites.length
      };
    });

    res.json(mappedProperties)
  } catch (error) {
    console.error('Failed to fetch admin properties:', error)
    res.status(500).json({ error: 'Failed to fetch admin properties' })
  }
})

// GET /api/properties/stats - Récupérer les statistiques
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const where = user.role !== "admin" ? { ownerId: userId } : {}

    const total = await prisma.property.count({ where })
    
    const published = await prisma.property.count({
      where: {
        ...where,
        status: { in: ['for_sale', 'for_rent'] }
      }
    })
    const pending = await prisma.property.count({
      where: {
        ...where,
        status: { in: ["pending"] },
      },
    });
    
    const archived = await prisma.property.count({
      where: {
        ...where,
        status: { in: ['sold', 'rented'] }
      }
    })

    const publishedProperties = await prisma.property.findMany({
      where: {
        ...where,
        status: { in: ['for_sale', 'for_rent'] }
      },
      select: { views: true }
    })

    const totalViews = publishedProperties.reduce((sum, prop) => sum + prop.views, 0)
    const avgViews = publishedProperties.length > 0 ? Math.round(totalViews / publishedProperties.length) : 0

    // Statistiques sociales si admin
    let socialStats = {};
    if (user.role === 'admin') {
      const socialProperties = await prisma.property.findMany({
        where: {
          ...where,
          OR: [
            { isSHLMR: true },
            { isPSLA: true },
            {
              OR: [
                { features: { hasSome: ['SODIAC', 'SIDR', 'SEDRE', 'SEMAC'] } },
                { description: { contains: 'SODIAC', mode: 'insensitive' } },
                { description: { contains: 'SIDR', mode: 'insensitive' } },
                { description: { contains: 'SEDRE', mode: 'insensitive' } },
                { description: { contains: 'SEMAC', mode: 'insensitive' } }
              ]
            }
          ]
        }
      });

      socialStats = {
        totalSocial: socialProperties.length,
        shlmr: socialProperties.filter(p => p.isSHLMR).length,
        psla: socialProperties.filter(p => p.isPSLA).length,
        sodiac: socialProperties.filter(p => determineSocialType(p) === 'SODIAC').length,
        sidr: socialProperties.filter(p => determineSocialType(p) === 'SIDR').length,
        sedre: socialProperties.filter(p => determineSocialType(p) === 'SEDRE').length,
        semac: socialProperties.filter(p => determineSocialType(p) === 'SEMAC').length
      };
    }

    res.json({
      total,
      published,
      pending,
      archived,
      totalViews,
      avgViews,
      ...(user.role === 'admin' && { socialStats })
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/properties/:id - Récupérer une propriété spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        favorites: true
      }
    })

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    await prisma.property.update({
      where: { id },
      data: { views: property.views + 1 }
    })

    const mappedProperty = mapPropertyFields(property);
    mappedProperty.socialType = determineSocialType(property);

    res.json(mappedProperty)
  } catch (error) {
    console.error('Error fetching property:', error)
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// PUT /api/properties/:id - Mettre à jour une propriété
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const updateData = { ...data }

    if (data.price) updateData.price = parseFloat(data.price)
    if (data.surface) updateData.surface = parseInt(data.surface)
    if (data.rooms) updateData.rooms = parseInt(data.rooms)
    if (data.bedrooms) updateData.bedrooms = parseInt(data.bedrooms)
    if (data.bathrooms) updateData.bathrooms = parseInt(data.bathrooms)

    if (data.hasOwnProperty('socialLoan')) {
      updateData.isPSLA = data.socialLoan;
      delete updateData.socialLoan;
    }

    if (data.hasOwnProperty('isSHLMR')) {
      updateData.isSHLMR = data.isSHLMR;
    }

    // Gestion du type social
    if (data.socialType) {
      const socialType = data.socialType.toUpperCase();
      if (!updateData.features) {
        updateData.features = [];
      }
      // Retirer les anciens types sociaux des features
      updateData.features = updateData.features.filter(f => 
        !['SODIAC', 'SIDR', 'SEDRE', 'SEMAC'].includes(f.toUpperCase())
      );
      // Ajouter le nouveau type
      if (!updateData.features.includes(socialType)) {
        updateData.features.push(socialType);
      }
    }

    if (data.status === 'for_sale' || data.status === 'for_rent') {
      updateData.publishedAt = new Date()
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    const responseProperty = mapPropertyFields(updatedProperty);
    responseProperty.socialType = determineSocialType(updatedProperty);

    res.json(responseProperty)
  } catch (error) {
    console.error('Failed to update property:', error)
    res.status(500).json({
      error: 'Failed to update property',
      details: error.message
    })
  }
})

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const updateData = { ...data }

    if (data.price) updateData.price = parseFloat(data.price)
    if (data.surface) updateData.surface = parseInt(data.surface)
    if (data.rooms) updateData.rooms = parseInt(data.rooms)
    if (data.bedrooms) updateData.bedrooms = parseInt(data.bedrooms)
    if (data.bathrooms) updateData.bathrooms = parseInt(data.bathrooms)

    if (data.hasOwnProperty('socialLoan')) {
      updateData.isPSLA = data.socialLoan;
      delete updateData.socialLoan;
    }

    if (data.hasOwnProperty('isSHLMR')) {
      updateData.isSHLMR = data.isSHLMR;
    }

    // Gestion du type social
    if (data.socialType) {
      const socialType = data.socialType.toUpperCase();
      // Récupérer les features actuelles
      const currentProperty = await prisma.property.findUnique({
        where: { id },
        select: { features: true }
      });
      
      let features = currentProperty?.features || [];
      // Retirer les anciens types sociaux
      features = features.filter(f => 
        !['SODIAC', 'SIDR', 'SEDRE', 'SEMAC'].includes(f.toUpperCase())
      );
      // Ajouter le nouveau type
      if (!features.includes(socialType)) {
        features.push(socialType);
      }
      updateData.features = features;
    }

    if (data.status === 'for_sale' || data.status === 'for_rent') {
      updateData.publishedAt = new Date()
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    const responseProperty = mapPropertyFields(updatedProperty);
    responseProperty.socialType = determineSocialType(updatedProperty);

    res.json(responseProperty)
  } catch (error) {
    console.error('Failed to patch property:', error)
    res.status(500).json({
      error: 'Failed to patch property',
      details: error.message
    })
  }
})

// DELETE /api/properties/:id - Supprimer une propriété
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const property = await prisma.property.findUnique({
      where: { id }
    })

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    if (property.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await prisma.property.delete({
      where: { id }
    })

    res.json({ success: true, message: 'Property deleted' })
  } catch (error) {
    console.error('Failed to delete property:', error)
    res.status(500).json({ error: 'Failed to delete property' })
  }
})

// GET /api/properties/professional/all - Récupérer les propriétés pour les professionnels
router.get('/professional/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les professionnels peuvent accéder à cette ressource.' })
    }

    const {
      status,
      city,
      minPrice,
      maxPrice,
      type,
      listingType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive = true
    } = req.query

    const where = {
      isActive: isActive === 'true' || isActive === true
    }

    if (req.user.role !== 'admin') {
      where.ownerId = req.user.id
    }

    // Gérer le paramètre status
    if (status === 'all') {
      where.status = { in: ['for_sale', 'for_rent', 'pending', 'sold', 'rented'] }
    } else if (status) {
      where.status = status
    }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (type) where.type = type
    if (listingType) where.listingType = listingType

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        favorites: {
          select: { id: true, userId: true }
        }
      },
      orderBy: { [sortBy]: sortOrder }
    })

    const mappedProperties = properties.map(property => {
      const mapped = mapPropertyFields(property);
      return {
        ...mapped,
        socialType: determineSocialType(property),
        favoriteCount: property.favorites.length,
        stats: {
          views: property.views || 0,
          favorites: property.favorites.length
        }
      }
    })

    res.json({
      success: true,
      count: mappedProperties.length,
      data: mappedProperties
    })
  } catch (error) {
    console.error('Failed to fetch professional properties:', error)
    res.status(500).json({ error: 'Failed to fetch professional properties' })
  }
})

module.exports = router