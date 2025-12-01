const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET disponibilités d'une activité
router.get('/activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { activityId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      where.date = { gte: new Date() };
    }

    const availability = await prisma.activityAvailability.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des disponibilités'
    });
  }
});

// POST créer une disponibilité (pour les guides)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      activityId,
      date,
      startTime,
      endTime,
      slots,
      price
    } = req.body;

    // Vérifier que l'utilisateur est le guide de cette activité
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { guide: true }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activité non trouvée'
      });
    }

    if (activity.guide.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à modifier les disponibilités de cette activité'
      });
    }

    const availability = await prisma.activityAvailability.create({
      data: {
        activityId,
        date: new Date(date),
        startTime,
        endTime,
        slots: parseInt(slots),
        price: price ? parseFloat(price) : null
      }
    });

    res.status(201).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la disponibilité'
    });
  }
});

// PUT mettre à jour une disponibilité
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier les permissions
    const availability = await prisma.activityAvailability.findUnique({
      where: { id },
      include: {
        activity: {
          include: { guide: true }
        }
      }
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Disponibilité non trouvée'
      });
    }

    if (availability.activity.guide.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à modifier cette disponibilité'
      });
    }

    const updatedAvailability = await prisma.activityAvailability.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedAvailability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la disponibilité'
    });
  }
});

// DELETE supprimer une disponibilité
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les permissions
    const availability = await prisma.activityAvailability.findUnique({
      where: { id },
      include: {
        activity: {
          include: { guide: true }
        },
        bookings: {
          where: {
            status: { not: 'cancelled' }
          }
        }
      }
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Disponibilité non trouvée'
      });
    }

    if (availability.activity.guide.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à supprimer cette disponibilité'
      });
    }

    // Vérifier qu'il n'y a pas de réservations actives
    if (availability.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer une disponibilité avec des réservations actives'
      });
    }

    await prisma.activityAvailability.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Disponibilité supprimée avec succès'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la disponibilité'
    });
  }
});

module.exports = router;