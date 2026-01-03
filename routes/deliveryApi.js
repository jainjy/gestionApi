// routes/deliveryApi.js
const express = require('express');
const router = express.Router();
const { authenticateDeliveryPlatform, verifyWebhookSignature } = require('../middleware/deliveryAuth');
const { prisma } = require('../lib/db');

// ROUTES POUR LA PLATEFORME DE LIVRAISON (elle nous appelle)
// -----------------------------------------------------------------

// GET - Récupérer les nouvelles commandes
// routes/deliveryApi.js - VERSION FLEXIBLE
router.get('/orders/pending', authenticateDeliveryPlatform, async (req, res) => {
  try {
    console.log('Récupération de toutes les commandes...');
    
    // TOUTES les commandes
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            commercialName: true,
            phone: true,
            email: true
          }
        },
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
            commercialName: true,
            phone: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Augmentez la limite si besoin
    });
    
    console.log(`Trouvé ${orders.length} commandes au total`);
    
    // Formatez la réponse
    const formattedOrders = orders.map(order => {
      const userName = order.user.commercialName || 
                      `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() ||
                      order.user.email.split('@')[0];
      
      const vendorName = order.prestataire.commercialName ||
                        `${order.prestataire.firstName || ''} ${order.prestataire.lastName || ''}`.trim();
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          id: order.user.id,
          name: userName,
          phone: order.user.phone,
          email: order.user.email
        },
        vendor: {
          id: order.prestataire.id,
          name: vendorName,
          phone: order.prestataire.phone,
          address: order.prestataire.address
        },
        items: order.items,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        shippingAddress: order.shippingAddress,
        status: order.status,
        paymentStatus: order.paymentStatus,
        syncStatus: order.syncStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        metadata: {
          requiresSignature: order.totalAmount > 100,
          paymentMethod: order.paymentMethod,
          hasDelivery: !!order.deliveryAddress
        }
      };
    });
    
    res.json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length,
      message: `${formattedOrders.length} commande(s) récupérée(s)`
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// POST - Envoyer une commande spécifique à la plateforme
router.post('/orders/sync', authenticateDeliveryPlatform, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId est requis'
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande non trouvée'
      });
    }
    
    // Formater les données pour la livraison
    const deliveryData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.user.name,
        phone: order.user.phone,
        email: order.user.email
      },
      pickupAddress: order.shippingAddress,
      deliveryAddress: order.deliveryAddress,
      items: order.items,
      totalAmount: order.totalAmount,
      metadata: {
        createdAt: order.createdAt,
        requiresSignature: order.totalAmount > 100 // Exemple de règle métier
      }
    };
    
    res.json({
      success: true,
      data: deliveryData,
      message: 'Données de commande formatées pour livraison'
    });
    
  } catch (error) {
    console.error('Erreur sync commande:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// PUT - Mettre à jour le statut d'une commande (appelé par la plateforme de livraison)
router.put('/orders/:orderId/status', authenticateDeliveryPlatform, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, deliveryId, driverInfo, estimatedDelivery } = req.body;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Commande non trouvée'
      });
    }
    
    // Mapper les statuts de livraison vers vos statuts
    const statusMap = {
      'picked_up': 'shipped',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'failed': 'delivery_failed'
    };
    
    const newStatus = statusMap[status] || status;
    
    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        trackingNumber: trackingNumber || order.trackingNumber,
        deliveryId: deliveryId || order.deliveryId,
        syncStatus: 'synced',
        deliveryDetails: {
          driver: driverInfo,
          estimatedDelivery,
          lastUpdate: new Date().toISOString(),
          status: status
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Statut mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// WEBHOOKS (nous recevons des updates de la plateforme)
// -----------------------------------------------------------------

// POST - Webhook pour les mises à jour en temps réel
router.post('/webhooks/delivery-update', verifyWebhookSignature, async (req, res) => {
  try {
    const { event, orderNumber, data } = req.body;
    
    console.log(`Webhook reçu: ${event} pour commande ${orderNumber}`);
    
    // Traiter l'événement selon le type
    switch (event) {
      case 'delivery.created':
        await handleDeliveryCreated(orderNumber, data);
        break;
      case 'delivery.updated':
        await handleDeliveryUpdated(orderNumber, data);
        break;
      case 'delivery.completed':
        await handleDeliveryCompleted(orderNumber, data);
        break;
      case 'delivery.failed':
        await handleDeliveryFailed(orderNumber, data);
        break;
      default:
        console.warn(`Événement non géré: ${event}`);
    }
    
    // Répondre rapidement pour confirmer la réception
    res.json({ 
      success: true, 
      message: 'Webhook traité avec succès',
      receivedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur traitement webhook'
    });
  }
});

// Fonctions de traitement des webhooks
async function handleDeliveryCreated(orderNumber, data) {
  await prisma.order.update({
    where: { orderNumber },
    data: {
      deliveryId: data.deliveryId,
      trackingNumber: data.trackingNumber,
      syncStatus: 'synced',
      status: 'shipped'
    }
  });
}

async function handleDeliveryCompleted(orderNumber, data) {
  await prisma.order.update({
    where: { orderNumber },
    data: {
      status: 'delivered',
      deliveryDetails: {
        deliveredAt: data.deliveredAt,
        receivedBy: data.receivedBy,
        signatureUrl: data.signatureUrl
      }
    }
  });
}

module.exports = router;