// backend/scripts/relanceAutoCron.js
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiCommercialService = require('../services/aiCommercialService');
const emailRelanceService = require('../services/emailRelanceService');

// Stockage en mémoire des relances déjà envoyées
const relancesEnvoyees = new Map();

class RelanceAutoService {
  constructor() {
    // Exécuter toutes les heures
    cron.schedule('0 * * * *', () => {
      this.verifierEtEnvoyerRelances();
    });
    
    // Nettoyage du cache toutes les 24h
    cron.schedule('0 0 * * *', () => {
      this.nettoyerCache();
    });
    
    console.log('⏰ Service de relances automatiques démarré');
  }

  async verifierEtEnvoyerRelances() {
    console.log('🔍 Vérification des relances automatiques...');
    
    try {
      const maintenant = new Date();
      
      // Récupérer toutes les conversations actives
      const conversations = await prisma.conversation.findMany({
        where: {
          demande: {
            statut: {
              not: 'terminée' // Exclure les demandes terminées
            }
          }
        },
        include: {
          demande: {
            include: {
              service: true,
              metier: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  userType: true
                }
              }
            }
          },
          createur: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log(`📊 Analyse de ${conversations.length} conversations`);

      for (const conversation of conversations) {
        await this.analyserConversation(conversation, maintenant);
      }

    } catch (error) {
      console.error('❌ Erreur dans le CRON de relances:', error);
    }
  }

  async analyserConversation(conversation, maintenant) {
    try {
      const dernierMessage = conversation.messages[0];
      if (!dernierMessage) return;

      // Récupérer l'expéditeur du dernier message
      const dernierExpediteur = await prisma.user.findUnique({
        where: { id: dernierMessage.expediteurId },
        select: { userType: true }
      });

      // Si le dernier message est du client, pas besoin de relance
      if (dernierExpediteur?.userType === 'CLIENT') return;

      // Trouver l'artisan
      const artisan = conversation.participants.find(p => p.user.userType === 'ARTISAN')?.user || conversation.createur;
      
      if (!artisan || !artisan.email) {
        console.log(`⚠️ Pas d'email pour l'artisan de la conversation ${conversation.id}`);
        return;
      }

      // Vérifier si on a déjà envoyé une relance récemment
      const cleRelance = `relance_${conversation.id}`;
      const derniereRelance = relancesEnvoyees.get(cleRelance);
      
      if (derniereRelance) {
        const joursDepuisDerniereRelance = (maintenant - derniereRelance.date) / (1000 * 60 * 60 * 24);
        if (joursDepuisDerniereRelance < 3) {
          return; // Déjà relancé il y a moins de 3 jours
        }
      }

      // Calculer les jours depuis le dernier message
      const joursDepuisDernierMessage = (maintenant - new Date(dernierMessage.createdAt)) / (1000 * 60 * 60 * 24);

      let typeRelance = null;
      
      // J+2 : entre 2 et 3 jours
      if (joursDepuisDernierMessage >= 2 && joursDepuisDernierMessage < 3) {
        typeRelance = 'J+2';
      }
      // J+5 : entre 5 et 6 jours
      else if (joursDepuisDernierMessage >= 5 && joursDepuisDernierMessage < 6) {
        typeRelance = 'J+5';
      }

      if (typeRelance) {
        await this.envoyerRelance(conversation, artisan, typeRelance);
      }

    } catch (error) {
      console.error(`❌ Erreur analyse conversation ${conversation.id}:`, error);
    }
  }

  async envoyerRelance(conversation, artisan, type) {
    try {
      console.log(`📧 Préparation relance ${type} pour conversation ${conversation.id}`);

      // Générer le message de relance
      const messageRelance = await aiCommercialService.genererRelance(conversation, type);
      
      // Ajouter le message à la conversation pour l'email
      conversation.messageRelance = messageRelance;

      // Envoyer l'email
      const resultat = await emailRelanceService.envoyerRelance(artisan, conversation, type);

      if (resultat.success) {
        // Enregistrer dans le cache
        const cleRelance = `relance_${conversation.id}`;
        relancesEnvoyees.set(cleRelance, {
          date: new Date(),
          type: type,
          messageId: resultat.messageId
        });

        // Créer une entrée dans la base de données (optionnel)
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            expediteurId: artisan.id,
            contenu: `🔄 Relance automatique ${type} envoyée par email`,
            type: 'SYSTEM',
            evenementType: 'RELANCE_AUTO'
          }
        });

        console.log(`✅ Relance ${type} envoyée avec succès à ${artisan.email}`);
      }

    } catch (error) {
      console.error(`❌ Erreur envoi relance ${type}:`, error);
    }
  }

  nettoyerCache() {
    const maintenant = new Date();
    let compteur = 0;

    for (const [cle, valeur] of relancesEnvoyees.entries()) {
      const age = (maintenant - valeur.date) / (1000 * 60 * 60 * 24);
      if (age > 7) { // Supprimer après 7 jours
        relancesEnvoyees.delete(cle);
        compteur++;
      }
    }

    console.log(`🧹 Nettoyage cache: ${compteur} entrées supprimées`);
  }
}

// Démarrer le service
const relanceService = new RelanceAutoService();

module.exports = relanceService;