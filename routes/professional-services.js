const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')

const { prisma } = require('../lib/db')

// GET /api/professional/services - Récupérer les services liés au professionnel connecté
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Récupérer les métiers du professionnel
    const userMetiers = await prisma.utilisateurMetier.findMany({
      where: { userId },
      include: {
        metier: {
          include: {
            services: {
              include: {
                service: {
                  // select explicit fields and nested relations to avoid missing DB columns
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
                      include: { metier: true }
                    },
                    users: {
                      include: {
                        user: { select: { id: true, firstName: true, lastName: true, companyName: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

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
            metiers: { include: { metier: true } },
            users: { include: { user: { select: { id: true, firstName: true, lastName: true, companyName: true } } } }
          }
        }
      }
    })

    // Transformer les données des services par métiers
    const servicesFromMetiers = userMetiers.flatMap(um =>
      um.metier.services.map(ms => ({
        id: ms.service.id.toString(),
        name: ms.service.libelle,
        description: ms.service.description,
        category: ms.service.category?.name || 'Non catégorisé',
        categoryId: ms.service.categoryId,
        images: ms.service.images,
        metiers: ms.service.metiers.map(m => ({
          id: m.metier.id,
          libelle: m.metier.libelle
        })),
        vendors: ms.service.users.map(u => ({
          id: u.user.id,
          name: u.user.companyName || `${u.user.firstName} ${u.user.lastName}`,
          isCurrentUser: u.user.id === userId
        })),
        isAssociated: ms.service.users.some(u => u.userId === userId),
        isFromMetier: true,
        status: 'active'
      }))
    )

    // Transformer les données des services directs
    const directServices = userServices.map(us => ({
      id: us.service.id.toString(),
      name: us.service.libelle,
      description: us.service.description,
      category: us.service.category?.name || 'Non catégorisé',
      categoryId: us.service.categoryId,
      images: us.service.images,
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
      isFromMetier: false,
      status: 'active'
    }))

    // Fusionner et dédupliquer les services
    const allServices = [...directServices, ...servicesFromMetiers]
    const uniqueServices = allServices.filter((service, index, self) =>
      index === self.findIndex(s => s.id === service.id)
    )

    res.json(uniqueServices)
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

module.exports = router