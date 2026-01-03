// routes/ProduitsArtEtCreation.js - VERSION FINALE SANS MODIFICATION SCHEMA
const express = require('express');
const multer = require('multer');
const { uploadToSupabase } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const VALID_TYPES = ['photographie', 'sculpture', 'peinture', 'artisanat'];
const VALID_CATEGORIES = [
  // PHOTOGRAPHIE
  "Photographe portrait",
  "Photographe paysage",
  "Photographe événementiel",
  "Photographe artistique",
  "Photographe de mode",
  
  // SCULPTURE
  "Sculpteur sur bois",
  "Sculpteur sur pierre",
  "Sculpteur sur métal",
  "Sculpteur terre cuite",
  "Sculpteur contemporain",
  
  // PEINTURE
  "Peintre à l'huile",
  "Peintre aquarelle",
  "Peintre acrylique",
  "Peintre mural",
  "Peintre abstrait",
  "Peintre portraitiste",
  
  // ARTISANAT
  "Artisan céramiste",
  "Artisan tisserand",
  "Artisan maroquinier",
  "Artisan bijoutier",
  "Artisan ébéniste",
  "Artisan verrier",
  "Artisan vannier",
  "Artisan maroquinier d'art"
];

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

// ✅ 2. ROUTE DE CRÉATION COMPLÈTE - CORRIGÉE POUR MODÈLE EXISTANT
router.post('/create', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /create - Body:', req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    
    const { 
      name, 
      description, 
      type,          // Type principal: photographie, sculpture, peinture, artisanat
      category,      // Métier spécifique
      price, 
      status = 'published',
      images = [],
      dimensions = {},
      materials,
      creationDate,
      artistName
    } = req.body;
    
    // Validation des champs requis
    const requiredFields = ['name', 'type', 'category', 'price'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Champs manquants', 
        required: requiredFields,
        missing: missingFields
      });
    }
    
    // Validation du type
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ 
        error: 'Type invalide', 
        validTypes: VALID_TYPES,
        received: type
      });
    }
    
    // Validation de la catégorie (métier)
    if (!VALID_CATEGORIES.includes(category)) {
      const typeCategories = {
        'photographie': VALID_CATEGORIES.slice(0, 5),
        'sculpture': VALID_CATEGORIES.slice(5, 10),
        'peinture': VALID_CATEGORIES.slice(10, 16),
        'artisanat': VALID_CATEGORIES.slice(16)
      };
      
      return res.status(400).json({ 
        error: 'Catégorie invalide', 
        validCategories: typeCategories[type] || [],
        received: category
      });
    }
    
    // Validation du prix
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ 
        error: 'Prix invalide', 
        message: 'Le prix doit être un nombre positif'
      });
    }
    
    if (priceNum === 0) {
      return res.status(400).json({ 
        error: 'Prix invalide', 
        message: 'Le prix doit être supérieur à 0'
      });
    }
    
    // Validation des images
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        error: 'Images requises', 
        message: 'Au moins une image est requise'
      });
    }
    
    // Traiter les dimensions et ajouter toutes les métadonnées
    let parsedDimensions = {};
    if (dimensions) {
      try {
        parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      } catch (e) {
        parsedDimensions = { raw: dimensions };
      }
    }
    
    // Ajouter les métadonnées spécifiques aux œuvres dans dimensions
    const artworkMetadata = {
      ...parsedDimensions,
      // Informations artistiques
      materials: materials || parsedDimensions.materials || '',
      creationDate: creationDate || parsedDimensions.creationDate || null,
      artistName: artistName || req.user.companyName || `${req.user.firstName} ${req.user.lastName}`,
      type: type, // Stocker le type ici aussi pour facilité d'accès
      category: category,
      // Pour compatibilité avec le panier
      isArtwork: true,
      artworkType: type
    };
    
    // Créer le slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      + '-' + Date.now();
    
    // CRÉATION DU PRODUIT - Utiliser les champs existants du modèle
    const product = await prisma.product.create({
      data: {
        // Champs de base
        name,
        slug,
        description: description || '',
        
        // Utilisation des champs existants pour l'art
        category: category,           // Métier spécifique (ex: "Peintre à l'huile")
        subcategory: type,            // Type principal (ex: "peinture")
        productType: 'artwork',       // IMPORTANT: identifier les œuvres d'art
        
        // Prix et statut
        price: priceNum,
        status: status,
        
        // Images
        images: Array.isArray(images) ? images : [],
        
        // Métadonnées dans dimensions (JSON)
        dimensions: artworkMetadata,
        
        // Propriétaire
        userId: req.user.id,
        
        // Champs requis par le modèle avec valeurs par défaut adaptées
        comparePrice: null,
        cost: null,
        trackQuantity: true,           // Pour gérer le stock des œuvres
        quantity: 1,                   // Œuvre unique par défaut
        weight: null,
        featured: false,
        visibility: 'public',
        viewCount: 0,
        clickCount: 0,
        purchaseCount: 0,
        publishedAt: status === 'published' ? new Date() : null,
        
        // Champs alimentaires (garder null pour œuvres)
        allergens: [],
        brand: null,
        expiryDate: null,
        foodCategory: null,
        isVegan: null,
        isVegetarian: null,
        healthScore: null,
        isOrganic: null,
        isPerishable: null,
        nutritionalInfo: null,
        origin: null,
        storageTips: null,
        unit: null,
        sku: `ART-${Date.now()}`,     // Générer un SKU unique
        barcode: null
      }
    });
    
    console.log('✅ Œuvre d\'art créée:', {
      id: product.id,
      name: product.name,
      type: product.subcategory,
      category: product.category,
      status: product.status,
      productType: product.productType,
      quantity: product.quantity
    });
    
    // Récupérer les infos utilisateur pour la réponse
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        firstName: true,
        lastName: true,
        companyName: true,
        commercialName: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Œuvre créée avec succès',
      product: {
        id: product.id,
        name: product.name,
        type: product.subcategory,     // Depuis subcategory
        category: product.category,    // Depuis category
        productType: product.productType,
        price: product.price,
        status: product.status,
        images: product.images,
        slug: product.slug,
        dimensions: product.dimensions,
        quantity: product.quantity,
        createdAt: product.createdAt,
        artist: {
          id: req.user.id,
          name: user?.companyName || user?.commercialName || 
                `${user?.firstName} ${user?.lastName}`.trim() || req.user.email
        }
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR création œuvre:', error);
    console.error('❌ Stack:', error.stack);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Erreur de contrainte unique',
        message: 'Une œuvre avec ce nom existe déjà',
        field: error.meta?.target || 'slug'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'œuvre',
      message: error.message,
      code: error.code,
      // Stack seulement en développement
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// ✅ 3. ROUTE GET POUR RÉCUPÉRER LES PRODUITS - CORRIGÉE POUR UTILISER SUBCATEGORY
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { 
      limit = 20, 
      page = 1,
      status,
      type,        // Filtrer par type (stocké dans subcategory)
      category     // Filtrer par métier (stocké dans category)
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      userId: userId,
      productType: 'artwork'  // Seulement les œuvres d'art
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.subcategory = type;  // Filtrer par type (stocké dans subcategory)
    }

    if (category) {
      where.category = category; // Filtrer par métier (stocké dans category)
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

    // Formater les produits pour retourner type depuis subcategory
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.name,
      name: product.name,
      description: product.description,
      type: product.subcategory,     // Type depuis subcategory
      category: product.category,    // Métier depuis category
      price: product.price,
      status: product.status,
      images: product.images,
      dimensions: product.dimensions,
      creationDate: product.dimensions?.creationDate || null,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
      userId: product.userId,
      user: product.User,
      slug: product.slug
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

// ✅ 4. ROUTE GET POUR UN PRODUIT SPÉCIFIQUE - CORRIGÉE
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
        type: product.subcategory,     // Type depuis subcategory
        category: product.category,    // Métier depuis category
        price: product.price,
        status: product.status,
        images: product.images,
        dimensions: product.dimensions,
        creationDate: product.dimensions?.creationDate || null,
        createdAt: product.createdAt,
        publishedAt: product.publishedAt,
        userId: product.userId,
        user: product.User,
        slug: product.slug
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

// ✅ 5. ROUTE POUR RÉCUPÉRER LES CATÉGORIES PAR TYPE
router.get('/categories/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validation du type
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Type invalide',
        validTypes: VALID_TYPES
      });
    }
    
    // Filtrer les catégories par type
    const typeCategories = {
      'photographie': VALID_CATEGORIES.slice(0, 5),
      'sculpture': VALID_CATEGORIES.slice(5, 10),
      'peinture': VALID_CATEGORIES.slice(10, 16),
      'artisanat': VALID_CATEGORIES.slice(16)
    };
    
    res.json({
      success: true,
      type: type,
      categories: typeCategories[type] || []
    });
    
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories'
    });
  }
});

