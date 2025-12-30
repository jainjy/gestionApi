const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateToken } = require("../middleware/auth");

/**
 * Créer un avis sur une expérience
 * POST /api/experience-reviews/:experienceId
 */
router.post("/:experienceId", authenticateToken, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.userId;

    // Vérifier si l'utilisateur a réservé cette expérience
    const hasBooking = await prisma.experienceBooking.findFirst({
      where: {
        experienceId,
        userId,
        status: "completed",
      },
    });

    if (!hasBooking) {
      return res.status(403).json({
        success: false,
        error: "Vous devez avoir participé à cette expérience pour laisser un avis",
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis
    const existingReview = await prisma.experienceReview.findUnique({
      where: {
        experienceId_userId: {
          experienceId,
          userId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà laissé un avis sur cette expérience",
      });
    }

    const review = await prisma.experienceReview.create({
      data: {
        experienceId,
        userId,
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

    // Mettre à jour la note moyenne de l'expérience
    const allReviews = await prisma.experienceReview.findMany({
      where: { experienceId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;

    await prisma.experience.update({
      where: { id: experienceId },
      data: {
        rating: averageRating,
        reviewCount: { increment: 1 },
      },
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'avis",
    });
  }
});

/**
 * Récupérer les avis d'une expérience
 * GET /api/experience-reviews/experience/:experienceId
 */
router.get("/experience/:experienceId", async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.experienceReview.findMany({
        where: { experienceId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.experienceReview.count({
        where: { experienceId },
      }),
    ]);

    // Calculer la répartition des notes
    const ratingDistribution = await prisma.experienceReview.groupBy({
      by: ["rating"],
      where: { experienceId },
      _count: {
        rating: true,
      },
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Error getting reviews:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des avis",
    });
  }
});

module.exports = router;