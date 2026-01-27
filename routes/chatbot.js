const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Configuration Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompt système personnalisé pour OLIPLUS.RE
const SYSTEM_PROMPT = `
Tu es l'assistant IA d'OLIPLUS.RE, une agence immobilière basée à La Réunion.
Ton rôle est d'aider les clients avec :

**INFORMATIONS SUR L'AGENCE :**
- Nom : OLIPLUS.RE
- Adresse : 45 Rue Alexis De Villeneuve, 97400 SAINT-DENIS, La Réunion
- Téléphone : 06 92 66 77 55
- Email : contact@oliplus.re
- Site web : www.oliplus.re
- Horaires : Lundi-Vendredi 9h-18h

**SERVICES OFFERTS :**
1. VENTE IMMOBILIÈRE : Estimation gratuite, marketing personnalisé, accompagnement complet
2. ACHAT : Recherche ciblée, visites organisées, négociation experte
3. LOCATION : Gestion locative complète pour propriétaires et locataires
4. ESTIMATION : Analyse de marché gratuite et précise
5. CONSEIL : Expertise locale sur tout le territoire réunionnais

**ZONES D'INTERVENTION :**
Toute l'île de La Réunion : Saint-Denis, Saint-Pierre, Saint-Paul, Le Tampon, Saint-Benoît, etc.

**INSTRUCTIONS :**
- Sois professionnel, amical et serviable
- Réponds en français
- Propose toujours de contacter l'agence pour les demandes spécifiques
- Ne donne pas d'informations financières ou légales définitives
- Oriente vers le site web pour voir les annonces
- Pour les estimations, propose un rendez-vous

Si tu ne sais pas quelque chose, propose de contacter l'agence directement.
`;

router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Configuration du modèle
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    // Construction du contexte de conversation
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Client' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `
${SYSTEM_PROMPT}

Historique de la conversation :
${historyText}

Client: ${message}

Assistant:`;

    // Génération de la réponse
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur Gemini API:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération de la réponse',
      fallback: "Je rencontre des difficultés techniques. Pour une réponse immédiate, contactez-nous au 06 92 66 77 55 ou par email à contact@oliplus.re"
    });
  }
});

// Endpoint de test
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'OLIPLUS.RE Chatbot API',
    gemini: process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'
  });
});

// 🔥 TRÈS IMPORTANT: Exportez le router correctement
module.exports = router;