// ✅ 6. ROUTE DELETE
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

// ✅ 7. ROUTE PUT POUR METTRE À JOUR UN PRODUIT - CORRIGÉE
router.put('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    const { 
      name, 
      description, 
      type,
      category,
      price, 
      status,
      images,
      dimensions
    } = req.body;
    
    // Vérifier que le produit existe et appartient à l'utilisateur
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: userId,
        productType: 'artwork'
      }
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }
    
    // Validation si type ou category sont fournis
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ 
        error: 'Type invalide', 
        validTypes: VALID_TYPES
      });
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        error: 'Catégorie invalide', 
        validCategories: VALID_CATEGORIES
      });
    }
    
    // Vérifier la cohérence type/category si les deux sont fournis
    if (type && category) {
      const typeCategories = {
        'photographie': VALID_CATEGORIES.slice(0, 5),
        'sculpture': VALID_CATEGORIES.slice(5, 10),
        'peinture': VALID_CATEGORIES.slice(10, 16),
        'artisanat': VALID_CATEGORIES.slice(16)
      };
      
      if (!typeCategories[type]?.includes(category)) {
        return res.status(400).json({ 
          error: 'Incohérence type/catégorie', 
          message: 'La catégorie ne correspond pas au type sélectionné'
        });
      }
    }
    
    // Préparer les données de mise à jour
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.subcategory = type;     // Mettre à jour subcategory
    if (category !== undefined) updateData.category = category; // Mettre à jour category
    if (price !== undefined) updateData.price = parseFloat(price);
    if (status !== undefined) updateData.status = status;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (dimensions !== undefined) {
      try {
        updateData.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
      } catch (e) {
        updateData.dimensions = { raw: dimensions };
      }
    }
    
    // Mettre à jour publishedAt si le statut passe à 'published'
    if (status === 'published' && existingProduct.status !== 'published') {
      updateData.publishedAt = new Date();
    }
    
    // Mettre à jour le produit
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });
    
    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        type: updatedProduct.subcategory,   // Retourner depuis subcategory
        category: updatedProduct.category,  // Retourner depuis category
        status: updatedProduct.status,
        price: updatedProduct.price
      }
    });
    
  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du produit'
    });
  }
});

