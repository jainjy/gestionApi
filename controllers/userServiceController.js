// controllers/userServiceController.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Récupérer tous les services avec filtres optionnels
 */
exports.getAllUserServices = async (req, res) => {
  try {
    const {
      categoryId,
      type = 'entreprise', // Par défaut 'entreprise' pour vos données
      isActive = 'true',
      search,
      minPrice,
      maxPrice,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'libelle',
      sortOrder = 'asc'
    } = req.query

    // Construction des filtres
    const where = {
      isActive: isActive === 'true'
    }

    // Filtre par catégorie
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    // Filtre par type
    if (type) {
      where.type = type
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Filtre par tags
    if (tags) {
      const tagArray = tags.split(',')
      where.tags = {
        hasSome: tagArray
      }
    }

    // Recherche par texte
    if (search) {
      where.OR = [
        { libelle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Tri
    const orderBy = {}
    const validSortFields = ['libelle', 'price', 'duration']
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.libelle = 'asc'
    }

    // Récupération des services avec la catégorie
    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy,
      skip,
      take
    })

    // Total pour la pagination
    const total = await prisma.service.count({ where })
    const totalPages = Math.ceil(total / take)

    res.json({
      success: true,
      count: services.length,
      data: services,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: take
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Récupérer un service par son ID
 */
exports.getUserServiceById = async (req, res) => {
  try {
    const { id } = req.params

    const service = await prisma.service.findUnique({
      where: { 
        id: parseInt(id),
        isActive: true 
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      })
    }

    res.json({
      success: true,
      data: service
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du service:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Récupérer les services par catégorie
 */
exports.getUserServicesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params
    const { 
      type = 'entreprise',
      isActive = 'true'
    } = req.query

    const services = await prisma.service.findMany({
      where: {
        categoryId: parseInt(categoryId),
        type: type,
        isActive: isActive === 'true'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    })

    res.json({
      success: true,
      count: services.length,
      data: services
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services par catégorie:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Récupérer les services par type (entreprise)
 */
exports.getUserServicesByType = async (req, res) => {
  try {
    const { type } = req.params
    const { 
      isActive = 'true',
      limit = 20
    } = req.query

    const services = await prisma.service.findMany({
      where: {
        type: type,
        isActive: isActive === 'true'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      },
      take: parseInt(limit)
    })

    res.json({
      success: true,
      count: services.length,
      data: services
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services par type:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Rechercher des services
 */
exports.searchUserServices = async (req, res) => {
  try {
    const { 
      q,
      categoryId,
      type = 'entreprise',
      limit = 10 
    } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche est requis'
      })
    }

    const where = {
      isActive: true,
      type: type,
      OR: [
        { libelle: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } }
      ]
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: parseInt(limit)
    })

    res.json({
      success: true,
      count: services.length,
      data: services
    })

  } catch (error) {
    console.error('❌ Erreur lors de la recherche des services:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Récupérer les services recommandés (services de la même catégorie)
 */
exports.getRecommendedServices = async (req, res) => {
  try {
    const { 
      serviceId,
      limit = 4 
    } = req.query

    // Récupérer le service actuel pour connaître sa catégorie
    const currentService = await prisma.service.findUnique({
      where: { 
        id: parseInt(serviceId),
        isActive: true 
      },
      select: {
        categoryId: true,
        id: true
      }
    })

    if (!currentService) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      })
    }

    // Récupérer d'autres services de la même catégorie
    const recommendedServices = await prisma.service.findMany({
      where: {
        categoryId: currentService.categoryId,
        id: { not: currentService.id },
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: parseInt(limit)
    })

    res.json({
      success: true,
      count: recommendedServices.length,
      data: recommendedServices
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services recommandés:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Récupérer les catégories avec leurs services
 */
exports.getCategoriesWithServices = async (req, res) => {
  try {
    const { 
      type = 'entreprise',
      isActive = 'true'
    } = req.query

    const categories = await prisma.category.findMany({
      where: {
        services: {
          some: {
            type: type,
            isActive: isActive === 'true'
          }
        }
      },
      include: {
        services: {
          where: {
            type: type,
            isActive: isActive === 'true'
          },
          select: {
            id: true,
            libelle: true,
            description: true,
            price: true,
            duration: true,
            images: true,
            tags: true
          },
          orderBy: {
            libelle: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrer les catégories qui ont des services
    const filteredCategories = categories.filter(category => category.services.length > 0)

    res.json({
      success: true,
      count: filteredCategories.length,
      data: filteredCategories
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}