const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiCommercialService = require('../services/aiCommercialService');
const emailRelanceService = require('../services/emailRelanceService');

// Stockage des dernières relances
const dernieresRelances = new Map();

// Exécuter toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Vérification des relances à envoyer...');
  
  try {
    const maintenant = new Date();
    
    // Récupérer les conversations actives
    const conversations = await prisma.conversation.findMany({
      where: {
        demande: {
          statut: { not: 'terminée' }
        }
      },
      include: {
        demande: {
          include: { service: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            expediteur: {
              select: { userType: true }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, userType: true }
            }
          }
        }
      }
    });

    for (const conversation of conversations) {
      await verifierEtEnvoyerRelance(conversation, maintenant);
    }

  } catch (error) {
    console.error('❌ Erreur CRON relances:', error);
  }
});

async function verifierEtEnvoyerRelance(conversation, maintenant) {
  try {
    const dernierMessage = conversation.messages[0];
    if (!dernierMessage) return;

    // Si le dernier message est du client, pas besoin de relance
    if (dernierMessage.expediteur?.userType === 'CLIENT') return;

    // Trouver l'artisan
    const artisan = conversation.participants.find(p => p.user.userType === 'ARTISAN')?.user;
    if (!artisan || !artisan.email) return;

    // Vérifier si déjà relancé récemment
    const cle = `relance_${conversation.id}`;
    const derniereRelance = dernieresRelances.get(cle);
    
    if (derniereRelance) {
      const joursDepuis = (maintenant - derniereRelance.date) / (1000 * 60 * 60 * 24);
      if (joursDepuis < 3) return;
    }

    // Calculer les jours depuis le dernier message
    const joursDepuisDernierMessage = (maintenant - new Date(dernierMessage.createdAt)) / (1000 * 60 * 60 * 24);

    let typeRelance = null;
    
    if (joursDepuisDernierMessage >= 2 && joursDepuisDernierMessage < 3) {
      typeRelance = 'J+2';
    } else if (joursDepuisDernierMessage >= 5 && joursDepuisDernierMessage < 6) {
      typeRelance = 'J+5';
    }

    if (typeRelance) {
      // Générer la relance
      const messageRelance = await aiCommercialService.genererRelance(
        conversation, 
        typeRelance,
        []
      );

      // Envoyer l'email
      const resultat = await emailRelanceService.envoyerRelance(
        artisan,
        conversation,
        messageRelance,
        typeRelance
      );

      if (resultat.success) {
        // Enregistrer
        dernieresRelances.set(cle, {
          date: new Date(),
          type: typeRelance
        });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            expediteurId: artisan.id,
            contenu: `🔄 Relance automatique ${typeRelance} envoyée`,
            type: 'SYSTEM',
            evenementType: 'RELANCE_AUTO'
          }
        });

        console.log(`✅ Relance ${typeRelance} envoyée à ${artisan.email}`);
      }
    }

  } catch (error) {
    console.error(`❌ Erreur pour conversation ${conversation.id}:`, error);
  }
}

console.log('⏰ Service de relances automatiques démarré');