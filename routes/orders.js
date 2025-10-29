const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

/**
 * 🛍️ POST /api/orders - Créer une commande
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body
    const userId = req.user.id

    console.log('🛒 Création commande pour user:', userId, {
      itemsCount: items?.length,
      paymentMethod
    })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide'
      })
    }

    let totalAmount = 0
    const orderItems = []
    const stockErrors = []

    // Vérification des stocks
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Produit non trouvé: ${item.name}`
        })
      }

      if (product.trackQuantity && product.quantity < item.quantity) {
        stockErrors.push(
          `Stock insuffisant pour "${product.name}". Disponible: ${product.quantity}, Demandé: ${item.quantity}`
        )
        continue
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        images: product.images,
        itemTotal: parseFloat(itemTotal.toFixed(2))
      })
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Problèmes de stock',
        errors: stockErrors
      })
    }

    // Numéro unique de commande
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    const orderNumber = `CMD-${timestamp}-${random}`

    console.log('📦 Création commande:', orderNumber, {
      items: orderItems.length,
      total: totalAmount
    })

    // Enregistrement de la commande
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        items: orderItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: shippingAddress || {},
        paymentMethod: paymentMethod || 'card',
        status: 'pending',
        paymentStatus: 'pending'
      }
    })

    // Mise à jour des stocks
    await updateStock(orderItems)

    console.log('✅ Commande créée:', order.orderNumber)

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order
    })
  } catch (error) {
    console.error('💥 Erreur création commande:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    })
  }
})

/**
 * 📋 GET /api/orders - Commandes de l'utilisateur connecté
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const userId = req.user.id
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { userId } })
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
 * 🔎 GET /api/orders/:id - Détails d'une commande
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const order = await prisma.order.findFirst({
      where: { id, userId }
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
 * 🔄 PUT /api/orders/:id/status - Mettre à jour le statut d'une commande
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user.id

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

    const order = await prisma.order.findFirst({ where: { id, userId } })

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
 * 👨‍🔧 GET /api/orders/pro - Récupérer les commandes liées aux produits du professionnel connecté
 */
router.get('/pro', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 50, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // ✅ Fonction utilitaire pour récupérer les produits du pro
    const productIds = await getProductIdsByUser(userId)

    if (productIds.length === 0) {
      return res.json({
        success: true,
        orders: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      })
    }

    const allOrders = await prisma.order.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filtrage des commandes contenant les produits du pro
    const filteredOrders = allOrders.filter(order => {
      const hasProProducts = order.items.some(
        item => item.productId && productIds.includes(item.productId)
      )
      const matchesStatus = !status || status === 'all' || order.status === status
      return hasProProducts && matchesStatus
    })

    const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit))

    const finalOrders = paginatedOrders.map(order => ({
      ...order,
      items: order.items.filter(item =>
        item.productId && productIds.includes(item.productId)
      )
    }))

    res.json({
      success: true,
      orders: finalOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredOrders.length,
        pages: Math.ceil(filteredOrders.length / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erreur récupération commandes pro:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos commandes'
    })
  }
})

/**
 * 🔧 Fonction utilitaire : récupérer les IDs de produits appartenant à un utilisateur pro
 */
async function getProductIdsByUser(userId) {
  const products = await prisma.product.findMany({
    where: { userId },
    select: { id: true }
  })
  return products.map(p => p.id)
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

module.exports = router
