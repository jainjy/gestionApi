const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MediaService = require('../services/mediaService');
const { manualCleanup } = require('../middleware/uploadMedia');

// Récupérer tous les podcasts
const getAllPodcasts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = {
        name: category
      };
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
    console.error('Erreur lors de la récupération des podcasts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer tous les vidéos
const getAllVideos = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = {
        name: category
      };
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
    console.error('Erreur lors de la récupération des vidéos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer un podcast par ID
const getPodcastById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MediaService.getPodcastById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération du podcast:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer une vidéo par ID
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MediaService.getVideoById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération de la vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Récupérer les catégories
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    const result = await MediaService.getCategories(type);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer un podcast (PROFESSIONNEL) - REFONDU POUR SUPABASE
const createPodcast = async (req, res) => {
  try {
    console.log('🎙️  Début création podcast avec Supabase...');

    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        error: 'Fichier audio requis'
      });
    }

    // Préparer les données avec l'ID du professionnel
    const podcastData = {
      ...req.body,
      authorId: req.user.id
    };

    const audioFile = req.files.audio[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    console.log('📤 Upload vers Supabase...');
    const result = await MediaService.createPodcast(podcastData, audioFile, thumbnailFile);

    if (!result.success) {
      // Nettoyer les fichiers temporaires en cas d'erreur
      manualCleanup(req.files);
      return res.status(400).json(result);
    }

    console.log('✅ Podcast créé avec succès via Supabase');
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Erreur création podcast:', error);
    
    // Nettoyage d'urgence en cas d'erreur inattendue
    if (req.files) {
      manualCleanup(req.files);
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du podcast'
    });
  }
};

// Créer une vidéo (PROFESSIONNEL) - REFONDU POUR SUPABASE
const createVideo = async (req, res) => {
  try {
    console.log('🎥 Début création vidéo avec Supabase...');

    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        error: 'Fichier vidéo requis'
      });
    }

    // Préparer les données avec l'ID du professionnel
    const videoData = {
      ...req.body,
      authorId: req.user.id
    };

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    console.log('📤 Upload vers Supabase...');
    const result = await MediaService.createVideo(videoData, videoFile, thumbnailFile);

    if (!result.success) {
      // Nettoyer les fichiers temporaires en cas d'erreur
      manualCleanup(req.files);
      return res.status(400).json(result);
    }

    console.log('✅ Vidéo créée avec succès via Supabase');
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Erreur création vidéo:', error);
    
    // Nettoyage d'urgence en cas d'erreur inattendue
    if (req.files) {
      manualCleanup(req.files);
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la vidéo'
    });
  }
};

// Créer une catégorie (PROFESSIONNEL)
const createCategory = async (req, res) => {
  try {
    const result = await MediaService.createCategory(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// Incrémenter les écoutes d'un podcast
const incrementPodcastListens = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MediaService.incrementPodcastListens(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur incrémentation écoutes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Incrémenter les vues d'une vidéo
const incrementVideoViews = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MediaService.incrementVideoViews(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur incrémentation vues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer un podcast (PROFESSIONNEL) - REFONDU POUR SUPABASE
const deletePodcast = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que le podcast appartient au professionnel
    const podcast = await prisma.podcast.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast non trouvé ou vous n\'êtes pas autorisé à le supprimer'
      });
    }

    const result = await MediaService.deletePodcast(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur suppression podcast:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une vidéo (PROFESSIONNEL) - REFONDU POUR SUPABASE
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la vidéo appartient au professionnel
    const video = await prisma.video.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée ou vous n\'êtes pas autorisé à la supprimer'
      });
    }

    const result = await MediaService.deleteVideo(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur suppression vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un podcast (PROFESSIONNEL)
const updatePodcast = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que le podcast appartient au professionnel
    const podcast = await prisma.podcast.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast non trouvé ou vous n\'êtes pas autorisé à le modifier'
      });
    }

    const updatedPodcast = await prisma.podcast.update({
      where: { id },
      data: req.body,
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
};

// Mettre à jour une vidéo (PROFESSIONNEL)
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la vidéo appartient au professionnel
    const video = await prisma.video.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée ou vous n\'êtes pas autorisé à la modifier'
      });
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: req.body,
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
};

