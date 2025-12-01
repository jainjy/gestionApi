const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/activity-bookings - Créer une réservation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { activityId, availabilityId, participants, specialRequests } = req.body;

    // Vérifier l'activité
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        guide: {
          include: {
            user: true
          }
        },
        availability: {
          where: { id: availabilityId }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activité non trouvée' });
    }

    const availability = activity.availability[0];
    if (!availability) {
      return res.status(404).json({ success: false, error: 'Disponibilité non trouvée' });
    }

    // Vérifier les places disponibles
    const availableSlots = availability.slots - availability.bookedSlots;
    if (participants > availableSlots) {
      return res.status(400).json({
        success: false,
        error: `Il ne reste que ${availableSlots} places disponibles`
      });
    }

    // Calculer le montant total
    const totalAmount = activity.price ? activity.price * participants : 0;

    // Créer la réservation
    const booking = await prisma.activityBooking.create({
      data: {
        activityId,
        availabilityId,
        userId: req.user.id,
        participants,
        totalAmount,
        specialRequests,
        status: 'pending',
        paymentStatus: 'pending'
      },
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
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        availability: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Mettre à jour les places réservées
    await prisma.activityAvailability.update({
      where: { id: availabilityId },
      data: {
        bookedSlots: { increment: participants }
      }
    });

    // Créer une notification pour le guide (via WebSocket)
    if (req.io && activity.guide.user) {
      req.io.to(`user:${activity.guide.userId}`).emit('new-notification', {
        title: 'Nouvelle réservation',
        message: `${req.user.firstName} ${req.user.lastName} a réservé "${activity.title}"`,
        type: 'booking',
        relatedEntity: 'activity',
        relatedEntityId: activityId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activity-bookings/my-bookings - Réservations de l'utilisateur
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.activityBooking.findMany({
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
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            category: true
          }
        },
        availability: true,
        review: true
      },
      orderBy: { bookedAt: 'desc' }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/activity-bookings/guide-bookings - Réservations pour le guide
router.get('/guide-bookings', authenticateToken, async (req, res) => {
  try {
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id }
    });

    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide non trouvé' });
    }

    const bookings = await prisma.activityBooking.findMany({
      where: {
        activity: {
          guideId: guide.id
        }
      },
      include: {
        activity: {
          include: {
            category: true
          }
        },
        availability: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        review: true
      },
      orderBy: { bookedAt: 'desc' }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/activity-bookings/:id/status - Changer le statut d'une réservation
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérifier la réservation
    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            guide: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    // Vérifier les permissions
    const isOwner = booking.userId === req.user.id;
    const isGuide = booking.activity.guide.userId === req.user.id;

    if (!isOwner && !isGuide) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Mettre à jour le statut
    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: { 
        status,
        ...(status === 'confirmed' && { confirmedAt: new Date() }),
        ...(status === 'cancelled' && { cancelledAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() })
      },
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
                    email: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Notifier l'autre partie via WebSocket
    if (req.io) {
      const targetUserId = isOwner ? booking.activity.guide.userId : booking.userId;
      const message = isOwner 
        ? `Vous avez ${status} votre réservation pour "${booking.activity.title}"`
        : `${req.user.firstName} ${req.user.lastName} a ${status} la réservation`;

      req.io.to(`user:${targetUserId}`).emit('new-notification', {
        title: 'Réservation mise à jour',
        message,
        type: 'booking',
        relatedEntity: 'activity',
        relatedEntityId: booking.activityId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;