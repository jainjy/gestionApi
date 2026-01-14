const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');
// POST /api/articles - Créer un nouvel article (avec authentification)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      titre,
      description,
      contenu,
      categorie,
      tags,
      statut,
      datePublication,
      image,
      excerpt
    } = req.body;

    // Validation des champs obligatoires
    if (!titre || titre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le titre est obligatoire'
      });
    }

    if (!contenu || contenu.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu est obligatoire'
      });
    }

    // Générer un slug à partir du titre
    const slug = titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Calculer le temps de lecture (environ 200 mots par minute)
    const wordCount = contenu.split(/\s+/).length;
    const readTimeMinutes = Math.ceil(wordCount / 200);
    const readTime = `${readTimeMinutes} min`;

    // Vérifier si le slug existe déjà
    const existingArticle = await prisma.blogArticle.findFirst({
      where: { slug }
    });

    let finalSlug = slug;
    if (existingArticle) {
      // Ajouter un suffixe numérique si le slug existe déjà
      let counter = 1;
      while (true) {
        const newSlug = `${slug}-${counter}`;
        const check = await prisma.blogArticle.findFirst({
          where: { slug: newSlug }
        });
        if (!check) {
          finalSlug = newSlug;
          break;
        }
        counter++;
      }
    }

    // Créer l'article
    const article = await prisma.blogArticle.create({
      data: {
        title: titre.trim(),
        slug: finalSlug,
        content: contenu,
        excerpt: (excerpt || description || contenu.substring(0, 150)).trim(),
        category: categorie || 'Non catégorisé',
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
        status: statut || 'brouillon',
        coverUrl: image || null,
        readTime,
        publishedAt: (statut === 'publié' || statut === 'programmé') && datePublication
          ? new Date(datePublication)
          : statut === 'publié'
          ? new Date()
          : null,
        authorId: req.user.id,
        views: 0,
        likes: 0,
        comments: 0
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Formater la réponse
    const formattedArticle = {
      id: article.id,
      titre: article.title,
      slug: article.slug,
      date: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      dateFormatted: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'Non publié',
      categorie: article.category,
      description: article.excerpt,
      image: article.coverUrl || `https://via.placeholder.com/800x450/3b82f6/ffffff?text=${encodeURIComponent(article.title.substring(0, 30))}`,
      contenu: article.content,
      auteur: `${article.author.firstName} ${article.author.lastName}`,
      auteurId: article.author.id,
      auteurAvatar: article.author.avatar,
      tempsLecture: article.readTime,
      statut: article.status,
      tags: article.tags || [],
      views: article.views || 0,
      likes: article.likes || 0,
      comments: article.comments || 0,
      shares: 0
    };

    res.status(201).json({
      success: true,
      data: formattedArticle,
      message: 'Article créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'article'
    });
  }
});

