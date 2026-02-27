const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiCommercialService = require('../services/aiCommercialService');
const emailRelanceService = require('../services/emailRelanceService');

// Cache simple pour les suggestions
const suggestionsCache = new Map();
const analysesCache = new Map();

// GET /api/ai-commercial/suggestion/:messageId
router.get('/suggestion/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const suggestion = suggestionsCache.get(parseInt(messageId));
    
    if (suggestion) {
      return res.json({
        intention: suggestion.intention,
        reponseSuggeree: suggestion.reponseSuggeree,
        confiance: suggestion.confiance,
        inspireDe: suggestion.inspireDe
      });
    }

    res.json({
      intention: 'ANALYSE_EN_COURS',
      reponseSuggeree: "Analyse en cours...",
      confiance: 0
    });

  } catch (error) {
    console.error('❌ Erreur récupération suggestion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/ai-commercial/analyse/:conversationId
router.get('/analyse/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Vérifier d'abord le cache
    const cached = analysesCache.get(`analyse_${conversationId}`);
    
    if (cached) {
      return res.json({
        ...cached,
        fromCache: true
      });
    }

    // Récupérer la conversation complète
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        demande: {
          include: {
            service: true,
            metier: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            expediteur: {
              select: {
                userType: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Analyser avec l'IA
    const analyse = await aiCommercialService.analyserConversation(conversation);

    // Mettre en cache
    if (analyse) {
      analysesCache.set(`analyse_${conversationId}`, analyse);
      
      // Nettoyer après 1 heure
      setTimeout(() => analysesCache.delete(`analyse_${conversationId}`), 60 * 60 * 1000);
    }

    res.json({
      ...analyse,
      fromCache: false
    });

  } catch (error) {
    console.error('❌ Erreur récupération analyse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/ai-commercial/generer-relance/:conversationId
router.post('/generer-relance/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        demande: {
          include: { 
            service: true,
            metier: true 
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            expediteur: {
              select: { userType: true }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Récupérer l'historique des conversations similaires
    const historiqueSimilaire = await getConversationsSimilaires(conversation);

    const messageRelance = await aiCommercialService.genererRelance(
      conversation, 
      type || 'J+2',
      historiqueSimilaire
    );

    res.json({
      success: true,
      type: type || 'J+2',
      message: messageRelance
    });

  } catch (error) {
    console.error('❌ Erreur génération relance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/ai-commercial/envoyer-relance/:conversationId
router.post('/envoyer-relance/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, type } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        demande: true,
        participants: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, userType: true }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Trouver l'artisan
    const artisan = conversation.participants.find(p => p.user.userType === 'ARTISAN')?.user;

    if (!artisan || !artisan.email) {
      return res.status(400).json({ error: 'Artisan ou email non trouvé' });
    }

    const resultat = await emailRelanceService.envoyerRelance(
      artisan,
      conversation,
      message,
      type || 'J+2'
    );

    if (resultat.success) {
      // Enregistrer l'envoi
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: artisan.id,
          contenu: `🔄 Relance ${type} envoyée par email`,
          type: 'SYSTEM',
          evenementType: 'RELANCE_ENVOYEE'
        }
      });

      res.json({ success: true, messageId: resultat.messageId });
    } else {
      res.status(500).json({ error: resultat.error });
    }

  } catch (error) {
    console.error('❌ Erreur envoi relance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route health check pour l'IA
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const status = {
      service: 'AI Commercial',
      geminiKey: !!process.env.GEMINI_API_KEY,
      cache: {
        suggestions: suggestionsCache.size,
        analyses: analysesCache.size
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai-commercial/devis-pre-rempli/:conversationId
router.get('/devis-pre-rempli/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        demande: {
          include: {
            service: true,
            metier: true
          }
        },
        messages: {
          where: {
            expediteur: {
              userType: 'CLIENT'
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Extraire les infos pour le devis
    const messagesClients = conversation.messages.map(m => m.contenu).join(' ');
    
    // Estimation simple (à améliorer avec l'IA)
    const montantEstime = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
    
    res.json({
      montantEstime: montantEstime,
      description: conversation.demande?.description || "Devis standard",
      service: conversation.demande?.service?.libelle || "Service",
      metier: conversation.demande?.metier?.libelle || "Métier"
    });

  } catch (error) {
    console.error('❌ Erreur génération devis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour trouver des conversations similaires
async function getConversationsSimilaires(conversation) {
  try {
    if (!conversation.demande?.serviceId) return [];

    const conversationsSimilaires = await prisma.conversation.findMany({
      where: {
        demande: {
          serviceId: conversation.demande.serviceId,
          statut: 'terminée'
        },
        id: { not: conversation.id }
      },
      include: {
        messages: {
          where: {
            evenementType: 'RELANCE_ENVOYEE'
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 3
    });

    return conversationsSimilaires.map(c => ({
      message: c.messages[0]?.contenu || '',
      date: c.messages[0]?.createdAt
    })).filter(c => c.message);

  } catch (error) {
    console.error('❌ Erreur recherche similarités:', error);
    return [];
  }
}

module.exports = router;