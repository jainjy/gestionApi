const { prisma } = require('../lib/db');

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Votre logique d'authentification existante
      const userId = token.replace('real-jwt-token-', '');
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyName: user.companyName,
          kycStatus: user.status
        };
      }
    } catch (error) {
      // Token invalide, continuer sans utilisateur
      console.log('Optional auth - Token invalide:', error.message);
    }
  }

  next();
}

module.exports = { optionalAuth };