const express = require('express');
const router = express.Router();
const fs = require('fs');
const { prisma } = require('../lib/db');
const { supabase } = require('../lib/supabase');
const { authenticateToken } = require('../middleware/auth');
const { uploadImage, cleanupTempFiles } = require('../middleware/uploadMedia');

/**
 * 🔧 Upload d'image vers Supabase
 */
async function uploadImageToSupabase(file, folder = 'patrimoine-images') {
  try {
    // Lire le fichier en mémoire
    const fileBuffer = fs.readFileSync(file.path);
    
    // Générer un nom de fichier unique
    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    
    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw new Error(`Échec upload: ${error.message}`);
    }
    
    // Obtenir l'URL publique
    const { data: publicUrl } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);
    
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('❌ Erreur dans uploadImageToSupabase:', error);
    throw error;
  }
}

/**
 * 🔧 Upload route pour images multiples
 */
router.post(
  '/upload/image',
  authenticateToken,
  uploadImage,
  cleanupTempFiles,
  async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return res.status(400).json({
          success: false,
          message: 'Aucune image reçue',
        });
      }
      
      const imageUrl = await uploadImageToSupabase(req.files.image[0]);
      
      return res.status(200).json({
        success: true,
        url: imageUrl,
        message: 'Image uploadée avec succès',
      });
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'upload de l\'image',
      });
    }
  }
);

/**
 * 📌 POST /api/patrimoine
 * Création d'un patrimoine culturel
 */
