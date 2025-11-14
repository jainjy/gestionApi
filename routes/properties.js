// routes/properties.js - Mise à jour complète
const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')
const { createNotification } = require("../services/notificationService");

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
      userId
    } = req.query

    const where = { isActive: true }
    
    if (status) where.status = status
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (type) where.type = type
    if (listingType) where.listingType = listingType
    if (userId) where.ownerId = userId
    
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

    res.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// POST /api/properties - Créer une nouvelle propriété
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    const io = req.app.get("io"); // WebSocket

    // Validation
    if (!data.title || !data.type || !data.city) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const userId = req.user.id;

    // ➕ Création de la propriété
    const newProperty = await prisma.property.create({
      data: {
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
        status: data.status || 'draft',
        listingType: data.listingType || 'sale',
        rentType: data.rentType || "longue_duree",
        images: data.images || [],
        features: data.features || [],
        ownerId: userId,
        publishedAt: data.status === 'published' ? new Date() : null
      },
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

    // 🔔 Notification automatique
    await createNotification({
      userId: userId,
      type: "success",
      title: "Nouvelle propriété ajoutée",
      message: `La propriété "${data.title}" a été créée avec succès.`,
      relatedEntity: "property",
      relatedEntityId: String(newProperty.id),
      io,
    });

    res.status(201).json({
      success: true,
      message: "Propriété ajoutée et notification envoyée",
      data: newProperty,
    });

  } catch (error) {
    console.error('Failed to create property:', error);
    res.status(500).json({
      error: 'Failed to create property',
      message: error.message
    });
  }
});

// GET /api/properties/stats - Récupérer les statistiques
router.get('/stats',authenticateToken, async (req, res) => {
  try {
    const user=req.user;
    console.log(user)
    const  userId  = user.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    
    const where = user.role!="admin" ?{ ownerId: userId }:{}
    
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
        status: { in: ['draft'] } 
      } 
    })
    const archived = await prisma.property.count({ 
      where: { 
        ...where,
        status: { in: ['sold', 'rented'] } 
      } 
    })
    
    // Statistiques de vues pour les propriétés publiées
    const publishedProperties = await prisma.property.findMany({
      where: { 
        ...where,
        status: { in: ['for_sale', 'for_rent'] } 
      },
      select: { views: true }
    })
    
    const totalViews = publishedProperties.reduce((sum, prop) => sum + prop.views, 0)
    const avgViews = publishedProperties.length > 0 ? Math.round(totalViews / publishedProperties.length) : 0

    res.json({ 
      total, 
      published, 
      pending, 
      archived,
      totalViews,
      avgViews
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

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

    if (status) where.status = status
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

    res.json(properties)
  } catch (error) {
    console.error('Failed to fetch user properties:', error)
    res.status(500).json({ error: 'Failed to fetch user properties' })
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

    // Incrémenter le compteur de vues
    await prisma.property.update({
      where: { id },
      data: { views: property.views + 1 }
    })

    res.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// PUT /api/properties/:id - Mettre à jour une propriété
router.put('/:id',authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    // Préparer les données de mise à jour
    const updateData = { ...data }
    
    // Convertir les nombres
    if (data.price) updateData.price = parseFloat(data.price)
    if (data.surface) updateData.surface = parseInt(data.surface)
    if (data.rooms) updateData.rooms = parseInt(data.rooms)
    if (data.bedrooms) updateData.bedrooms = parseInt(data.bedrooms)
    if (data.bathrooms) updateData.bathrooms = parseInt(data.bathrooms)
    
    // Gérer la date de publication
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
    
    res.json(updatedProperty)
  } catch (error) {
    console.error('Failed to update property:', error)
    res.status(500).json({ error: 'Failed to update property' })
  }
})

// PATCH /api/properties/:id - Mettre à jour le statut d'une propriété
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    const updateData = { status }
    
    // Gérer la date de publication
    if (status === 'for_sale' || status === 'for_rent') {
      updateData.publishedAt = new Date()
    } else if (status === 'draft') {
      updateData.publishedAt = null
    }
    
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData
    })
    
    res.json(updatedProperty)
  } catch (error) {
    console.error('Failed to update property status:', error)
    res.status(500).json({ error: 'Failed to update property status' })
  }
})

// PATCH /api/properties/:id/views - Incrémenter les vues
router.patch('/:id/views', async (req, res) => {
  try {
    const { id } = req.params
    
    const property = await prisma.property.findUnique({
      where: { id },
      select: { views: true }
    })
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }
    
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { views: property.views + 1 }
    })
    
    res.json({ views: updatedProperty.views })
  } catch (error) {
    console.error('Failed to update views:', error)
    res.status(500).json({ error: 'Failed to update views' })
  }
})

// DELETE /api/properties/:id - Supprimer une propriété (soft delete)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete property:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

module.exports = router