// services/profileOptimization.service.js - Version corrigée
const { GoogleGenerativeAI } = require("@google/generative-ai");

class ProfileOptimizationService {
  constructor() {
    // Initialiser Gemini API seulement si la clé est disponible
    if (process.env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: "Tu es un assistant expert en optimisation de profil professionnel. Fournis des recommandations concrètes et actionnables."
        });
        console.log('✅ Gemini AI initialisé');
      } catch (error) {
        console.warn('⚠️ Erreur initialisation Gemini:', error.message);
        this.model = null;
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY non configurée, mode fallback activé');
      this.model = null;
    }
  }

  async analyzeProfessionalProfile(professionalData) {
    try {
      console.log('🔍 Analyse du profil:', professionalData.firstName, professionalData.lastName);
      
      // Essayer d'abord l'API Gemini
      if (this.model) {
        try {
          const prompt = this.buildAnalysisPrompt(professionalData);
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const analysisText = response.text();
          
          console.log('🤖 Réponse Gemini reçue');
          return this.parseAnalysisResponse(analysisText, professionalData);
          
        } catch (geminiError) {
          console.warn('⚠️ Erreur Gemini API, fallback:', geminiError.message);
          // Fallback sur l'analyse basique
          return this.generateBasicAnalysis(professionalData);
        }
      } else {
        // Mode fallback direct
        console.log('🔄 Utilisation du mode fallback (pas de Gemini)');
        return this.generateBasicAnalysis(professionalData);
      }
      
    } catch (error) {
      console.error('❌ Erreur analyse profil:', error);
      // Fallback minimal
      return {
        score: 50,
        missingElements: ['Erreur lors de l\'analyse, veuillez réessayer'],
        blockingFactors: [],
        seoRecommendations: [],
        conversionStats: [],
        timestamp: new Date().toISOString(),
        isAIAnalysis: false
      };
    }
  }

  buildAnalysisPrompt(professionalData) {
    // Simplifier le prompt pour éviter les erreurs
    return `
Analyse ce profil professionnel et donne des recommandations.

INFORMATIONS:
- Nom: ${professionalData.firstName || ''} ${professionalData.lastName || ''}
- Description: ${professionalData.description || 'Pas de description'}
- Services: ${professionalData.services?.length || 0}
- Photo de profil: ${professionalData.avatar ? 'Oui' : 'Non'}
- Téléphone: ${professionalData.phone ? 'Oui' : 'Non'}

Donne une réponse au format:
SCORE: [0-100]%
CE QUI MANQUE:
- [recommandation 1]
- [recommandation 2]
FREINS CLIENTS:
- [frein 1]
AMÉLIORATIONS VISIBILITÉ:
- [amélioration 1]
RÉFÉRENCES STATISTIQUES:
- [stat 1]
`;
  }

  parseAnalysisResponse(responseText, professionalData) {
    console.log('📝 Parsing réponse Gemini');
    
    // Parsing simplifié
    const lines = responseText.split('\n');
    let score = 50;
    const missingElements = [];
    const blockingFactors = [];
    const seoRecommendations = [];
    const conversionStats = [];

    let currentSection = null;

    for (let line of lines) {
      line = line.trim();
      
      if (line.startsWith('SCORE:')) {
        const scoreMatch = line.match(/(\d+)%/);
        if (scoreMatch) score = parseInt(scoreMatch[1]);
      } 
      else if (line.includes('CE QUI MANQUE:')) {
        currentSection = 'missing';
      }
      else if (line.includes('FREINS CLIENTS:')) {
        currentSection = 'blocking';
      }
      else if (line.includes('AMÉLIORATIONS VISIBILITÉ:')) {
        currentSection = 'seo';
      }
      else if (line.includes('RÉFÉRENCES STATISTIQUES:')) {
        currentSection = 'stats';
      }
      else if (line.startsWith('- ') && currentSection) {
        const content = line.substring(2).trim();
        
        switch(currentSection) {
          case 'missing':
            missingElements.push(content);
            break;
          case 'blocking':
            blockingFactors.push(content);
            break;
          case 'seo':
            seoRecommendations.push(content);
            break;
          case 'stats':
            conversionStats.push(content);
            break;
        }
      }
    }

    // Si pas assez d'éléments, compléter
    if (missingElements.length === 0) {
      missingElements.push(...this.generateBasicRecommendations(professionalData));
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      missingElements: missingElements.slice(0, 5),
      blockingFactors: blockingFactors.slice(0, 3),
      seoRecommendations: seoRecommendations.slice(0, 3),
      conversionStats: conversionStats.slice(0, 2),
      timestamp: new Date().toISOString(),
      isAIAnalysis: true
    };
  }

  generateBasicAnalysis(professionalData) {
    console.log('🔄 Génération analyse basique');
    
    const recommendations = this.generateBasicRecommendations(professionalData);
    const blockingFactors = [];
    const seoRecommendations = [];
    const conversionStats = [];

    // Calcul score simple
    let score = 50;
    if (professionalData.avatar) score += 10;
    if (professionalData.description && professionalData.description.length > 100) score += 15;
    if (professionalData.services && professionalData.services.length >= 3) score += 10;
    if (professionalData.phone) score += 5;
    if (professionalData.address) score += 5;

    // Freins
    if (!professionalData.avatar) {
      blockingFactors.push("Aucune photo de profil - moins de confiance");
    }
    if (!professionalData.phone) {
      blockingFactors.push("Pas de téléphone - clients ne peuvent pas vous appeler");
    }

    // SEO
    if (!professionalData.description) {
      seoRecommendations.push("Ajoutez une description détaillée");
    }
    seoRecommendations.push("Ajoutez votre zone d'intervention");

    // Stats
    conversionStats.push("Les profils complets ont +40% de conversion");
    conversionStats.push("Les photos augmentent la confiance de 80%");

    return {
      score: Math.min(100, score),
      missingElements: recommendations.slice(0, 5),
      blockingFactors,
      seoRecommendations,
      conversionStats,
      timestamp: new Date().toISOString(),
      isAIAnalysis: false
    };
  }

  generateBasicRecommendations(professionalData) {
    const recommendations = [];

    if (!professionalData.avatar) {
      recommendations.push("Ajoutez une photo de profil professionnelle");
    }

    if (!professionalData.description) {
      recommendations.push("Rédigez une description de votre activité");
    } else if (professionalData.description.length < 100) {
      recommendations.push("Votre description est trop courte (minimum 100 caractères)");
    }

    if (!professionalData.services || professionalData.services.length < 3) {
      recommendations.push("Ajoutez au moins 3 services détaillés");
    }

    if (!professionalData.phone) {
      recommendations.push("Ajoutez votre numéro de téléphone");
    }

    if (!professionalData.address) {
      recommendations.push("Ajoutez votre adresse");
    }

    return recommendations;
  }

  calculateProfileCompletion(professionalData) {
    const completion = {
      total: 0,
      completed: 0,
      percentage: 0,
      details: {}
    };

    // Critères de complétion
    const criteria = [
      {
        name: 'photo',
        label: 'Photo de profil',
        weight: 10,
        isComplete: () => !!professionalData.avatar,
        description: 'Une photo de profil professionnelle'
      },
      {
        name: 'description',
        label: 'Description',
        weight: 15,
        isComplete: () => professionalData.description && professionalData.description.length > 100,
        description: 'Description détaillée de votre activité'
      },
      {
        name: 'phone',
        label: 'Téléphone',
        weight: 10,
        isComplete: () => !!professionalData.phone,
        description: 'Numéro de téléphone de contact'
      },
      {
        name: 'email',
        label: 'Email professionnel',
        weight: 5,
        isComplete: () => !!professionalData.email,
        description: 'Adresse email professionnelle'
      },
      {
        name: 'address',
        label: 'Adresse complète',
        weight: 10,
        isComplete: () => !!professionalData.address && !!professionalData.city,
        description: 'Adresse et ville'
      },
      {
        name: 'services',
        label: 'Services',
        weight: 20,
        isComplete: () => professionalData.services && professionalData.services.length >= 3,
        description: 'Minimum 3 services définis'
      },
      {
        name: 'metiers',
        label: 'Métiers',
        weight: 10,
        isComplete: () => professionalData.metiers && professionalData.metiers.length > 0,
        description: 'Au moins un métier sélectionné'
      },
      {
        name: 'photosProjets',
        label: 'Photos de réalisations',
        weight: 10,
        isComplete: () => professionalData.projectPhotos && professionalData.projectPhotos >= 3,
        description: 'Minimum 3 photos de vos travaux'
      },
      {
        name: 'horaires',
        label: 'Horaires',
        weight: 5,
        isComplete: () => !!professionalData.hasSchedule,
        description: 'Horaires de disponibilité définis'
      },
      {
        name: 'companyInfo',
        label: 'Informations entreprise',
        weight: 5,
        isComplete: () => !!professionalData.companyName || !!professionalData.commercialName,
        description: 'Nom de votre entreprise'
      }
    ];

    // Calculer la complétion
    let totalWeight = 0;
    let completedWeight = 0;

    criteria.forEach(criterion => {
      const isComplete = criterion.isComplete();
      totalWeight += criterion.weight;
      if (isComplete) {
        completedWeight += criterion.weight;
      }

      completion.details[criterion.name] = {
        label: criterion.label,
        description: criterion.description,
        weight: criterion.weight,
        isComplete,
        missingAction: !isComplete ? `Ajouter ${criterion.label.toLowerCase()}` : null
      };
    });

    completion.total = totalWeight;
    completion.completed = completedWeight;
    completion.percentage = Math.round((completedWeight / totalWeight) * 100);

    // Générer des recommandations basées sur ce qui manque
    completion.recommendations = criteria
      .filter(c => !c.isComplete())
      .map(c => `• ${c.description}`)
      .slice(0, 5); // Limiter à 5 recommandations

    return completion;
  }
}

module.exports = new ProfileOptimizationService();