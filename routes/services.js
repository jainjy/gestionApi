const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db')
// GET /api/services - Récupérer tous les services avec leurs catégories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      // Select explicit scalar fields and nested relations to avoid selecting non-existent DB columns
      select: {
        id: true,
        libelle: true,
        description: true,
        categoryId: true,
        images: true,
        price: true,
        duration: true,
        category: true,
        metiers: {
          include: {
            metier: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    // Transformer les données pour le frontend
    const transformedServices = services.map(service => ({
      id: service.id.toString(),
      name: service.libelle,
      description: service.description,
      category: service.category?.name || 'non-categorise',
      categoryId: service.categoryId,
      images: service.images,
      metiers: service.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      vendors: service.users.map(u => ({
        id: u.user.id,
        name: u.user.companyName || `${u.user.firstName} ${u.user.lastName}`,
        rating: 4.5, // À calculer depuis vos données
        bookings: 0 // À calculer depuis vos données
      })),
      status: 'active' // À adapter selon vos besoins
    }))

    res.json(transformedServices)
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/services/categories - Récupérer toutes les catégories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        services: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(categories)
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/services/metiers - Récupérer tous les métiers
router.get('/metiers', authenticateToken, async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    })

    res.json(metiers)
  } catch (error) {
    console.error('Erreur lors de la récupération des métiers:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/services - Créer un nouveau service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, categoryId, metierIds, images } = req.body

    // Créer le service
    const newService = await prisma.service.create({
      data: {
        libelle: name,
        description: description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: images || [],
        price: null,
        duration: null,
        metiers: {
          create: metierIds?.map(metierId => ({
            metierId: parseInt(metierId)
          })) || []
        }
      },
      select: {
        id: true,
        libelle: true,
        description: true,
        category: true,
        images: true,
        metiers: {
          include: {
            metier: true
          }
        }
      }
    })

    res.status(201).json({
      id: newService.id.toString(),
      name: newService.libelle,
      description: newService.description,
      category: newService.category?.name,
      images: newService.images,
      metiers: newService.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      status: 'active'
    })
  } catch (error) {
    console.error('Erreur lors de la création du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/services/:id - Modifier un service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id)
    const { name, description, categoryId, metierIds, images } = req.body

    // Supprimer les liaisons métiers existantes
    await prisma.metierService.deleteMany({
      where: {
        serviceId: serviceId
      }
    })

    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        libelle: name,
        description: description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: images || [],
        metiers: {
          create: metierIds?.map(metierId => ({
            metierId: parseInt(metierId)
          })) || []
        }
      },
      select: {
        id: true,
        libelle: true,
        description: true,
        category: true,
        images: true,
        metiers: {
          include: {
            metier: true
          }
        }
      }
    })

    res.json({
      id: updatedService.id.toString(),
      name: updatedService.libelle,
      description: updatedService.description,
      category: updatedService.category?.name,
      images: updatedService.images,
      metiers: updatedService.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      status: 'active'
    })
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/services/:id - Supprimer un service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id)

    // Vérifier si le service est utilisé dans des demandes
    const demandes = await prisma.demande.findMany({
      where: { serviceId: serviceId }
    })

    if (demandes.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce service car il est utilisé dans des demandes' 
      })
    }

    // Supprimer les liaisons métiers
    await prisma.metierService.deleteMany({
      where: { serviceId: serviceId }
    })

    // Supprimer les liaisons utilisateurs
    await prisma.utilisateurService.deleteMany({
      where: { serviceId: serviceId }
    })

    // Supprimer le service
    await prisma.service.delete({
      where: { id: serviceId }
    })

    res.json({ success: true, message: 'Service supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/services/stats - Statistiques des services
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalServices = await prisma.service.count()
    const totalCategories = await prisma.category.count()
    const totalMetiers = await prisma.metier.count()
    
    // Services par catégorie
    const servicesByCategory = await prisma.category.findMany({
      include: {
        _count: {
          select: { services: true }
        }
      }
    })

    res.json({
      totalServices,
      totalCategories,
      totalMetiers,
      servicesByCategory: servicesByCategory.map(cat => ({
        category: cat.name,
        count: cat._count.services
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router