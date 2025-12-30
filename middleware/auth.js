const { prisma } = require('../lib/db');
const jwt = require("jsonwebtoken");


async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Token requis" });
  }

  try {
    // VÉRIFICATION CRYPTOGRAPHIQUE (Corrige CRIT-01)
    // Le secret doit être dans une variable d'environnement (.env)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier si l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Utilisateur introuvable" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, error: "Token invalide ou expiré" });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentification requise' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    res.status(403).json({ 
      success: false,
      error: 'Accès non autorisé' 
    });
  }
}

module.exports = { authenticateToken, requireRole };