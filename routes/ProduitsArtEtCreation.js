// routes/ProduitsArtEtCreation.js - VERSION CORRIGÉE
const express = require('express');
const multer = require('multer');
const { uploadToSupabase } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client'); // IMPORTATION MANQUANTE

const router = express.Router();
const prisma = new PrismaClient(); // INITIALISATION MANQUANTE
const upload = multer({ storage: multer.memoryStorage() });

// ✅ 1. ROUTE D'UPLOAD
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📤 Upload d\'image pour userId:', userId);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier uploadé'
      });
    }

    const uploadResult = await uploadToSupabase(req.file, `artworks/${userId}`);
    
    res.status(200).json({
      success: true,
      url: uploadResult.url,
      path: uploadResult.path,
      filename: req.file.originalname,
      fullUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${uploadResult.path}`
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload'
    });
  }
});

// ✅ 2. ROUTE DE CRÉATION COMPLÈTE
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /create - Body:', req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    
    const { 
      name, 
      description, 
      category, 
      price, 
      status = 'draft',
      images = [],
      dimensions = {}
    } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ 
        error: 'Champs manquants', 
        required: ['name', 'category', 'price'] 
      });
    }
    
    // Traiter les dimensions si c'est un string JSON
    let parsedDimensions = {};
    if (dimensions) {
      try {
        parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      } catch (e) {
        parsedDimensions = { raw: dimensions };
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        description: description || '',
        category,
        price: parseFloat(price),
        status: status,
        images: Array.isArray(images) ? images : [],
        dimensions: parsedDimensions,
        userId: req.user.id,
        productType: 'artwork',
        subcategory: null,
        comparePrice: null,
        cost: null,
        trackQuantity: true,
        quantity: 1,
        weight: null,
        featured: false,
        visibility: 'public',
        viewCount: 0,
        clickCount: 0,
        purchaseCount: 0
      }
    });
    
    console.log('✅ Produit créé:', product.id);
    
    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        status: product.status,
        images: product.images
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR création:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du produit',
      message: error.message,
      code: error.code
    });
  }
});

// ✅ 3. ROUTE GET POUR RÉCUPÉRER LES PRODUITS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { 
      limit = 20, 
      page = 1,
      status,
      category
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      userId: userId,
      productType: 'artwork'
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              companyName: true,
              commercialName: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.name,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      status: product.status,
      images: product.images,
      dimensions: product.dimensions,
      creationDate: product.dimensions?.creationDate || null,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
      userId: product.userId,
      user: product.User
    }));

    res.json({
      success: true,
      count: products.length,
      total,
      data: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des œuvres'
    });
  }
});

// ✅ 4. ROUTE GET POUR UN PRODUIT SPÉCIFIQUE
router.get('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: userId,
        productType: 'artwork'
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
            commercialName: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        id: product.id,
        title: product.name,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        status: product.status,
        images: product.images,
        dimensions: product.dimensions,
        creationDate: product.dimensions?.creationDate || null,
        createdAt: product.createdAt,
        publishedAt: product.publishedAt,
        userId: product.userId,
        user: product.User
      }
    });

  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du produit'
    });
  }
});

// ✅ 5. ROUTE DELETE
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    console.log('🗑️ Suppression produit - User:', userId, 'Product:', productId);

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    if (product.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à supprimer ce produit'
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// ✅ 6. ROUTE POUR SUPPRIMER UNE IMAGE (OPTIONNEL)
router.delete('/delete/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // NOTE: Implémentez la suppression sur Supabase si nécessaire
    // const { deleteFromSupabase } = require('../middleware/upload');
    // await deleteFromSupabase(filename);
    
    console.log('📷 Suppression image:', filename);
    
    res.json({
      success: true,
      message: 'Image supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur suppression image'
    });
  }
});

module.exports = router;