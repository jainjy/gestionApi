// routes/cart.js
const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')

// POST /api/cart/validate - Valider le panier
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { cartItems } = req.body

    console.log('🔍 Validation du panier reçue:', { 
      itemsCount: cartItems?.length,
      items: cartItems 
    })

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide ou format invalide'
      })
    }

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide'
      })
    }

    const validatedItems = []
    const errors = []
    let totalAmount = 0

    // Valider chaque item du panier
    for (const cartItem of cartItems) {
      try {
        console.log('📦 Validation produit:', cartItem.id)
        
        const product = await prisma.product.findUnique({
          where: { id: cartItem.id }
        })
        
        if (!product) {
          errors.push(`Produit non trouvé: ${cartItem.name || cartItem.id}`)
          continue
        }

        if (product.status !== 'active') {
          errors.push(`Produit non disponible: ${product.name}`)
          continue
        }

        if (product.trackQuantity && product.quantity < cartItem.quantity) {
          errors.push(`Stock insuffisant pour "${product.name}". Stock disponible: ${product.quantity}`)
          continue
        }

        // Vérifier que le prix n'a pas changé
        if (Math.abs(product.price - cartItem.price) > 0.01) {
          errors.push(`Le prix de "${product.name}" a changé. Nouveau prix: €${product.price.toFixed(2)}`)
        }

        const itemTotal = product.price * cartItem.quantity
        totalAmount += itemTotal

        validatedItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          images: product.images,
          itemTotal: parseFloat(itemTotal.toFixed(2)),
          stock: product.quantity,
          trackQuantity: product.trackQuantity
        })

        console.log('✅ Produit validé:', product.name)

      } catch (error) {
        console.error('❌ Erreur validation produit:', error)
        errors.push(`Erreur de validation pour: ${cartItem.name || cartItem.id}`)
      }
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun article valide dans le panier',
        errors
      })
    }

    const response = {
      success: true,
      validatedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      message: errors.length > 0 ? 'Certains articles ont des problèmes' : 'Panier validé avec succès'
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    console.log('🎯 Validation terminée:', { 
      itemsValides: validatedItems.length,
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

// POST /api/cart/check-stock - Vérifier le stock en temps réel
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

module.exports = router