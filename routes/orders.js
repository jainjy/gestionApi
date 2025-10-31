const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

function deduceProductTypeFromName(productName) {
  if (!productName || typeof productName !== 'string') return 'general';
  
  const nameLower = productName.toLowerCase();
  
  // Mots-clés pour l'alimentation
  const foodKeywords = [
    'pain', 'baguette', 'croissant', 'chocolatine', 'patisserie', 'boulangerie',
    'aliment', 'nourriture', 'food', 'manger', 'boisson', 'jus', 'cafe',
    'the', 'lait', 'fromage', 'yaourt', 'fruit', 'legume', 'viande', 'poisson',
    'epicerie', 'sucre', 'farine', 'beurre', 'oeuf', 'légume', 'fruit',
    'chocolat', 'biscuit', 'gateau', 'viennoiserie', 'pâtisserie', 'saumon', 'salade'
  ];
  
  if (foodKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'food';
  }
  
  return 'general';
}

// Fonction pour obtenir le productType d'un item (avec fallback)
function getItemProductType(item) {
  // 1. Si productType est défini, on l'utilise
  if (item.productType) return item.productType;
  
  // 2. Sinon, on déduit du nom
  return deduceProductTypeFromName(item.name);
}


// Middleware de logging pour le débogage
router.use((req, res, next) => {
  console.log(`📍 [ORDERS] ${req.method} ${req.originalUrl}`)
  next()
})

/**
 * 🔧 POST /api/orders/pro/migrate-product-types - MIGRATION des productType
 */
router.post('/pro/migrate-product-types', async (req, res) => {
  try {
    console.log('🚨 DÉBUT MIGRATION DES PRODUCT TYPE...');
    
    const allOrders = await prisma.order.findMany();
    let updatedCount = 0;
    let fixedItemsCount = 0;

    console.log(`📦 ${allOrders.length} commandes à traiter`);

    for (const order of allOrders) {
      if (!order.items || !Array.isArray(order.items)) continue;

      let needsUpdate = false;
      const updatedItems = order.items.map(item => {
        if (!item.productType) {
          needsUpdate = true;
          fixedItemsCount++;
          
          const newItem = {
            ...item,
            productType: getItemProductType(item)
          };
          
          console.log(`🔧 Item corrigé: "${item.name}" -> ${newItem.productType}`);
          return newItem;
        }
        return item;
      });

      if (needsUpdate) {
        await prisma.order.update({
          where: { id: order.id },
          data: { items: updatedItems }
        });
        updatedCount++;
        console.log(`✅ Commande ${order.orderNumber} migrée`);
      }
    }

    res.json({
      success: true,
      message: `Migration terminée`,
      stats: {
        totalOrders: allOrders.length,
        ordersUpdated: updatedCount,
        itemsFixed: fixedItemsCount
      }
    });

  } catch (error) {
    console.error('💥 Erreur migration:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
/**
 * 👨‍🔧 GET /api/orders/pro - Récupérer TOUTES les commandes - VERSION ULTRA ROBUSTE
 */
router.get("/pro", async (req, res) => {
  try {
    const { page = 1, limit = 50, status, productType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log(`🔍 Récupération commandes pro`, { 
      productType, 
      status,
      page,
      limit 
    });

    // Récupérer TOUTES les commandes
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Fonction pour obtenir le productType d'un item (avec fallback)
    const getItemProductType = (item) => {
      // 1. Si productType est défini, on l'utilise
      if (item.productType) return item.productType;
      
      // 2. Sinon, on déduit du nom
      return deduceProductTypeFromName(item.name);
    };

    // Filtrer par statut si spécifié
    let filteredOrders = allOrders;
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Filtrer par productType si spécifié - VERSION ROBUSTE
    if (productType && productType !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        if (!order.items || !Array.isArray(order.items)) return false;
        
        const hasMatchingProductType = order.items.some(item => {
          const itemProductType = getItemProductType(item);
          const match = itemProductType === productType;
          
          // Debug seulement pour les premières occurrences
          if (match && Math.random() < 0.1) { // 10% des matches pour éviter les logs massifs
            console.log(`🎯 Match trouvé: "${item.name}" -> ${itemProductType} (recherché: ${productType})`);
          }
          
          return match;
        });
        
        return hasMatchingProductType;
      });
    }

    console.log(`📊 Résultats: ${allOrders.length} -> ${filteredOrders.length} commandes`);

    // Pagination
    const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));

    // Récupérer les informations utilisateur
    const ordersWithUsers = await Promise.all(
      paginatedOrders.map(async (order) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: order.userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              companyName: true,
            },
          });

          // Filtrer les items si un productType spécifique est demandé
          let displayItems = order.items;
          if (productType && productType !== 'all') {
            displayItems = order.items.filter(item => 
              getItemProductType(item) === productType
            );
          }

          return {
            ...order,
            items: displayItems,
            user: user || {
              id: order.userId,
              firstName: "Client",
              lastName: "Non Trouvé",
              email: "client.inconnu@example.com",
              phone: null,
              companyName: null,
            },
          };
        } catch (userError) {
          console.warn(
            `⚠️ Erreur récupération user ${order.userId}:`,
            userError.message
          );
          return {
            ...order,
            items: productType && productType !== 'all' 
              ? order.items.filter(item => getItemProductType(item) === productType)
              : order.items,
            user: {
              id: order.userId,
              firstName: "Client",
              lastName: "Non Trouvé",
              email: "client.inconnu@example.com",
              phone: null,
              companyName: null,
            },
          };
        }
      })
    );

    console.log(`✅ ${ordersWithUsers.length} commandes récupérées`);

    res.json({
      success: true,
      orders: ordersWithUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredOrders.length,
        pages: Math.ceil(filteredOrders.length / parseInt(limit))
      },
      filters: {
        status: status || 'all',
        productType: productType || 'all'
      }
    });
  } catch (error) {
    console.error('💥 Erreur récupération commandes pro:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
});

