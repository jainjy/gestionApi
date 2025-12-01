const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/guide-contact - Contacter un guide
router.post('/', async (req, res) => {
  try {
    const { guideId, activityId, name, email, phone, message } = req.body;

    // Vérifier le guide
    const guide = await prisma.activityGuide.findUnique({
      where: { id: guideId },
      include: { user: true }
    });

    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide non trouvé' });
    }

    // Créer le message de contact
    const contact = await prisma.guideContact.create({
      data: {
        guideId,
        activityId: activityId || null,
        userId: req.user?.id || null,
        name: name || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Anonyme'),
        email: email || (req.user ? req.user.email : ''),
        phone,
        message,
        status: 'new'
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        activity: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Notifier le guide via WebSocket
    if (req.io && guide.user) {
      req.io.to(`user:${guide.userId}`).emit('new-notification', {
        title: 'Nouveau message de contact',
        message: `${contact.name} vous a contacté${activityId ? ' pour votre activité' : ''}`,
        type: 'contact',
        relatedEntity: 'guide',
        relatedEntityId: guideId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: contact
    });
  } catch (error) {
    console.error('Error creating guide contact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/guide-contact/my-contacts - Messages reçus par le guide
router.get('/my-contacts', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un guide
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id }
    });

    if (!guide) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const contacts = await prisma.guideContact.findMany({
      where: { guideId: guide.id },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            image: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/guide-contact/:id/status - Mettre à jour le statut d'un contact
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérifier que le message appartient au guide
    const contact = await prisma.guideContact.findUnique({
      where: { id },
      include: { guide: true }
    });

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }

    if (contact.guide.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const updatedContact = await prisma.guideContact.update({
      where: { id },
      data: { 
        status,
        respondedAt: status === 'responded' ? new Date() : null
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data: updatedContact
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;