// PUT /api/articles/:id - Mettre à jour un article (avec authentification)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      description,
      contenu,
      categorie,
      tags,
      statut,
      datePublication,
      image,
      excerpt
    } = req.body;

    // Vérifier si l'article existe
    const existingArticle = await prisma.blogArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true
          }
        }
      }
    });

    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé'
      });
    }

    // Vérifier les permissions (auteur ou admin)
    if (existingArticle.author.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez modifier que vos propres articles'
      });
    }

    // Validation des champs obligatoires
    if (titre !== undefined && titre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le titre ne peut pas être vide'
      });
    }

    if (contenu !== undefined && contenu.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu ne peut pas être vide'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};

    if (titre !== undefined) {
      updateData.title = titre.trim();
      
      // Regénérer le slug si le titre change
      if (titre !== existingArticle.title) {
        const slug = titre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        // Vérifier si le nouveau slug existe déjà pour un autre article
        const existingSlug = await prisma.blogArticle.findFirst({
          where: {
            slug,
            id: { not: id }
          }
        });

        if (!existingSlug) {
          updateData.slug = slug;
        }
      }
    }

    if (contenu !== undefined) {
      updateData.content = contenu;
      // Recalculer le temps de lecture
      const wordCount = contenu.split(/\s+/).length;
      const readTimeMinutes = Math.ceil(wordCount / 200);
      updateData.readTime = `${readTimeMinutes} min`;
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt.trim();
    } else if (description !== undefined) {
      updateData.excerpt = description.trim();
    }

    if (categorie !== undefined) {
      updateData.category = categorie;
    }

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []);
    }

    if (statut !== undefined) {
      updateData.status = statut;
      
      // Gérer la date de publication en fonction du statut
      if (statut === 'publié' && !existingArticle.publishedAt) {
        updateData.publishedAt = datePublication ? new Date(datePublication) : new Date();
      } else if (statut === 'programmé' && datePublication) {
        updateData.publishedAt = new Date(datePublication);
      } else if (statut === 'brouillon') {
        updateData.publishedAt = null;
      }
    } else if (datePublication !== undefined && existingArticle.status !== 'brouillon') {
      updateData.publishedAt = new Date(datePublication);
    }

    if (image !== undefined) {
      updateData.coverUrl = image || null;
    }

    updateData.updatedAt = new Date();

    // Mettre à jour l'article
    const updatedArticle = await prisma.blogArticle.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Formater la réponse
    const formattedArticle = {
      id: updatedArticle.id,
      titre: updatedArticle.title,
      slug: updatedArticle.slug,
      date: updatedArticle.publishedAt?.toISOString() || updatedArticle.createdAt.toISOString(),
      dateFormatted: updatedArticle.publishedAt
        ? new Date(updatedArticle.publishedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'Non publié',
      categorie: updatedArticle.category,
      description: updatedArticle.excerpt,
      image: updatedArticle.coverUrl || `https://via.placeholder.com/800x450/3b82f6/ffffff?text=${encodeURIComponent(updatedArticle.title.substring(0, 30))}`,
      contenu: updatedArticle.content,
      auteur: `${updatedArticle.author.firstName} ${updatedArticle.author.lastName}`,
      auteurId: updatedArticle.author.id,
      auteurAvatar: updatedArticle.author.avatar,
      tempsLecture: updatedArticle.readTime,
      statut: updatedArticle.status,
      tags: updatedArticle.tags || [],
      views: updatedArticle.views || 0,
      likes: updatedArticle.likes || 0,
      comments: updatedArticle.comments || 0,
      shares: 0
    };

    res.json({
      success: true,
      data: formattedArticle,
      message: 'Article mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de l\'article'
    });
  }
});

// DELETE /api/articles/:id - Supprimer un article (avec authentification)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'article existe
    const article = await prisma.blogArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé'
      });
    }

    // Vérifier les permissions (auteur ou admin)
    if (article.author.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez supprimer que vos propres articles'
      });
    }

    // Supprimer les likes de l'article
    await prisma.blogArticleLike.deleteMany({
      where: { articleId: id }
    });

    // Supprimer tous les commentaires et leurs likes associés
    const comments = await prisma.blogComment.findMany({
      where: { articleId: id },
      select: { id: true }
    });

    for (const comment of comments) {
      await prisma.blogCommentLike.deleteMany({
        where: { commentId: comment.id }
      });
    }

    await prisma.blogComment.deleteMany({
      where: { articleId: id }
    });

    // Supprimer l'article
    await prisma.blogArticle.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'article'
    });
  }
});

