const express = require("express");
const { prisma } = require("../lib/db");
const { uploadAudio, uploadVideo, manualCleanup } = require("../middleware/uploadMedia");
const { supabase } = require("../lib/supabase");
const fs = require('fs');
const router = express.Router();

// GET /api/admin/media/stats - Statistiques des médias
router.get("/stats", async (req, res) => {
  try {
    const [podcasts, videos] = await Promise.all([
      prisma.podcast.findMany({
        where: { isActive: true },
        select: { listens: true }
      }),
      prisma.video.findMany({
        where: { isActive: true },
        select: { views: true }
      })
    ]);

    const totalListens = podcasts.reduce((sum, podcast) => sum + (podcast.listens || 0), 0);
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Récupérer toutes les catégories uniques
    const podcastCategories = await prisma.podcast.findMany({
      where: { category: { not: null } },
      select: { category: true }
    });
    
    const videoCategories = await prisma.video.findMany({
      where: { category: { not: null } },
      select: { category: true }
    });

    const allCategories = [...podcastCategories, ...videoCategories]
      .map(item => item.category)
      .filter((category, index, self) => category && self.indexOf(category) === index);

    const stats = {
      totalPodcasts: podcasts.length,
      totalVideos: videos.length,
      totalListens,
      totalViews,
      totalCategories: allCategories.length
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/media/podcasts - Liste des podcasts
router.get("/podcasts", async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const podcasts = await prisma.podcast.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        thumbnailUrl: true,
        duration: true,
        listens: true,
        isActive: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Maintenant un simple string
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: podcasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await prisma.podcast.count({ where })
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des podcasts:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// GET /api/admin/media/videos - Liste des vidéos
router.get("/videos", async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const videos = await prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        isActive: true,
        isPremium: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Maintenant un simple string
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await prisma.video.count({ where })
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des vidéos:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// GET /api/admin/media/categories - Liste des catégories existantes
router.get("/categories", async (req, res) => {
  try {
    // Récupérer toutes les catégories uniques des podcasts et vidéos
    const [podcastCategories, videoCategories] = await Promise.all([
      prisma.podcast.findMany({
        where: { category: { not: null } },
        select: { category: true }
      }),
      prisma.video.findMany({
        where: { category: { not: null } },
        select: { category: true }
      })
    ]);

    const allCategories = [...podcastCategories, ...videoCategories]
      .map(item => item.category)
      .filter((category, index, self) => category && self.indexOf(category) === index)
      .sort();

    res.json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// POST /api/admin/media/podcasts - Créer un podcast
router.post("/podcasts", uploadAudio, async (req, res) => {
  try {
    const { title, description, category, isActive = true, duration } = req.body;
    
    if (!title) {
      manualCleanup(req.files);
      return res.status(400).json({
        success: false,
        message: "Le titre est requis"
      });
    }

    // Upload vers Supabase
    const audioFile = req.files.audio[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    let audioUrl = null;
    let thumbnailUrl = null;
    let fileSize = null;
    let mimeType = null;
    let storagePath = null;

    console.log('📁 Début upload podcast vers Supabase...');

    // Upload audio avec BUFFER
    if (audioFile) {
      console.log('📤 Upload audio:', audioFile.originalname, `(${(audioFile.size / (1024 * 1024)).toFixed(2)} MB)`);
      
      const audioBuffer = fs.readFileSync(audioFile.path);
      const fileName = `podcasts/audio/${Date.now()}-${audioFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data: audioData, error: audioError } = await supabase.storage
        .from('media')
        .upload(fileName, audioBuffer, {
          contentType: audioFile.mimetype,
          cacheControl: '3600'
        });

      if (audioError) {
        console.error('❌ Erreur upload audio:', audioError);
        manualCleanup(req.files);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'upload de l'audio: " + audioError.message
        });
      }

      console.log('✅ Audio uploadé avec succès:', audioData.path);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(audioData.path);
      audioUrl = urlData.publicUrl;
      fileSize = audioFile.size;
      mimeType = audioFile.mimetype;
      storagePath = audioData.path;
      console.log('🔗 URL audio:', audioUrl);
    }

    // Upload thumbnail avec BUFFER
    if (thumbnailFile) {
      console.log('📤 Upload thumbnail:', thumbnailFile.originalname);
      
      const thumbnailBuffer = fs.readFileSync(thumbnailFile.path);
      const thumbnailName = `podcasts/thumbnails/${Date.now()}-${thumbnailFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('media')
        .upload(thumbnailName, thumbnailBuffer, {
          contentType: thumbnailFile.mimetype,
          cacheControl: '3600'
        });

      if (thumbnailError) {
        console.error('❌ Erreur upload thumbnail:', thumbnailError);
        manualCleanup(req.files);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'upload de la miniature: " + thumbnailError.message
        });
      }

      console.log('✅ Thumbnail uploadé avec succès:', thumbnailData.path);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(thumbnailData.path);
      thumbnailUrl = urlData.publicUrl;
      console.log('🔗 URL thumbnail:', thumbnailUrl);
    }

    // Créer le podcast dans la base de données
    console.log('💾 Création en base de données...');
    const podcast = await prisma.podcast.create({
      data: {
        title,
        description,
        audioUrl,
        thumbnailUrl,
        category: category || null, // ← Simple string
        isActive: isActive === 'true',
        listens: 0,
        duration: duration || "00:00:00",
        fileSize,
        mimeType,
        storagePath
      },
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        thumbnailUrl: true,
        duration: true,
        listens: true,
        isActive: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Simple string
        createdAt: true,
        updatedAt: true
      }
    });

    // Nettoyer les fichiers temporaires
    manualCleanup(req.files);

    console.log('✅ Podcast créé avec succès:', podcast.id);

    res.json({
      success: true,
      data: podcast,
      message: "Podcast créé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur lors de la création du podcast:", error);
    manualCleanup(req.files);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// POST /api/admin/media/videos - Créer une vidéo
router.post("/videos", uploadVideo, async (req, res) => {
  let videoUrl = null;
  let thumbnailUrl = null;
  let uploadedFiles = [];
  let fileSize = null;
  let mimeType = null;
  let storagePath = null;

  try {
    const { title, description, category, isActive = true, duration } = req.body;
    
    if (!title) {
      manualCleanup(req.files);
      return res.status(400).json({
        success: false,
        message: "Le titre est requis"
      });
    }

    // Upload vers Supabase
    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    console.log('📁 Début upload vidéo vers Supabase...');

    // Upload vidéo avec BUFFER
    if (videoFile) {
      console.log('📤 Upload vidéo:', videoFile.originalname, `(${(videoFile.size / (1024 * 1024)).toFixed(2)} MB)`);
      
      const videoBuffer = fs.readFileSync(videoFile.path);
      const fileName = `videos/${Date.now()}-${videoFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('media')
        .upload(fileName, videoBuffer, {
          contentType: videoFile.mimetype,
          cacheControl: '3600'
        });

      if (videoError) {
        console.error('❌ Erreur upload vidéo:', videoError);
        manualCleanup(req.files);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'upload de la vidéo: " + videoError.message
        });
      }

      console.log('✅ Vidéo uploadée avec succès:', videoData.path);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(videoData.path);
      videoUrl = urlData.publicUrl;
      fileSize = videoFile.size;
      mimeType = videoFile.mimetype;
      storagePath = videoData.path;
      uploadedFiles.push({ type: 'video', path: videoData.path, url: videoUrl });
      console.log('🔗 URL vidéo:', videoUrl);
    }

    // Upload thumbnail avec BUFFER
    if (thumbnailFile) {
      console.log('📤 Upload thumbnail:', thumbnailFile.originalname);
      
      try {
        const thumbnailBuffer = fs.readFileSync(thumbnailFile.path);
        const thumbnailName = `videos/thumbnails/${Date.now()}-${thumbnailFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('media')
          .upload(thumbnailName, thumbnailBuffer, {
            contentType: thumbnailFile.mimetype,
            cacheControl: '3600'
          });

        if (thumbnailError) {
          console.warn('⚠️ Erreur upload thumbnail:', thumbnailError.message);
        } else {
          console.log('✅ Thumbnail uploadé avec succès:', thumbnailData.path);
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(thumbnailData.path);
          thumbnailUrl = urlData.publicUrl;
          uploadedFiles.push({ type: 'thumbnail', path: thumbnailData.path, url: thumbnailUrl });
          console.log('🔗 URL thumbnail:', thumbnailUrl);
        }
      } catch (thumbnailError) {
        console.warn('⚠️ Erreur lors de l\'upload du thumbnail:', thumbnailError.message);
      }
    }

    // Créer la vidéo dans la base de données
    console.log('💾 Création en base de données...');
    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        category: category || null, // ← Simple string
        isActive: isActive === 'true',
        views: 0,
        duration: duration || "00:00:00",
        fileSize,
        mimeType,
        storagePath
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        isActive: true,
        isPremium: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Simple string
        createdAt: true,
        updatedAt: true
      }
    });

    // Nettoyer les fichiers temporaires
    manualCleanup(req.files);

    console.log('✅ Vidéo créée avec succès:', video.id);

    let message = "Vidéo créée avec succès";
    if (!thumbnailUrl) {
      message += " (sans miniature)";
    }

    res.json({
      success: true,
      data: video,
      message: message
    });

  } catch (error) {
    console.error("❌ Erreur lors de la création de la vidéo:", error);
    
    // Nettoyer les fichiers uploadés en cas d'erreur
    if (uploadedFiles.length > 0) {
      console.log('🧹 Nettoyage des fichiers partiellement uploadés...');
      const pathsToDelete = uploadedFiles.map(file => file.path);
      await supabase.storage.from('media').remove(pathsToDelete);
    }
    
    manualCleanup(req.files);
    
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// PUT /api/admin/media/podcasts/:id - Mettre à jour un podcast
router.put("/podcasts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isActive, duration } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(category !== undefined && { category }), // ← Simple string
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(duration && { duration })
    };

    const podcast = await prisma.podcast.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        audioUrl: true,
        thumbnailUrl: true,
        duration: true,
        listens: true,
        isActive: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Simple string
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: podcast,
      message: "Podcast mis à jour avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du podcast:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// PUT /api/admin/media/videos/:id - Mettre à jour une vidéo
router.put("/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isActive, duration } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(category !== undefined && { category }), // ← Simple string
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(duration && { duration })
    };

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        isActive: true,
        isPremium: true,
        fileSize: true,
        mimeType: true,
        storagePath: true,
        category: true, // ← Simple string
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: video,
      message: "Vidéo mise à jour avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vidéo:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// DELETE /api/admin/media/podcasts/:id - Supprimer un podcast
router.delete("/podcasts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le podcast pour avoir les URLs des fichiers
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      select: {
        id: true,
        audioUrl: true,
        thumbnailUrl: true,
        storagePath: true
      }
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast non trouvé"
      });
    }

    // Supprimer les fichiers de Supabase
    if (podcast.storagePath) {
      await supabase.storage.from('media').remove([podcast.storagePath]);
      console.log('🗑️ Fichier audio supprimé:', podcast.storagePath);
    } else if (podcast.audioUrl) {
      const audioPath = podcast.audioUrl.split('/storage/v1/object/public/media/')[1];
      if (audioPath) {
        await supabase.storage.from('media').remove([audioPath]);
        console.log('🗑️ Fichier audio supprimé:', audioPath);
      }
    }

    if (podcast.thumbnailUrl) {
      const thumbnailPath = podcast.thumbnailUrl.split('/storage/v1/object/public/media/')[1];
      if (thumbnailPath) {
        await supabase.storage.from('media').remove([thumbnailPath]);
        console.log('🗑️ Thumbnail supprimé:', thumbnailPath);
      }
    }

    // Supprimer de la base de données
    await prisma.podcast.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Podcast supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la suppression du podcast:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// DELETE /api/admin/media/videos/:id - Supprimer une vidéo
router.delete("/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la vidéo pour avoir les URLs des fichiers
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        videoUrl: true,
        thumbnailUrl: true,
        storagePath: true
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée"
      });
    }

    // Supprimer les fichiers de Supabase
    if (video.storagePath) {
      await supabase.storage.from('media').remove([video.storagePath]);
      console.log('🗑️ Fichier vidéo supprimé:', video.storagePath);
    } else if (video.videoUrl) {
      const videoPath = video.videoUrl.split('/storage/v1/object/public/media/')[1];
      if (videoPath) {
        await supabase.storage.from('media').remove([videoPath]);
        console.log('🗑️ Fichier vidéo supprimé:', videoPath);
      }
    }

    if (video.thumbnailUrl) {
      const thumbnailPath = video.thumbnailUrl.split('/storage/v1/object/public/media/')[1];
      if (thumbnailPath) {
        await supabase.storage.from('media').remove([thumbnailPath]);
        console.log('🗑️ Thumbnail supprimé:', thumbnailPath);
      }
    }

    // Supprimer de la base de données
    await prisma.video.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Vidéo supprimée avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de la vidéo:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

module.exports = router;