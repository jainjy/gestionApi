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

router.post('/:userId', async (req, res) => {
  try {
    console.log("➕ POST /api/tourisme-bookings/:userId", req.params, req.body);

    // ✔ ID de l'utilisateur qui réserve (dans l'URL) - CELUI QUI ENVOIE LA NOTIFICATION
    const userIdFromUrl = req.params.userId;

    const {
      listingId,
      checkIn,
      checkOut,
      guests,
      adults,
      children,
      infants,
      specialRequests,
      paymentMethod,
    } = req.body;

    // Récupérer la fiche
    const listing = await prisma.tourisme.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Hébergement non trouvé" });
    }

    // Déterminer propriétaire du service - CELUI QUI REÇOIT LA NOTIFICATION
    const proprietaireId = listing.idPrestataire;

    // Création réservation
    const booking = await prisma.tourismeBooking.create({
      data: {
        listingId,
        userId: userIdFromUrl,       // ✔ celui qui réserve
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: Number(guests),
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
        specialRequests,
        paymentMethod,
        totalAmount: listing.price,
        serviceFee: 15,
        status: "pending",
        paymentStatus: "pending",
        confirmationNumber: generateConfirmationNumber(),
      }
    });

    // CORRECTION: Création notification avec les bons IDs
    await prisma.notification.create({
      data: {
        userId: proprietaireId,              // ✔ propriétaire REÇOIT la notif
        userProprietaireId: userIdFromUrl,   // ✔ celui qui réserve (envoie la notif)
        type: "info",
        title: "Nouvelle réservation",
        message: `Nouvelle réservation pour votre hébergement "${listing.title}"`,
        relatedEntity: "tourismeBooking",
        relatedEntityId: booking.id,
      }
    });

    res.status(201).json({
      success: true,
      data: booking,
    });

  } catch (error) {
    console.error("❌ Erreur création réservation :", error);
    res.status(500).json({ error: error.message });
  }
});

// Fonction pour générer le numéro de confirmation (à ajouter si elle n'existe pas)
function generateConfirmationNumber() {
  return 'CONF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

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