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
        
        },
        
        include: {
          messages:true,
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
        messages:conversation.messages
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
    const userRole = req.user.role;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
      include: {
        createur: {
          select: {
            id: true
          }
        },
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                userType: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation non trouvée",
      });
    }

    // Vérifier si l'utilisateur a accès à cette conversation
    const hasAccess = conversation.createurId === userId || 
                     conversation.participants.some(p => p.userId === userId)||userRole=="admin";
    
    if (!hasAccess) {
      return res.status(403).json({
        error: "Accès non autorisé à cette conversation",
      });
    }

    // Récupérer les IDs des participants professionnels
    const professionalParticipantIds = conversation.participants
      .filter((p) => p.user.role === "professional")
      .map((p) => p.userId);

    // Déterminer la condition WHERE
    let whereClause = {
      conversationId: conversation.id
    };

    // Si l'utilisateur est un professionnel
    if (userRole === "professional") {
      whereClause = {
        AND: [{
        conversationId: conversation.id,
        OR: [
          // Ses propres messages
          { expediteurId: userId },
          // Messages du créateur
          { expediteurId: conversation.createurId },
          // Messages système
          { type: "SYSTEM" }
        ]}]
      };
    } 
    // Si l'utilisateur est le créateur
    else {
      whereClause = {
        conversationId: conversation.id,
      };
    }

    // Récupérer les messages avec le filtre approprié
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        expediteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
            userType: true,
            role: true
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Marquer les messages comme lus
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
    const { contenu, type = "TEXT",nomFichier=null,urlFichier=null,typeFichier=null } = req.body;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        // OR: [
        //   { createurId: userId },
        //   {
        //     participants: {
        //       some: {
        //         userId: userId,
        //       },
        //     },
        //   },
        // ],
      },
      include: {
        participants: true,
      },
    });
    console.log("conversation:",conversation)
    if (!conversation) {
      return res.status(404).json({
        error: "Conversation non trouvée",
      });
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
