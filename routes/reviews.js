// routes/reviews.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();

// POST /api/reviews - Créer un nouvel avis
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: artisanId, serviceId, rating, comment, demandeId } = req.body;

    // Vérifier que l'utilisateur a le droit de noter cet artisan
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        artisans: {
          where: {
            userId: artisanId,
            recruited: true,
            factureStatus: "validee"
          }
        }
      }
    });

    if (!demande || demande.artisans.length === 0) {
      return res.status(403).json({
        error: "Vous ne pouvez pas noter cet artisan"
      });
    }

    // Vérifier que l'utilisateur est bien le client de la demande
    if (demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à noter cet artisan"
      });
    }

    // Vérifier si un avis existe déjà pour cette combinaison
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: artisanId,
        serviceId: serviceId || null,
        user: {
          id: userId
        }
      }
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
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Avis ${existingReview ? 'modifié' : 'déposé'} - Note: ${rating}/5${comment ? ` - "${comment}"` : ''}`,
          type: "SYSTEM",
          evenementType: "AVIS_LAISSE",
        },
      });
    }

    res.json({
      success: true,
      message: `Avis ${existingReview ? 'modifié' : 'envoyé'} avec succès`,
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
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
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

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
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

module.exports = router;