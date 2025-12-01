const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const prisma = new PrismaClient();

// POST contacter un guide
router.post('/', async (req, res) => {
  try {
    const {
      guideId,
      activityId,
      name,
      email,
      phone,
      message
    } = req.body;

    const userId = req.user?.id;

    const contact = await prisma.guideContact.create({
      data: {
        guideId,
        activityId,
        userId,
        name,
        email,
        phone,
        message
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        activity: {
          select: {
            title: true
          }
        }
      }
    });

    // Envoyer un email au guide
    await sendEmail({
      to: contact.guide.user.email,
      subject: 'Nouveau contact via votre activité',
      template: 'guide-contact',
      data: {
        guideName: `${contact.guide.user.firstName} ${contact.guide.user.lastName}`,
        userName: name,
        userEmail: email,
        userPhone: phone,
        message,
        activityTitle: contact.activity?.title,
        contactDate: new Date().toLocaleDateString('fr-FR')
      }
    });

    // Notifier le guide via WebSocket
    if (req.io) {
      req.io.to(`user:${contact.guide.userId}`).emit('new-contact', {
        type: 'NEW_CONTACT',
        contact,
        message: `Nouveau message de ${name}`
      });
    }

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Message envoyé au guide avec succès'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du message'
    });
  }
});

// GET messages reçus (pour les guides)
router.get('/my-contacts', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un guide
    const guide = await prisma.activityGuide.findUnique({
      where: { userId: req.user.id }
    });

    if (!guide) {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux guides'
      });
    }

    const contacts = await prisma.guideContact.findMany({
      where: { guideId: guide.id },
      include: {
        activity: {
          select: {
            title: true,
            image: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
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
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des messages'
    });
  }
});

// PUT marquer un message comme répondu
router.put('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.guideContact.findUnique({
      where: { id },
      include: { 
        guide: {
          include: {
            user: true
          }
        } 
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Message non trouvé'
      });
    }

    if (contact.guide.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à modifier ce message'
      });
    }

    const updatedContact = await prisma.guideContact.update({
      where: { id },
      data: {
        status: 'responded',
        respondedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedContact,
      message: 'Message marqué comme répondu'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du message'
    });
  }
});

module.exports = router;