// ✅ 8. ROUTE POUR SUPPRIMER UNE IMAGE
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

// ✅ ROUTE PUBLIQUE : Œuvres d'un professionnel spécifique
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    
    console.log('🔍 Route publique appelée pour professionalId:', professionalId);
    
    const { 
      limit = 20, 
      page = 1
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Chercher uniquement les œuvres PUBLIÉES de ce professionnel
    const where = {
      userId: professionalId,
      productType: 'artwork',
      status: 'published',  // Important : seulement les œuvres publiées
    };

    console.log('📊 Requête Prisma WHERE:', where);

    const [products, total, professional] = await Promise.all([
      // 1. Récupérer les œuvres
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
              commercialName: true,
              city: true
            }
          }
        }
      }),
      
      // 2. Compter le total
      prisma.product.count({ where }),
      
      // 3. Récupérer les infos du professionnel
      prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          commercialName: true,
          avatar: true,
          city: true
        }
      })
    ]);

    console.log('📦 Résultats:', {
      productsCount: products.length,
      totalCount: total,
      professional: professional
    });

    // Formater les œuvres pour votre frontend OeuvrePages
    const formattedOeuvres = products.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      images: product.images,
      price: product.price,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
      // Vous pouvez ajouter d'autres champs si besoin
      artist: product.User?.companyName || 
              `${product.User?.firstName} ${product.User?.lastName}`.trim(),
      userId: product.userId,
      category: product.category,
      type: product.subcategory
    }));

    res.json({
      success: true,
      count: products.length,
      total,
      data: formattedOeuvres,
      professional: professional,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération œuvres publiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des œuvres'
    });
  }
});



module.exports = router;