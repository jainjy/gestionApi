const { prisma } = require('../lib/db');

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

    const podcast = await prisma.podcast.findUnique({
      where: { id },
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

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast non trouvé'
      });
    }

    // Incrémenter le compteur d'écoutes
    await prisma.podcast.update({
      where: { id },
      data: { listens: { increment: 1 } }
    });

    res.json({
      success: true,
      data: podcast
    });
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

    const video = await prisma.video.findUnique({
      where: { id },
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

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Vidéo non trouvée'
      });
    }

    // Incrémenter le compteur de vues
    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json({
      success: true,
      data: video
    });
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
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ajouter un média aux favoris
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

// Retirer un média des favoris
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

// Récupérer les favoris de l'utilisateur
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

// Mettre à jour les statistiques de bien-être
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

// Récupérer les statistiques de bien-être
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

// Récupérer les médias populaires
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

// 🔥 NOUVELLES FONCTIONS POUR L'ADMIN
const deletePodcast = async (req, res) => {
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
};

const deleteVideo = async (req, res) => {
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
};

const updatePodcast = async (req, res) => {
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
};

const updateVideo = async (req, res) => {
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
  // 🔥 AJOUTER CES NOUVELLES FONCTIONS
  deletePodcast,
  deleteVideo,
  updatePodcast,
  updateVideo
};