router.post(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        type,
        category,
        city,
        description,
        lat,
        lng,
        images = [],
        year,
        rating = 4.5,
        reviewCount = 0,
        featured = false,
      } = req.body;
      
      const userId = req.user.id;
      
      // Validation des champs obligatoires
      const errors = {};
      
      if (!title || !title.trim()) {
        errors.title = 'Titre requis';
      }
      
      if (!category || !category.trim()) {
        errors.category = 'Catégorie requise';
      }
      
      if (!city || !city.trim()) {
        errors.city = 'Localisation requise';
      }
      
      if (!description || !description.trim()) {
        errors.description = 'Description requise';
      } else if (description.trim().length < 20) {
        errors.description = 'Description trop courte (minimum 20 caractères)';
      }
      
      if (typeof lat === 'undefined' || typeof lng === 'undefined') {
        errors.coordinates = 'Coordonnées requises';
      }
      
      // Vérifier que type = "patrimoine" (obligatoire du frontend)
      if (type !== 'patrimoine') {
        errors.type = 'Type invalide. Doit être "patrimoine"';
      }
      
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation échouée',
          errors,
        });
      }
      
      // Validation des images
      let imageArray = [];
      if (images && Array.isArray(images)) {
        imageArray = images.filter(url => 
          typeof url === 'string' && url.startsWith('http')
        );
      } else if (typeof images === 'string') {
        imageArray = [images];
      }
      
      // Créer l'ID unique
      const idUnique = `patrimoine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convertir les valeurs numériques
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const ratingNum = parseFloat(rating) || 4.5;
      const reviewCountNum = parseInt(reviewCount) || 0;
      const yearNum = year ? parseInt(year) : null;
      
      // Créer le patrimoine dans la base de données
      const patrimoine = await prisma.Patrimoine.create({
        data: {
          idUnique,
          title: title.trim(),
          category: category.trim(),
          city: city.trim(),
          description: description.trim(),
          lat: latNum,
          lng: lngNum,
          images: imageArray,
          userId,
          rating: ratingNum,
          reviewCount: reviewCountNum,
          featured: Boolean(featured),
          year: yearNum,
        },
      });
      
      // Formater la réponse
      const response = {
        id: patrimoine.id,
        idUnique: patrimoine.idUnique,
        title: patrimoine.title,
        category: patrimoine.category,
        city: patrimoine.city,
        description: patrimoine.description,
        lat: patrimoine.lat,
        lng: patrimoine.lng,
        images: patrimoine.images,
        year: patrimoine.year,
        rating: patrimoine.rating,
        reviewCount: patrimoine.reviewCount,
        featured: patrimoine.featured,
        userId: patrimoine.userId,
        createdAt: patrimoine.createdAt,
        updatedAt: patrimoine.updatedAt,
      };
      
      return res.status(201).json({
        success: true,
        message: 'Patrimoine créé avec succès',
        data: response,
      });
      
    } catch (error) {
      console.error('❌ Erreur création patrimoine:', error);
      
      // Gestion des erreurs spécifiques
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Un patrimoine avec ces informations existe déjà',
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création du patrimoine',
      });
    }
  }
);


// routes/patrimoine.js - Ajoutez ces routes à la fin du fichier

/**
 * 📌 GET /api/patrimoine/my-patrimoine
 * Récupère tous les patrimoines de l'utilisateur connecté
 */
router.get(
  '/my-patrimoine',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Récupérer les patrimoines de l'utilisateur
      const patrimoines = await prisma.Patrimoine.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              companyName: true
            }
          }
        }
      });
      
      // Formater la réponse
      const formattedPatrimoines = patrimoines.map(patrimoine => ({
        id: patrimoine.id,
        idUnique: patrimoine.idUnique,
        title: patrimoine.title,
        category: patrimoine.category,
        city: patrimoine.city,
        description: patrimoine.description,
        lat: patrimoine.lat,
        lng: patrimoine.lng,
        images: patrimoine.images,
        year: patrimoine.year,
        rating: patrimoine.rating,
        reviewCount: patrimoine.reviewCount,
        featured: patrimoine.featured,
        userId: patrimoine.userId,
        user: patrimoine.user,
        createdAt: patrimoine.createdAt,
        updatedAt: patrimoine.updatedAt,
        // Ajouter l'URL de la première image pour l'affichage
        thumbnail: patrimoine.images.length > 0 ? patrimoine.images[0] : null
      }));
      
      return res.status(200).json({
        success: true,
        count: formattedPatrimoines.length,
        data: formattedPatrimoines
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération patrimoines:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des patrimoines'
      });
    }
  }
);

/**
 * 📌 GET /api/patrimoine/:id
 * Récupère un patrimoine spécifique par ID
 */
// Dans routes/Patrimoine.js - AJOUTEZ CETTE ROUTE
router.get(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Construire la condition WHERE
      let whereCondition = {};
      
      // Si l'utilisateur n'est pas admin, il ne voit que ses propres patrimoines
      if (userRole !== 'professional' && userRole !== 'admin') {
        whereCondition.userId = userId;
      }
      
      // Récupérer tous les patrimoines
      const patrimoines = await prisma.Patrimoine.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              companyName: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json({
        success: true,
        data: patrimoines // C'est un tableau []
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération patrimoines:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des patrimoines'
      });
    }
  }
);
/**
 * 📌 PUT /api/patrimoine/:id
 * Met à jour un patrimoine existant
 */
router.put(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const {
        title,
        category,
        city,
        description,
        lat,
        lng,
        images,
        year,
        rating,
        reviewCount,
        featured
      } = req.body;
      
      // Vérifier que le patrimoine existe et appartient à l'utilisateur
      const existingPatrimoine = await prisma.Patrimoine.findUnique({
        where: { id }
      });
      
      if (!existingPatrimoine) {
        return res.status(404).json({
          success: false,
          message: 'Patrimoine non trouvé'
        });
      }
      
      // Vérifier les permissions
      if (existingPatrimoine.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de modifier ce patrimoine'
        });
      }
      
      // Validation
      const errors = {};
      
      if (title !== undefined && !title.trim()) {
        errors.title = 'Titre requis';
      }
      
      if (category !== undefined && !category.trim()) {
        errors.category = 'Catégorie requise';
      }
      
      if (city !== undefined && !city.trim()) {
        errors.city = 'Localisation requise';
      }
      
      if (description !== undefined) {
        if (!description.trim()) {
          errors.description = 'Description requise';
        } else if (description.trim().length < 20) {
          errors.description = 'Description trop courte (minimum 20 caractères)';
        }
      }
      
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation échouée',
          errors
        });
      }
      
      // Préparer les données de mise à jour
      const updateData = {};
      
      if (title !== undefined) updateData.title = title.trim();
      if (category !== undefined) updateData.category = category.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (lat !== undefined) updateData.lat = parseFloat(lat);
      if (lng !== undefined) updateData.lng = parseFloat(lng);
      if (images !== undefined) updateData.images = Array.isArray(images) ? images : [images];
      if (year !== undefined) updateData.year = year ? parseInt(year) : null;
      if (rating !== undefined) updateData.rating = parseFloat(rating);
      if (reviewCount !== undefined) updateData.reviewCount = parseInt(reviewCount) || 0;
      if (featured !== undefined) updateData.featured = Boolean(featured);
      
      // Mettre à jour le patrimoine
      const updatedPatrimoine = await prisma.Patrimoine.update({
        where: { id },
        data: updateData
      });
      
      return res.status(200).json({
        success: true,
        message: 'Patrimoine mis à jour avec succès',
        data: updatedPatrimoine
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour patrimoine:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Patrimoine non trouvé'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du patrimoine'
      });
    }
  }
);

/**
 * 📌 DELETE /api/patrimoine/:id
 * Supprime un patrimoine
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Vérifier que le patrimoine existe et appartient à l'utilisateur
      const existingPatrimoine = await prisma.Patrimoine.findUnique({
        where: { id }
      });
      
      if (!existingPatrimoine) {
        return res.status(404).json({
          success: false,
          message: 'Patrimoine non trouvé'
        });
      }
      
      // Vérifier les permissions
      if (existingPatrimoine.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de supprimer ce patrimoine'
        });
      }
      
      // Supprimer le patrimoine
      await prisma.Patrimoine.delete({
        where: { id }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Patrimoine supprimé avec succès'
      });
      
    } catch (error) {
      console.error('❌ Erreur suppression patrimoine:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Patrimoine non trouvé'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du patrimoine'
      });
    }
  }
);

/**
 * GET : récupérer tous les patrimoines
 */
router.get('/all', async (req, res) => {
  try {
    const patrimoines = await prisma.patrimoine.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true, // Remplace 'name'
            lastName: true,  // Ajouté
            email: true,
            role: true
          }
        }
      }
    });

    res.status(200).json(patrimoines);
  } catch (error) {
    console.error('❌ Erreur récupération patrimoines:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET : récupérer tous les patrimoines
 * 🔐 Token requis
 * 👤 Rôle requis : user
 */
router.get('/test', authenticateToken, async (req, res) => {
  try {
    // Le middleware authenticateToken met l'utilisateur dans req.user
    const { role } = req.user;

    // Vérification du rôle
    if (role !== 'user') {
      return res.status(403).json({
        message: 'Accès refusé : rôle user requis'
      });
    }

    const patrimoines = await prisma.patrimoine.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true, // ← CORRIGÉ : 'name' → 'firstName'
            lastName: true,  // ← AJOUTÉ pour avoir le nom complet
            email: true
          }
        }
      }
    });

    // Formatage des données pour inclure le nom complet
    const formattedPatrimoines = patrimoines.map(patrimoine => ({
      ...patrimoine,
      user: {
        ...patrimoine.user,
        // Créer un champ name à partir de firstName et lastName
        name: patrimoine.user.firstName && patrimoine.user.lastName 
          ? `${patrimoine.user.firstName} ${patrimoine.user.lastName}`
          : patrimoine.user.firstName || patrimoine.user.email.split('@')[0]
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedPatrimoines,
      pagination: {
        page: 1,
        limit: patrimoines.length,
        total: patrimoines.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération patrimoines:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});


module.exports = router;