const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken, requireRole } = require('../middleware/auth')

// GET /api/products - Récupérer tous les produits avec filtres
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, // Ne pas mettre de valeur par défaut ici
      featured,
      vendorId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query

    // Construire les filtres
    const where = {}

    if (status && status !== 'Tous') {
      where.status = status
    }
    // Si aucun statut n'est spécifié, on montre tous les produits

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category && category !== 'Toutes') {
      where.category = category
    }

    if (featured !== undefined) {
      where.featured = featured === 'true'
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ])

    // Formater les données pour le frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      comparePrice: product.comparePrice,
      quantity: product.quantity,
      lowStock: product.lowStock,
      images: product.images || [],
      status: product.status,
      featured: !!product.featured,
      vendor: {
        id: product.vendor?.id || product.vendorId || null,
        companyName: product.vendor?.companyName || null,
        rating: product.vendor?.rating ?? null
      },
      createdAt: product.createdAt ? product.createdAt.toISOString() : null,
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null,
      publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null
    }))

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})
// GET /api/products/categories - Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        status: 'active'
      },
      _count: {
        id: true
      }
    })

    res.json(categories.map(cat => ({
      name: cat.category,
      count: cat._count.id
    })))
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/products/vendor/my-products - Récupérer les produits du vendeur connecté
router.get('/vendor/my-products', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    })

    if (!vendor) {
      return res.status(404).json({ error: 'Vendeur non trouvé' })
    }

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits du vendeur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/products/:id - Récupérer un produit spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    // Ne pas faire d'update vide — renvoyer simplement le produit
    res.json(product)
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/products - Créer un nouveau produit (Vendeurs uniquement)
router.post('/', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      comparePrice,
      cost,
      sku,
      barcode,
      quantity,
      lowStock,
      weight,
      dimensions,
      images,
      status,
      featured,
      visibility,
      seoTitle,
      seoDescription
    } = req.body

    // Trouver le vendorId de l'utilisateur connecté
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    })

    if (!vendor && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux vendeurs' })
    }

    // Générer un slug à partir du nom
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const product = await prisma.product.create({
      data: {
        vendorId: vendor?.id || (req.user.role === 'admin' ? req.body.vendorId : undefined), // Admin peut spécifier vendorId
        name,
        slug,
        description,
        category,
        subcategory,
        price: price !== undefined && price !== null ? parseFloat(price) : null,
        comparePrice: comparePrice !== undefined && comparePrice !== null ? parseFloat(comparePrice) : null,
        cost: cost !== undefined && cost !== null ? parseFloat(cost) : null,
        sku: sku || null,
        barcode: barcode || null,
        quantity: quantity !== undefined && quantity !== null ? parseInt(quantity) : 0,
        lowStock: lowStock !== undefined && lowStock !== null ? parseInt(lowStock) : 5,
        weight: weight !== undefined && weight !== null ? parseFloat(weight) : null,
        dimensions: (typeof dimensions === 'string' && dimensions.length) ? (JSON.parse(dimensions) || null) : (typeof dimensions === 'object' ? dimensions : null),
        images: Array.isArray(images) ? images : [],
        status: status || 'draft',
        featured: !!featured,
        visibility: visibility || 'public',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        publishedAt: status === 'active' ? new Date() : null
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    })

    res.json(product)
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Un produit avec ce nom existe déjà' })
    }
    
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      category,
      subcategory,
      price,
      comparePrice,
      cost,
      sku,
      barcode,
      quantity,
      lowStock,
      weight,
      dimensions,
      images,
      status,
      featured,
      visibility,
      seoTitle,
      seoDescription
    } = req.body

    // Vérifier que le produit existe et que l'utilisateur a les droits
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: true
      }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    // Vérifier les permissions (vendeur ne peut modifier que ses produits)
    if (req.user.role === 'professional') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      })

      if (existingProduct.vendorId !== vendor.id) {
        return res.status(403).json({ error: 'Accès non autorisé à ce produit' })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        category: category || existingProduct.category,
        subcategory: subcategory || existingProduct.subcategory,
        price: price !== undefined && price !== null ? parseFloat(price) : existingProduct.price,
        comparePrice: comparePrice !== undefined && comparePrice !== null ? parseFloat(comparePrice) : existingProduct.comparePrice,
        cost: cost !== undefined && cost !== null ? parseFloat(cost) : existingProduct.cost,
        sku: sku || existingProduct.sku,
        barcode: barcode || existingProduct.barcode,
        quantity: quantity !== undefined && quantity !== null ? parseInt(quantity) : existingProduct.quantity,
        lowStock: lowStock !== undefined && lowStock !== null ? parseInt(lowStock) : existingProduct.lowStock,
        weight: weight !== undefined && weight !== null ? parseFloat(weight) : existingProduct.weight,
        dimensions: (typeof dimensions === 'string' && dimensions.length) ? (JSON.parse(dimensions) || existingProduct.dimensions) : (typeof dimensions === 'object' ? dimensions : existingProduct.dimensions),
        images: Array.isArray(images) ? images : existingProduct.images,
        status: status || existingProduct.status,
        featured: featured !== undefined ? !!featured : existingProduct.featured,
        visibility: visibility || existingProduct.visibility,
        seoTitle: seoTitle || existingProduct.seoTitle,
        seoDescription: seoDescription || existingProduct.seoDescription,
        publishedAt: status === 'active' && existingProduct.status !== 'active' ? new Date() : existingProduct.publishedAt,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    })

    res.json(product)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/products/:id - Supprimer un produit
router.delete('/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params

    // Vérifier que le produit existe et que l'utilisateur a les droits
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: true
      }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    // Vérifier les permissions
    if (req.user.role === 'professional') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      })

      if (existingProduct.vendorId !== vendor.id) {
        return res.status(403).json({ error: 'Accès non autorisé à ce produit' })
      }
    }

    await prisma.product.delete({
      where: { id }
    })

    res.json({ success: true, message: 'Produit supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/products/vendor/my-products - Récupérer les produits du vendeur connecté
router.get('/vendor/my-products', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    })

    if (!vendor) {
      return res.status(404).json({ error: 'Vendeur non trouvé' })
    }

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits du vendeur:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router