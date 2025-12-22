const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const prisma = new PrismaClient();

// POST: Créer un avis
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehiculeId,
      reservationId,
      rating,
      titre,
      commentaire,
      avantages,
      inconvenients,
      recommandation,
      dateExperience,
    } = req.body;

    // Vérifier si l'utilisateur a une réservation pour ce véhicule
    const reservation = await prisma.reservationVehicule.findFirst({
      where: {
        id: reservationId,
        clientId: userId,
        vehiculeId,
        statut: "terminee",
      },
    });

    if (!reservation) {
      return res.status(403).json({
        success: false,
        error:
          "Vous devez avoir terminé une location pour laisser un avis sur ce véhicule",
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce véhicule
    const avisExistant = await prisma.avisVehicule.findFirst({
      where: {
        vehiculeId,
        clientId: userId,
      },
    });

    if (avisExistant) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà laissé un avis pour ce véhicule",
      });
    }

    // Créer l'avis
    const avis = await prisma.avisVehicule.create({
      data: {
        vehiculeId,
        reservationId,
        clientId: userId,
        rating: parseInt(rating),
        titre,
        commentaire,
        avantages: Array.isArray(avantages) ? avantages : [],
        inconvenients: Array.isArray(inconvenients) ? inconvenients : [],
        recommandation: recommandation === true,
        dateExperience: new Date(dateExperience),
        verifie: true,
        statut: "actif",
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Mettre à jour les statistiques du véhicule
    const tousLesAvis = await prisma.avisVehicule.findMany({
      where: { vehiculeId, statut: "actif" },
    });

    const moyenneRating =
      tousLesAvis.length > 0
        ? tousLesAvis.reduce((sum, avis) => sum + avis.rating, 0) /
          tousLesAvis.length
        : 0;

    await prisma.vehicule.update({
      where: { id: vehiculeId },
      data: {
        rating: parseFloat(moyenneRating.toFixed(1)),
        nombreAvis: { increment: 1 },
      },
    });

    // Notification au prestataire
    const vehicule = await prisma.vehicule.findUnique({
      where: { id: vehiculeId },
      select: { prestataireId: true, marque: true, modele: true },
    });

    await prisma.notification.create({
      data: {
        userId: vehicule.prestataireId,
        type: "nouvel_avis",
        title: "Nouvel avis sur votre véhicule",
        message: `${req.user.firstName} a laissé un avis sur votre ${vehicule.marque} ${vehicule.modele}`,
        relatedEntity: "AvisVehicule",
        relatedEntityId: avis.id,
      },
    });

    // Socket.io
    if (req.io) {
      req.io.to(`user:${vehicule.prestataireId}`).emit("new-review", {
        type: "vehicule_review",
        vehiculeId,
        rating,
        client: req.user.firstName + " " + req.user.lastName,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: avis,
      message: "Avis publié avec succès",
    });
  } catch (error) {
    console.error("Erreur création avis:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la publication de l'avis",
    });
  }
});

// GET: Avis d'un véhicule
router.get("/vehicule/:vehiculeId", async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      vehiculeId,
      statut: "actif",
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    const total = await prisma.avisVehicule.count({ where });

    const avis = await prisma.avisVehicule.findMany({
      where,
      include: {
        client: {
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
    });

    // Calculer les statistiques des notes
    const allRatings = await prisma.avisVehicule.findMany({
      where: { vehiculeId, statut: "actif" },
      select: { rating: true },
    });

    const ratingStats = {
      1: allRatings.filter((a) => a.rating === 1).length,
      2: allRatings.filter((a) => a.rating === 2).length,
      3: allRatings.filter((a) => a.rating === 3).length,
      4: allRatings.filter((a) => a.rating === 4).length,
      5: allRatings.filter((a) => a.rating === 5).length,
    };

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, a) => sum + a.rating, 0) / allRatings.length
        : 0;

    res.json({
      success: true,
      data: {
        avis,
        stats: {
          total,
          averageRating: parseFloat(averageRating.toFixed(1)),
          ratingDistribution: ratingStats,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Erreur récupération avis:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des avis",
    });
  }
});

// DELETE: Supprimer un avis
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const avis = await prisma.avisVehicule.findUnique({
      where: { id },
      select: { clientId: true, vehiculeId: true },
    });

    if (!avis) {
      return res.status(404).json({
        success: false,
        error: "Avis non trouvé",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Seul l'auteur de l'avis ou un admin peut le supprimer
    if (avis.clientId !== userId && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cet avis",
      });
    }

    // Marquer comme supprimé
    await prisma.avisVehicule.update({
      where: { id },
      data: { statut: "supprime" },
    });

    // Recalculer la moyenne des notes
    const tousLesAvis = await prisma.avisVehicule.findMany({
      where: { vehiculeId: avis.vehiculeId, statut: "actif" },
    });

    const nouvelleMoyenne =
      tousLesAvis.length > 0
        ? tousLesAvis.reduce((sum, a) => sum + a.rating, 0) / tousLesAvis.length
        : 0;

    await prisma.vehicule.update({
      where: { id: avis.vehiculeId },
      data: {
        rating: parseFloat(nouvelleMoyenne.toFixed(1)),
        nombreAvis: { decrement: 1 },
      },
    });

    res.json({
      success: true,
      message: "Avis supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression avis:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'avis",
    });
  }
});

module.exports = router;
