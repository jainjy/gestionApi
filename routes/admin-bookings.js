// routes/admin-bookings.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/admin/bookings/stats - Statistiques des réservations
router.get('/stats', async (req, res) => {
  try {
    const [
      total,
      pending,
      confirmed,
      cancelled,
      completed,
      revenueResult,
      bookings
    ] = await Promise.all([
      prisma.tourismeBooking.count(),
      prisma.tourismeBooking.count({ where: { status: 'pending' } }),
      prisma.tourismeBooking.count({ where: { status: 'confirmed' } }),
      prisma.tourismeBooking.count({ where: { status: 'cancelled' } }),
      prisma.tourismeBooking.count({ where: { status: 'completed' } }),
      prisma.tourismeBooking.aggregate({
        where: {
          status: { in: ['confirmed', 'completed'] }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.tourismeBooking.findMany({
        where: {
          status: { in: ['confirmed', 'completed'] }
        },
        select: {
          totalAmount: true
        }
      })
    ]);

    const revenue = revenueResult._sum.totalAmount || 0;
    const averageBooking = bookings.length > 0 ? revenue / bookings.length : 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        cancelled,
        completed,
        revenue,
        averageBooking
      }
    });
  } catch (error) {
    console.error('Erreur stats réservations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/admin/bookings/analytics - Analytics détaillées
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculer la date de début selon la période
    const startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const analytics = await prisma.tourismeBooking.groupBy({
      by: ['status', 'paymentStatus'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    // Réservations par mois
    const monthlyBookings = await prisma.tourismeBooking.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      success: true,
      data: {
        summary: analytics,
        monthly: monthlyBookings,
        period
      }
    });
  } catch (error) {
    console.error('Erreur analytics réservations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des analytics'
    });
  }
});

module.exports = router;