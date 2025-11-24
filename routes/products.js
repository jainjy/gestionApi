const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { createNotification } = require("../services/notificationService");

// Dans votre route GET /api/products 
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status,
      featured,
      minPrice,
      maxPrice,
      productType, 
      page = 1,
      limit = 20
    } = req.query;

    // Construire les filtres
    const where = {};

    // Filtrage par rôle : seul le professional est restreint à ses produits
    if (req.user.role === 'professional') {
      where.userId = req.user.id;
    }

    // Filtres classiques
    if (status && status !== 'Tous') where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'Toutes') where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';
    if (productType) where.productType = productType;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      productType: product.productType,
      price: product.price,
      comparePrice: product.comparePrice,
      cost: product.cost,
      sku: product.sku,
      barcode: product.barcode,
      trackQuantity: product.trackQuantity,
      quantity: product.quantity,
      lowStock: product.lowStock,
      weight: product.weight,
      dimensions: product.dimensions,
      images: product.images || [],
      status: product.status,
      featured: !!product.featured,
      visibility: product.visibility,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      vendor: {
        id: product.User?.id || null,
        firstName: product.User?.firstName || null,
        lastName: product.User?.lastName || null,
        companyName: product.User?.companyName || null,
        phone: product.User?.phone || null,
        email: product.User?.email || null
      },
      createdAt: product.createdAt?.toISOString() || null,
      updatedAt: product.updatedAt?.toISOString() || null,
      publishedAt: product.publishedAt?.toISOString() || null
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dans votre route GET /api/products 
router.get('/all', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status,
      featured,
      minPrice,
      maxPrice,
      productType, 
      page = 1,
      limit = 20
    } = req.query;

    // Construire les filtres
    const where = {};

    // Filtres classiques
    if (status && status !== 'Tous') where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'Toutes') where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';
    if (productType) where.productType = productType;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      productType: product.productType,
      price: product.price,
      comparePrice: product.comparePrice,
      cost: product.cost,
      sku: product.sku,
      barcode: product.barcode,
      trackQuantity: product.trackQuantity,
      quantity: product.quantity,
      lowStock: product.lowStock,
      weight: product.weight,
      dimensions: product.dimensions,
      images: product.images || [],
      status: product.status,
      featured: !!product.featured,
      visibility: product.visibility,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      vendor: {
        id: product.User?.id || null,
        firstName: product.User?.firstName || null,
        lastName: product.User?.lastName || null,
        companyName: product.User?.companyName || null,
        phone: product.User?.phone || null,
        email: product.User?.email || null
      },
      createdAt: product.createdAt?.toISOString() || null,
      updatedAt: product.updatedAt?.toISOString() || null,
      publishedAt: product.publishedAt?.toISOString() || null
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les statistiques des produits
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const where = {};

    // 🚫 Seul le professional est limité à ses produits
    if (req.user.role === "professional") {
      where.userId = req.user.id;
    }

    // 📌 1. Nombre total de produits
    const totalProducts = await prisma.product.count({ where });

    // 📌 2. Produits par catégorie
    const productsByCategory = await prisma.product.groupBy({
      by: ["category"],
      where,
      _count: { category: true }
    });

    // 📌 3. Status (active / draft)
    const productsByStatus = await prisma.product.groupBy({
      by: ["status"],
      where,
      _count: { status: true }
    });

    // 📌 4. Somme des vues, clics, achats
    const counters = await prisma.product.aggregate({
      where,
      _sum: {
        viewCount: true,
        clickCount: true,
        purchaseCount: true
      }
    });

    // 📌 5. Top 5 produits les plus vus
    const topViewed = await prisma.product.findMany({
      where,
      orderBy: { viewCount: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        viewCount: true,
        price: true
      }
    });

    // 📌 6. Top 5 produits les plus achetés
    const topPurchased = await prisma.product.findMany({
      where,
      orderBy: { purchaseCount: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        purchaseCount: true,
        price: true
      }
    });

    return res.json({
      success: true,
      data: {
        totalProducts,
        productsByCategory,
        productsByStatus,
        totals: {
          views: counters._sum.viewCount || 0,
          clicks: counters._sum.clickCount || 0,
          purchases: counters._sum.purchaseCount || 0
        },
        topViewed,
        topPurchased
      }
    });

  } catch (error) {
    console.error("Erreur stats produits:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
});


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