/**
 * 🔄 PUT /api/orders/pro/:id/status - Mettre à jour le statut d'une commande (côté pro - SANS AUTH)
 */
router.put("/pro/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Mise à jour statut commande ${id} vers: ${status}`);

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide",
      });
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    // Mettre à jour le statut
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === "delivered" && { paymentStatus: "completed" }),
      },
    });

    console.log(`✅ Statut commande ${id} mis à jour vers: ${status}`);

    res.json({
      success: true,
      message: "Statut de commande mis à jour avec succès",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("💥 Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message,
    });
  }
});

/**
 * 📊 GET /api/orders/pro/stats - Statistiques des commandes pour le pro (SANS AUTH)
 */
router.get("/pro/stats", async (req, res) => {
  try {
    console.log(`📊 Récupération statistiques (sans auth)`);

    // Récupérer toutes les commandes pour les statistiques
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter((order) => order.status === "pending").length,
      confirmed: allOrders.filter((order) => order.status === "confirmed")
        .length,
      processing: allOrders.filter((order) => order.status === "processing")
        .length,
      shipped: allOrders.filter((order) => order.status === "shipped").length,
      delivered: allOrders.filter((order) => order.status === "delivered")
        .length,
      cancelled: allOrders.filter((order) => order.status === "cancelled")
        .length,
      totalRevenue: allOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      ),
      // Statistiques mensuelles
      monthlyRevenue: calculateMonthlyRevenue(allOrders),
      // Commandes de cette semaine
      thisWeek: allOrders.filter((order) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(order.createdAt) > oneWeekAgo;
      }).length,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("💥 Erreur récupération statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
})

/**
 * 📈 GET /api/orders/pro/product-types - Récupérer les statistiques par type de produit
 */
