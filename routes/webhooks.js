// routes/webhooks.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const deliveryService = require('../lib/deliveryService');

/**
 * 🚚 POST /api/webhooks/delivery-status
 * Webhook appelé par la plateforme de livraison pour mettre à jour les statuts
 * Sécurisé avec signature HMAC
 */
router.post('/delivery-status', async (req, res) => {
  try {
    const { 
      deliveryId, 
      orderId, 
      status, 
      trackingNumber,
      timestamp,
      driverInfo,
      estimatedDelivery,
      proof 
    } = req.body;

    const signature = req.headers['x-signature'];
    const receivedTimestamp = req.headers['x-timestamp'];

    console.log('📨 Webhook reçu:', { deliveryId, orderId, status });

    // =====================================================
    // 1. VÉRIFICATION DE SÉCURITÉ
    // =====================================================
    if (!signature || !receivedTimestamp) {
      console.warn('❌ Webhook rejeté: headers manquants');
      return res.status(401).json({ error: 'Signature ou timestamp manquant' });
    }

    // Vérifier le timestamp (prévenir replay attacks)
    const now = Date.now();
    const timeDiff = Math.abs(now - parseInt(receivedTimestamp));
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes max
      console.warn('❌ Webhook rejeté: timestamp trop ancien');
      return res.status(401).json({ error: 'Timestamp invalide' });
    }

    // Vérifier la signature HMAC
    const payload = JSON.stringify(req.body);
    const isValid = deliveryService.verifyWebhookSignature(
      payload, 
      signature, 
      receivedTimestamp
    );

    if (!isValid) {
      console.warn('❌ Webhook rejeté: signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    // =====================================================
    // 2. MISE À JOUR DE LA COMMANDE
    // =====================================================
    console.log(`🔄 Mise à jour commande ${orderId} -> ${status}`);

    // Trouver la commande par orderId (qui est notre ID ecommerce)
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`❌ Commande ${orderId} non trouvée`);
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Mapper les statuts de livraison vers nos statuts
    const statusMapping = {
      'pickup_pending': 'processing',
      'in_transit': 'shipped',
      'out_for_delivery': 'shipped',
      'delivered': 'delivered',
      'failed': 'cancelled',
      'cancelled': 'cancelled'
    };

    const mappedStatus = statusMapping[status] || status;

    // Mettre à jour la commande
    const updateData = {
      status: mappedStatus,
      updatedAt: new Date(),
      syncStatus: 'synced'
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Ajouter les détails de livraison dans un champ dédié
    updateData.deliveryDetails = {
      deliveryId,
      driverInfo,
      estimatedDelivery,
      proof,
      lastUpdate: new Date().toISOString()
    };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    console.log(`✅ Commande ${orderId} mise à jour: ${mappedStatus}`);

    // =====================================================
    // 3. NOTIFICATION (optionnelle)
    // =====================================================
    if (mappedStatus === 'delivered') {
      // Envoyer une notification au client
      await sendDeliveryNotification(order.userId, orderId, trackingNumber);
    }

    // =====================================================
    // 4. RÉPONSE POSITIVE
    // =====================================================
    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      orderId,
      status: mappedStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erreur webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * Envoie une notification au client
 */
async function sendDeliveryNotification(userId, orderId, trackingNumber) {
  try {
    // Récupérer les infos utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, firstName: true }
    });

    if (!user) return;

    // Envoyer email ou SMS
    console.log(`📧 Notification livraison envoyée à ${user.email}`);
    
    // Ici vous intégrerez votre service d'email/SMS
    // Ex: sendEmail(user.email, 'Votre commande a été livrée', ...);
    
  } catch (error) {
    console.error('❌ Erreur notification:', error);
  }
}

module.exports = router;