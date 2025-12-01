const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

// POST créer une réservation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      activityId,
      availabilityId,
      participants,
      specialRequests,
      paymentMethod,
      promotionCode
    } = req.body;

    // Vérifier la disponibilité
    const availability = await prisma.activityAvailability.findUnique({
      where: { id: availabilityId },
      include: { 
        activity: {
          include: {
            guide: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Créneau non disponible'
      });
    }

    if (availability.bookedSlots + participants > availability.slots) {
      return res.status(400).json({
        success: false,
        error: 'Plus assez de places disponibles'
      });
    }

    let totalAmount = (availability.price || availability.activity.price) * participants;
    let discountApplied = 0;

    // Appliquer une promotion si fournie
    if (promotionCode) {
      const promotion = await prisma.activityPromotion.findFirst({
        where: { 
          code: promotionCode,
          activityId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
          OR: [
            { usageLimit: null },
            { usageLimit: { gt: { usedCount: 0 } } }
          ]
        }
      });

      if (promotion) {
        if (promotion.discountType === 'percentage') {
          discountApplied = totalAmount * (promotion.discountValue / 100);
        } else {
          discountApplied = promotion.discountValue;
        }
        totalAmount = Math.max(0, totalAmount - discountApplied);

        // Incrémenter le compteur d'utilisation
        await prisma.activityPromotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }

    // Créer la réservation
    const booking = await prisma.activityBooking.create({
      data: {
        activityId,
        availabilityId,
        userId: req.user.id,
        participants: parseInt(participants),
        totalAmount,
        specialRequests,
        paymentMethod
      },
      include: {
        activity: {
          include: {
            guide: {
              include: {
                user: {
                  select: {
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
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Mettre à jour les slots réservés
    await prisma.activityAvailability.update({
      where: { id: availabilityId },
      data: { bookedSlots: { increment: participants } }
    });

    // Créer un paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convertir en centimes
      currency: 'eur',
      metadata: {
        bookingId: booking.id,
        activityId,
        userId: req.user.id,
        discountApplied: discountApplied.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Mettre à jour la réservation avec l'ID de paiement
    await prisma.activityBooking.update({
      where: { id: booking.id },
      data: { stripePaymentIntent: paymentIntent.id }
    });

    // Notifier le guide
    if (req.io) {
      req.io.to(`user:${booking.activity.guide.userId}`).emit('new-booking', {
        type: 'NEW_BOOKING',
        booking,
        message: `Nouvelle réservation pour ${booking.activity.title}`
      });
    }

    res.json({
      success: true,
      data: {
        booking,
        clientSecret: paymentIntent.client_secret,
        discountApplied
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la réservation'
    });
  }
});

// GET mes réservations
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const bookings = await prisma.activityBooking.findMany({
      where,
      include: {
        activity: {
          include: {
            guide: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        availability: true,
        review: true
      },
      orderBy: { bookedAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.activityBooking.count({ where });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des réservations'
    });
  }
});

// GET réservations d'un guide
router.get('/guide/my-bookings', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Vérifier que l'utilisateur est un guide
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id }
    });

    if (!guide) {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux guides'
      });
    }

    const where = {
      activity: { guideId: guide.id }
    };
    if (status) where.status = status;

    const bookings = await prisma.activityBooking.findMany({
      where,
      include: {
        activity: true,
        availability: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        review: true
      },
      orderBy: { bookedAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.activityBooking.count({ where });

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching guide bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des réservations'
    });
  }
});

// PUT annuler une réservation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: { 
        availability: true,
        activity: {
          include: {
            guide: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à annuler cette réservation'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Réservation déjà annulée'
      });
    }

    // Libérer les slots
    await prisma.activityAvailability.update({
      where: { id: booking.availabilityId },
      data: { bookedSlots: { decrement: booking.participants } }
    });

    // Annuler la réservation
    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date()
      }
    });

    // Remboursement Stripe si payé
    if (booking.paymentStatus === 'paid') {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntent);
        if (paymentIntent.status === 'succeeded') {
          await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntent,
          });
        }
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
      }
    }

    // Notifier le guide
    if (req.io) {
      req.io.to(`user:${booking.activity.guide.userId}`).emit('booking-cancelled', {
        type: 'BOOKING_CANCELLED',
        booking: updatedBooking,
        message: `Réservation annulée pour ${booking.activity.title}`
      });
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Réservation annulée avec succès'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation de la réservation'
    });
  }
});

// PUT confirmer une réservation (pour les guides)
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.activityBooking.findUnique({
      where: { id },
      include: { 
        activity: {
          include: {
            guide: true
          }
        },
        user: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le guide
    if (booking.activity.guide.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à confirmer cette réservation'
      });
    }

    const updatedBooking = await prisma.activityBooking.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date()
      },
      include: {
        activity: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Envoyer un email de confirmation
    await sendEmail({
      to: updatedBooking.user.email,
      subject: 'Confirmation de votre réservation',
      template: 'booking-confirmation',
      data: {
        userName: `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
        activityTitle: updatedBooking.activity.title,
        bookingDate: updatedBooking.availability.date.toLocaleDateString('fr-FR'),
        bookingTime: updatedBooking.availability.startTime,
        participants: updatedBooking.participants,
        meetingPoint: updatedBooking.activity.meetingPoint,
        totalAmount: updatedBooking.totalAmount
      }
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Réservation confirmée avec succès'
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la confirmation de la réservation'
    });
  }
});

module.exports = router;