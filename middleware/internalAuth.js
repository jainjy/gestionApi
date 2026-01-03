const crypto = require("crypto");

const verifyInternalSignature = (req, res, next) => {
  const signature = req.headers["x-service-signature"];
  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!signature) return res.status(401).json({ error: "Accès refusé" });

  // On recrée la signature à partir du corps de la requête
  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash === signature) {
    next();
  } else {
    res.status(403).json({ error: "Signature invalide" });
  }
};

module.exports = { verifyInternalSignature };
