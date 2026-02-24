// Backend/services/conversationMonitorService.js
const { PrismaClient } = require("@prisma/client");
const cron = require("node-cron");
const aiAssistantService = require("./aiAssistantService");
const emailService = require("./emailService");

const prisma = new PrismaClient();

class ConversationMonitorService {
  constructor() {
    this.lastRelance = new Map(); // Pour éviter les doublons
    console.log("✅ Service de monitoring initialisé");
    this.startMonitoring();
  }

  startMonitoring() {
    // Vérifier toutes les heures (ajustez selon vos besoins)
    cron.schedule("0 * * * *", async () => {
      console.log("🕐 Vérification des conversations inactives...");
      await this.checkInactiveConversations();
    });

    console.log("✅ Monitoring programmé (toutes les heures)");
  }

  async checkInactiveConversations() {
    try {
      // Récupérer les conversations actives
      const conversations = await prisma.conversation.findMany({
        where: {
          demande: {
            statut: {
              notIn: ["terminée", "refusée"],
            },
          },
        },
        include: {
          demande: {
            include: {
              service: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              expediteur: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  userType: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      console.log(`📊 ${conversations.length} conversations actives trouvées`);

      for (const conv of conversations) {
        await this.processConversation(conv);
      }
    } catch (error) {
      console.error("❌ Erreur monitoring:", error);
    }
  }

  async processConversation(conversation) {
    try {
      const dernierMessage = conversation.messages[0];
      if (!dernierMessage) return;

      const maintenant = new Date();
      const derniereActivite = new Date(dernierMessage.createdAt);
      const diffJours = Math.floor(
        (maintenant - derniereActivite) / (1000 * 60 * 60 * 24),
      );

      // Vérifier si une relance est nécessaire (J+2 ou J+5)
      if (diffJours === 2 || diffJours === 5) {
        console.log(
          `⏰ Conversation ${conversation.id} inactive depuis ${diffJours} jours`,
        );
        await this.sendRelance(conversation, diffJours);
      }
    } catch (error) {
      console.error("❌ Erreur traitement conversation:", error);
    }
  }

  async sendRelance(conversation, jours) {
    const relanceKey = `${conversation.id}_${jours}`;

    // Vérifier si déjà envoyé aujourd'hui
    const lastSent = this.lastRelance.get(relanceKey);
    const today = new Date().toDateString();

    if (lastSent === today) {
      console.log(
        `⏭️ Relance déjà envoyée aujourd'hui pour ${conversation.id}`,
      );
      return;
    }

    try {
      // Trouver qui n'a pas répondu
      const dernierExpediteur = conversation.messages[0]?.expediteurId;
      const destinataire = conversation.participants.find(
        (p) => p.userId !== dernierExpediteur,
      )?.user;

      if (!destinataire || !destinataire.email) {
        console.log("⚠️ Pas de destinataire trouvé");
        return;
      }

      console.log(
        `📧 Préparation relance J+${jours} pour ${destinataire.email}`,
      );

      // Générer le message de relance
      const contexte = {
        service: conversation.demande?.service?.libelle || "service",
        clientNom: destinataire.firstName || "Client",
        dernierMessage: conversation.messages[0]?.contenu || "",
      };

      const relanceMessage = await aiAssistantService.generateRelance(
        contexte,
        jours,
      );

      if (relanceMessage) {
        // Formater et envoyer l'email
        const emailContent = emailService.formatRelanceClient(
          conversation,
          destinataire,
          relanceMessage,
          contexte,
          jours,
        );

        const sujet =
          jours === 2
            ? `📧 Relance - Donnez suite à votre demande`
            : `⚠️ Dernière relance concernant votre demande`;

        const sent = await emailService.sendEmail(
          destinataire.email,
          sujet,
          emailContent,
        );

        if (sent) {
          // Enregistrer l'envoi
          this.lastRelance.set(relanceKey, today);

          // Ajouter un message système (optionnel)
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              expediteurId: destinataire.id,
              contenu: `[SYSTÈME] Email de relance envoyé (J+${jours})`,
              type: "SYSTEM",
              evenementType: "RELANCE",
            },
          });

          console.log(`✅ Relance J+${jours} envoyée à ${destinataire.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur envoi relance J+${jours}:`, error);
    }
  }

  async sendRelance(conversation, jours) {
    const relanceKey = `${conversation.id}_${jours}`;

    // Vérifier si déjà envoyé aujourd'hui
    const lastSent = this.lastRelance.get(relanceKey);
    const today = new Date().toDateString();

    if (lastSent === today) {
      console.log(
        `⏭️ Relance déjà envoyée aujourd'hui pour ${conversation.id}`,
      );
      return;
    }

    try {
      // Trouver qui n'a pas répondu
      const dernierExpediteur = conversation.messages[0]?.expediteurId;
      const destinataire = conversation.participants.find(
        (p) => p.userId !== dernierExpediteur,
      )?.user;

      if (!destinataire || !destinataire.email) {
        console.log("⚠️ Pas de destinataire trouvé");
        return;
      }

      console.log(
        `📧 Préparation relance J+${jours} pour ${destinataire.email}`,
      );

      // Générer le message de relance
      const contexte = {
        service: conversation.demande?.service?.libelle || "service",
        clientNom: destinataire.firstName || "Client",
        dernierMessage: conversation.messages[0]?.contenu || "",
      };

      const relanceMessage = await aiAssistantService.generateRelance(
        contexte,
        jours,
      );

      if (relanceMessage) {
        // Formater et envoyer l'email
        const emailContent = EmailService.formatRelanceClient(
          // Utilisez EmailService
          conversation,
          destinataire,
          relanceMessage,
          contexte,
          jours,
        );

        const sujet =
          jours === 2
            ? `📧 Relance - Donnez suite à votre demande`
            : `⚠️ Dernière relance concernant votre demande`;

        const sent = await EmailService.sendEmail(
          // Utilisez EmailService
          destinataire.email,
          sujet,
          emailContent,
        );

        if (sent) {
          // Enregistrer l'envoi
          this.lastRelance.set(relanceKey, today);

          // Ajouter un message système (optionnel)
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              expediteurId: destinataire.id,
              contenu: `[SYSTÈME] Email de relance envoyé (J+${jours})`,
              type: "SYSTEM",
              evenementType: "RELANCE",
            },
          });

          console.log(`✅ Relance J+${jours} envoyée à ${destinataire.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur envoi relance J+${jours}:`, error);
    }
  }
}

module.exports = new ConversationMonitorService();