// GET /api/articles/slug/:slug - Récupérer un article par son slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;

    // Extraire userId du token si présent
    if (token) {
      if (token.startsWith('real-jwt-token-')) {
        userId = token.replace('real-jwt-token-', '');
      } else {
        userId = token;
      }
    }

    // Incrémenter le compteur de vues
    await prisma.blogArticle.update({
      where: { slug },
      data: {
        views: { increment: 1 }
      }
    });

    const article = await prisma.blogArticle.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        blogComments: {
          where: {
            parentId: null // Ne prendre que les commentaires principaux
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
            _count: {
              select: {
                commentLikes: true,
                replies: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        // Vérifier si l'utilisateur courant a liké l'article
        articleLikes: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé'
      });
    }

    // Vérifier si l'article est publié (sauf pour l'auteur ou l'admin)
    if (article.status !== 'publié') {
      if (!userId || (userId !== article.author.id && req.user?.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          error: 'Cet article n\'est pas accessible publiquement'
        });
      }
    }

    // Formater les commentaires
    const formattedComments = await Promise.all(
      article.blogComments.map(async (comment) => {
        // Vérifier si l'utilisateur courant a liké ce commentaire
        let isLiked = false;
        if (userId) {
          const like = await prisma.blogCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId: userId
              }
            }
          });
          isLiked = !!like;
        }

        return {
          id: comment.id,
          userId: comment.user.id,
          userName: `${comment.user.firstName} ${comment.user.lastName}`,
          userAvatar: comment.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.firstName + ' ' + comment.user.lastName)}&background=random`,
          content: comment.content,
          date: comment.createdAt.toISOString(),
          likes: comment._count.commentLikes,
          isLiked: isLiked,
          repliesCount: comment._count.replies,
          isEdited: comment.isEdited,
          updatedAt: comment.updatedAt?.toISOString()
        };
      })
    );

    // Vérifier si l'utilisateur courant a liké l'article
    const isLiked = userId && article.articleLikes && article.articleLikes.length > 0;

    // Générer une URL d'image par défaut si aucune image n'est fournie
    let imageUrl = article.coverUrl;
    if (!imageUrl) {
      const colors = ['f97316', '3b82f6', '10b981', '8b5cf6', 'ef4444'];
      const color = colors[article.id.charCodeAt(0) % colors.length];
      imageUrl = `https://via.placeholder.com/800x450/${color}/ffffff?text=${encodeURIComponent(article.title)}`;
    }

    const responseData = {
      id: article.id,
      titre: article.title,
      slug: article.slug,
      date: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      dateFormatted: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : new Date(article.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
      categorie: article.category,
      description: article.excerpt || article.content.substring(0, 150) + '...',
      image: imageUrl,
      contenu: article.content,
      auteur: `${article.author.firstName} ${article.author.lastName}`,
      auteurId: article.author.id,
      auteurAvatar: article.author.avatar,
      tempsLecture: article.readTime || '3 min',
      tags: article.tags || [],
      views: article.views || 0,
      likes: article.likes || 0,
      isLiked: !!isLiked,
      isBookmarked: false,
      shares: 0,
      statut: article.status,
      comments: formattedComments
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article par slug:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'article'
    });
  }
});

// GET /api/articles/:id/comments - Récupérer les commentaires d'un article
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;

    // Extraire userId du token si présent
    if (token) {
      if (token.startsWith('real-jwt-token-')) {
        userId = token.replace('real-jwt-token-', '');
      } else {
        userId = token;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Vérifier si l'article existe
    const articleExists = await prisma.blogArticle.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!articleExists) {
      return res.status(404).json({
        success: false,
        error: 'Article non trouvé'
      });
    }

    // Récupérer les commentaires avec pagination
    const [comments, totalComments] = await Promise.all([
      prisma.blogComment.findMany({
        where: {
          articleId: id,
          parentId: null // Ne prendre que les commentaires principaux
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
          _count: {
            select: {
              commentLikes: true,
              replies: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.blogComment.count({
        where: {
          articleId: id,
          parentId: null
        }
      })
    ]);

    // Formater les commentaires avec vérification des likes
    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        let isLiked = false;
        if (userId) {
          const like = await prisma.blogCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId: userId
              }
            }
          });
          isLiked = !!like;
        }

        return {
          id: comment.id,
          userId: comment.user.id,
          userName: `${comment.user.firstName} ${comment.user.lastName}`,
          userAvatar: comment.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.firstName + ' ' + comment.user.lastName)}&background=random`,
          content: comment.content,
          date: comment.createdAt.toISOString(),
          likes: comment._count.commentLikes,
          isLiked: isLiked,
          repliesCount: comment._count.replies,
          isEdited: comment.isEdited,
          updatedAt: comment.updatedAt?.toISOString()
        };
      })
    );

    res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalComments,
          totalPages: Math.ceil(totalComments / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des commentaires'
    });
  }
});

// GET /api/articles/comments/:commentId/replies - Récupérer les réponses d'un commentaire
router.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;

    // Extraire userId du token si présent
    if (token) {
      if (token.startsWith('real-jwt-token-')) {
        userId = token.replace('real-jwt-token-', '');
      } else {
        userId = token;
      }
    }

    // Vérifier si le commentaire parent existe
    const parentComment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire parent non trouvé'
      });
    }

    // Récupérer les réponses
    const replies = await prisma.blogComment.findMany({
      where: {
        parentId: commentId
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
        _count: {
          select: {
            commentLikes: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Formater les réponses avec vérification des likes
    const formattedReplies = await Promise.all(
      replies.map(async (reply) => {
        let isLiked = false;
        if (userId) {
          const like = await prisma.blogCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: reply.id,
                userId: userId
              }
            }
          });
          isLiked = !!like;
        }

        return {
          id: reply.id,
          userId: reply.user.id,
          userName: `${reply.user.firstName} ${reply.user.lastName}`,
          userAvatar: reply.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user.firstName + ' ' + reply.user.lastName)}&background=random`,
          content: reply.content,
          date: reply.createdAt.toISOString(),
          likes: reply._count.commentLikes,
          isLiked: isLiked,
          isEdited: reply.isEdited,
          updatedAt: reply.updatedAt?.toISOString()
        };
      })
    );

    res.json({
      success: true,
      data: formattedReplies
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des réponses'
    });
  }
});

