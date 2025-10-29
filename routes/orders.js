const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

// POST /api/orders - Créer une commande
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

    // Valider le panier d'abord
    let totalAmount = 0
    const orderItems = []
    const stockErrors = []

    // Vérifier le stock et préparer les items
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
        stockErrors.push(`Stock insuffisant pour "${product.name}". Disponible: ${product.quantity}, Demandé: ${item.quantity}`)
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

    // Si erreurs de stock, retourner les erreurs
    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Problèmes de stock',
        errors: stockErrors
      })
    }

    // Générer un numéro de commande unique
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    const orderNumber = `CMD-${timestamp}-${random}`

    console.log('📦 Création commande:', orderNumber, {
      items: orderItems.length,
      total: totalAmount
    })

    // Créer la commande dans la base de données
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

    // Mettre à jour les stocks
    await updateStock(orderItems)

    console.log('✅ Commande créée:', order.orderNumber)

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt
      }
    })

  } catch (error) {
    console.error('💥 Erreur création commande:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    })
  }
})

// GET /api/orders - Récupérer les commandes de l'utilisateur
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

// GET /api/orders/:id - Récupérer une commande spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      })
    }

    res.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Erreur récupération commande:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    })
  }
})

// PUT /api/orders/:id/status - Mettre à jour le statut d'une commande
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user.id

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      })
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
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

// Fonction pour mettre à jour les stocks
async function updateStock(orderItems) {
  const updates = []
  
  for (const item of orderItems) {
    console.log(`📊 Mise à jour stock: ${item.name} -${item.quantity}`)
    
    const update = prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: {
          decrement: item.quantity
        },
        updatedAt: new Date()
      }
    })
    updates.push(update)
  }
  
  await Promise.all(updates)
  console.log('✅ Stocks mis à jour pour', updates.length, 'produits')
}

module.exports = router