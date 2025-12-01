const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/activity-actions/favorite - Ajouter/supprimer des favoris
router.post('/favorite', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.body;

    const existingFavorite = await prisma.activityFavorite.findUnique({
      where: {
        userId_activityId: {
          userId: req.user.id,
          activityId
        }
      }
    });

    if (existingFavorite) {
      // Supprimer du favori
      await prisma.activityFavorite.delete({
        where: {
          userId_activityId: {
            userId: req.user.id,
            activityId
          }
        }
      });

      // Décrémenter le compteur
      await prisma.activityStatistics.update({
        where: { activityId },
        data: { totalFavorites: { decrement: 1 } }
      });

      res.json({
        success: true,
        action: 'removed',
        message: 'Activité retirée des favoris'
      });
    } else {
      // Ajouter au favori
      await prisma.activityFavorite.create({
        data: {
          userId: req.user.id,
          activityId
        }
      });

      // Incrémenter le compteur
      await prisma.activityStatistics.update({
        where: { activityId },
        data: { totalFavorites: { increment: 1 } }
      });

      res.json({
        success: true,
        action: 'added',
        message: 'Activité ajoutée aux favoris'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/activity-actions/share - Enregistrer un partage
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const { activityId, platform, sharedWith } = req.body;

    const share = await prisma.activityShare.create({
      data: {
        activityId,
        userId: req.user.id,
        platform,
        sharedWith
      }
    });

    // Incrémenter le compteur de partages
    await prisma.activityStatistics.update({
      where: { activityId },
      data: { totalShares: { increment: 1 } }
    });

    res.json({
      success: true,
      message: 'Partage enregistré',
      data: share
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/activity-actions/review - Ajouter un avis
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { activityId, bookingId, rating, comment, images } = req.body;

    // Vérifier que l'utilisateur a bien réservé cette activité
    const booking = await prisma.activityBooking.findFirst({
      where: {
        id: bookingId,
        userId: req.user.id,
        activityId,
        status: 'completed'
      }
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez noter que les activités que vous avez terminées'
      });
    }

    // Vérifier si un avis existe déjà
    const existingReview = await prisma.activityReview.findUnique({
      where: { bookingId }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà noté cette activité'
      });
    }

    // Créer l'avis
    const review = await prisma.activityReview.create({
      data: {
        activityId,
        bookingId,
        userId: req.user.id,
        rating,
        comment,
        images: images || [],
        verified: true // Vérifié car lié à une réservation
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

    // Mettre à jour la note moyenne de l'activité
    const activityReviews = await prisma.activityReview.findMany({
      where: { activityId },
      select: { rating: true }
    });

    const averageRating = activityReviews.reduce((sum, r) => sum + r.rating, 0) / activityReviews.length;

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        rating: averageRating,
        reviewCount: { increment: 1 }
      }
    });

    // Mettre à jour les statistiques
    await prisma.activityStatistics.update({
      where: { activityId },
      data: {
        completedBookings: { increment: 1 }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activity-actions/favorites - Récupérer les favoris de l'utilisateur
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.activityFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        activity: {
          include: {
            guide: {
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
            },
            category: true,
            reviews: {
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: favorites.map(fav => fav.activity)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;