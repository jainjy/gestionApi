// controllers/portraitController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les portraits avec pagination
exports.getAllPortraits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      generation,
      country,
      location,
      featured,
      search,
      categories,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construire les filtres
    const where = {
      isActive: true
    };

    if (generation && generation !== 'tous') {
      where.generation = generation;
    }

    if (country) {
      where.country = country;
    }

    if (location) {
      where.location = location;
    }

    if (featured) {
      where.featured = featured === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { profession: { contains: search, mode: 'insensitive' } },
        { story: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categories) {
      const categoryArray = categories.split(',');
      where.categories = {
        hasSome: categoryArray
      };
    }

    // Obtenir le total
    const total = await prisma.portraitLocal.count({ where });

    // Obtenir les portraits
    const portraits = await prisma.portraitLocal.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        portraitComments: {
          where: { parentId: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            portraitComments: true,
            portraitShares: true,
            portraitListens: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: portraits,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting portraits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des portraits'
    });
  }
};

// Récupérer un portrait par ID
exports.getPortraitById = async (req, res) => {
  try {
    const { id } = req.params;

    const portrait = await prisma.portraitLocal.findUnique({
      where: { id },
      include: {
        portraitComments: {
          where: { parentId: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            portraitComments: true,
            portraitShares: true,
            portraitListens: true
          }
        }
      }
    });

    if (!portrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await prisma.portraitLocal.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: portrait
    });
  } catch (error) {
    console.error('Error getting portrait:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du portrait'
    });
  }
};

// Créer un portrait (admin)
exports.createPortrait = async (req, res) => {
  try {
    const {
      name,
      age,
      generation,
      country,
      location,
      profession,
      description,
      story,
      shortStory,
      quote,
      color,
      featured,
      images,
      interviewAudioUrl,
      interviewDuration,
      interviewTopics,
      wisdom,
      instagramHandle,
      facebookHandle,
      youtubeHandle,
      categories,
      tags,
      latitude,
      longitude,
      region,
      isActive
    } = req.body;

    // Validation basique
    if (!name || !age || !generation || !location || !profession || !story) {
      return res.status(400).json({
        success: false,
        error: 'Les champs obligatoires sont manquants'
      });
    }

    const portrait = await prisma.portraitLocal.create({
      data: {
        name,
        age: parseInt(age),
        generation,
        country: country || 'Réunion',
        location,
        profession,
        description: description || story.substring(0, 200) + '...',
        story,
        shortStory: shortStory || story.substring(0, 150) + '...',
        quote,
        color: color || 'blue',
        featured: featured === true || featured === 'true',
        images: Array.isArray(images) ? images : [],
        interviewAudioUrl,
        interviewDuration,
        interviewTopics: Array.isArray(interviewTopics) ? interviewTopics : [],
        wisdom: Array.isArray(wisdom) ? wisdom : [],
        instagramHandle,
        facebookHandle,
        youtubeHandle,
        categories: Array.isArray(categories) ? categories : [],
        tags: Array.isArray(tags) ? tags : [],
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        region,
        isActive: isActive !== false,
        userId: req.user?.id
      }
    });

    res.status(201).json({
      success: true,
      data: portrait,
      message: 'Portrait créé avec succès'
    });
  } catch (error) {
    console.error('Error creating portrait:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du portrait'
    });
  }
};

// Mettre à jour un portrait (admin)
exports.updatePortrait = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si le portrait existe
    const existingPortrait = await prisma.portraitLocal.findUnique({
      where: { id }
    });

    if (!existingPortrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Convertir les types si nécessaire
    if (updateData.age) {
      updateData.age = parseInt(updateData.age);
    }
    if (updateData.latitude) {
      updateData.latitude = parseFloat(updateData.latitude);
    }
    if (updateData.longitude) {
      updateData.longitude = parseFloat(updateData.longitude);
    }
    if (updateData.featured !== undefined) {
      updateData.featured = updateData.featured === true || updateData.featured === 'true';
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive !== false;
    }

    const portrait = await prisma.portraitLocal.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: portrait,
      message: 'Portrait mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating portrait:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du portrait'
    });
  }
};

// Supprimer un portrait (admin)
exports.deletePortrait = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le portrait existe
    const existingPortrait = await prisma.portraitLocal.findUnique({
      where: { id }
    });

    if (!existingPortrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Soft delete: marquer comme inactif
    await prisma.portraitLocal.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Portrait supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting portrait:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du portrait'
    });
  }
};

