const aiCommercialService = require('../services/aiCommercialService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cache pour les suggestions
const suggestionsCache = new Map();

const aiCommercialMiddleware = (io) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = async function (data) {
      // Quand un nouveau message est créé
      if (req.method === "POST" && req.path.includes("/messages") && data.id) {
        setTimeout(async () => {
          await analyserNouveauMessage(req, data, io);
        }, 1000);
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

async function analyserNouveauMessage(req, messageData, io) {
  try {
    const { demandeId } = req.params;

    // Récupérer le message complet
    const message = await prisma.message.findUnique({
      where: { id: messageData.id },
      include: { 
        expediteur: true,
        conversation: {
          include: {
            demande: {
              include: {
                service: true,
                metier: true
              }
            },
            participants: {
              include: {
                user: {
                  select: { id: true, userType: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!message || !message.conversation) return;

    // Vérifier si l'expéditeur est un client
    const estClient = message.expediteur?.userType === 'CLIENT';
    
    if (estClient) {
      console.log(`👤 Message client détecté dans conversation #${message.conversation.id}`);

      // Récupérer les conversations similaires pour inspiration
      const historiqueConversations = await getConversationsSimilaires(
        message.conversation.demande?.serviceId,
        message.contenu
      );

      // Analyser avec l'IA
      const contexte = {
        service: message.conversation.demande?.service?.libelle || 'Service',
        statut: message.conversation.demande?.statut || 'En cours',
        description: message.conversation.demande?.description || ''
      };

      const analysis = await aiCommercialService.analyserMessageClient(
        message, 
        contexte,
        historiqueConversations
      );

      if (analysis && analysis.confiance > 60) {
        // Mettre en cache
        const cacheKey = `suggestion_${message.id}`;
        suggestionsCache.set(cacheKey, {
          ...analysis,
          messageId: message.id,
          conversationId: message.conversation.id,
          timestamp: new Date()
        });

        // Trouver l'artisan
        const artisan = message.conversation.participants.find(
          p => p.user.userType === 'ARTISAN'
        )?.user;

        if (artisan) {
          // Émettre via Socket.IO
          io.to(`user:${artisan.id}`).emit('ai-suggestion', {
            messageId: message.id,
            conversationId: message.conversation.id,
            analyse: {
              intention: analysis.intention,
              reponseSuggeree: analysis.reponseSuggeree,
              confiance: analysis.confiance,
              inspireDe: analysis.inspireDe
            }
          });

          console.log(`💡 Suggestion IA envoyée à l'artisan ${artisan.id}`);
        }

        // Nettoyer après 1 heure
        setTimeout(() => suggestionsCache.delete(cacheKey), 60 * 60 * 1000);
      }
    }

  } catch (error) {
    console.error("❌ Erreur analyse message:", error);
  }
}

// Récupérer une suggestion du cache
function getSuggestionFromCache(messageId) {
  return suggestionsCache.get(`suggestion_${messageId}`) || null;
}

// Récupérer l'analyse d'une conversation
function getConversationAnalysis(conversationId) {
  // Cette fonction est maintenant dans le routeur
  return null;
}

// Trouver des conversations similaires
async function getConversationsSimilaires(serviceId, messageClient) {
  try {
    if (!serviceId) return [];

    // Récupérer les conversations terminées du même service
    const conversations = await prisma.conversation.findMany({
      where: {
        demande: {
          serviceId: serviceId,
          statut: 'terminée'
        }
      },
      include: {
        messages: {
          where: {
            expediteur: {
              userType: 'CLIENT'
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 5
    });

    // Extraire les exemples pertinents
    const exemples = [];
    for (const conv of conversations) {
      for (const msg of conv.messages) {
        exemples.push({
          messageClient: msg.contenu,
          reponseArtisan: "", // À compléter si besoin
          satisfaction: "Non évaluée",
          service: serviceId
        });
      }
    }

    return exemples.slice(0, 3);

  } catch (error) {
    console.error('❌ Erreur recherche similarités:', error);
    return [];
  }
}

module.exports = {
  aiCommercialMiddleware,
  getSuggestionFromCache
};