router.get('/pro/product-types', async (req, res) => {
  try {
    console.log(`📈 Récupération statistiques par type de produit`);

    // Récupérer toutes les commandes
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Analyser les types de produits depuis les items des commandes
    const productTypeStats = {};
    let totalItems = 0;

    allOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          totalItems++;
          const productType = item.productType || 'Non catégorisé';
          
          if (!productTypeStats[productType]) {
            productTypeStats[productType] = {
              count: 0,
              revenue: 0,
              orders: new Set(),
              products: new Set()
            };
          }
          
          productTypeStats[productType].count += item.quantity || 1;
          productTypeStats[productType].revenue += (item.price || 0) * (item.quantity || 1);
          productTypeStats[productType].orders.add(order.id);
          productTypeStats[productType].products.add(item.productId);
        });
      }
    });

    // Convertir les Sets en arrays et formater les données
    const formattedStats = Object.entries(productTypeStats).map(([productType, data]) => ({
      productType,
      itemsCount: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      ordersCount: data.orders.size,
      productsCount: data.products.size,
      percentage: totalItems > 0 ? ((data.count / totalItems) * 100).toFixed(1) : 0
    }));

    // Trier par revenu décroissant
    formattedStats.sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      productTypes: formattedStats,
      totalItems,
      totalProductTypes: formattedStats.length
    });

  } catch (error) {
    console.error('💥 Erreur récupération statistiques types produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par type de produit',
      error: error.message
    });
  }
});

// NOUVELLE ROUTE POUR DEBUG
/**
 * 🐛 GET /api/orders/pro/debug - Debug des données de commandes
 */
router.get('/pro/debug', async (req, res) => {
  try {
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const debugData = allOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items?.map(item => ({
        name: item.name,
        productType: item.productType,
        productId: item.productId,
        quantity: item.quantity
      })),
      itemsCount: order.items?.length,
      productTypes: [...new Set(order.items?.map(item => item.productType).filter(Boolean))]
    }));

    // Analyse des productTypes existants
    const allProductTypes = new Set();
    allOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.productType) {
            allProductTypes.add(item.productType);
          }
        });
      }
    });

    res.json({
      success: true,
      totalOrders: allOrders.length,
      sampleOrders: debugData,
      allProductTypes: Array.from(allProductTypes),
      analysis: {
        foodOrders: allOrders.filter(order => 
          order.items?.some(item => item.productType === 'food')
        ).length,
        generalOrders: allOrders.filter(order => 
          order.items?.some(item => item.productType === 'general')
        ).length
      }
    });

  } catch (error) {
    console.error('💥 Erreur debug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes de test sans authentification
router.get("/test", (req, res) => {
  console.log("✅ Route /orders/test appelée");
  res.json({
    success: true,
    message: "API Orders fonctionne!",
    timestamp: new Date().toISOString(),
  });
});

router.get("/test-data", async (req, res) => {
  try {
    console.log("🔍 Récupération données de test");

    // Récupérer les commandes
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
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
              companyName: true,
            },
          });

          return {
            ...order,
            user: user || {
              id: order.userId,
              firstName: "Client",
              lastName: "Test",
              email: "client.test@example.com",
              phone: "+33123456789",
              companyName: null,
            },
          };
        } catch (error) {
          return {
            ...order,
            user: {
              id: order.userId,
              firstName: "Client",
              lastName: "Test",
              email: "client.test@example.com",
              phone: "+33123456789",
              companyName: null,
            },
          };
        }
      })
    );

    console.log(`✅ ${orders.length} commandes récupérées pour le test`);

    res.json({
      success: true,
      orders: ordersWithUsers,
      message: "Données de test récupérées avec succès",
    });
  } catch (error) {
    console.error("💥 Erreur test:", error);

    // Données mockées complètes en cas d'erreur
    const mockOrders = [
      {
        id: "1",
        orderNumber: "CMD-" + Date.now(),
        userId: "user-1",
        status: "pending",
        totalAmount: 150.5,
        createdAt: new Date().toISOString(),
        items: [
          {
            productId: 'prod1',
            name: 'Pain Campagne',
            price: 75.25,
            quantity: 2,
            images: ['/api/placeholder/80/80'],
            itemTotal: 150.50,
            productType: 'food'
          }
        ],
        user: {
          id: "user1",
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean.dupont@email.com",
          phone: "+33123456789",
          companyName: "Entreprise Dupont",
        },
      },
      {
        id: "2",
        orderNumber: "CMD-" + (Date.now() - 1000),
        userId: "user-2",
        status: "confirmed",
        totalAmount: 89.99,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        items: [
          {
            productId: 'prod2',
            name: 'Ciment 25kg',
            price: 89.99,
            quantity: 1,
            images: ['/api/placeholder/80/80'],
            itemTotal: 89.99,
            productType: 'general'
          }
        ],
        user: {
          id: "user2",
          firstName: "Marie",
          lastName: "Martin",
          email: "marie.martin@email.com",
          phone: "+33987654321",
          companyName: "Société Martin",
        },
      },
    ];

    res.json({
      success: true,
      orders: mockOrders,
      message: "Données mockées utilisées (erreur base de données)",
    });
  }
});

