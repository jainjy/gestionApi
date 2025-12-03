// routes/contact-messages.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// POST /api/contact-messages - Créer un nouveau message de contact
router.post("/", async (req, res) => {
  try {
    const {
      senderName,
      senderEmail,
      senderPhone,
      subject,
      message,
      recipientId,
      serviceId,
      metierId,
      userId,
      messageType = "general",
      priority = "normal",
    } = req.body;

    // Validation basique
    if (!senderName || !senderEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Nom, email, sujet et message sont requis",
      });
    }

    // Vérifier si le destinataire existe (s'il est spécifié)
    if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });
      if (!recipient) {
        return res.status(404).json({
          success: false,
          error: "Destinataire non trouvé",
        });
      }
    }

    // Créer le message de contact
    const contactMessage = await prisma.contactMessage.create({
      data: {
        senderName,
        senderEmail,
        senderPhone,
        subject,
        message,
        messageType,
        priority,
        status: "pending",
        isRead: false,
        isReplied: false,
        userId: userId || null,
        recipientId: recipientId || null,
        serviceId: serviceId ? parseInt(serviceId) : null,
        metierId: metierId ? parseInt(metierId) : null,
      },
      include: {
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            libelle: true,
          },
        },
        metier: {
          select: {
            id: true,
            libelle: true,
          },
        },
      },
    });

    // 🔥 ENVOI DE NOTIFICATION EN TEMPS RÉEL
    if (req.io && recipientId) {
      req.io.to(`user:${recipientId}`).emit("new-notification", {
        type: "contact_message",
        title: "Nouveau message de contact",
        message: `${senderName} vous a contacté`,
        data: {
          messageId: contactMessage.id,
          senderName,
          senderEmail,
          subject,
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: contactMessage,
      message: "Message envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création du message de contact:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'envoi du message",
    });
  }
});

// GET /api/contact-messages/:id - Récupérer un message spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
      include: {
        recipient: true,
        service: true,
        metier: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message non trouvé",
      });
    }

    // Marquer comme lu
    if (!message.isRead) {
      await prisma.contactMessage.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du message:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// Dans routes/contact-messages.js, modifiez la route GET /
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status, messageType, priority, limit = 50, offset = 0 } = req.query;

    const where = {
      OR: [
        { recipientId: req.user.id },
        { userId: req.user.id },
      ],
    };

    if (status) where.status = status;
    if (messageType) where.messageType = messageType;
    if (priority) where.priority = priority;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              libelle: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          metier: {
            select: {
              id: true,
              libelle: true,
            },
          },
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.contactMessage.count({ where }),
    ]);

    // Compter les messages non lus pour le destinataire
    const unreadCount = await prisma.contactMessage.count({
      where: {
        recipientId: req.user.id,
        isRead: false,
      },
    });

    // Statistiques par statut
    const stats = {
      pending: await prisma.contactMessage.count({
        where: { ...where, status: "pending" },
      }),
      read: await prisma.contactMessage.count({
        where: { ...where, status: "read" },
      }),
      replied: await prisma.contactMessage.count({
        where: { ...where, status: "replied" },
      }),
      archived: await prisma.contactMessage.count({
        where: { ...where, status: "archived" },
      }),
    };

    // Statistiques par type
    const typeStats = {
      service: await prisma.contactMessage.count({
        where: { ...where, messageType: "service" },
      }),
      metier: await prisma.contactMessage.count({
        where: { ...where, messageType: "metier" },
      }),
      professional: await prisma.contactMessage.count({
        where: { ...where, messageType: "professional" },
      }),
      general: await prisma.contactMessage.count({
        where: { ...where, messageType: "general" },
      }),
    };

    res.json({
      success: true,
      data: messages,
      meta: {
        total,
        unreadCount,
        stats,
        typeStats,
        hasMore: parseInt(offset) + messages.length < total,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// PUT /api/contact-messages/:id/status - Mettre à jour le statut
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyMessage } = req.body;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message non trouvé",
      });
    }

    // Vérifier que l'utilisateur est le destinataire
    if (message.recipientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Non autorisé",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (replyMessage) {
      updateData.replyMessage = replyMessage;
      updateData.isReplied = true;
      updateData.repliedAt = new Date();
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: updateData,
      include: {
        sender: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedMessage,
      message: "Message mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du message:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