// GET /api/products/user/my-products - Récupérer les produits de l'utilisateur connecté
router.get('/user/my-products', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user.id },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(products)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits de l\'utilisateur:', error)
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
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true
          }
        }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    res.json(product)
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/products - Créer un nouveau produit
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
    } = req.body;

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const product = await prisma.product.create({
      data: {
        userId: req.user.id,
        name,
        slug,
        description,
        category,
        subcategory,
        price: price != null ? parseFloat(price) : null,
        comparePrice: comparePrice != null ? parseFloat(comparePrice) : null,
        cost: cost != null ? parseFloat(cost) : null,
        sku: sku || null,
        barcode: barcode || null,
        trackQuantity: quantity != null,
        quantity: quantity != null ? parseInt(quantity) : 0,
        lowStock: lowStock != null ? parseInt(lowStock) : 5,
        weight: weight != null ? parseFloat(weight) : null,
        dimensions: dimensions || null,
        images: Array.isArray(images) ? images : [],
        status: status || 'draft',
        featured: !!featured,
        visibility: visibility || 'public',
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        publishedAt: status === 'active' ? new Date() : null
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    // 🔔 Notification création produit
    const io = req.app.get("io");
    await createNotification({
      userId: req.user.id,
      type: "success",
      title: "Nouveau produit ajouté",
      message: `Le produit "${product.name}" a été ajouté avec succès.`,
      relatedEntity: "product",
      relatedEntityId: product.id,
      io
    });

    res.json({ success: true, data: product, message: "Produit créé et notification envoyée" });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Un produit avec ce nom ou slug existe déjà' });
    }

    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

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
      where: { id }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    // Vérifier les permissions (utilisateur ne peut modifier que ses produits)
    if (req.user.role === 'professional' && existingProduct.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé à ce produit' })
    }

    // Générer un nouveau slug si le nom change
    let slug = existingProduct.slug
    if (name && name !== existingProduct.name) {
      slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        slug,
        description: description !== undefined ? description : existingProduct.description,
        category: category || existingProduct.category,
        subcategory: subcategory !== undefined ? subcategory : existingProduct.subcategory,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        comparePrice: comparePrice !== undefined ? parseFloat(comparePrice) : existingProduct.comparePrice,
        cost: cost !== undefined ? parseFloat(cost) : existingProduct.cost,
        sku: sku !== undefined ? sku : existingProduct.sku,
        barcode: barcode !== undefined ? barcode : existingProduct.barcode,
        quantity: quantity !== undefined ? parseInt(quantity) : existingProduct.quantity,
        lowStock: lowStock !== undefined ? parseInt(lowStock) : existingProduct.lowStock,
        weight: weight !== undefined ? parseFloat(weight) : existingProduct.weight,
        dimensions: dimensions !== undefined ? dimensions : existingProduct.dimensions,
        images: Array.isArray(images) ? images : existingProduct.images,
        status: status || existingProduct.status,
        featured: featured !== undefined ? !!featured : existingProduct.featured,
        visibility: visibility || existingProduct.visibility,
        seoTitle: seoTitle !== undefined ? seoTitle : existingProduct.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existingProduct.seoDescription,
        publishedAt: status === 'active' && existingProduct.status !== 'active' ? new Date() : existingProduct.publishedAt,
        updatedAt: new Date()
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true
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
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    if (req.user.role === 'professional' && existingProduct.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé à ce produit' });
    }

    await prisma.product.delete({ where: { id } });

    // 🔔 Notification suppression produit
    const io = req.app.get("io");
    await createNotification({
      userId: req.user.id,
      type: "info",
      title: "Produit supprimé",
      message: `Le produit "${existingProduct.name}" a été supprimé.`,
      relatedEntity: "product",
      relatedEntityId: existingProduct.id,
      io
    });

    res.json({ success: true, message: 'Produit supprimé avec succès et notification envoyée' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});


module.exports = router