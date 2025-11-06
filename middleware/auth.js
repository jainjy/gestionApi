const { prisma } = require('../lib/db')

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' })
  }
  try {
    // Extraire l'ID utilisateur du token
    const userId = token.replace('real-jwt-token-', '')
    
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(401).json({ error: 'Token invalide' })
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
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Token invalide' })
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' })
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (userRole === 'admin' || allowedRoles.includes(userRole)) {
      return next()
    }

    res.status(403).json({ error: 'Accès non autorisés' })
  }
}

module.exports = { authenticateToken, requireRole }