// Fonction utilitaire pour calculer le revenu mensuel
function calculateMonthlyRevenue(orders) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
}

/**
 * 📦 Fonction interne pour mettre à jour le stock
 */
async function updateStock(orderItems) {
  const updates = orderItems.map((item) =>
    prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.quantity },
        updatedAt: new Date(),
      },
    })
  );
  await Promise.all(updates);
  console.log("✅ Stocks mis à jour pour", updates.length, "produits");
}

// ============================================================================
// ROUTES AVEC AUTHENTIFICATION UTILISATEUR - CORRIGÉES
// ============================================================================

/**
 * 🛍️ POST /api/orders - Créer une commande (AVEC AUTHENTIFICATION) - CORRIGÉ
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    console.log('=== 🎯 CRÉATION COMMANDE AVEC PRODUCT TYPE ===');
    console.log('👤 req.user:', req.user);
    console.log('📦 Body items count:', items?.length);

    const userId = req.user.id;
    const isAuthenticated = true;
    
    console.log('✅ UserId depuis auth middleware:', userId, req.user.email);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le panier est vide",
      });
    }

    let totalAmount = 0;
    const orderItems = [];
    const stockErrors = [];

    // Vérification des stocks et construction des items avec productType
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Produit non trouvé: ${item.name}`,
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

      // INCLURE LE PRODUCTTYPE DANS L'ITEM DE LA COMMANDE
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        images: product.images,
        productType: product.productType || 'general', // ← CORRECTION IMPORTANTE
        itemTotal: parseFloat(itemTotal.toFixed(2))
      });

      console.log(`📦 Item ajouté: ${product.name} (${product.productType || 'general'})`);
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Problèmes de stock",
        errors: stockErrors,
      });
    }

    // Numéro unique de commande
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    const orderNumber = `CMD-${timestamp}-${random}`;

    console.log("📦 Création commande:", orderNumber, {
      items: orderItems.length,
      total: totalAmount,
      user: userId,
      productTypes: [...new Set(orderItems.map(item => item.productType))]
    });

    // Enregistrement de la commande
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        items: orderItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: shippingAddress || {},
        paymentMethod: paymentMethod || "card",
        status: "pending",
        paymentStatus: "pending",
      },
    });

    // Mise à jour des stocks
    await updateStock(orderItems);

    console.log('✅ Commande créée:', order.orderNumber, 'avec productTypes:', 
      [...new Set(orderItems.map(item => item.productType))]);

    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      order,
      userInfo: {
        id: userId,
        authenticated: isAuthenticated,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  } catch (error) {
    console.error("💥 Erreur création commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la commande",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
/**
 * 👤 GET /api/orders/user/my-orders - Commandes de l'utilisateur connecté
 */
router.get('/user/my-orders', authenticateToken, async (req, res) => {
  try {
    // DEBUG AUTH POUR LES COMMANDES UTILISATEUR
    console.log('=== 🔐 DEBUG AUTH MY-ORDERS ===');
    console.log('👤 req.user:', req.user);
    console.log('🔐 Headers auth:', req.headers.authorization);
    console.log('==============================');

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
        firstName: req.user.firstName,
        lastName: req.user.lastName,
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
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📊 Récupération statistiques pour l'utilisateur: ${userId}`, {
      authenticated: true,
      email: req.user.email,
    });

    // Récupérer toutes les commandes de l'utilisateur
    const userOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: userOrders.length,
      pending: userOrders.filter((order) => order.status === "pending").length,
      confirmed: userOrders.filter((order) => order.status === "confirmed")
        .length,
      processing: userOrders.filter((order) => order.status === "processing")
        .length,
      shipped: userOrders.filter((order) => order.status === "shipped").length,
      delivered: userOrders.filter((order) => order.status === "delivered")
        .length,
      cancelled: userOrders.filter((order) => order.status === "cancelled")
        .length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      // Commandes de cette semaine
      thisWeek: userOrders.filter((order) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(order.createdAt) > oneWeekAgo;
      }).length,
    };

    res.json({
      success: true,
      stats,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  } catch (error) {
    console.error("💥 Erreur récupération statistiques utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos statistiques",
      error: error.message,
    });
  }
});