// Statistiques des portraits
exports.getPortraitStats = async (req, res) => {
  try {
    const stats = await prisma.portraitLocal.aggregate({
      where: { isActive: true },
      _count: true,
      _sum: {
        views: true,
        shares: true,
        listens: true
      }
    });

    // Statistiques par génération
    const generationStats = await prisma.portraitLocal.groupBy({
      by: ['generation'],
      where: { isActive: true },
      _count: true
    });

    // Statistiques par pays
    const countryStats = await prisma.portraitLocal.groupBy({
      by: ['country'],
      where: { isActive: true },
      _count: true
    });

    res.json({
      success: true,
      data: {
        totalPortraits: stats._count,
        totalViews: stats._sum.views || 0,
        totalShares: stats._sum.shares || 0,
        totalListens: stats._sum.listens || 0,
        byGeneration: generationStats,
        byCountry: countryStats
      }
    });
  } catch (error) {
    console.error('Error getting portrait stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Gestion des commentaires
exports.getPortraitComments = async (req, res) => {
  try {
    const { portraitId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await prisma.portraitComment.findMany({
      where: {
        portraitId,
        parentId: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.portraitComment.count({
      where: {
        portraitId,
        parentId: null
      }
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des commentaires'
    });
  }
};

exports.createPortraitComment = async (req, res) => {
  try {
    const { portraitId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    // Vérifier si le portrait existe
    const portrait = await prisma.portraitLocal.findUnique({
      where: { id: portraitId }
    });

    if (!portrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du commentaire est requis'
      });
    }

    // Vérifier si c'est une réponse à un commentaire
    if (parentId) {
      const parentComment = await prisma.portraitComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: 'Commentaire parent non trouvé'
        });
      }
    }

    const comment = await prisma.portraitComment.create({
      data: {
        portraitId,
        userId,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Notifier via WebSocket si disponible
    if (req.io) {
      req.io.to(`portrait:${portraitId}`).emit('new-comment', {
        comment,
        portraitId
      });
    }

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Commentaire ajouté avec succès'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du commentaire'
    });
  }
};

exports.likePortraitComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.portraitComment.update({
      where: { id: commentId },
      data: {
        likes: { increment: 1 }
      }
    });

    res.json({
      success: true,
      data: comment,
      message: 'Commentaire aimé avec succès'
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du like du commentaire'
    });
  }
};

// Enregistrer un partage
exports.recordPortraitShare = async (req, res) => {
  try {
    const { portraitId } = req.params;
    const { platform } = req.body;
    const userId = req.user?.id;

    // Vérifier si le portrait existe
    const portrait = await prisma.portraitLocal.findUnique({
      where: { id: portraitId }
    });

    if (!portrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Enregistrer le partage
    const share = await prisma.portraitShare.create({
      data: {
        portraitId,
        userId,
        platform,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Incrémenter le compteur de partages du portrait
    await prisma.portraitLocal.update({
      where: { id: portraitId },
      data: {
        shares: { increment: 1 }
      }
    });

    res.status(201).json({
      success: true,
      data: share,
      message: 'Partage enregistré avec succès'
    });
  } catch (error) {
    console.error('Error recording share:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement du partage'
    });
  }
};

// Enregistrer une écoute
exports.recordPortraitListen = async (req, res) => {
  try {
    const { portraitId } = req.params;
    const { duration, completed } = req.body;
    const userId = req.user?.id;

    // Vérifier si le portrait existe
    const portrait = await prisma.portraitLocal.findUnique({
      where: { id: portraitId }
    });

    if (!portrait) {
      return res.status(404).json({
        success: false,
        error: 'Portrait non trouvé'
      });
    }

    // Enregistrer l'écoute
    const listen = await prisma.portraitListen.create({
      data: {
        portraitId,
        userId,
        duration: parseInt(duration) || 0,
        completed: completed === true || completed === 'true',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Incrémenter le compteur d'écoutes si c'est une écoute complète
    if (completed) {
      await prisma.portraitLocal.update({
        where: { id: portraitId },
        data: {
          listens: { increment: 1 }
        }
      });
    }

    res.status(201).json({
      success: true,
      data: listen,
      message: 'Écoute enregistrée avec succès'
    });
  } catch (error) {
    console.error('Error recording listen:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de l\'écoute'
    });
  }
};