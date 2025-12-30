// middleware/securityMiddleware.js
const securityMiddleware = {
  // Masquer les données sensibles dans les réponses
  maskSensitiveData: (req, res, next) => {
    const originalSend = res.json;
    res.json = function (data) {
      if (req.user && req.user.role === "admin") {
        // Vérifier si l'admin a les permissions nécessaires
        const hasFullAccess = req.user.permissions?.includes(
          "view_sensitive_data"
        );

        if (!hasFullAccess && data.users) {
          data.users = data.users.map((user) => ({
            ...user,
            phone: user.phone ? maskPhoneNumber(user.phone) : null,
            address: "***",
            addressComplement: null,
            siret: user.siret ? maskSiret(user.siret) : null,
            latitude: null,
            longitude: null,
            email: maskEmail(user.email),
          }));

          data.dataProtection = {
            sensitiveDataMasked: true,
            maskedFields: ["phone", "address", "siret", "coordinates", "email"],
            timestamp: new Date().toISOString(),
          };
        }
      }
      return originalSend.call(this, data);
    };
    next();
  },

  // Limiter la taille des requêtes
  limitPayloadSize: (req, res, next) => {
    const MAX_PAYLOAD_SIZE = "10mb";
    if (req.headers["content-length"] > 10 * 1024 * 1024) {
      return res.status(413).json({ error: "Payload too large" });
    }
    next();
  },
};

// Fonctions utilitaires
function maskPhoneNumber(phone) {
  return phone.replace(/(\d{2})\d+(\d{2})/, "$1****$2");
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.substring(0, 2)}***@${domain}`;
}

function maskSiret(siret) {
  return siret.replace(/\d(?=\d{4})/g, "*");
}

module.exports = securityMiddleware;
