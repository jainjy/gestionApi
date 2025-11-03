const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();

// GET /api/conversations/demande/:demandeId/details - Détails d'une conversation par demande
router.get(
  "/demande/:demandeId/details",
  authenticateToken,
  async (req, res) => {
    try {
      const { demandeId } = req.params;
      const userId = req.user.id;

      const conversation = await prisma.conversation.findFirst({
        where: {
          demandeId: parseInt(demandeId),
          OR: [
            { createurId: userId },
            {
              participants: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        },
        include: {
          createur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          demande: {
            select: {
              id: true,
              description: true,
              lieuAdresseVille: true,
              statut: true,
              service: {
                select: {
                  libelle: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation non trouvée",
        });
      }

      // Formater la réponse
      const response = {
        id: conversation.id,
        titre: conversation.titre || `Discussion Demande #${demandeId}`,
        statut: conversation.demande?.statut || "En cours",
        demande: conversation.demande,
        createur: conversation.createur,
        participants: conversation.participants.map((p) => p.user),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      res.json(response);
    } catch (error) {
      console.error("Erreur chargement conversation:", error);
      res.status(500).json({
        error: "Erreur lors du chargement de la conversation",
      });
    }
  }
);

// GET /api/conversations/:demandeId/messages - Récupérer les messages d'une conversation
router.get("/:demandeId/messages", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        OR: [
          { createurId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation non trouvée",
      });
    }

    // Récupérer les messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      include: {
        expediteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Marquer les messages comme lus pour l'utilisateur actuel
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        expediteurId: { not: userId },
        lu: false,
      },
      data: {
        lu: true,
      },
    });

    res.json(messages);
  } catch (error) {
    console.error("Erreur chargement messages:", error);
    res.status(500).json({
      error: "Erreur lors du chargement des messages",
    });
  }
});

// POST /api/conversations/:demandeId/messages - Envoyer un message
router.post("/:demandeId/messages", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { contenu, type = "TEXT" } = req.body;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        OR: [
          { createurId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });
    
    if (!conversation) {
      return res.status(404).json({
        error: "Conversation non trouvée",
      });
    }

    // Gérer l'upload de fichier si présent
    let urlFichier = null;
    let nomFichier = null;
    let typeFichier = null;

    if (req.file && type !== "TEXT") {
      // Upload vers Supabase
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `messages/${fileName}`;

      const { data, error } = await supabase.storage
        .from("messages")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) {
        throw new Error("Erreur upload fichier");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("messages").getPublicUrl(filePath);

      urlFichier = publicUrl;
      nomFichier = req.file.originalname;
      typeFichier = req.file.mimetype;
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: userId,
        contenu: contenu || "",
        type: type,
        urlFichier: urlFichier,
        nomFichier: nomFichier,
        typeFichier: typeFichier,
        lu: false,
      },
      include: {
        expediteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
          },
        },
      },
    });

    // Mettre à jour la date de mise à jour de la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.json(message);
  } catch (error) {
    console.error("Erreur envoi message:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi du message",
    });
  }
});

// POST /api/conversations/:demandeId/join - Rejoindre une conversation
router.post("/:demandeId/join", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation non trouvée",
      });
    }

    // Vérifier si l'utilisateur est déjà participant
    const existingParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversation.id,
        userId: userId,
      },
    });

    if (existingParticipant) {
      return res.status(400).json({
        error: "Vous êtes déjà participant à cette conversation",
      });
    }

    // Ajouter l'utilisateur comme participant
    const participant = await prisma.conversationParticipant.create({
      data: {
        conversationId: conversation.id,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
          },
        },
      },
    });

    // Créer un message système
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: userId,
        contenu: `${participant.user.firstName} ${participant.user.lastName} a rejoint la conversation`,
        type: "SYSTEM",
        evenementType: "GENERIC",
      },
    });

    res.json(participant);
  } catch (error) {
    console.error("Erreur rejoindre conversation:", error);
    res.status(500).json({
      error: "Erreur lors de la participation à la conversation",
    });
  }
});

// GET /api/conversations/user - Conversations de l'utilisateur
router.get("/user/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { createurId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        createur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        demande: {
          select: {
            id: true,
            description: true,
            statut: true,
            service: {
              select: {
                libelle: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            expediteur: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      titre: conv.titre || `Discussion Demande #${conv.demandeId}`,
      statut: conv.demande?.statut || "En cours",
      demande: conv.demande,
      createur: conv.createur,
      participants: conv.participants.map((p) => p.user),
      dernierMessage: conv.messages[0]
        ? {
            contenu: conv.messages[0].contenu,
            expediteur: conv.messages[0].expediteur,
            createdAt: conv.messages[0].createdAt,
          }
        : null,
      unreadCount: 0, // À implémenter si nécessaire
      updatedAt: conv.updatedAt,
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error("Erreur chargement conversations:", error);
    res.status(500).json({
      error: "Erreur lors du chargement des conversations",
    });
  }
});

module.exports = router;
