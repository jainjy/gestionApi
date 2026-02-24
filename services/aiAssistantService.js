// backend/services/aiAssistantService.js - VERSION SANS aiSuggestion
const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIAssistantService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY manquante dans .env");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log('✅ Service IA initialisé');
  }

  async qualifierDemande(demandeData) {
    try {
      const {
        description,
        contactPrenom,
        contactNom,
        dateSouhaitee,
        heureSouhaitee,
        property
      } = demandeData;

      const prenom = contactPrenom || 'Client';
      const nom = contactNom || '';
      const bien = property?.title || 'bien immobilier';
      
      const cleanDescription = this.extraireMessageUtilisateur(description) || 'Aucun message';
      
      const prompt = `
      Analyse cette demande de visite immobilière:

      CLIENT: ${prenom} ${nom}
      ${dateSouhaitee ? `DATE: ${new Date(dateSouhaitee).toLocaleDateString('fr-FR')}` : ''}
      ${heureSouhaitee ? `HEURE: ${heureSouhaitee}` : ''}
      BIEN: ${bien}
      LOCALISATION: ${property?.city || property?.address || 'Non spécifiée'}

      MESSAGE: "${cleanDescription}"

      Réponds UNIQUEMENT avec cet objet JSON:
      {
        "resume": "résumé en 1 phrase",
        "type": "URGENT" ou "DEVIS" ou "INFO",
        "leadScore": "CHAUD" ou "TIEDE" ou "FROID",
        "budgetEstime": null ou nombre,
        "delai": null ou "24h" ou "48h" ou "semaine"
      }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const qualification = JSON.parse(jsonMatch[0]);
        
        return {
          aiSummary: qualification.resume || `Demande de ${prenom} ${nom}`,
          aiClass: (qualification.type || 'INFO').toLowerCase(),
          aiScore: (qualification.leadScore || 'TIEDE').toLowerCase(),
          aiBudget: qualification.budgetEstime ? String(qualification.budgetEstime) : null,
          aiInterventionTime: qualification.delai || null,
          // aiSuggestion supprimé
          aiProcessedAt: new Date(),
          aiConfidence: 0.85
        };
      }
      
      return this.qualificationParDefaut(demandeData);
      
    } catch (error) {
      console.error('❌ Erreur IA:', error.message);
      return this.qualificationParDefaut(demandeData);
    }
  }

  extraireMessageUtilisateur(description) {
    if (!description) return '';
    
    const prefixes = [
      "Demande visite pour le bien:",
      "Postulation pour logement intermédiaire"
    ];
    
    let message = description;
    for (const prefix of prefixes) {
      if (message.includes(prefix)) {
        const parts = message.split('.');
        message = parts[parts.length - 1].trim();
      }
    }
    
    return message;
  }

  qualificationParDefaut(demandeData) {
    const { dateSouhaitee, property, contactPrenom, contactNom } = demandeData;
    
    return {
      aiSummary: `Demande de visite pour ${property?.title || 'un bien'} par ${contactPrenom || ''} ${contactNom || ''}`,
      aiClass: dateSouhaitee ? 'urgent' : 'info',
      aiScore: dateSouhaitee ? 'tiède' : 'froid',
      aiBudget: null,
      aiInterventionTime: dateSouhaitee ? '48h' : null,
      // aiSuggestion supprimé
      aiProcessedAt: new Date(),
      aiConfidence: 0.5
    };
  }
}

module.exports = new AIAssistantService();