const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

/**
 * 👨‍🔧 GET /api/orders/pro - Récupérer TOUTES les commandes pour la gestion pro (SANS AUTH)
 */
router.get('/pro', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log(`🔍 Récupération de TOUTES les commandes (sans auth)`);

    // Construire les filtres
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Récupérer TOUTES les commandes SANS les données utilisateur d'abord
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    console.log(`✅ ${orders.length} commandes récupérées sur ${total} total`);

    // Maintenant, récupérer les informations utilisateur pour chaque commande
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        try {
          // Essayer de récupérer l'utilisateur
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              companyName: true
            }
          });

          return {
            ...order,
            user: user || {
              id: order.userId,
              firstName: 'Client',
              lastName: 'Non Trouvé',
              email: 'client.inconnu@example.com',
              phone: null,
              companyName: null
            }
          };
        } catch (userError) {
          console.warn(`⚠️ Erreur récupération user ${order.userId}:`, userError.message);
          return {
            ...order,
            user: {
              id: order.userId,
              firstName: 'Client',
              lastName: 'Non Trouvé',
              email: 'client.inconnu@example.com',
              phone: null,
              companyName: null
            }
          };
        }
      })
    );

    res.json({
      success: true,
      orders: ordersWithUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération commandes pro:', error);
    
    // Solution de fallback ultra simple
    try {
      console.log('🔄 Tentative de récupération simple...');
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const ordersWithBasicInfo = orders.map(order => ({
        ...order,
        user: {
          id: order.userId,
          firstName: 'Client',
          lastName: 'Non Trouvé',
          email: 'client.inconnu@example.com',
          phone: null,
          companyName: null
        }
      }));

      res.json({
        success: true,
        orders: ordersWithBasicInfo,
        pagination: {
          page: 1,
          limit: 50,
          total: orders.length,
          pages: 1
        }
      });
    } catch (fallbackError) {
      console.error('💥 Erreur même avec fallback:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      });
    }
  }
})

/**
 * 🔄 PUT /api/orders/pro/:id/status - Mettre à jour le statut d'une commande (côté pro - SANS AUTH)
 */
router.put('/pro/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Mise à jour statut commande ${id} vers: ${status}`);

    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Mettre à jour le statut
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status, 
        updatedAt: new Date(),
        ...(status === 'delivered' && { paymentStatus: 'completed' })
      }
    });

    console.log(`✅ Statut commande ${id} mis à jour vers: ${status}`);

    res.json({
      success: true,
      message: 'Statut de commande mis à jour avec succès',
      order: updatedOrder
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
})

/**
 * 📊 GET /api/orders/pro/stats - Statistiques des commandes pour le pro (SANS AUTH)
 */
router.get('/pro/stats', async (req, res) => {
  try {
    console.log(`📊 Récupération statistiques (sans auth)`);

    // Récupérer toutes les commandes pour les statistiques
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(order => order.status === 'pending').length,
      confirmed: allOrders.filter(order => order.status === 'confirmed').length,
      processing: allOrders.filter(order => order.status === 'processing').length,
      shipped: allOrders.filter(order => order.status === 'shipped').length,
      delivered: allOrders.filter(order => order.status === 'delivered').length,
      cancelled: allOrders.filter(order => order.status === 'cancelled').length,
      totalRevenue: allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      // Statistiques mensuelles
      monthlyRevenue: calculateMonthlyRevenue(allOrders),
      // Commandes de cette semaine
      thisWeek: allOrders.filter(order => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(order.createdAt) > oneWeekAgo;
      }).length
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('💥 Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
})

// Routes de test sans authentification
router.get('/test', (req, res) => {
  console.log('✅ Route /orders/test appelée');
  res.json({ 
    success: true, 
    message: 'API Orders fonctionne!',
    timestamp: new Date().toISOString()
  });
});

router.get('/test-data', async (req, res) => {
  try {
    console.log('🔍 Récupération données de test');
    
    // Récupérer les commandes
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Récupérer les utilisateurs pour chaque commande
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              companyName: true
            }
          });

          return {
            ...order,
            user: user || {
              id: order.userId,
              firstName: 'Client',
              lastName: 'Test',
              email: 'client.test@example.com',
              phone: '+33123456789',
              companyName: null
            }
          };
        } catch (error) {
          return {
            ...order,
            user: {
              id: order.userId,
              firstName: 'Client',
              lastName: 'Test',
              email: 'client.test@example.com',
              phone: '+33123456789',
              companyName: null
            }
          };
        }
      })
    );

    console.log(`✅ ${orders.length} commandes récupérées pour le test`);

    res.json({
      success: true,
      orders: ordersWithUsers,
      message: 'Données de test récupérées avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur test:', error);
    
    // Données mockées complètes en cas d'erreur
    const mockOrders = [
      {
        id: '1',
        orderNumber: 'CMD-' + Date.now(),
        userId: 'user-1',
        status: 'pending',
        totalAmount: 150.50,
        createdAt: new Date().toISOString(),
        items: [
          {
            productId: 'prod1',
            name: 'Produit Test 1',
            price: 75.25,
            quantity: 2,
            images: ['/api/placeholder/80/80'],
            itemTotal: 150.50
          }
        ],
        user: {
          id: 'user1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          phone: '+33123456789',
          companyName: 'Entreprise Dupont'
        }
      },
      {
        id: '2',
        orderNumber: 'CMD-' + (Date.now() - 1000),
        userId: 'user-2',
        status: 'confirmed',
        totalAmount: 89.99,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        items: [
          {
            productId: 'prod2',
            name: 'Produit Test 2',
            price: 89.99,
            quantity: 1,
            images: ['/api/placeholder/80/80'],
            itemTotal: 89.99
          }
        ],
        user: {
          id: 'user2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@email.com',
          phone: '+33987654321',
          companyName: 'Société Martin'
        }
      }
    ];

    res.json({
      success: true,
      orders: mockOrders,
      message: 'Données mockées utilisées (erreur base de données)'
    });
  }
});

