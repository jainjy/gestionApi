// routes/user-bookings.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

// GET /api/user/bookings - Récupérer les réservations de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    console.log('📦 Requête reçue pour /api/user/bookings', req.query);
    
    const {
      status,
      page = 1,
      limit = 10,
      userId // Doit être fourni par le middleware d'authentification
    } = req.query;

    // Vérifier que l'userId est fourni
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction des filtres
    const where = {
      userId: userId
    };

    if (status && status !== 'all') {
      where.status = status;
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
              price: true,
              provider: true,
              rating: true,
              reviewCount: true,
              amenities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tourismeBooking.count({ where })
    ]);

    console.log(`✅ ${bookings.length} réservations trouvées pour l'utilisateur ${userId}`);

    // Formater les données pour le frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      code: booking.confirmationNumber,
      service: `Location ${booking.listing.type} - ${booking.listing.title}`,
      date: booking.checkIn.toISOString().split('T')[0],
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: mapStatus(booking.status),
      amount: booking.totalAmount,
      guests: booking.guests,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      specialRequests: booking.specialRequests,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      listing: booking.listing,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt
    }));

    res.json({
      success: true,
      data: formattedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération réservations utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des réservations',
      details: error.message
    });
  }
});

// GET /api/user/bookings/:id - Récupérer une réservation spécifique de l'utilisateur
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    console.log(`🔍 Requête reçue pour /api/user/bookings/${id}`, { userId });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    const booking = await prisma.tourismeBooking.findFirst({
      where: {
        id,
        userId
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            images: true,
            price: true,
            provider: true,
            rating: true,
            reviewCount: true,
            amenities: true,
            description: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            maxGuests: true,
            instantBook: true,
            cancellationPolicy: true
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

    // Formater la réservation
    const formattedBooking = {
      id: booking.id,
      code: booking.confirmationNumber,
      service: `Location ${booking.listing.type} - ${booking.listing.title}`,
      date: booking.checkIn.toISOString().split('T')[0],
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: mapStatus(booking.status),
      amount: booking.totalAmount,
      serviceFee: booking.serviceFee,
      guests: booking.guests,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      specialRequests: booking.specialRequests,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      listing: booking.listing,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt,
      nights: Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 60 * 60 * 24))
    };

    console.log(`✅ Réservation ${id} trouvée pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      data: formattedBooking
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

// PUT /api/user/bookings/:id/cancel - Annuler une réservation
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log(`🗑️ Annulation réservation utilisateur: ${id}`, { userId });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    // Vérifier que la réservation appartient à l'utilisateur
    const existingBooking = await prisma.tourismeBooking.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    // Vérifier que la réservation peut être annulée
    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cette réservation est déjà annulée'
      });
    }

    if (existingBooking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'annuler une réservation terminée'
      });
    }

    const cancelledBooking = await prisma.tourismeBooking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            images: true
          }
        }
      }
    });

    console.log(`✅ Réservation ${id} annulée par l'utilisateur ${userId}`);

    res.json({
      success: true,
      data: {
        id: cancelledBooking.id,
        code: cancelledBooking.confirmationNumber,
        status: mapStatus(cancelledBooking.status)
      },
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

// PUT /api/user/bookings/:id/reschedule - Reprogrammer une réservation
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, checkIn, checkOut } = req.body;

    console.log(`📅 Reprogrammation réservation: ${id}`, { userId, checkIn, checkOut });

    if (!userId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes: userId, checkIn, checkOut requis'
      });
    }

    // Vérifier que la réservation appartient à l'utilisateur
    const existingBooking = await prisma.tourismeBooking.findFirst({
      where: {
        id,
        userId
      },
      include: {
        listing: true
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    // Vérifier que la réservation peut être reprogrammée
    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de reprogrammer une réservation annulée'
      });
    }

    if (existingBooking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de reprogrammer une réservation terminée'
      });
    }

    // Vérifier la disponibilité pour les nouvelles dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    const conflictingBooking = await prisma.tourismeBooking.findFirst({
      where: {
        listingId: existingBooking.listingId,
        id: { not: id },
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: 'L\'hébergement n\'est pas disponible pour ces nouvelles dates'
      });
    }

    // Calculer le nouveau nombre de nuits et montant
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const baseAmount = existingBooking.listing.price * nights;
    const totalAmount = baseAmount + existingBooking.serviceFee;

    const updatedBooking = await prisma.tourismeBooking.update({
      where: { id },
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalAmount
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            images: true
          }
        }
      }
    });

    console.log(`✅ Réservation ${id} reprogrammée par l'utilisateur ${userId}`);

    res.json({
      success: true,
      data: {
        id: updatedBooking.id,
        code: updatedBooking.confirmationNumber,
        checkIn: updatedBooking.checkIn,
        checkOut: updatedBooking.checkOut,
        totalAmount: updatedBooking.totalAmount
      },
      message: 'Réservation reprogrammée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur reprogrammation réservation:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la reprogrammation de la réservation',
      details: error.message
    });
  }
});

// Fonction utilitaire pour mapper les statuts
function mapStatus(backendStatus) {
  const statusMap = {
    'pending': 'en_attente',
    'confirmed': 'confirmee', 
    'cancelled': 'annulee',
    'completed': 'terminee'
  };
  return statusMap[backendStatus] || 'en_attente';
}

module.exports = router;