// GET /api/articles/user/stats - Récupérer les statistiques de l'utilisateur
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      scheduledArticles,
      totalViews,
      totalLikes,
      totalComments
    ] = await Promise.all([
      // Total des articles
      prisma.blogArticle.count({
        where: { authorId: userId }
      }),
      // Articles publiés
      prisma.blogArticle.count({
        where: {
          authorId: userId,
          status: 'publié'
        }
      }),
      // Brouillons
      prisma.blogArticle.count({
        where: {
          authorId: userId,
          status: 'brouillon'
        }
      }),
      // Articles programmés
      prisma.blogArticle.count({
        where: {
          authorId: userId,
          status: 'programmé'
        }
      }),
      // Total des vues
      prisma.blogArticle.aggregate({
        where: { authorId: userId },
        _sum: { views: true }
      }),
      // Total des likes
      prisma.blogArticle.aggregate({
        where: { authorId: userId },
        _sum: { likes: true }
      }),
      // Total des commentaires
      prisma.blogArticle.aggregate({
        where: { authorId: userId },
        _sum: { comments: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalArticles,
        publishedArticles,
        draftArticles,
        scheduledArticles,
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
        totalComments: totalComments._sum.comments || 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// GET /api/articles/user/articles - Récupérer les articles de l'utilisateur
router.get('/user/articles', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire le filtre where
    const where = { authorId: userId };
    if (status && status !== 'Tous') {
      where.status = status;
    }

    const [articles, total] = await Promise.all([
      prisma.blogArticle.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              blogComments: {
                where: {
                  parentId: null
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.blogArticle.count({ where })
    ]);

    // Formater les articles
    const formattedArticles = articles.map(article => {
      let imageUrl = article.coverUrl;
      if (!imageUrl) {
        const colors = ['f97316', '3b82f6', '10b981', '8b5cf6', 'ef4444'];
        const color = colors[article.id.charCodeAt(0) % colors.length];
        imageUrl = `https://via.placeholder.com/400x250/${color}/ffffff?text=${encodeURIComponent(article.title.substring(0, 20))}`;
      }

      return {
        id: article.id,
        titre: article.title,
        slug: article.slug,
        date: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        dateFormatted: article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          : 'Non publié',
        categorie: article.category,
        description: article.excerpt || article.content.substring(0, 150) + '...',
        image: imageUrl,
        auteur: `${article.author.firstName} ${article.author.lastName}`,
        auteurId: article.author.id,
        tempsLecture: article.readTime || '3 min',
        statut: article.status,
        tags: article.tags || [],
        views: article.views || 0,
        likes: article.likes || 0,
        comments: article._count.blogComments || 0
      };
    });

    res.json({
      success: true,
      data: {
        articles: formattedArticles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des articles'
    });
  }
});
  
// GET /api/articles - Récupérer tous les articles avec filtres
router.get('/', async (req, res) => {
  try {
    const { search, category, status, sort = 'newest' } = req.query;

    // Construire les filtres
    const where = {
      status: 'publié' // Par défaut, ne montrer que les articles publiés
    };

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    if (category && category !== 'Toutes') {
      where.category = category;
    }

    if (status && status !== 'Tous') {
      where.status = status;
    }

    // Déterminer l'ordre de tri
    let orderBy = {};
    switch(sort) {
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      case 'likes':
        orderBy = { likes: 'desc' };
        break;
      case 'oldest':
        orderBy = { publishedAt: 'asc' };
        break;
      default: // 'newest'
        orderBy = { publishedAt: 'desc' };
    }

    const articles = await prisma.blogArticle.findMany({
    
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        // Compter les commentaires
        _count: {
          select: {
            blogComments: {
              where: {
                parentId: null // Seulement les commentaires principaux
              }
            }
          }
        }
      },
      orderBy
    });

    // Formater les données pour le frontend
    const formattedArticles = articles.map(article => {
      // Générer une URL d'image par défaut si aucune image n'est fournie
      let imageUrl = article.coverUrl;
      if (!imageUrl) {
        // Générer une image de placeholder basée sur l'ID
        const colors = ['f97316', '3b82f6', '10b981', '8b5cf6', 'ef4444'];
        const color = colors[article.id.charCodeAt(0) % colors.length];
        imageUrl = `https://via.placeholder.com/400x250/${color}/ffffff?text=${encodeURIComponent(article.title.substring(0, 20))}`;
      }

      return {
        id: article.id,
        titre: article.title,
        date: article.publishedAt 
          ? new Date(article.publishedAt).toISOString()
          : article.createdAt.toISOString(),
        dateFormatted: article.publishedAt 
          ? new Date(article.publishedAt).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })
          : new Date(article.createdAt).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }),
        dateCreation: article.createdAt.toISOString(),
        dateModification: article.updatedAt.toISOString(),
        categorie: article.category,
        description: article.excerpt || article.content.substring(0, 150) + '...',
        image: imageUrl,
        contenu: article.content,
        auteur: `${article.author.firstName} ${article.author.lastName}`,
        auteurId: article.author.id,
        auteurAvatar: article.author.avatar,
        tempsLecture: article.readTime || '3 min',
        statut: article.status,
        tags: article.tags || [],
        views: article.views || 0,
        likes: article.likes || 0,
        comments: article._count.blogComments || 0,
        shares: 0 // À implémenter si besoin
      };
    });

    res.json({
      success: true,
      data: formattedArticles,
      total: formattedArticles.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des articles' 
    });
  }
});

// GET /api/articles/:id - Récupérer un article spécifique avec ses commentaires
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;

    // Extraire userId du token si présent
    if (token) {
      if (token.startsWith('real-jwt-token-')) {
        userId = token.replace('real-jwt-token-', '');
      } else {
        userId = token;
      }
    }

    // Incrémenter le compteur de vues
    await prisma.blogArticle.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    });

    const article = await prisma.blogArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        blogComments: {
          where: {
            parentId: null // Ne prendre que les commentaires principaux
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
            _count: {
              select: {
                commentLikes: true,
                replies: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        // Vérifier si l'utilisateur courant a liké l'article
        articleLikes: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      }
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        error: 'Article non trouvé' 
      });
    }

    // Formater les commentaires
    const formattedComments = await Promise.all(
      article.blogComments.map(async (comment) => {
        // Vérifier si l'utilisateur courant a liké ce commentaire
        let isLiked = false;
        if (userId) {
          const like = await prisma.blogCommentLike.findUnique({
            where: {
              commentId_userId: {
                commentId: comment.id,
                userId: userId
              }
            }
          });
          isLiked = !!like;
        }

        return {
          id: comment.id,
          userId: comment.user.id,
          userName: `${comment.user.firstName} ${comment.user.lastName}`,
          userAvatar: comment.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.firstName + ' ' + comment.user.lastName)}&background=random`,
          content: comment.content,
          date: comment.createdAt.toISOString(),
          likes: comment._count.commentLikes,
          isLiked: isLiked,
          repliesCount: comment._count.replies,
          isEdited: comment.isEdited,
          updatedAt: comment.updatedAt?.toISOString()
        };
      })
    );

    // Vérifier si l'utilisateur courant a liké l'article
    const isLiked = userId && article.articleLikes && article.articleLikes.length > 0;

    // Générer une URL d'image par défaut si aucune image n'est fournie
    let imageUrl = article.coverUrl;
    if (!imageUrl) {
      const colors = ['f97316', '3b82f6', '10b981', '8b5cf6', 'ef4444'];
      const color = colors[article.id.charCodeAt(0) % colors.length];
      imageUrl = `https://via.placeholder.com/800x450/${color}/ffffff?text=${encodeURIComponent(article.title)}`;
    }

    const responseData = {
      id: article.id,
      titre: article.title,
      date: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      dateFormatted: article.publishedAt 
        ? new Date(article.publishedAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        : new Date(article.createdAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
      categorie: article.category,
      description: article.excerpt || article.content.substring(0, 150) + '...',
      image: imageUrl,
      contenu: article.content,
      auteur: `${article.author.firstName} ${article.author.lastName}`,
      auteurId: article.author.id,
      auteurAvatar: article.author.avatar,
      tempsLecture: article.readTime || '3 min',
      tags: article.tags || [],
      views: article.views || 0,
      likes: article.likes || 0,
      isLiked: !!isLiked,
      isBookmarked: false, // À implémenter si besoin
      shares: 0, // À implémenter si besoin
      comments: formattedComments
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'article' 
    });
  }
});

