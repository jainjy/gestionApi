const { prisma } = require('../lib/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token d\'authentification requis' 
    });
  }

  try {
    let userId;
    
    console.log('🔐 Token reçu:', token);
    
    // Accepter plusieurs formats de token
    if (token.startsWith('real-jwt-token-')) {
      userId = token.replace('real-jwt-token-', '');
    } else {
      // Si le token est directement l'ID utilisateur
      userId = token;
    }
    
    console.log('👤 User ID extrait:', userId);
    
    // Validation de l'ID utilisateur
    if (!userId || userId.length < 1) {
      return res.status(401).json({ 
        success: false,
        error: 'Token invalide' 
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyName: user.companyName,
      kycStatus: user.status
    };

    console.log('✅ User authentifié:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Token invalide' 
    });
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