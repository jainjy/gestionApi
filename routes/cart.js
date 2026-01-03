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


// Route pour vérifier une œuvre d'art
router.post('/check-artwork', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        quantity: true,
        trackQuantity: true,
        productType: true,
        userId: true,
        dimensions: true // Pour récupérer les infos artistiques
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Œuvre non trouvée'
      });
    }

    // Vérifier que c'est bien une œuvre d'art
    if (product.productType !== 'artwork') {
      return res.status(400).json({
        success: false,
        message: 'Ce produit n\'est pas une œuvre d\'art'
      });
    }

    // Vérifier la disponibilité
    const available = product.status === 'published' && 
      (!product.trackQuantity || product.quantity >= quantity);
    
    // Récupérer les infos artistiques depuis dimensions
    const artworkInfo = product.dimensions || {};
    
    res.json({
      success: true,
      available,
      availableStock: product.quantity,
      productName: product.name,
      price: product.price,
      artworkInfo: {
        type: artworkInfo.type,
        category: artworkInfo.category,
        materials: artworkInfo.materials,
        creationDate: artworkInfo.creationDate,
        artistName: artworkInfo.artistName || product.userId
      },
      sellerId: product.userId
    });

  } catch (error) {
    console.error('Erreur vérification œuvre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'œuvre'
    });
  }
});


// ✅ NOUVELLE ROUTE : Validation spécifique pour les œuvres d'art
router.post('/validate-artworks', authenticateToken, async (req, res) => {
  try {
    const { cartItems } = req.body;

    console.log('🎨 Validation spécifique œuvres d\'art:', { 
      userId: req.user.id,
      itemsCount: cartItems?.length
    });

    // Validation de base
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide ou format invalide'
      });
    }

    const validatedItems = [];
    const errors = [];
    let totalAmount = 0;

    // Filtrer et valider uniquement les œuvres d'art
    const artworkItems = cartItems.filter(item => 
      item.productType === 'artwork' || 
      (item.dimensions && item.dimensions.isArtwork)
    );

    if (artworkItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune œuvre d\'art trouvée dans le panier'
      });
    }

    for (const cartItem of artworkItems) {
      try {
        console.log(`🖼️ Validation œuvre:`, cartItem.id);
        
        const product = await prisma.product.findUnique({ 
          where: { id: cartItem.id },
          select: { 
            id: true, 
            name: true, 
            price: true, 
            status: true, 
            quantity: true, 
            trackQuantity: true,
            productType: true,
            userId: true,
            dimensions: true,
            category: true,
            subcategory: true
          }
        });
        
        if (!product) {
          errors.push(`Œuvre non trouvée: ${cartItem.name || cartItem.id}`);
          continue;
        }
        
        // Vérifier que c'est bien une œuvre d'art
        if (product.productType !== 'artwork') {
          errors.push(`Le produit "${product.name}" n'est pas une œuvre d'art`);
          continue;
        }
        
        // Œuvre doit être publiée
        if (product.status !== 'published') {
          errors.push(`L'œuvre "${product.name}" n'est plus disponible (statut: ${product.status})`);
          continue;
        }
        
        // Vérifier le stock (quantité > 0)
        if (product.trackQuantity && product.quantity < cartItem.quantity) {
          errors.push(`L'œuvre "${product.name}" a été vendue entre-temps. Disponible: ${product.quantity}`);
          continue;
        }

        // Vérification du prix
        if (Math.abs(product.price - cartItem.price) > 0.01) {
          errors.push(`Le prix de "${product.name}" a changé. Nouveau prix: €${product.price.toFixed(2)}`);
        }

        // Calcul du total
        const itemTotal = product.price * cartItem.quantity;
        totalAmount += itemTotal;

        // Récupérer les infos artistiques
        const artworkInfo = product.dimensions || {};
        
        validatedItems.push({
          itemId: product.id,
          type: 'product',
          productType: 'artwork',
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          itemTotal: parseFloat(itemTotal.toFixed(2)),
          sellerId: product.userId,
          artworkInfo: {
            type: product.subcategory || artworkInfo.type,
            category: product.category || artworkInfo.category,
            dimensions: artworkInfo.dimensions,
            materials: artworkInfo.materials,
            creationDate: artworkInfo.creationDate,
            artistName: artworkInfo.artistName
          }
        });

        console.log(`✅ Œuvre validée:`, product.name);

      } catch (error) {
        console.error('❌ Erreur validation œuvre:', error);
        errors.push(`Erreur de validation pour: ${cartItem.name || cartItem.id}`);
      }
    }

    // Vérifier s'il reste des œuvres valides
    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune œuvre d\'art valide dans le panier',
        errors
      });
    }

    // 🔄 METTRE À JOUR LES ŒUVRES COMME VENDUES
    const soldArtworks = [];
    for (const validatedItem of validatedItems) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: validatedItem.itemId }
        });
        
        if (product && product.trackQuantity) {
          // Marquer l'œuvre comme vendue
          await prisma.product.update({
            where: { id: validatedItem.itemId },
            data: { 
              quantity: 0,
              status: 'sold',
              purchaseCount: { increment: validatedItem.quantity }
            }
          });
          
          soldArtworks.push({
            id: product.id,
            name: product.name,
            quantity: validatedItem.quantity
          });
          
          console.log(`🎯 Œuvre marquée comme vendue: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ Erreur mise à jour œuvre ${validatedItem.itemId}:`, error);
        errors.push(`Erreur lors de la mise à jour de l'œuvre "${validatedItem.name}"`);
      }
    }

    // Créer la commande spécifique pour œuvres
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: 'pending',
        notes: 'Commande d\'œuvres d\'art',
        orderItems: {
          create: validatedItems.map(item => ({
            productId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.itemTotal,
            itemType: 'product',
            // Stocker les infos artistiques dans itemDetails
            itemDetails: {
              productType: 'artwork',
              artworkInfo: item.artworkInfo,
              sellerId: item.sellerId
            }
          }))
        }
      },
      include: { 
        orderItems: true 
      }
    });

    const response = {
      success: true,
      validatedItems: validatedItems.map(item => ({
        id: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.itemTotal,
        artworkInfo: item.artworkInfo
      })),
      soldArtworks,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      orderId: order.id,
      message: errors.length > 0 
        ? 'Commande d\'œuvres créée avec quelques avertissements' 
        : 'Œuvres validées et commande créée avec succès'
    };

    if (errors.length > 0) response.errors = errors;

    console.log('🎨 Commande œuvres créée:', { 
      orderId: order.id,
      œuvres: validatedItems.length,
      total: response.totalAmount,
      erreurs: errors.length
    });

    res.json(response);

  } catch (error) {
    console.error('💥 Erreur validation œuvres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la validation des œuvres'
    });
  }
});


module.exports = router