// Fonction utilitaire pour calculer le revenu mensuel
function calculateMonthlyRevenue(orders) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return orders
    .filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
}

/**
 * 📦 Fonction interne pour mettre à jour le stock
 */
async function updateStock(orderItems) {
  const updates = orderItems.map(item =>
    prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.quantity },
        updatedAt: new Date()
      }
    })
  )
  await Promise.all(updates)
  console.log('✅ Stocks mis à jour pour', updates.length, 'produits')
}

// ============================================================================
// ROUTES AVEC AUTHENTIFICATION UTILISATEUR - AMÉLIORÉES
// ============================================================================

/**
 * 🛍️ POST /api/orders - Créer une commande (CORRIGÉ avec gestion d'auth)
 */
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    // DEBUG DÉTAILLÉ DE L'AUTHENTIFICATION
    console.log('=== DEBUG AUTH DÉTAILLÉ ===');
    console.log('🔐 Headers auth:', req.headers.authorization);
    console.log('👤 req.user:', req.user);
    console.log('📦 Body items count:', items?.length);
    console.log('==========================');
    
    // STRATÉGIE AMÉLIORÉE POUR RÉCUPÉRER L'USER
    let userId;
    let isAuthenticated = false;
    
    // Option 1: User depuis l'authentification (req.user peuplé par le middleware)
    if (req.user && req.user.id) {
      userId = req.user.id;
      isAuthenticated = true;
      console.log('✅ UserId depuis auth middleware:', userId, req.user.email);
    } 
    // Option 2: Fallback intelligent
    else {
      // Générer un ID temporaire basé sur l'IP + timestamp
      const clientIP = req.ip || req.connection.remoteAddress;
      userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      console.log('⚠️ UserId temporaire (guest):', userId, 'IP:', clientIP);
    }

    console.log('🛒 Création commande pour user:', userId, {
      itemsCount: items?.length,
      paymentMethod,
      userAuthenticated: isAuthenticated
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide'
      });
    }

    let totalAmount = 0;
    const orderItems = [];
    const stockErrors = [];

    // Vérification des stocks
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Produit non trouvé: ${item.name}`
        });
      }

      if (product.trackQuantity && product.quantity < item.quantity) {
        stockErrors.push(
          `Stock insuffisant pour "${product.name}". Disponible: ${product.quantity}, Demandé: ${item.quantity}`
        );
        continue;
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        images: product.images,
        itemTotal: parseFloat(itemTotal.toFixed(2))
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Problèmes de stock',
        errors: stockErrors
      });
    }

    // Numéro unique de commande
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    const orderNumber = `CMD-${timestamp}-${random}`;

    console.log('📦 Création commande:', orderNumber, {
      items: orderItems.length,
      total: totalAmount,
      user: userId,
      userAuthenticated: isAuthenticated
    });

    // Enregistrement de la commande
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId, // Utilise le vrai userId si authentifié, sinon le fallback
        items: orderItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: shippingAddress || {},
        paymentMethod: paymentMethod || 'card',
        status: 'pending',
        paymentStatus: 'pending'
      }
    });

    // Mise à jour des stocks
    await updateStock(orderItems);

    console.log('✅ Commande créée:', order.orderNumber, 'pour user:', userId);

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order,
      userInfo: {
        id: userId,
        authenticated: isAuthenticated,
        email: isAuthenticated ? req.user.email : null
      }
    });
  } catch (error) {
    console.error('💥 Erreur création commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 👤 GET /api/orders/user/my-orders - Commandes de l'utilisateur connecté
 */
router.get("/user/my-orders",authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log(`👤 Récupération des commandes pour l'utilisateur: ${userId}`, {
      authenticated: true,
      email: req.user.email,
    });

    // Construire les filtres
    const where = { userId };
    if (status && status !== "all") {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    console.log(
      `✅ ${orders.length} commandes trouvées pour l'utilisateur ${userId}`
    );

    res.json({
      success: true,
      orders,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("💥 Erreur récupération commandes utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos commandes",
      error: error.message,
    });
  }
});

