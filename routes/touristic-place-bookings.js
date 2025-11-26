const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");

// Middleware CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

router.options('*', (req, res) => {
  res.sendStatus(200);
});

// Générer un numéro de confirmation unique
function generateConfirmationNumber() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TPL-${timestamp}-${random}`.toUpperCase();
}

// POST /api/touristic-place-bookings/:userId - Créer une réservation
router.post('/:userId', async (req, res) => {
  try {
    console.log("➕ POST /api/touristic-place-bookings/:userId", req.params, req.body);

    const userIdFromUrl = req.params.userId;
    const {
      placeId,
      visitDate,
      visitTime,
      numberOfTickets,
      ticketType,
      specialRequests,
      paymentMethod,
    } = req.body;

    // Récupérer le lieu touristique
    const place = await prisma.tourisme.findUnique({
      where: { id: placeId },
    });

    if (!place) {
      return res.status(404).json({ error: "Lieu touristique non trouvé" });
    }

    if (!place.isTouristicPlace) {
      return res.status(400).json({ error: "Ce lieu n'est pas un site touristique" });
    }

    // Calculer le prix total
    const basePrice = place.price || 0;
    const totalAmount = basePrice * numberOfTickets;
    const serviceFee = totalAmount * 0.10; // 10% de frais de service

    // Création de la réservation
    const booking = await prisma.touristicPlaceBooking.create({
      data: {
        placeId,
        userId: userIdFromUrl,
        visitDate: new Date(visitDate),
        visitTime,
        numberOfTickets: Number(numberOfTickets),
        ticketType,
        totalAmount,
        serviceFee,
        specialRequests,
        paymentMethod,
        status: "pending",
        paymentStatus: "pending",
        confirmationNumber: generateConfirmationNumber(),
      }
    });

    // Notification au propriétaire du lieu
    await prisma.notification.create({
      data: {
        userId: place.idPrestataire,
        userProprietaireId: userIdFromUrl,
        type: "info",
        title: "Nouvelle réservation de billet",
        message: `Nouvelle réservation pour votre lieu "${place.title}" - ${numberOfTickets} billet(s)`,
        relatedEntity: "touristicPlaceBooking",
        relatedEntityId: booking.id,
      }
    });

    res.status(201).json({
      success: true,
      data: booking,
    });

  } catch (error) {
    console.error("❌ Erreur création réservation lieu touristique :", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/touristic-place-bookings - Récupérer les réservations
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête reçue pour /api/touristic-place-bookings', req.query);
    
    const {
      userId,
      placeId,
      status,
      paymentStatus,
      prestataireId, // Pour le prestataire
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction des filtres
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (placeId) {
      where.placeId = placeId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filtre pour le prestataire (ses propres lieux)
    if (prestataireId) {
      where.place = {
        idPrestataire: prestataireId
      };
    }

    // Récupération des données
    const [bookings, total] = await Promise.all([
      prisma.touristicPlaceBooking.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          place: {
            select: {
              id: true,
              title: true,
              type: true,
              city: true,
              images: true,
              price: true,
              openingHours: true,
              idPrestataire: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.touristicPlaceBooking.count({ where })
    ]);

    console.log(`✅ ${bookings.length} réservations de lieux touristiques trouvées`);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des réservations',
      details: error.message
    });
  }
});

// GET /api/touristic-place-bookings/:id - Récupérer une réservation spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Requête reçue pour /api/touristic-place-bookings/${id}`);

    const booking = await prisma.touristicPlaceBooking.findUnique({
      where: { id },
      include: {
        place: true,
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

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    console.log(`✅ Réservation ${id} trouvée`);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Erreur récupération détail réservation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la réservation',
      details: error.message
    });
  }
});

