const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const multer = require('multer')
const { uploadToSupabase } = require('../middleware/upload')

const { prisma } = require('../lib/db')

// Ajouter la configuration multer
const upload = multer({ storage: multer.memoryStorage() })

// GET /api/professional/services - Récupérer tous les services du professionnel (associés + personnalisés)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Récupérer les services directement associés au professionnel
    const userServices = await prisma.utilisateurService.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            id: true,
            libelle: true,
            description: true,
            categoryId: true,
            images: true,
            price: true,
            duration: true,
            tags: true,
            isCustom: true,
            isActive: true,
            createdById: true,
            metiers: { include: { metier: true } },
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
            },
            category: true
          }
        }
      }
    })

    // Transformer les données
    const transformedServices = userServices.map(us => ({
      id: us.service.id.toString(),
      name: us.service.libelle,
      description: us.service.description,
      category: us.service.category?.name || 'Non catégorisé',
      images: us.service.images,
      price: us.service.price,
      duration: us.service.duration,
      tags: us.service.tags,
      metiers: us.service.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      vendors: us.service.users.map(u => ({
        id: u.user.id,
        name: u.user.companyName || `${u.user.firstName} ${u.user.lastName}`,
        isCurrentUser: u.user.id === userId
      })),
      isAssociated: true,
      isCustom: us.service.isCustom,
      isFromMetier: !us.service.isCustom, // Les services personnalisés ne viennent pas des métiers
      status: us.service.isActive ? 'active' : 'inactive',
      canEdit: us.service.isCustom && us.service.createdById === userId,
      customPrice: us.customPrice,
      customDuration: us.customDuration,
      isAvailable: us.isAvailable
    }))

    res.json(transformedServices)
  } catch (error) {
    console.error('Erreur lors de la récupération des services professionnels:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/professional/services/:serviceId/associate - Associer un service au professionnel
router.post('/:serviceId/associate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const serviceId = parseInt(req.params.serviceId)

    // Vérifier si le service existe
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' })
    }

    // Vérifier si l'association existe déjà
    const existingAssociation = await prisma.utilisateurService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId
        }
      }
    })

    if (existingAssociation) {
      return res.status(400).json({ error: 'Service déjà associé' })
    }

    // Créer l'association
    await prisma.utilisateurService.create({
      data: {
        userId,
        serviceId
      }
    })

    res.json({ success: true, message: 'Service associé avec succès' })
  } catch (error) {
    console.error('Erreur lors de l\'association du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/professional/services/:serviceId/disassociate - Désassocier un service du professionnel
router.delete('/:serviceId/disassociate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const serviceId = parseInt(req.params.serviceId)

    // Vérifier si l'association existe
    const association = await prisma.utilisateurService.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId
        }
      }
    })

    if (!association) {
      return res.status(404).json({ error: 'Association non trouvée' })
    }

    // Supprimer l'association
    await prisma.utilisateurService.delete({
      where: {
        userId_serviceId: {
          userId,
          serviceId
        }
      }
    })

    res.json({ success: true, message: 'Service désassocié avec succès' })
  } catch (error) {
    console.error('Erreur lors de la désassociation du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/professional/services/available - Récupérer les services disponibles pour le professionnel
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Récupérer les métiers du professionnel
    const userMetiers = await prisma.utilisateurMetier.findMany({
      where: { userId },
      select: { metierId: true }
    })

    const metierIds = userMetiers.map(um => um.metierId)

    // Récupérer les services liés à ses métiers mais pas encore associés
    const availableServices = await prisma.service.findMany({
      where: {
        OR: [
          {
            metiers: {
              some: {
                metierId: {
                  in: metierIds
                }
              }
            }
          }
        ],
        NOT: {
          users: {
            some: {
              userId: userId
            }
          }
        }
      },
      select: {
        id: true,
        libelle: true,
        description: true,
        categoryId: true,
        images: true,
        price: true,
        duration: true,
        category: true,
        metiers: { include: { metier: true } },
        users: { include: { user: { select: { id: true, firstName: true, lastName: true, companyName: true } } } }
      },
      orderBy: {
        libelle: 'asc'
      }
    })

    const transformedServices = availableServices.map(service => ({
      id: service.id.toString(),
      name: service.libelle,
      description: service.description,
      category: service.category?.name || 'Non catégorisé',
      images: service.images,
      metiers: service.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      vendorsCount: service.users.length,
      isFromMetier: true,
      status: 'available'
    }))

    res.json(transformedServices)
  } catch (error) {
    console.error('Erreur lors de la récupération des services disponibles:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/professional/services/stats - Statistiques des services du professionnel
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Services associés
    const associatedServices = await prisma.utilisateurService.count({
      where: { userId }
    })

    // Métiers du professionnel
    const userMetiers = await prisma.utilisateurMetier.count({
      where: { userId }
    })

    // Services disponibles via métiers
    const userMetiersList = await prisma.utilisateurMetier.findMany({
      where: { userId },
      select: { metierId: true }
    })

    const metierIds = userMetiersList.map(um => um.metierId)

    const availableServicesCount = await prisma.service.count({
      where: {
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        },
        NOT: {
          users: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    // Demandes liées aux services du professionnel
    const demandesCount = await prisma.demandeArtisan.count({
      where: { userId }
    })

    res.json({
      associatedServices,
      userMetiers,
      availableServicesCount,
      demandesCount,
      totalPotentialServices: associatedServices + availableServicesCount
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})
// POST /api/professional/services/custom - Créer un service personnalisé
router.post('/custom', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user.id
    const {
      libelle,
      description,
      categoryId,
      duration,
      price,
      tags = '[]',
      metierIds = '[]'
    } = req.body

    // Validation des données requises
    if (!libelle) {
      return res.status(400).json({ error: 'Le nom du service est obligatoire' })
    }

    // Parser les tableaux JSON
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags
    const parsedMetierIds = typeof metierIds === 'string' ? JSON.parse(metierIds) : metierIds

    // Upload des images vers Supabase
    const uploadedImages = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadedImage = await uploadToSupabase(file, 'services')
          uploadedImages.push(uploadedImage.url)
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError)
          // Continuer même si une image échoue
        }
      }
    }

    // Créer le service personnalisé
    const customService = await prisma.service.create({
      data: {
        libelle,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: uploadedImages,
        duration: duration ? parseInt(duration) : null,
        price: price ? parseFloat(price) : null,
        tags: parsedTags,
        createdById: userId,
        isCustom: true,
        isActive: true
      },
      include: {
        category: true,
        metiers: {
          include: { metier: true }
        }
      }
    })

    // Associer les métiers si spécifiés
    if (metierIds && metierIds.length > 0) {
      const metierServiceConnections = metierIds.map(metierId => ({
        metierId: parseInt(metierId),
        serviceId: customService.id
      }))

      await prisma.metierService.createMany({
        data: metierServiceConnections
      })
    }

    // Récupérer le service complet avec ses relations
    const completeService = await prisma.service.findUnique({
      where: { id: customService.id },
      select: {
        id: true,
        libelle: true,
        description: true,
        categoryId: true,
        images: true,
        price: true,
        duration: true,
        tags: true,
        isCustom: true,
        isActive: true,
        category: true,
        metiers: { 
          include: { metier: true } 
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
      }
    })

    res.json({
      success: true,
      message: 'Service personnalisé créé avec succès',
      service: {
        id: completeService.id.toString(),
        name: completeService.libelle,
        description: completeService.description,
        category: completeService.category?.name || 'Non catégorisé',
        images: completeService.images,
        price: completeService.price,
        duration: completeService.duration,
        tags: completeService.tags,
        metiers: completeService.metiers.map(m => ({
          id: m.metier.id,
          libelle: m.metier.libelle
        })),
        vendors: completeService.users.map(u => ({
          id: u.user.id,
          name: u.user.companyName || `${u.user.firstName} ${u.user.lastName}`,
          isCurrentUser: u.user.id === userId
        })),
        isAssociated: true,
        isFromMetier: false,
        isCustom: true,
        status: 'active'
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création du service personnalisé:', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création du service' })
  }
})

// PUT /api/professional/services/custom/:serviceId - Modifier un service personnalisé
router.put('/custom/:serviceId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const serviceId = parseInt(req.params.serviceId)
    const {
      libelle,
      description,
      categoryId,
      images,
      duration,
      price,
      tags,
      metierIds,
      isActive
    } = req.body

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { users: true }
    })

    if (!existingService) {
      return res.status(404).json({ error: 'Service non trouvé' })
    }

    if (existingService.createdById !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres services' })
    }

    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        libelle,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images,
        duration: duration ? parseInt(duration) : null,
        price: price ? parseFloat(price) : null,
        tags,
        isActive
      },
      include: {
        category: true,
        metiers: {
          include: { metier: true }
        },
        users: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, companyName: true }
            }
          }
        }
      }
    })

    // Mettre à jour les métiers associés si spécifiés
    if (metierIds) {
      // Supprimer les associations existantes
      await prisma.metierService.deleteMany({
        where: { serviceId }
      })

      // Créer les nouvelles associations
      if (metierIds.length > 0) {
        const metierServiceConnections = metierIds.map(metierId => ({
          metierId: parseInt(metierId),
          serviceId
        }))

        await prisma.metierService.createMany({
          data: metierServiceConnections
        })
      }
    }

    res.json({
      success: true,
      message: 'Service mis à jour avec succès',
      service: {
        id: updatedService.id.toString(),
        name: updatedService.libelle,
        description: updatedService.description,
        category: updatedService.category?.name || 'Non catégorisé',
        images: updatedService.images,
        price: updatedService.price,
        duration: updatedService.duration,
        tags: updatedService.tags,
        metiers: updatedService.metiers.map(m => ({
          id: m.metier.id,
          libelle: m.metier.libelle
        })),
        vendors: updatedService.users.map(u => ({
          id: u.user.id,
          name: u.user.companyName || `${u.user.firstName} ${u.user.lastName}`,
          isCurrentUser: u.user.id === userId
        })),
        isAssociated: true,
        isFromMetier: false,
        isCustom: true,
        status: updatedService.isActive ? 'active' : 'inactive'
      }
    })
  } catch (error) {
    console.error('Erreur lors de la modification du service personnalisé:', error)
    res.status(500).json({ error: 'Erreur serveur lors de la modification du service' })
  }
})

// GET /api/professional/services/categories - Récupérer les catégories disponibles
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        services: {
          where: { isCustom: false }, // Seulement les services standards
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json(categories)
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/professional/services/metiers - Récupérer les métiers de l'utilisateur
router.get('/metiers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const userMetiers = await prisma.utilisateurMetier.findMany({
      where: { userId },
      include: {
        metier: {
          select: {
            id: true,
            libelle: true
          }
        }
      }
    })

    const metiers = userMetiers.map(um => ({
      id: um.metier.id,
      libelle: um.metier.libelle
    }))

    res.json(metiers)
  } catch (error) {
    console.error('Erreur lors de la récupération des métiers:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})
// DELETE /api/professional/services/custom/:serviceId - Supprimer un service personnalisé
router.delete('/custom/:serviceId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const serviceId = parseInt(req.params.serviceId)

    // Vérifier que le service existe et appartient à l'utilisateur
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' })
    }

    if (service.createdById !== userId) {
      return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres services' })
    }

    // Supprimer le service (les associations utilisateurService seront supprimées en cascade)
    await prisma.service.delete({
      where: { id: serviceId }
    })

    res.json({ success: true, message: 'Service supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du service personnalisé:', error)
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du service' })
  }
})


module.exports = router