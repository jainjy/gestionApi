const { GoogleGenerativeAI } = require("@google/generative-ai");

class AICommercialService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY manquante dans .env");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Service IA Commercial initialisé');
  }

  /**
   * Analyse l'historique complet de la conversation et suggère une réponse
   */
  async analyserConversation(conversation) {
    try {
      // Construire l'historique complet
      const historique = conversation.messages.map(m => 
        `${m.expediteur?.userType === 'CLIENT' ? 'CLIENT' : m.expediteur?.userType || 'ARTISAN'}: ${m.contenu}`
      ).join('\n');

      // Compter les messages
      const messagesClients = conversation.messages.filter(m => m.expediteur?.userType === 'CLIENT').length;
      const messagesArtisans = conversation.messages.filter(m => m.expediteur?.userType === 'ARTISAN').length;

      const prompt = `
      Tu es un assistant conversationnel pour artisans. Analyse TOUT l'historique de cette conversation et propose une réponse pertinente.

      HISTORIQUE COMPLET DE LA CONVERSATION:
      ${historique}

      STATISTIQUES:
      - Messages clients: ${messagesClients}
      - Messages artisans: ${messagesArtisans}
      - Service: ${conversation.demande?.service?.libelle || 'Non spécifié'}
      - Description: ${conversation.demande?.description || 'Non fournie'}

      Analyse:
      1. Quel est le sujet principal de la conversation ?
      2. Quelles questions restent sans réponse ?
      3. Que devrait faire l'artisan maintenant ?

      Propose une réponse adaptée au contexte actuel de la conversation.
      La réponse doit être naturelle, professionnelle et utile.

      Réponds UNIQUEMENT avec cet objet JSON:
      {
        "analyse": "brève analyse de la conversation (1 phrase)",
        "suggestion": "ta réponse suggérée ici (2-3 phrases max)",
        "typeAction": "repondre|relancer|proposer_rdv|envoyer_devis|autre",
        "confiance": 85
      }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.reponseConversationParDefaut(conversation);
    } catch (error) {
      console.error('❌ Erreur analyse conversation:', error);
      return this.reponseConversationParDefaut(conversation);
    }
  }

  /**
   * Analyse un message client pour générer une suggestion de réponse
   */
  async analyserMessageClient(message, contexte, historiqueConversations = []) {
    try {
      // Construire l'historique des conversations similaires
      let historiqueText = '';
      if (historiqueConversations.length > 0) {
        historiqueText = `
        CONVERSATIONS SIMILAIRES ANTÉRIEURES:
        ${historiqueConversations.map((conv, idx) => {
          return `Exemple ${idx + 1}:
          - Message client: "${conv.messageClient}"`;
        }).join('\n\n')}
        `;
      }

      const prompt = `
      Tu es un assistant commercial pour des artisans du bâtiment.
      
      CONTEXTE ACTUEL:
      - Service demandé: ${contexte.service || 'Non spécifié'}
      - Description projet: ${contexte.description || 'Non fournie'}
      
      MESSAGE DU CLIENT:
      "${message.contenu}"
      
      ${historiqueText}
      
      INSTRUCTIONS:
      1. Analyse ce message et propose une réponse professionnelle
      2. Base-toi sur les conversations similaires si disponibles
      3. La réponse doit être personnalisée et utile
      
      Réponds UNIQUEMENT avec cet objet JSON:
      {
        "intention": "DEMANDE_PRIX|DEMANDE_RENDEZ_VOUS|QUESTION_TECHNIQUE|AUTRE",
        "reponseSuggeree": "ta réponse suggérée ici (2-3 phrases max)",
        "confiance": 85,
        "inspireDe": "conversation_antérieure|analyse_directe"
      }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.reponseParDefaut();
    } catch (error) {
      console.error('❌ Erreur analyse message:', error);
      return this.reponseParDefaut();
    }
  }

  /**
   * Génère une relance par email pour un artisan
   */
  async genererRelance(conversation, type = 'J+2', historiqueSimilaire = []) {
    try {
      const dernierMessage = conversation.messages?.[0];
      
      let historiqueText = '';
      if (historiqueSimilaire.length > 0) {
        historiqueText = `
        EXEMPLES DE RELANCES EFFICACES:
        ${historiqueSimilaire.map((ex, idx) => `- "${ex.message}"`).join('\n')}
        `;
      }

      const prompt = `
      Génère un email de relance professionnel pour un artisan.

      CONTEXTE:
      - Type: ${type === 'J+2' ? '2 jours après le dernier message' : '5 jours après le dernier message'}
      - Dernier message: "${dernierMessage?.contenu || 'Aucun'}"
      - Service: ${conversation.demande?.service?.libelle || 'Non spécifié'}
      
      ${historiqueText}

      IMPORTANT: 
      - Sois poli mais professionnel
      - Rappelle le contexte de la conversation
      - Propose une action claire
      - Maximum 100 mots

      Retourne UNIQUEMENT le texte de l'email.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('❌ Erreur génération relance:', error);
      return type === 'J+2' 
        ? "Bonjour, je me permets de revenir vers vous suite à notre échange concernant votre demande. Avez-vous eu le temps de réfléchir à ma proposition ? N'hésitez pas si vous avez des questions."
        : "Bonjour, je souhaitais prendre de vos nouvelles suite à notre précédent échange. Je reste à votre disposition pour discuter de votre projet quand vous le souhaitez.";
    }
  }

  reponseParDefaut() {
    return {
      intention: "AUTRE",
      reponseSuggeree: "Merci pour votre message. Je vais étudier votre demande et reviens vers vous rapidement.",
      confiance: 30,
      inspireDe: "defaut"
    };
  }

  reponseConversationParDefaut(conversation) {
    return {
      analyse: `Conversation avec ${conversation.messages.length} messages`,
      suggestion: "Bonjour, merci pour votre message. Je fais le point sur votre demande et vous réponds dans la journée.",
      typeAction: "repondre",
      confiance: 50
    };
  }
}

module.exports = new AICommercialService();