const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken } = require('./auth');

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
      where,
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