// PUT /api/touristic-place-bookings/:id/status - Mettre à jour le statut
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, stripePaymentIntent } = req.body;
    
    console.log(`✏️ Mise à jour statut réservation: ${id}`, req.body);

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (stripePaymentIntent) updateData.stripePaymentIntent = stripePaymentIntent;

    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const updatedBooking = await prisma.touristicPlaceBooking.update({
      where: { id },
      data: updateData,
      include: {
        place: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            images: true
          }
        },
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

    console.log(`✅ Statut réservation ${id} mis à jour: ${status}`);

    // Notification à l'utilisateur
    const io = req.app.get("io");
    if (updatedBooking.user) {
      let notificationMessage = '';
      let notificationTitle = '';

      if (status === 'confirmed') {
        notificationTitle = "Billet confirmé";
        notificationMessage = `Votre billet pour "${updatedBooking.place.title}" a été confirmé.`;
      } else if (status === 'cancelled') {
        notificationTitle = "Billet annulé";
        notificationMessage = `Votre billet pour "${updatedBooking.place.title}" a été annulé.`;
      }

      if (notificationMessage) {
        await createNotification({
          userId: updatedBooking.user.id,
          type: status === 'cancelled' ? 'warning' : 'info',
          title: notificationTitle,
          message: notificationMessage,
          relatedEntity: "touristicPlaceBooking",
          relatedEntityId: String(updatedBooking.id),
          io,
        });
      }
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Statut de réservation mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour statut réservation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
});

// GET /api/touristic-place-bookings/place/:placeId/availability - Vérifier la disponibilité
router.get('/place/:placeId/availability', async (req, res) => {
  try {
    const { placeId } = req.params;
    const { visitDate } = req.query;
    
    console.log(`📅 Vérification disponibilité: ${placeId}`, { visitDate });

    if (!visitDate) {
      return res.status(400).json({
        success: false,
        error: 'Le paramètre visitDate est requis'
      });
    }

    const visitDateObj = new Date(visitDate);
    const startOfDay = new Date(visitDateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(visitDateObj.setHours(23, 59, 59, 999));

    // Compter les réservations pour cette date
    const bookingCount = await prisma.touristicPlaceBooking.count({
      where: {
        placeId,
        status: { in: ['pending', 'confirmed'] },
        visitDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Récupérer les infos du lieu pour connaître la capacité
    const place = await prisma.tourisme.findUnique({
      where: { id: placeId },
      select: {
        maxGuests: true,
        title: true
      }
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        error: 'Lieu touristique non trouvé'
      });
    }

    const availableSpots = place.maxGuests - bookingCount;
    const isAvailable = availableSpots > 0;

    console.log(`✅ Disponibilité vérifiée: ${isAvailable ? 'Disponible' : 'Complet'}`);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        availableSpots,
        totalCapacity: place.maxGuests,
        bookedSpots: bookingCount,
        placeTitle: place.title
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification disponibilité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de la disponibilité',
      details: error.message
    });
  }
});

// DELETE /api/touristic-place-bookings/:id - Annuler une réservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Annulation réservation: ${id}`);

    const cancelledBooking = await prisma.touristicPlaceBooking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      },
      include: {
        user: true,
        place: true
      }
    });

    console.log(`✅ Réservation ${id} annulée`);

    // Notification d'annulation
    const io = req.app.get("io");
    if (cancelledBooking.user) {
      await createNotification({
        userId: cancelledBooking.user.id,
        type: "warning",
        title: "Réservation annulée",
        message: `Votre réservation pour "${cancelledBooking.place.title}" a été annulée.`,
        relatedEntity: "touristicPlaceBooking",
        relatedEntityId: String(cancelledBooking.id),
        io,
      });
    }

    res.json({
      success: true,
      data: cancelledBooking,
      message: 'Réservation annulée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur annulation réservation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation de la réservation',
      details: error.message
    });
  }
});

// GET /api/touristic-place-bookings/prestataire/:prestataireId/stats - Statistiques pour prestataire
router.get('/prestataire/:prestataireId/stats', async (req, res) => {
  try {
    const { prestataireId } = req.params;
    const { period = 'month' } = req.query; // month, week, year

    console.log(`📊 Statistiques pour prestataire: ${prestataireId}`);

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default: // month
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Récupérer les réservations du prestataire
    const bookings = await prisma.touristicPlaceBooking.findMany({
      where: {
        place: {
          idPrestataire: prestataireId
        },
        createdAt: {
          gte: startDate
        }
      },
      include: {
        place: true
      }
    });

    // Calcul des statistiques
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    const places = await prisma.tourisme.findMany({
      where: {
        idPrestataire: prestataireId,
        isTouristicPlace: true
      }
    });

    const stats = {
      totalPlaces: places.length,
      totalBookings,
      confirmedBookings,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue,
      averageRevenuePerBooking: confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0,
      bookingRate: places.length > 0 ? (totalBookings / places.length) : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

module.exports = router;