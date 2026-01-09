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
        quantity: req.body.quantity || 1, // Prendre la quantité du formulaire
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

// ✅ 7. ROUTE PUT POUR METTRE À JOUR UN PRODUIT - VERSION CORRIGÉE COMPLÈTE
router.put('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    
    console.log('🔄 [PUT] Mise à jour produit - ID:', productId, 'User:', userId);
    console.log('📝 Body reçu:', JSON.stringify(req.body, null, 2));
    
    // Vérification plus stricte de l'ID
    if (!productId || productId.trim() === '' || productId === 'undefined' || productId === 'null') {
      console.log('❌ ID invalide:', productId);
      return res.status(400).json({
        success: false,
        error: 'ID de produit invalide'
      });
    }
    
    // Chercher le produit AVANT la mise à jour
    console.log('🔍 Recherche produit existant avec ID:', productId);
    const existingProduct = await prisma.product.findUnique({
      where: { 
        id: productId
      },
      select: {
        id: true,
        userId: true,
        productType: true,
        name: true,
        category: true,
        subcategory: true,
        dimensions: true,
        images: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📋 Produit existant trouvé:', existingProduct);
    
    // Vérifier que le produit existe
    if (!existingProduct) {
      console.log('❌ Produit non trouvé dans la base de données');
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }
    
    // Vérifier les permissions
    if (existingProduct.userId !== userId) {
      console.log('❌ Permission refusée: user', userId, '!=', existingProduct.userId);
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }
    
    // Vérifier que c'est bien une œuvre d'art
    if (existingProduct.productType !== 'artwork') {
      console.log('❌ Mauvais type de produit:', existingProduct.productType);
      return res.status(400).json({
        success: false,
        error: 'Ce produit n\'est pas une œuvre d\'art'
      });
    }
    
    // Récupérer les données de la requête
    const { 
      name, 
      description, 
      type,
      category,
      price, 
      status,
      images,
      dimensions,
      materials,
      creationDate,
      quantity
    } = req.body;
    
    console.log('📊 Données de mise à jour:', {
      name, type, category, price, status,
      imagesCount: images?.length || 0,
      hasDimensions: !!dimensions,
      hasMaterials: !!materials,
      quantity
    });
    
    // Validation des données
    const updateData = {};
    
    // 1. Validation et préparation du nom et slug
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Le nom est requis et doit être une chaîne non vide'
        });
      }
      updateData.name = name.trim();
      
      // Regénérer le slug uniquement si le nom a changé
      if (name.trim() !== existingProduct.name) {
        const newSlug = name.trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          + '-' + Date.now();
        updateData.slug = newSlug;
        console.log('🆕 Nouveau slug généré:', newSlug);
      }
    }
    
    // 2. Validation de la description
    if (description !== undefined) {
      updateData.description = description || '';
    }
    
    // 3. Validation du type
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ 
          success: false,
          error: 'Type invalide', 
          validTypes: VALID_TYPES,
          received: type
        });
      }
      updateData.subcategory = type;
    }
    
    // 4. Validation de la catégorie (métier)
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        const typeForValidation = type || existingProduct.subcategory;
        const typeCategories = {
          'photographie': VALID_CATEGORIES.slice(0, 5),
          'sculpture': VALID_CATEGORIES.slice(5, 10),
          'peinture': VALID_CATEGORIES.slice(10, 16),
          'artisanat': VALID_CATEGORIES.slice(16)
        };
        
        const validForType = typeCategories[typeForValidation] || [];
        
        if (!validForType.includes(category)) {
          return res.status(400).json({ 
            success: false,
            error: 'Catégorie invalide pour ce type', 
            validCategories: validForType,
            received: category,
            type: typeForValidation
          });
        }
      }
      updateData.category = category;
    }
    
    // 5. Validation du prix
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Prix invalide', 
          message: 'Le prix doit être un nombre positif'
        });
      }
      
      if (priceNum === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Prix invalide', 
          message: 'Le prix doit être supérieur à 0'
        });
      }
      
      updateData.price = priceNum;
    }
    
    // 6. Validation du statut
    if (status !== undefined) {
      const validStatuses = ['published', 'draft', 'sold'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Statut invalide',
          validStatuses: validStatuses
        });
      }
      updateData.status = status;
      
      // Mettre à jour publishedAt en fonction du statut
      if (status === 'published' && existingProduct.status !== 'published') {
        updateData.publishedAt = new Date();
        console.log('📅 Date de publication mise à jour');
      } else if (status !== 'published' && existingProduct.status === 'published') {
        updateData.publishedAt = null;
        console.log('📅 Date de publication annulée');
      }
    }
    
    // 7. Validation des images
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          error: 'Les images doivent être un tableau'
        });
      }
      
      if (images.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Au moins une image est requise'
        });
      }
      
      updateData.images = images;
    }
    
    // 8. Validation de la quantité
    if (quantity !== undefined) {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantité invalide',
          message: 'La quantité doit être un nombre positif'
        });
      }
      updateData.quantity = quantityNum;
    }
    
    // 9. Gestion des dimensions et métadonnées
    if (dimensions !== undefined || materials !== undefined || creationDate !== undefined) {
      let newDimensions = { ...existingProduct.dimensions };
      
      // Mettre à jour les dimensions si fournies
      if (dimensions !== undefined) {
        try {
          const parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
          newDimensions = {
            ...newDimensions,
            ...parsedDimensions
          };
        } catch (e) {
          // Si ce n'est pas du JSON valide, traiter comme une chaîne simple
          newDimensions = { 
            ...newDimensions,
            raw: dimensions 
          };
        }
      }
      
      // Ajouter/Mettre à jour les métadonnées spécifiques
      if (materials !== undefined) newDimensions.materials = materials;
      if (creationDate !== undefined) newDimensions.creationDate = creationDate;
      
      // Toujours mettre à jour le type et la catégorie dans les dimensions
      newDimensions.type = type || existingProduct.subcategory;
      newDimensions.category = category || existingProduct.category;
      newDimensions.isArtwork = true;
      newDimensions.artworkType = type || existingProduct.subcategory;
      
      updateData.dimensions = newDimensions;
    } else {
      // Même si aucune dimension n'est fournie, s'assurer que le type est à jour
      const currentDimensions = existingProduct.dimensions || {};
      updateData.dimensions = {
        ...currentDimensions,
        type: type || existingProduct.subcategory,
        category: category || existingProduct.category
      };
    }
    
    console.log('📤 Données à mettre à jour:', JSON.stringify(updateData, null, 2));
    
    // Vérifier s'il y a des modifications
    const hasChanges = Object.keys(updateData).length > 0;
    if (!hasChanges) {
      console.log('⚠️ Aucune modification à apporter');
      return res.status(200).json({
        success: true,
        message: 'Aucune modification nécessaire',
        product: existingProduct
      });
    }
    
    // Mettre à jour le produit EXISTANT
    console.log('💾 Début de la mise à jour dans la base de données...');
    const updatedProduct = await prisma.product.update({
      where: { 
        id: productId
      },
      data: updateData
    });
    
    console.log('✅ Produit mis à jour avec succès:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      previousName: existingProduct.name,
      changes: Object.keys(updateData)
    });
    
    // Récupérer les informations utilisateur pour la réponse
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        companyName: true,
        commercialName: true,
        avatar: true
      }
    });
    
    // Formater la réponse
    const responseData = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      type: updatedProduct.subcategory,
      category: updatedProduct.category,
      price: updatedProduct.price,
      status: updatedProduct.status,
      images: updatedProduct.images,
      description: updatedProduct.description,
      dimensions: updatedProduct.dimensions,
      quantity: updatedProduct.quantity,
      createdAt: updatedProduct.createdAt,
      publishedAt: updatedProduct.publishedAt,
      productType: updatedProduct.productType,
      artist: {
        id: userId,
        name: user?.companyName || user?.commercialName || 
              `${user?.firstName} ${user?.lastName}`.trim() || req.user.email
      }
    };
    
    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: responseData,
      changes: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERREUR mise à jour produit:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé',
        message: 'Le produit que vous essayez de mettre à jour n\'existe pas'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Erreur de contrainte unique',
        message: 'Une œuvre avec ce nom/slug existe déjà',
        field: error.meta?.target || 'unknown'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Violation de contrainte de clé étrangère',
        message: 'Erreur de relation avec l\'utilisateur'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du produit',
      message: error.message,
      code: error.code,
      // Stack seulement en développement
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
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
      quantity: { gt: 0 }
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