// POST /api/articles/:id/like - Ajouter/Retirer un like
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier si l'article existe
    const article = await prisma.blogArticle.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        error: 'Article non trouvé' 
      });
    }

    // Vérifier si l'utilisateur a déjà liké l'article
    const existingLike = await prisma.blogArticleLike.findUnique({
      where: {
        articleId_userId: {
          articleId: id,
          userId: userId
        }
      }
    });

    let result;
    let likesCount;

    if (existingLike) {
      // Retirer le like
      await prisma.$transaction([
        prisma.blogArticleLike.delete({
          where: {
            articleId_userId: {
              articleId: id,
              userId: userId
            }
          }
        }),
        prisma.blogArticle.update({
          where: { id },
          data: {
            likes: { decrement: 1 }
          }
        })
      ]);

      result = { liked: false };
      likesCount = article.likes - 1;
    } else {
      // Ajouter le like
      await prisma.$transaction([
        prisma.blogArticleLike.create({
          data: {
            articleId: id,
            userId: userId
          }
        }),
        prisma.blogArticle.update({
          where: { id },
          data: {
            likes: { increment: 1 }
          }
        })
      ]);

      result = { liked: true };
      likesCount = article.likes + 1;
    }

    // Récupérer l'article mis à jour
    const updatedArticle = await prisma.blogArticle.findUnique({
      where: { id },
      select: { likes: true }
    });

    res.json({
      success: true,
      data: {
        ...result,
        likes: updatedArticle.likes
      }
    });
  } catch (error) {
    console.error('Erreur lors du like de l\'article:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors du traitement du like' 
    });
  }
});

