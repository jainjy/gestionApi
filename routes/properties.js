const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')

// GET /api/properties - Récupérer toutes les propriétés avec filtres
router.get('/', async (req, res) => {
  try {
    const { status, city, minPrice, maxPrice } = req.query

    const where = { isActive: true }
    
    if (status) where.status = status
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    const properties = await prisma.property.findMany({
      where,
      include: { owner: true, favorites: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// POST /api/properties - Créer une nouvelle propriété
router.post('/', async (req, res) => {
  try {
    const data = req.body
    
    const newProperty = await prisma.property.create({
      data: {
        ...data,
        ownerId: data.ownerId || 'default-owner-id'
      },
      include: { owner: true }
    })

    res.status(201).json(newProperty)
  } catch (error) {
    console.error('Failed to create property:', error)
    res.status(500).json({ error: 'Failed to create property' })
  }
})

// GET /api/properties/stats - Récupérer les statistiques
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.property.count()
    const published = await prisma.property.count({ 
      where: { status: { in: ['for_sale', 'for_rent'] } } 
    })
    const pending = await prisma.property.count({ 
      where: { status: { in: ['sold', 'rented'] } } 
    })
    const soldThisMonth = await prisma.property.count({ 
      where: { 
        status: 'sold', 
        updatedAt: { 
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        } 
      } 
    })
    
    res.json({ total, published, pending, soldThisMonth })
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
      include: { owner: true }
    })

    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }

    res.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// PUT /api/properties/:id - Mettre à jour une propriété
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    const updatedProperty = await prisma.property.update({
      where: { id },
      data
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
    
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { status }
    })
    
    res.json(updatedProperty)
  } catch (error) {
    console.error('Failed to update property status:', error)
    res.status(500).json({ error: 'Failed to update property status' })
  }
})

// DELETE /api/properties/:id - Supprimer une propriété
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.property.delete({
      where: { id }
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete property:', error)
    res.status(500).json({ error: 'Failed to delete property' })
  }
})

module.exports = router