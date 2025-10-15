// routes/admin/properties.js
const express = require('express')
const router = express.Router()
const { prisma } = require('../../lib/db')

// GET /api/admin/properties - Récupérer toutes les propriétés pour l'admin
router.get('/', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { 
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// GET /api/admin/properties/stats - Statistiques pour l'admin
router.get('/stats', async (req, res) => {
  try {
    const [
      total,
      published,
      pending,
      draft,
      archived,
      featured,
      totalViews
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'published' } }),
      prisma.property.count({ where: { status: 'pending' } }),
      prisma.property.count({ where: { status: 'draft' } }),
      prisma.property.count({ where: { status: 'archived' } }),
      prisma.property.count({ where: { isFeatured: true } }),
      prisma.property.aggregate({
        _sum: { views: true }
      })
    ])

    res.json({
      total,
      published,
      pending,
      draft,
      archived,
      featured,
      totalViews: totalViews._sum.views || 0
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// POST /api/admin/properties - Créer une propriété en tant qu'admin
router.post('/', async (req, res) => {
  try {
    const data = req.body
    
    // Générer un slug si non fourni
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    }

    const newProperty = await prisma.property.create({
      data: {
        ...data,
        // L'admin peut assigner à n'importe quel propriétaire
        ownerId: data.ownerId
      },
      include: { owner: true }
    })

    res.status(201).json(newProperty)
  } catch (error) {
    console.error('Failed to create property:', error)
    res.status(500).json({ error: 'Failed to create property' })
  }
})

// PUT /api/admin/properties/:id - Mettre à jour une propriété
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const updatedProperty = await prisma.property.update({
      where: { id },
      data,
      include: { owner: true }
    })
    
    res.json(updatedProperty)
  } catch (error) {
    console.error('Failed to update property:', error)
    res.status(500).json({ error: 'Failed to update property' })
  }
})

// PATCH /api/admin/properties/:id - Mise à jour partielle
router.patch('/:id', async (req, res) => {
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

// DELETE /api/admin/properties/:id - Supprimer une propriété
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