const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');


/*
users avec role = professional

une subscription active

une transaction payée
*/ 

// GET /api/users/professionals-premium
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "professional",
        subscriptions: {
          some: { status: "active" },
        },
        Transaction: {
          some: { status: "paid" },
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        subscriptions: {
          where: { status: "active" },
          select: {
            id: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                interval: true
              }
            }
          }
        },
        Transaction: true
      }
    });

    // TRI CÔTÉ JS : pack le plus cher en premier
    const sortedUsers = users.sort((a, b) => {
      const priceA = a.subscriptions[0]?.plan?.price || 0;
      const priceB = b.subscriptions[0]?.plan?.price || 0;
      return priceB - priceA; // ↓ ordre décroissant
    });

    res.json({
      success: true,
      count: sortedUsers.length,
      data: sortedUsers
    });

  } catch (error) {
    console.error("Erreur recherche premium:", error);
    res.status(500).json({ success: false, message: "Erreur interne", error });
  }
});

module.exports = router;
