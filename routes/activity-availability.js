const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// POST /api/activity-availability - Ajouter des disponibilités
router.post('/', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { activityId, dates } = req.body; // dates: [{date, startTime, endTime, slots, price}]

    // Vérifier que l'activité appartient au guide
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { guide: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    if (activity.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Créer les disponibilités
    const availabilities = await Promise.all(
      dates.map(dateData => 
        prisma.activityAvailability.create({
          data: {
            activityId,
            date: new Date(dateData.date),
            startTime: dateData.startTime,
            endTime: dateData.endTime,
            slots: dateData.slots || activity.maxParticipants,
            price: dateData.price || activity.price,
            status: 'available'
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: 'Disponibilités ajoutées avec succès',
      data: availabilities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activity-availability/:activityId - Récupérer les disponibilités d'une activité
router.get('/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { startDate, endDate } = req.query;

    let where = { activityId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      where.date = { gte: new Date() };
    }

    const availabilities = await prisma.activityAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        bookings: {
          select: {
            id: true,
            participants: true,
            status: true
          }
        }
      }
    });

    // Formater pour afficher les places disponibles
    const formattedAvailabilities = availabilities.map(av => ({
      id: av.id,
      date: av.date,
      startTime: av.startTime,
      endTime: av.endTime,
      slots: av.slots,
      bookedSlots: av.bookedSlots,
      availableSlots: av.slots - av.bookedSlots,
      price: av.price,
      status: av.status,
      bookings: av.bookings
    }));

    res.json({
      success: true,
      data: formattedAvailabilities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/activity-availability/:id - Supprimer une disponibilité
router.delete('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier la disponibilité et les permissions
    const availability = await prisma.activityAvailability.findUnique({
      where: { id },
      include: {
        activity: {
          include: { guide: true }
        },
        bookings: {
          where: { status: { not: 'cancelled' } }
        }
      }
    });

    if (!availability) {
      return res.status(404).json({ success: false, error: 'Disponibilité non trouvée' });
    }

    if (availability.activity.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Vérifier s'il y a des réservations actives
    if (availability.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer : il y a des réservations actives'
      });
    }

    // Supprimer la disponibilité
    await prisma.activityAvailability.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Disponibilité supprimée'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;