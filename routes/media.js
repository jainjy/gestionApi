const express = require('express');
const router = express.Router();
const { uploadAudio, uploadVideo } = require('../middleware/uploadMedia');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { prisma } = require('../lib/db');
const path = require('path');
const fs = require('fs');

// Servir les fichiers média statiques
router.use('/audio', express.static('uploads/audio'));
router.use('/videos', express.static('uploads/videos'));
router.use('/thumbnails', express.static('uploads/thumbnails'));

// Routes GET publiques
router.get('/podcasts', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = { name: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const podcasts = await prisma.podcast.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.podcast.count({ where });

    res.json({
      success: true,
      data: podcasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération podcasts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/videos', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = { name: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.video.count({ where });

    res.json({
      success: true,
      data: videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération vidéos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    
    const categories = await prisma.mediaCategory.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes protégées pour les professionnels
router.post('/podcasts/upload', authenticateToken, requireRole(['professional', 'admin']), uploadAudio, async (req, res) => {
  try {
    console.log('✅ Upload podcast started for user:', req.user.email);
    const { title, description, duration, categoryId } = req.body;
    
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        message: 'Fichier audio requis'
      });
    }

    const audioFile = req.files.audio[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    const category = await prisma.mediaCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
      if (thumbnailFile && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide'
      });
    }

    const podcast = await prisma.podcast.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        duration: duration.trim(),
        audioFile: audioFile.filename,
        audioUrl: `/media/audio/${audioFile.filename}`,
        imageUrl: thumbnailFile ? `/media/thumbnails/${thumbnailFile.filename}` : 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop',
        categoryId: parseInt(categoryId),
        authorId: req.user.id,
        fileSize: audioFile.size,
        mimeType: audioFile.mimetype,
        listens: 0,
        isActive: true
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: podcast,
      message: 'Podcast uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur upload podcast:', error);
    
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du podcast: ' + error.message
    });
  }
});

router.post('/videos/upload', authenticateToken, requireRole(['professional', 'admin']), uploadVideo, async (req, res) => {
  try {
    console.log('✅ Upload video started for user:', req.user.email);
    const { title, description, duration, categoryId } = req.body;
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Fichier vidéo requis'
      });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    const category = await prisma.mediaCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
      if (thumbnailFile && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide'
      });
    }

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        duration: duration.trim(),
        videoFile: videoFile.filename,
        videoUrl: `/media/videos/${videoFile.filename}`,
        thumbnailUrl: thumbnailFile ? `/media/thumbnails/${thumbnailFile.filename}` : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop',
        categoryId: parseInt(categoryId),
        authorId: req.user.id,
        fileSize: videoFile.size,
        mimeType: videoFile.mimetype,
        views: 0,
        isActive: true
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: video,
      message: 'Vidéo uploadée avec succès'
    });

  } catch (error) {
    console.error('Erreur upload vidéo:', error);
    
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la vidéo: ' + error.message
    });
  }
});

// Routes d'incrémentation des compteurs (publiques)
router.post('/podcasts/:id/listen', async (req, res) => {
  try {
    const { id } = req.params;
    
    const podcast = await prisma.podcast.update({
      where: { id },
      data: { listens: { increment: 1 } }
    });

    res.json({
      success: true,
      data: podcast,
      message: 'Compteur d\'écoutes incrémenté'
    });
  } catch (error) {
    console.error('Erreur incrémentation écoutes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/videos/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: video,
      message: 'Compteur de vues incrémenté'
    });
  } catch (error) {
    console.error('Erreur incrémentation vues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Routes DELETE et UPDATE protégées
router.delete('/podcasts/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const podcast = await prisma.podcast.findUnique({
      where: { id }
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast non trouvé'
      });
    }

    if (req.user.role !== 'admin' && podcast.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres podcasts'
      });
    }

    await prisma.podcast.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Podcast supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression podcast:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.delete('/videos/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
    }

    if (req.user.role !== 'admin' && video.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres vidéos'
      });
    }

    await prisma.video.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Vidéo supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/podcasts/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const podcast = await prisma.podcast.findUnique({
      where: { id }
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast non trouvé'
      });
    }

    if (req.user.role !== 'admin' && podcast.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres podcasts'
      });
    }

    const updatedPodcast = await prisma.podcast.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedPodcast,
      message: 'Podcast mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour podcast:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/videos/:id', authenticateToken, requireRole(['professional', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
    }

    if (req.user.role !== 'admin' && video.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres vidéos'
      });
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedVideo,
      message: 'Vidéo mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;