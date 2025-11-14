// routes/users.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/users/bien-etre/email?serviceId=xxx
router.get('/bien-etre/email', async (req, res) => {
  try {
    const { serviceId } = req.query;

    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID est requis' });
    }

    // Trouver le service et l'utilisateur associé avec userType "bien-être"
    const serviceWithUser = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        user: {
          select: {
            email: true,
            userType: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      }
    });

    if (!serviceWithUser) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    if (!serviceWithUser.user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé pour ce service' });
    }

    // Vérifier si l'utilisateur a le userType "bien-être"
    if (serviceWithUser.user.userType !== 'BIEN_ETRE') {
      return res.status(404).json({ 
        error: 'Cet utilisateur n\'est pas un professionnel du bien-être',
        userType: serviceWithUser.user.userType
      });
    }

    res.json({
      email: serviceWithUser.user.email,
      userType: serviceWithUser.user.userType,
      name: serviceWithUser.user.companyName || `${serviceWithUser.user.firstName} ${serviceWithUser.user.lastName}`
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Alternative: Récupérer tous les emails des professionnels bien-être
router.get('/bien-etre/emails', async (req, res) => {
  try {
    const bienEtreUsers = await prisma.user.findMany({
      where: {
        userType: 'BIEN_ETRE',
        status: 'active' // Optionnel: seulement les utilisateurs actifs
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true
      }
    });

    res.json(bienEtreUsers);
  } catch (error) {
    console.error('Erreur lors de la récupération des emails:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;