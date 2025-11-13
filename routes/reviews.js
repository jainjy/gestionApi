// routes/reviews.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { emitNewMessage } = require("../utils/message");

const prisma = new PrismaClient();

// POST /api/reviews - Créer un nouvel avis
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      userId: artisanId,
      serviceId,
      rating,
      comment,
      demandeId,
    } = req.body;

    // Vérifier que l'utilisateur a le droit de noter cet artisan
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        artisans: {
          where: {
            userId: artisanId,
            recruited: true,
            factureStatus: "validee",
          },
        },
      },
    });

    if (!demande || demande.artisans.length === 0) {
      return res.status(403).json({
        error: "Vous ne pouvez pas noter cet artisan",
      });
    }

    // Vérifier que l'utilisateur est bien le client de la demande
    if (demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à noter cet artisan",
      });
    }

    // Vérifier si un avis existe déjà pour cette combinaison
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: artisanId,
        serviceId: serviceId || null,
        user: {
          id: userId,
        },
      },
    });

    let review;

    if (existingReview) {
      // Mettre à jour l'avis existant
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating),
          comment: comment || null,
        },
      });
    } else {
      // Créer un nouvel avis
      review = await prisma.review.create({
        data: {
          userId: artisanId,
          serviceId: serviceId ? parseInt(serviceId) : null,
          rating: parseInt(rating),
          comment: comment || null,
        },
      });
    }

    // Créer un message système dans la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Avis ${existingReview ? "modifié" : "déposé"} - Note: ${rating}/5${comment ? ` - "${comment}"` : ""}`,
          type: "SYSTEM",
          evenementType: "AVIS_LAISSE",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: `Avis ${existingReview ? "modifié" : "envoyé"} avec succès`,
      review,
    });
  } catch (error) {
    console.error("Erreur création avis:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi de l'avis",
    });
  }
});

// GET /api/reviews/user/:userId - Obtenir les avis d'un utilisateur
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
          },
        },
        service: {
          select: {
            libelle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer la note moyenne
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Erreur récupération avis:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des avis",
    });
  }
});

// GET /api/reviews/service/:serviceId - Obtenir les avis d'un service
router.get("/service/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        serviceId: parseInt(serviceId),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Erreur récupération avis service:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des avis du service",
    });
  }
});

// GET /api/reviews/me - Obtenir les avis du profil connecté (pour les professionnels)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les avis où l'utilisateur connecté est noté
    const reviews = await prisma.review.findMany({
      where: {
        userId: userId, // L'utilisateur connecté est celui qui est noté
      },
      include: {
        user: {
          // Le client qui a laissé l'avis
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            libelle: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer les statistiques
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    // Calculer la distribution des notes
    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      return {
        stars,
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
      };
    });

    // Obtenir les certifications/badges de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        userType: true,
        status: true,
        createdAt: true,
      },
    });

    // Générer les badges basés sur le profil
    const badges = generateUserBadges(user, totalReviews, averageRating);

    res.json({
      success: true,
      reviews,
      statistics: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
      },
      badges,
    });
  } catch (error) {
    console.error("Erreur récupération avis profil:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération de vos avis",
    });
  }
});

// Fonction pour générer les badges de l'utilisateur
function generateUserBadges(user, totalReviews, averageRating) {
  const badges = [];

  // Badge de certification de base
  if (user.role === "admin") {
    badges.push("Administrateur");
  } else if (user.userType === "PRESTATAIRE") {
    badges.push("Pro Certifié");
  } else if (user.userType === "AGENCE") {
    badges.push("Agence Immobilière");
  }

  // Badges basés sur l'ancienneté
  const accountAge =
    new Date().getFullYear() - new Date(user.createdAt).getFullYear();
  if (accountAge >= 2) {
    badges.push("Expert Confirmé");
  } else if (accountAge >= 1) {
    badges.push("Expérience Solide");
  }

  // Badges basés sur les reviews
  if (totalReviews >= 50) {
    badges.push("Top Prestataire");
  } else if (totalReviews >= 10) {
    badges.push("Populaire");
  }

  if (averageRating >= 4.5 && totalReviews >= 5) {
    badges.push("Excellence Service");
  } else if (averageRating >= 4.0) {
    badges.push("Service Qualité");
  }

  // Badge de réponse rapide (à implémenter avec les données de réponse)
  badges.push("Réponse Rapide");

  return badges;
}

// POST /api/reviews/response - Répondre à un avis
router.post("/response", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId, response } = req.body;

    // Vérifier que l'avis appartient bien à l'utilisateur connecté
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: userId, // L'utilisateur connecté est celui qui est noté
      },
    });

    if (!review) {
      return res.status(404).json({
        error:
          "Avis non trouvé ou vous n'êtes pas autorisé à répondre à cet avis",
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        // On utilise metadata pour stocker la réponse temporairement
        metadata: {
          ...(review.metadata || {}),
          professionalResponse: response,
          responseDate: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      message: "Réponse envoyée avec succès",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Erreur réponse avis:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi de la réponse",
    });
  }
});

module.exports = router;