// Récupérer les médias d'un professionnel
const getMyMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'both', page = 1, limit = 10 } = req.query;

    let myPodcasts = [];
    let myVideos = [];

    if (type === 'podcast' || type === 'both') {
      myPodcasts = await prisma.podcast.findMany({
        where: { authorId: userId },
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });
    }

    if (type === 'video' || type === 'both') {
      myVideos = await prisma.video.findMany({
        where: { authorId: userId },
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });
    }

    res.json({
      success: true,
      data: {
        podcasts: myPodcasts,
        videos: myVideos
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération médias professionnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Les autres fonctions (favoris, statistiques) restent inchangées
const addToFavorites = async (req, res) => {
  try {
    const { mediaId, mediaType } = req.body;
    const userId = req.user.id;

    if (!['podcast', 'video'].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de média invalide'
      });
    }

    // Vérifier si le média existe
    if (mediaType === 'podcast') {
      const podcast = await prisma.podcast.findUnique({
        where: { id: mediaId }
      });
      if (!podcast) {
        return res.status(404).json({
          success: false,
          message: 'Podcast non trouvé'
        });
      }
    } else {
      const video = await prisma.video.findUnique({
        where: { id: mediaId }
      });
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        });
      }
    }

    const favorite = await prisma.userMediaFavorite.create({
      data: {
        userId,
        mediaId,
        mediaType
      }
    });

    res.json({
      success: true,
      data: favorite,
      message: 'Média ajouté aux favoris'
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Ce média est déjà dans vos favoris'
      });
    }
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const { mediaId, mediaType } = req.body;
    const userId = req.user.id;

    await prisma.userMediaFavorite.delete({
      where: {
        userId_mediaId_mediaType: {
          userId,
          mediaId,
          mediaType
        }
      }
    });

    res.json({
      success: true,
      message: 'Média retiré des favoris'
    });
  } catch (error) {
    console.error('Erreur lors du retrait des favoris:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mediaType } = req.query;

    const where = { userId };
    if (mediaType) {
      where.mediaType = mediaType;
    }

    const favorites = await prisma.userMediaFavorite.findMany({
      where,
      include: {
        ...(mediaType === 'podcast' || !mediaType ? {
          podcast: {
            include: {
              category: true
            }
          }
        } : {}),
        ...(mediaType === 'video' || !mediaType ? {
          video: {
            include: {
              category: true
            }
          }
        } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const updateWellBeingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { duration, category } = req.body;

    const stats = await prisma.wellBeingStats.upsert({
      where: { userId },
      update: {
        totalSessions: { increment: 1 },
        totalDuration: { increment: duration },
        lastActivityAt: new Date(),
        ...(category && { favoriteCategory: category })
      },
      create: {
        userId,
        totalSessions: 1,
        totalDuration: duration,
        lastActivityAt: new Date(),
        favoriteCategory: category
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const getWellBeingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.wellBeingStats.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: stats || {
        totalSessions: 0,
        totalDuration: 0,
        favoriteCategory: null,
        lastActivityAt: null
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const getPopularMedia = async (req, res) => {
  try {
    const { type = 'both', limit = 6 } = req.query;

    let popularPodcasts = [];
    let popularVideos = [];

    if (type === 'podcast' || type === 'both') {
      popularPodcasts = await prisma.podcast.findMany({
        where: { isActive: true },
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
        orderBy: { listens: 'desc' },
        take: parseInt(limit)
      });
    }

    if (type === 'video' || type === 'both') {
      popularVideos = await prisma.video.findMany({
        where: { isActive: true },
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
        orderBy: { views: 'desc' },
        take: parseInt(limit)
      });
    }

    res.json({
      success: true,
      data: {
        podcasts: popularPodcasts,
        videos: popularVideos
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des médias populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  getAllPodcasts,
  getAllVideos,
  getPodcastById,
  getVideoById,
  getCategories,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  updateWellBeingStats,
  getWellBeingStats,
  getPopularMedia,
  createPodcast,
  createVideo,
  createCategory,
  incrementPodcastListens,
  incrementVideoViews,
  deletePodcast,
  deleteVideo,
  updatePodcast,
  updateVideo,
  getMyMedia
};