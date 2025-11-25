// routes/courses.js
const express = require("express");
const { prisma } = require("../lib/db");
const { upload, uploadToSupabase } = require("../middleware/upload");
const router = express.Router();

// Configuration Multer pour les cours
const courseUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

// GET /api/courses - Liste des cours
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, professionalId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('📚 [COURSES] Récupération cours - Page:', page, 'Limit:', limit, 'Catégorie:', category, 'Recherche:', search);

    const where = { isActive: true };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (professionalId) {
      where.professionalId = professionalId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            city: true
          }
        },
        availabilities: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.course.count({ where });

    console.log('✅ [COURSES]', courses.length, 'cours récupérés sur', total);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error("❌ [COURSES] Erreur lors de la récupération des cours:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// GET /api/courses/categories - Catégories disponibles
router.get("/categories", async (req, res) => {
  try {
    console.log('📂 [COURSES CATEGORIES] Récupération des catégories');

    const categories = await prisma.course.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).filter(Boolean).sort();

    console.log('✅ [COURSES CATEGORIES]', categoryList.length, 'catégories récupérées');

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error("❌ [COURSES CATEGORIES] Erreur:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// POST /api/courses - Créer un nouveau cours
router.post("/", courseUpload, async (req, res) => {
  let uploadedFiles = [];
  
  try {
    const {
      professionalId,
      category,
      title,
      description,
      price,
      priceUnit = "session",
      duration,
      maxParticipants,
      materialsIncluded = false,
      level = "Tous niveaux",
      availabilities = "[]"
    } = req.body;

    console.log('🎯 [CREATE COURSE] Données reçues:', {
      professionalId,
      category,
      title,
      price,
      duration,
      maxParticipants
    });

    // Validation des champs requis
    if (!professionalId || !category || !title || !price) {
      console.log('❌ [CREATE COURSE] Champs manquants');
      return res.status(400).json({
        success: false,
        message: "professionalId, category, title et price sont requis"
      });
    }

    // Vérifier que le professionnel existe
    const professional = await prisma.user.findUnique({
      where: { id: professionalId }
    });

    if (!professional) {
      console.log('❌ [CREATE COURSE] Professionnel non trouvé:', professionalId);
      return res.status(404).json({
        success: false,
        message: "Professionnel non trouvé"
      });
    }

    let imageUrl = null;
    let documents = [];

    // Upload de l'image principale
    if (req.files?.image?.[0]) {
      console.log('📤 [CREATE COURSE] Upload image...');
      const imageFile = req.files.image[0];
      const imageData = await uploadToSupabase(imageFile, "courses/images");
      imageUrl = imageData.url;
      uploadedFiles.push({ type: 'image', path: imageData.path });
      console.log('✅ [CREATE COURSE] Image uploadée:', imageUrl);
    }

    // Upload des documents
    if (req.files?.documents) {
      console.log('📤 [CREATE COURSE] Upload documents...');
      for (const docFile of req.files.documents) {
        const docData = await uploadToSupabase(docFile, "courses/documents");
        documents.push({
          name: docFile.originalname,
          url: docData.url,
          type: docFile.mimetype,
          size: docFile.size
        });
        uploadedFiles.push({ type: 'document', path: docData.path });
      }
      console.log('✅ [CREATE COURSE] Documents uploadés:', documents.length);
    }

    // Parser les disponibilités
    let availabilityData = [];
    try {
      availabilityData = JSON.parse(availabilities);
    } catch (e) {
      console.warn('⚠️ [CREATE COURSE] Erreur parsing disponibilités:', e.message);
    }

    // Créer le cours dans la base de données
    console.log('💾 [CREATE COURSE] Création en base de données...');
    const course = await prisma.course.create({
      data: {
        professionalId,
        category,
        title,
        description,
        price: parseFloat(price),
        priceUnit,
        durationMinutes: parseInt(duration) || 60,
        maxParticipants: parseInt(maxParticipants) || 1,
        materialsIncluded: materialsIncluded === 'true',
        level,
        imageUrl,
        documents,
        availabilities: {
          create: availabilityData.map(avail => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isRecurring: avail.isRecurring !== false
          }))
        }
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true
          }
        },
        availabilities: true
      }
    });

    console.log('✅ [CREATE COURSE] Cours créé avec succès:', course.id);

    res.status(201).json({
      success: true,
      data: course,
      message: "Cours créé avec succès"
    });

  } catch (error) {
    console.error("❌ [CREATE COURSE] Erreur lors de la création du cours:", error);
    
    // Nettoyer les fichiers uploadés en cas d'erreur
    if (uploadedFiles.length > 0) {
      console.log('🧹 [CREATE COURSE] Nettoyage des fichiers uploadés...');
      // Implémenter la suppression des fichiers de Supabase si nécessaire
    }
    
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// PUT /api/courses/:id - Mettre à jour un cours
router.put("/:id", courseUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      title,
      description,
      price,
      priceUnit,
      duration,
      maxParticipants,
      materialsIncluded,
      level,
      availabilities = "[]"
    } = req.body;

    console.log('🔄 [UPDATE COURSE] Mise à jour cours ID:', id);

    // Vérifier si le cours existe
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: { availabilities: true }
    });

    if (!existingCourse) {
      console.log('❌ [UPDATE COURSE] Cours non trouvé:', id);
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    let imageUrl = existingCourse.imageUrl;

    // Upload de la nouvelle image si fournie
    if (req.files?.image?.[0]) {
      console.log('📤 [UPDATE COURSE] Upload nouvelle image...');
      const imageFile = req.files.image[0];
      const imageData = await uploadToSupabase(imageFile, "courses/images");
      imageUrl = imageData.url;
      
      // TODO: Supprimer l'ancienne image si nécessaire
    }

    // Parser les nouvelles disponibilités
    let availabilityData = [];
    try {
      availabilityData = JSON.parse(availabilities);
    } catch (e) {
      console.warn('⚠️ [UPDATE COURSE] Erreur parsing disponibilités:', e.message);
    }

    // Mettre à jour le cours
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(priceUnit && { priceUnit }),
        ...(duration && { durationMinutes: parseInt(duration) }),
        ...(maxParticipants && { maxParticipants: parseInt(maxParticipants) }),
        ...(materialsIncluded !== undefined && { materialsIncluded: materialsIncluded === 'true' }),
        ...(level && { level }),
        ...(imageUrl && { imageUrl }),
        availabilities: {
          deleteMany: {}, // Supprimer les anciennes disponibilités
          create: availabilityData.map(avail => ({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isRecurring: avail.isRecurring !== false
          }))
        }
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true
          }
        },
        availabilities: true
      }
    });

    console.log('✅ [UPDATE COURSE] Cours mis à jour avec succès:', id);

    res.json({
      success: true,
      data: course,
      message: "Cours mis à jour avec succès"
    });

  } catch (error) {
    console.error("❌ [UPDATE COURSE] Erreur lors de la mise à jour:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// DELETE /api/courses/:id - Supprimer un cours (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ [DELETE COURSE] Suppression cours ID:', id);

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      console.log('❌ [DELETE COURSE] Cours non trouvé:', id);
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    // Soft delete
    await prisma.course.update({
      where: { id },
      data: { isActive: false }
    });

    console.log('✅ [DELETE COURSE] Cours désactivé avec succès:', id);

    res.json({
      success: true,
      message: "Cours supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ [DELETE COURSE] Erreur lors de la suppression:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// GET /api/courses/professional/:professionalId - Cours d'un professionnel
router.get("/professional/:professionalId", async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('👨‍🏫 [PROFESSIONAL COURSES] Récupération cours pour professionnel:', professionalId);

    const courses = await prisma.course.findMany({
      where: { 
        professionalId,
        isActive: true 
      },
      include: {
        availabilities: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.course.count({ 
      where: { professionalId, isActive: true } 
    });

    console.log('✅ [PROFESSIONAL COURSES]', courses.length, 'cours récupérés');

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error("❌ [PROFESSIONAL COURSES] Erreur:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

module.exports = router;