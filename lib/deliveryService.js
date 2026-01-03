// lib/deliveryService.js
const crypto = require('crypto');
const axios = require('axios');

class DeliveryService {
  constructor() {
    this.deliveryApiUrl = process.env.DELIVERY_API_URL;
    this.apiKey = process.env.DELIVERY_API_KEY;
    this.secretKey = process.env.DELIVERY_SECRET_KEY;
    this.webhookUrl = process.env.ECOMMERCE_WEBHOOK_URL;
  }

  /**
   * Génère une signature HMAC pour sécuriser les requêtes
   */
  generateSignature(payload, timestamp) {
    const data = `${JSON.stringify(payload)}${timestamp}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Envoie une commande à la plateforme de livraison
   */
  async sendOrderToDelivery(orderData) {
    try {
      const timestamp = Date.now();
      const signature = this.generateSignature(orderData, timestamp);

      const deliveryPayload = {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        customer: {
          id: orderData.userId,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          email: orderData.customerEmail
        },
        deliveryAddress: orderData.deliveryAddress,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: orderData.totalAmount,
        metadata: {
          source: 'ecommerce',
          ecommerceOrderId: orderData.id,
          timestamp: timestamp
        }
      };

      const response = await axios.post(
        `${this.deliveryApiUrl}/api/deliveries/create`,
        deliveryPayload,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
            'Content-Type': 'application/json',
            'X-Webhook-URL': this.webhookUrl // URL pour les mises à jour
          }
        }
      );

      return {
        success: true,
        deliveryId: response.data.deliveryId,
        trackingNumber: response.data.trackingNumber,
        status: response.data.status
      };
    } catch (error) {
      console.error('❌ Erreur envoi à la plateforme de livraison:', error.response?.data || error.message);
      
      // Log dans une table de retry
      await this.logFailedDelivery(orderData, error);
      
      return {
        success: false,
        error: error.message,
        retry: true
      };
    }
  }

  /**
   * Log les échecs d'envoi pour retry plus tard
   */
  async logFailedDelivery(orderData, error) {
    // Implémentez votre logique de log ici
    console.log('📝 Log échec livraison pour retry:', {
      orderId: orderData.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Vérifie la signature d'un webhook reçu
   */
  verifyWebhookSignature(payload, signature, timestamp) {
    const expectedSignature = this.generateSignature(payload, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature || ''),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Met à jour le statut dans l'ecommerce après livraison
   */
  async updateOrderStatus(orderId, status, trackingNumber = null) {
    // Cette méthode sera appelée par le webhook
    const { prisma } = require('./db');
    
    try {
      const updateData = {
        status: status,
        updatedAt: new Date()
      };

      // Ajouter les infos de tracking si fournies
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });

      console.log(`✅ Statut commande ${orderId} mis à jour: ${status}`);
      return updatedOrder;
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      throw error;
    }
  }
}

module.exports = new DeliveryService();