const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();

// POST ajouter/supprimer des favoris
router.post("/:activityId/favorite", authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;

    const existingFavorite = await prisma.activityFavorite.findUnique({
      where: {
        userId_activityId: {
          userId: req.user.id,
          activityId,
        },
      },
    });

    if (existingFavorite) {
      // Supprimer des favoris
      await prisma.activityFavorite.delete({
        where: {
          userId_activityId: {
            userId: req.user.id,
            activityId,
          },
        },
      });

      res.json({
        success: true,
        action: "removed",
        message: "Activité retirée des favoris",
      });
    } else {
      // Ajouter aux favoris
      await prisma.activityFavorite.create({
        data: {
          userId: req.user.id,
          activityId,
        },
      });

      res.json({
        success: true,
        action: "added",
        message: "Activité ajoutée aux favoris",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification des favoris",
    });
  }
});

// POST ajouter un avis
router.post("/:activityId/review", authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { bookingId, rating, comment, images } = req.body;

    // Vérifier que l'utilisateur a bien réservé cette activité
    const booking = await prisma.activityBooking.findFirst({
      where: {
        id: bookingId,
        activityId,
        userId: req.user.id,
        status: "completed",
      },
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error:
          "Vous ne pouvez noter que les activités que vous avez réservées et terminées",
      });
    }

    // Vérifier si un avis existe déjà pour cette réservation
    const existingReview = await prisma.activityReview.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà noté cette réservation",
      });
    }

    const review = await prisma.activityReview.create({
      data: {
        activityId,
        bookingId,
        userId: req.user.id,
        rating: parseInt(rating),
        comment,
        images: images || [],
        verified: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Mettre à jour la note moyenne de l'activité
    const activityReviews = await prisma.activityReview.findMany({
      where: { activityId },
    });

    const averageRating =
      activityReviews.reduce((sum, review) => sum + review.rating, 0) /
      activityReviews.length;

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        rating: averageRating,
        reviewCount: activityReviews.length,
      },
    });

    res.json({
      success: true,
      data: review,
      message: "Avis ajouté avec succès",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout de l'avis",
    });
  }
});

// GET mes favoris
router.get("/favorites/my-favorites", authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.activityFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            category: true,
            // REMOVED: availability relation
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedFavorites = favorites.map((fav) => {
      const activity = fav.activity;
      const reviews = activity.reviews || [];
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...activity,
        rating: averageRating,
        reviewCount: activity._count.reviews,
        isFavorite: true,
        favoritedAt: fav.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des favoris",
    });
  }
});

module.exports = router;