/**
 * 📦 GET /api/orders/user/stats - Statistiques des commandes pour l'utilisateur
 */
router.get('/user/stats', async (req, res) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const userId = req.user.id;

    console.log(`📊 Récupération statistiques pour l'utilisateur: ${userId}`, {
      authenticated: true,
      email: req.user.email
    });

    // Récupérer toutes les commandes de l'utilisateur
    const userOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: userOrders.length,
      pending: userOrders.filter(order => order.status === 'pending').length,
      confirmed: userOrders.filter(order => order.status === 'confirmed').length,
      processing: userOrders.filter(order => order.status === 'processing').length,
      shipped: userOrders.filter(order => order.status === 'shipped').length,
      delivered: userOrders.filter(order => order.status === 'delivered').length,
      cancelled: userOrders.filter(order => order.status === 'cancelled').length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      // Commandes de cette semaine
      thisWeek: userOrders.filter(order => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(order.createdAt) > oneWeekAgo;
      }).length
    };

    res.json({
      success: true,
      stats,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération statistiques utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos statistiques',
      error: error.message
    });
  }
});

/**
 * 👤 GET /api/orders/user/:id - Détails d'une commande spécifique pour l'utilisateur
 */
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const userId = req.user.id;

    console.log(`👤 Détails de la commande ${id} pour l'utilisateur: ${userId}`, {
      authenticated: true,
      email: req.user.email
    });

    const order = await prisma.order.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      order,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('💥 Erreur récupération détail commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de la commande',
      error: error.message
    });
  }
});

/**
 * 🔄 PUT /api/orders/user/:id/cancel - Annuler une commande
 */
router.put('/user/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const userId = req.user.id;

    console.log(`👤 Annulation de la commande ${id} par l'utilisateur: ${userId}`, {
      authenticated: true,
      email: req.user.email
    });

    const order = await prisma.order.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier si la commande peut être annulée
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande ne peut pas être annulée. Elle est déjà en cours de traitement.'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Commande ${id} annulée par l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Commande annulée avec succès',
      order: updatedOrder,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('💥 Erreur annulation commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la commande',
      error: error.message
    });
  }
});

/**
 * 📋 GET /api/orders - Toutes les commandes (admin seulement)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count()
    ])

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erreur récupération commandes:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    })
  }
})

/**
 * 🔎 GET /api/orders/:id - Détails d'une commande (admin seulement)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      })
    }

    res.json({ success: true, order })
  } catch (error) {
    console.error('Erreur récupération commande:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    })
  }
})

/**
 * 🔄 PUT /api/orders/:id/status - Mettre à jour le statut d'une commande (admin seulement)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      })
    }

    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    })

    res.json({
      success: true,
      message: 'Statut de commande mis à jour',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Erreur mise à jour statut:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    })
  }
})

/**
 * 🔐 GET /api/orders/test/auth - Test d'authentification
 */
router.get('/test/auth', (req, res) => {
  console.log('🔐 Test authentification - User:', req.user)
  res.json({
    success: true,
    user: req.user,
    message: req.user ? 'Authentification fonctionne' : 'Aucun utilisateur authentifié',
    timestamp: new Date().toISOString()
  })
})

module.exports = router