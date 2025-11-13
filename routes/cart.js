// routes/cart.js
const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

// POST /api/cart/validate - Valider le panier et créer la commande
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { cartItems } = req.body

    console.log('🔍 Validation du panier reçue:', { 
      userId: req.user.id,
      itemsCount: cartItems?.length,
      items: cartItems 
    })

    // Validation de base
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide ou format invalide'
      })
    }

    const validatedItems = []
    const errors = []
    let totalAmount = 0

    // Valider chaque item du panier (produits ET services)
    for (const cartItem of cartItems) {
      try {
        console.log(`📦 Validation ${cartItem.type}:`, cartItem.id)
        
        let item
        let itemType = cartItem.type

        // Validation selon le type (product ou service)
        if (itemType === 'product') {
          item = await prisma.product.findUnique({ 
            where: { id: cartItem.id },
            select: { id: true, name: true, price: true, status: true, quantity: true, trackQuantity: true }
          })
          
          if (!item) {
            errors.push(`Produit non trouvé: ${cartItem.name || cartItem.id}`)
            continue
          }
          
          if (item.status !== 'active') {
            errors.push(`Produit non disponible: ${item.name}`)
            continue
          }
          
          // Vérification du stock pour les produits
          if (item.trackQuantity && item.quantity < cartItem.quantity) {
            errors.push(`Stock insuffisant pour "${item.name}". Stock disponible: ${item.quantity}`)
            continue
          }

        } else if (itemType === 'service') {
          item = await prisma.service.findUnique({ 
            where: { id: cartItem.id },
            select: { id: true, name: true, price: true, status: true }
          })
          
          if (!item) {
            errors.push(`Service non trouvé: ${cartItem.name || cartItem.id}`)
            continue
          }
          
          if (item.status !== 'active') {
            errors.push(`Service non disponible: ${item.name}`)
            continue
          }

        } else {
          errors.push(`Type d'article invalide: ${itemType}`)
          continue
        }

        // Vérification du prix
        if (Math.abs(item.price - cartItem.price) > 0.01) {
          errors.push(`Le prix de "${item.name}" a changé. Nouveau prix: €${item.price.toFixed(2)}`)
        }

        // Calcul du total pour cet item
        const itemTotal = item.price * cartItem.quantity
        totalAmount += itemTotal

        // Ajouter l'item validé
        validatedItems.push({
          itemId: item.id,
          type: itemType,
          name: item.name,
          price: item.price,
          quantity: cartItem.quantity,
          itemTotal: parseFloat(itemTotal.toFixed(2))
        })

        console.log(`✅ ${itemType === 'product' ? 'Produit' : 'Service'} validé:`, item.name)

      } catch (error) {
        console.error('❌ Erreur validation item:', error)
        errors.push(`Erreur de validation pour: ${cartItem.name || cartItem.id}`)
      }
    }

    // Vérifier s'il reste des items valides
    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun article/service valide dans le panier',
        errors
      })
    }

    // Créer la commande dans la base de données
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: 'pending',
        orderItems: {
          create: validatedItems.map(item => ({
            productId: item.type === 'product' ? item.itemId : null,
            serviceId: item.type === 'service' ? item.itemId : null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.itemTotal,
            itemType: item.type // Ajouter le type pour plus de clarté
          }))
        }
      },
      include: { 
        orderItems: true 
      }
    })

    // Mettre à jour les stocks pour les produits
    for (const item of validatedItems.filter(item => item.type === 'product')) {
      const product = await prisma.product.findUnique({
        where: { id: item.itemId }
      })
      
      if (product && product.trackQuantity) {
        await prisma.product.update({
          where: { id: item.itemId },
          data: { 
            quantity: { decrement: item.quantity }
          }
        })
        console.log(`📦 Stock mis à jour pour ${product.name}: -${item.quantity}`)
      }
    }

    const response = {
      success: true,
      validatedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      orderId: order.id,
      message: errors.length > 0 
        ? 'Commande créée avec succès, mais certains articles avaient des problèmes' 
        : 'Panier validé et commande créée avec succès'
    }

    if (errors.length > 0) response.errors = errors

    console.log('🎯 Validation et création de commande terminée:', { 
      orderId: order.id,
      userId: req.user.id,
      itemsValides: validatedItems.length,
      produits: validatedItems.filter(i => i.type === 'product').length,
      services: validatedItems.filter(i => i.type === 'service').length,
      total: response.totalAmount,
      erreurs: errors.length
    })

    res.json(response)

  } catch (error) {
    console.error('💥 Erreur validation panier:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la validation du panier'
    })
  }
})

// POST /api/cart/check-stock - Vérifier le stock en temps réel (pour produits uniquement)
router.post('/check-stock', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'ProductId et quantity sont requis'
      })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      })
    }

    const available = !product.trackQuantity || product.quantity >= quantity
    
    res.json({
      success: true,
      available,
      availableStock: product.quantity,
      productName: product.name,
      trackQuantity: product.trackQuantity,
      price: product.price
    })

  } catch (error) {
    console.error('Erreur vérification stock:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du stock'
    })
  }
})

// POST /api/cart/check-availability - Vérifier la disponibilité (produits ET services)
router.post('/check-availability', authenticateToken, async (req, res) => {
  try {
    const { itemId, type, quantity = 1 } = req.body

    if (!itemId || !type) {
      return res.status(400).json({
        success: false,
        message: 'itemId et type (product/service) sont requis'
      })
    }

    if (type === 'product') {
      const product = await prisma.product.findUnique({
        where: { id: itemId }
      })

      if (!product) {
        return res.status(404).json({
          success: false,
          available: false,
          message: 'Produit non trouvé'
        })
      }

      const available = product.status === 'active' && 
        (!product.trackQuantity || product.quantity >= quantity)
      
      return res.json({
        success: true,
        type: 'product',
        available,
        availableStock: product.quantity,
        itemName: product.name,
        trackQuantity: product.trackQuantity,
        price: product.price,
        status: product.status
      })

    } else if (type === 'service') {
      const service = await prisma.service.findUnique({
        where: { id: itemId }
      })

      if (!service) {
        return res.status(404).json({
          success: false,
          available: false,
          message: 'Service non trouvé'
        })
      }

      const available = service.status === 'active'
      
      return res.json({
        success: true,
        type: 'service',
        available,
        itemName: service.name,
        price: service.price,
        status: service.status
      })

    } else {
      return res.status(400).json({
        success: false,
        message: 'Type invalide. Doit être "product" ou "service"'
      })
    }

  } catch (error) {
    console.error('Erreur vérification disponibilité:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la disponibilité'
    })
  }
})

module.exports = router