/**
 * 👤 GET /api/orders/user/:id - Détails d'une commande spécifique pour l'utilisateur
 */
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(
      `👤 Détails de la commande ${id} pour l'utilisateur: ${userId}`,
      {
        authenticated: true,
        email: req.user.email,
      }
    );

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    res.json({
      success: true,
      order,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  } catch (error) {
    console.error("💥 Erreur récupération détail commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détails de la commande",
      error: error.message,
    });
  }
});

/**
 * 🔄 PUT /api/orders/user/:id/cancel - Annuler une commande
 */
router.put('/user/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(
      `👤 Annulation de la commande ${id} par l'utilisateur: ${userId}`,
      {
        authenticated: true,
        email: req.user.email,
      }
    );

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    // Vérifier si la commande peut être annulée
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Cette commande ne peut pas être annulée. Elle est déjà en cours de traitement.",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Commande ${id} annulée par l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Commande annulée avec succès",
      order: updatedOrder,
      userInfo: {
        id: userId,
        authenticated: true,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  } catch (error) {
    console.error("💥 Erreur annulation commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de la commande",
      error: error.message,
    });
  }
});

/**
 * 📋 GET /api/orders - Toutes les commandes (admin seulement)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur récupération commandes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes",
    });
  }
});

/**
 * 🔎 GET /api/orders/:id - Détails d'une commande (admin seulement)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Erreur récupération commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la commande",
    });
  }
});

/**
 * 🔄 PUT /api/orders/:id/status - Mettre à jour le statut d'une commande (admin seulement)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide",
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    res.json({
      success: true,
      message: "Statut de commande mis à jour",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
    });
  }
});

/**
 * 🔐 GET /api/orders/test/auth - Test d'authentification
 */
router.get('/test/auth', authenticateToken, (req, res) => {
  console.log('🔐 Test authentification - Headers:', {
    authorization: req.headers.authorization,
    'user-agent': req.headers['user-agent']
  });
  console.log('🔐 Test authentification - User:', req.user);
  
  res.json({
    success: true,
    user: req.user,
    headers: {
      authorization: req.headers.authorization ? 'PRESENT' : 'MISSING'
    },
    message: req.user ? 'Authentification fonctionne' : 'Aucun utilisateur authentifié',
    timestamp: new Date().toISOString()
  });
});

/**
 */
router.get('/pro/migration-preview', async (req, res) => {
  try {
    console.log('🔒 APERÇU SÉCURISÉ DE LA MIGRATION');
    
    const sampleOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3 // Seulement 3 commandes pour l'aperçu
    });

    const preview = await Promise.all(
      sampleOrders.map(async (order) => {
        if (!order.items || !Array.isArray(order.items)) {
          return { orderId: order.id, changes: [] };
        }

        const changes = await Promise.all(
          order.items.map(async (item, index) => {
            const before = { ...item };
            let after = { ...item };
            
            if (!item.productType && item.productId) {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { productType: true, name: true }
              });
              
              if (product) {
                after.productType = product.productType || 'general';
              } else {
                after.productType = 'general';
              }
            } else if (!item.productType) {
              after.productType = deduceProductTypeFromName(item.name);
            }

            return {
              itemIndex: index,
              itemName: item.name,
              willChange: before.productType !== after.productType,
              before: before.productType,
              after: after.productType
            };
          })
        );

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalChanges: changes.filter(c => c.willChange).length,
          changes
        };
      })
    );

    res.json({
      success: true,
      message: 'Aperçu sécurisé - AUCUNE modification effectuée',
      preview,
      note: 'Cette route ne modifie aucune donnée'
    });

  } catch (error) {
    console.error('💥 Erreur aperçu migration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
module.exports = router