// POST /api/articles/:id/comments - Ajouter un commentaire
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Le contenu du commentaire est requis' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Le commentaire ne doit pas dépasser 1000 caractères' 
      });
    }

    // Vérifier si l'article existe
    const article = await prisma.blogArticle.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        error: 'Article non trouvé' 
      });
    }

    // Vérifier si parentId existe (pour les réponses)
    if (parentId) {
      const parentComment = await prisma.blogComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return res.status(404).json({ 
          success: false,
          error: 'Commentaire parent non trouvé' 
        });
      }
    }

    // Créer le commentaire
    const comment = await prisma.$transaction(async (prisma) => {
      const newComment = await prisma.blogComment.create({
        data: {
          articleId: id,
          userId: userId,
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

      // Incrémenter le compteur de commentaires seulement si ce n'est pas une réponse
      if (!parentId) {
        await prisma.blogArticle.update({
          where: { id },
          data: {
            comments: { increment: 1 }
          }
        });
      }

      return newComment;
    });

    // Formater la réponse
    const formattedComment = {
      id: comment.id,
      userId: comment.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userAvatar: req.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.firstName + ' ' + req.user.lastName)}&background=random`,
      content: comment.content,
      date: comment.createdAt.toISOString(),
      likes: 0,
      isLiked: false,
      repliesCount: 0,
      isEdited: false
    };

    res.status(201).json({
      success: true,
      data: formattedComment
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de l\'ajout du commentaire' 
    });
  }
});

// PUT /api/articles/comments/:commentId - Modifier un commentaire
router.put('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Le contenu du commentaire est requis' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Le commentaire ne doit pas dépasser 1000 caractères' 
      });
    }

    // Vérifier si le commentaire existe et appartient à l'utilisateur
    const comment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Commentaire non trouvé' 
      });
    }

    if (comment.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Vous ne pouvez modifier que vos propres commentaires' 
      });
    }

    // Mettre à jour le commentaire
    const updatedComment = await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date()
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
        _count: {
          select: {
            commentLikes: true,
            replies: true
          }
        }
      }
    });

    // Vérifier si l'utilisateur courant a liké ce commentaire
    const like = await prisma.blogCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: userId
        }
      }
    });

    const formattedComment = {
      id: updatedComment.id,
      userId: updatedComment.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userAvatar: req.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.firstName + ' ' + req.user.lastName)}&background=random`,
      content: updatedComment.content,
      date: updatedComment.createdAt.toISOString(),
      likes: updatedComment._count.commentLikes,
      isLiked: !!like,
      repliesCount: updatedComment._count.replies,
      isEdited: updatedComment.isEdited,
      updatedAt: updatedComment.updatedAt.toISOString()
    };

    res.json({
      success: true,
      data: formattedComment
    });
  } catch (error) {
    console.error('Erreur lors de la modification du commentaire:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la modification du commentaire' 
    });
  }
});

