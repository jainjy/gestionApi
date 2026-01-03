// middleware/deliveryAuth.js

const crypto = require("crypto");

/**
 * Middleware d'authentification pour la plateforme de livraison
 * Utilise un token statique partagé entre les deux plateformes
 */
// middleware/deliveryAuth.js - VERSION SIMPLIFIÉE POUR TESTS
function authenticateDeliveryPlatform(req, res, next) {
  const token = req.headers['x-delivery-token'];
  
  console.log('=== DEBUG ===');
  console.log('Token reçu:', token ? 'OUI' : 'NON');
  console.log('IP:', req.ip);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de livraison requis'
    });
  }
  
  // POUR LES TESTS - Désactivez la vérification token
  // if (token !== process.env.DELIVERY_PLATFORM_TOKEN) {
  //   return res.status(403).json({
  //     success: false,
  //     error: 'Token de livraison invalide'
  //   });
  // }
  
  // POUR LES TESTS - Désactivez la vérification IP
  // const allowedIps = process.env.DELIVERY_ALLOWED_IPS ? 
  //   process.env.DELIVERY_ALLOWED_IPS.split(',') : [];
  // 
  // if (allowedIps.length > 0) {
  //   const clientIp = req.ip || req.connection.remoteAddress;
  //   if (!allowedIps.includes(clientIp)) {
  //     return res.status(403).json({
  //       success: false,
  //       error: 'IP non autorisée'
  //     });
  //   }
  // }
  
  req.deliveryPlatform = { authenticated: true };
  next();
}

/**
 * Middleware pour vérifier la signature HMAC des webhooks
 * Utile quand la plateforme de livraison vous envoie des updates
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];

  if (!signature || !timestamp) {
    return res.status(400).json({
      success: false,
      error: "Signature webhook manquante",
    });
  }

  // Vérifier si le timestamp est récent (prévent replay attacks)
  const currentTime = Date.now();
  const requestTime = parseInt(timestamp);

  if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
    // 5 minutes
    return res.status(403).json({
      success: false,
      error: "Requête expirée",
    });
  }

  // Reconstruire la signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(403).json({
      success: false,
      error: "Signature webhook invalide",
    });
  }

  next();
}

module.exports = {
  authenticateDeliveryPlatform,
  verifyWebhookSignature,
};
