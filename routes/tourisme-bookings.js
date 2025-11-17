const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
//const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();
const { createNotification ,createNotificationTourisme } = require("../services/notificationService");

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
  return `TRV-${timestamp}-${random}`.toUpperCase();
}

// POST /api/tourisme-bookings - Créer une réservation
router.post('/', async (req, res) => {
  try {
    console.log('➕ Requête POST reçue pour /api/tourisme-bookings', req.body);
    
    const {
      listingId,
      userId,
      checkIn,
      checkOut,
      guests,
      adults,
      children,
      infants,
      specialRequests,
      paymentMethod
    } = req.body;

    if (!listingId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants: listingId, checkIn, checkOut, guests'
      });
    }

    const listing = await prisma.tourisme.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Hébergement non trouvé' });
    }

    const existingBooking = await prisma.tourismeBooking.findFirst({
      where: {
        listingId,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } }
        ]
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: 'L\'hébergement n\'est pas disponible pour ces dates'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La date de départ doit être après la date d\'arrivée'
      });
    }

    const baseAmount = listing.price * nights;
    const serviceFee = 15.00;
    const totalAmount = baseAmount + serviceFee;

    const booking = await prisma.tourismeBooking.create({
  data: {
    listingId,
    userId: userId || null,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: parseInt(guests),
    adults: parseInt(adults) || parseInt(guests),
    children: parseInt(children) || 0,
    infants: parseInt(infants) || 0,
    totalAmount,
    serviceFee,
    specialRequests: specialRequests || '',
    paymentMethod: paymentMethod || 'card',
    confirmationNumber: generateConfirmationNumber(),
    status: 'pending',
    paymentStatus: 'pending'
  },
  include: {
    listing: true,
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


    console.log(`✅ Réservation créée: ${booking.confirmationNumber}`);

    // 🔔 Création automatique d'une notification
    const io = req.app.get("io"); // Assure-toi que le serveur a "io"
    // await createNotification({
    //   userId: booking.userId,
    //   type: "info",
    //   title: "Nouvelle réservation",
    //   message: `Votre réservation pour "${listing.title}" du ${checkIn} au ${checkOut} a été créée.`,
    //   relatedEntity: "tourismeBooking",
    //   relatedEntityId: String(booking.id),
    //   io,
    // });
      await createNotificationTourisme({
        userId: listing.idPrestataire,               // 👉 ID du propriétaire
        userProprietaireId: listing.idPrestataire,   // 👉 Stocker dans la colonne userProprietaireId
        type: "info",
        title: "Nouvelle réservation reçue",
        message: `Vous avez reçu une nouvelle réservation pour "${listing.title}" du ${checkIn} au ${checkOut}.`,
        relatedEntity: "tourismeBooking",
        relatedEntityId: String(booking.id),
        io,
      });
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Réservation créée avec succès et notification envoyée'
    });

  } catch (error) {
    console.error('❌ Erreur création réservation:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Numéro de confirmation déjà utilisé'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la réservation',
      details: error.message
    });
  }
});


// GET /api/tourisme-bookings - Récupérer les réservations avec filtres
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête reçue pour /api/tourisme-bookings', req.query);
    
    const {
      userId,
      listingId,
      status,
      paymentStatus,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction des filtres
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (listingId) {
      where.listingId = listingId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Récupération des données
    const [bookings, total] = await Promise.all([
      prisma.tourismeBooking.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              city: true,
              images: true,
              price: true
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
      prisma.tourismeBooking.count({ where })
    ]);

    console.log(`✅ ${bookings.length} réservations trouvées`);

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

// GET /api/tourisme-bookings/:id - Récupérer une réservation spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Requête reçue pour /api/tourisme-bookings/${id}`);

    const booking = await prisma.tourismeBooking.findUnique({
      where: { id },
      include: {
        listing: true,
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

// GET /api/tourisme-bookings/confirmation/:confirmationNumber - Récupérer par numéro de confirmation
router.get('/confirmation/:confirmationNumber', async (req, res) => {
  try {
    const { confirmationNumber } = req.params;
    console.log(`🔍 Requête reçue pour confirmation: ${confirmationNumber}`);

    const booking = await prisma.tourismeBooking.findUnique({
      where: { confirmationNumber },
      include: {
        listing: true,
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

    console.log(`✅ Réservation ${confirmationNumber} trouvée`);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Erreur récupération par confirmation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la réservation',
      details: error.message
    });
  }
});

// PUT /api/tourisme-bookings/:id/status - Mettre à jour le statut d'une réservation
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

    const updatedBooking = await prisma.tourismeBooking.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
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

    // 🔔 Notification selon le nouveau statut
    const io = req.app.get("io");
    if (updatedBooking.user) {
      let notificationMessage = '';
      let notificationTitle = '';

      if (status === 'cancelled') {
        notificationTitle = "Réservation annulée";
        notificationMessage = `Votre réservation pour "${updatedBooking.listing.title}" a été annulée.`;
      } else if (status === 'confirmed') {
        notificationTitle = "Réservation confirmée";
        notificationMessage = `Votre réservation pour "${updatedBooking.listing.title}" a été confirmée.`;
      } else if (status === 'pending') {
        notificationTitle = "Réservation en attente";
        notificationMessage = `Votre réservation pour "${updatedBooking.listing.title}" est en attente.`;
      }

      if (notificationMessage) {
        await createNotification({
          userId: updatedBooking.user.id,
          type: status === 'cancelled' ? 'warning' : 'info',
          title: notificationTitle,
          message: notificationMessage,
          relatedEntity: "tourismeBooking",
          relatedEntityId: String(updatedBooking.id),
          io,
        });
      }
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Statut de réservation mis à jour avec succès et notification envoyée'
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


// GET /api/tourisme-bookings/listing/:listingId/availability - Vérifier la disponibilité
router.get('/listing/:listingId/availability', async (req, res) => {
  try {
    const { listingId } = req.params;
    const { checkIn, checkOut } = req.query;
    
    console.log(`📅 Vérification disponibilité: ${listingId}`, { checkIn, checkOut });

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Les paramètres checkIn et checkOut sont requis'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBooking = await prisma.tourismeBooking.findFirst({
      where: {
        listingId,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate }
          }
        ]
      }
    });

    const isAvailable = !conflictingBooking;

    console.log(`✅ Disponibilité vérifiée: ${isAvailable ? 'Disponible' : 'Indisponible'}`);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflictingBooking: isAvailable ? null : {
          id: conflictingBooking.id,
          checkIn: conflictingBooking.checkIn,
          checkOut: conflictingBooking.checkOut
        }
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

// DELETE /api/tourisme-bookings/:id - Annuler une réservation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Annulation réservation: ${id}`);

    const cancelledBooking = await prisma.tourismeBooking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      },
      include: {
        user: true,
        listing: true
      }
    });

    console.log(`✅ Réservation ${id} annulée`);

    // 🔔 Création de la notification d'annulation
    const io = req.app.get("io"); // Assure-toi que le serveur a "io"
    if (cancelledBooking.user) {
      await createNotification({
        userId: cancelledBooking.user.id,
        type: "warning",
        title: "Réservation annulée",
        message: `Votre réservation pour "${cancelledBooking.listing.title}" a été annulée.`,
        relatedEntity: "tourismeBooking",
        relatedEntityId: String(cancelledBooking.id),
        io,
      });
    }

    res.json({
      success: true,
      data: cancelledBooking,
      message: 'Réservation annulée avec succès et notification envoyée'
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


module.exports = router;