// DELETE /api/articles/comments/:commentId - Supprimer un commentaire
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Vérifier si le commentaire existe
    const comment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true
          }
        },
        article: {
          select: {
            id: true
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Commentaire non trouvé' 
      });
    }

    // Vérifier les permissions (utilisateur ou admin)
    if (comment.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Vous n\'avez pas la permission de supprimer ce commentaire' 
      });
    }

    // Supprimer le commentaire et ses réponses
    await prisma.$transaction(async (prisma) => {
      // D'abord supprimer les likes du commentaire
      await prisma.blogCommentLike.deleteMany({
        where: { commentId: commentId }
      });

      // Supprimer les réponses (si c'est un commentaire parent)
      await prisma.blogComment.deleteMany({
        where: { parentId: commentId }
      });

      // Supprimer le commentaire principal
      await prisma.blogComment.delete({
        where: { id: commentId }
      });

      // Décrémenter le compteur de commentaires de l'article si ce n'est pas une réponse
      if (!comment.parentId) {
        await prisma.blogArticle.update({
          where: { id: comment.article.id },
          data: {
            comments: { decrement: 1 }
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la suppression du commentaire' 
    });
  }
});

// POST /api/articles/comments/:commentId/like - Ajouter/Retirer un like sur un commentaire
router.post('/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Vérifier si le commentaire existe
    const comment = await prisma.blogComment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Commentaire non trouvé' 
      });
    }

    // Vérifier si l'utilisateur a déjà liké le commentaire
    const existingLike = await prisma.blogCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: commentId,
          userId: userId
        }
      }
    });

    let result;
    let likesCount;

    if (existingLike) {
      // Retirer le like
      await prisma.$transaction([
        prisma.blogCommentLike.delete({
          where: {
            commentId_userId: {
              commentId: commentId,
              userId: userId
            }
          }
        }),
        prisma.blogComment.update({
          where: { id: commentId },
          data: {
            likes: { decrement: 1 }
          }
        })
      ]);

      result = { liked: false };
      likesCount = comment.likes - 1;
    } else {
      // Ajouter le like
      await prisma.$transaction([
        prisma.blogCommentLike.create({
          data: {
            commentId: commentId,
            userId: userId
          }
        }),
        prisma.blogComment.update({
          where: { id: commentId },
          data: {
            likes: { increment: 1 }
          }
        })
      ]);

      result = { liked: true };
      likesCount = comment.likes + 1;
    }

    // Récupérer le commentaire mis à jour
    const updatedComment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      select: { likes: true }
    });

    res.json({
      success: true,
      data: {
        ...result,
        likes: updatedComment.likes
      }
    });
  } catch (error) {
    console.error('Erreur lors du like du commentaire:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors du traitement du like' 
    });
  }
});

// GET /api/articles/categories - Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.blogArticle.findMany({
      where: {
        status: 'publié'
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

// POST /api/articles/:id/share - Enregistrer un partage
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ici vous pourriez enregistrer les partages dans une table dédiée
    // Pour l'instant, on ne fait que retourner l'URL de partage
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/blog/article/${id}`;
    
    res.json({
      success: true,
      data: { url: shareUrl }
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du partage:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de l\'enregistrement du partage' 
    });
  }
});

module.exports = router;