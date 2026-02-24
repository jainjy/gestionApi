// Backend/middleware/aiAssistantMiddleware.js
const aiAssistantService = require('../services/aiAssistantService');
const { EmailService } = require('../services/emailService');

// Définir la fonction middleware
const aiAssistantMiddleware = (req, res, next) => {
  // Sauvegarder la méthode json originale
  const originalJson = res.json;
  
  // Surcharger res.json
  res.json = async function(data) {
    // Vérifier si c'est un POST vers /messages
    if (req.method === 'POST' && req.path.includes('/messages')) {
      try {
        // Attendre un peu pour que le message soit bien enregistré
        setTimeout(async () => {
          await analyzeAndNotify(req, data);
        }, 500);
      } catch (error) {
        console.error('❌ Erreur middleware IA:', error);
      }
    }
    
    // Appeler la méthode originale
    return originalJson.call(this, data);
  };
  
  next();
};

// Fonction d'analyse et notification
async function analyzeAndNotify(req, messageData) {
  try {
    const { demandeId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    console.log(`🔍 Analyse du message #${messageData.id} par l'IA...`);

    // Récupérer la conversation et la demande
    const conversation = await prisma.conversation.findFirst({
      where: { demandeId: parseInt(demandeId) },
      include: {
        demande: {
          include: {
            service: true
          }
        },
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!conversation) {
      console.log('❌ Conversation non trouvée');
      return;
    }

    // Récupérer le message complet
    const message = await prisma.message.findUnique({
      where: { id: messageData.id },
      include: { expediteur: true }
    });

    if (!message) {
      console.log('❌ Message non trouvé');
      return;
    }

    console.log(`📨 Message de ${message.expediteur?.userType || 'inconnu'} reçu`);

    // Vérifier si l'expéditeur est un client
    const estClient = message.expediteur?.userType === 'CLIENT';
    
    if (estClient) {
      console.log('👤 Message client détecté, analyse en cours...');
      
      // Analyser avec l'IA
      const contexte = {
        service: conversation.demande?.service?.libelle || 'Service',
        statut: conversation.demande?.statut || 'En cours',
        description: conversation.demande?.description || ''
      };

      const analysis = await aiAssistantService.analyzeMessage(message.contenu, contexte);

      if (analysis && analysis.confiance > 70) {
        // Trouver l'artisan
        const artisan = conversation.participants.find(p => p.user.userType === 'ARTISAN')?.user;
        
        if (artisan && artisan.email) {
          console.log(`📧 Envoi notification à l'artisan ${artisan.email}`);
          
          // Envoyer email avec SMTP Gmail
          const emailContent = EmailService.formatNotificationArtisan(
            {
              ...analysis,
              service: contexte.service
            }, 
            message, 
            demandeId, 
            artisan
          );
          
          await EmailService.sendEmail(
            artisan.email,
            `🎯 Nouveau message client - ${analysis.intention || 'opportunité'}`,
            emailContent
          );
          
          console.log('✅ Notification envoyée avec succès');
        } else {
          console.log('⚠️ Artisan non trouvé ou sans email');
        }
      } else {
        console.log('⚠️ Analyse IA non pertinente (confiance < 70%)');
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur analyse et notification:', error);
  }
}

// Exporter le middleware
module.exports = aiAssistantMiddleware;