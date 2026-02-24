// routes/iaAssistant.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");
const { EmailService } = require("../services/emailService");
const iaAssistantService = require("../services/aiAssistantService");

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================
// 1️⃣ ROUTES POUR L'ANALYSE SILENCIEUSE
// ============================================

// POST /api/ai/analyze-silent - Analyse silencieuse des messages (sans stockage)
router.post("/analyze-silent", authenticateToken, async (req, res) => {
  try {
    const { messageId, demandeId, contenu, contexte } = req.body;
    
    console.log(`🔍 [IA] Analyse silencieuse du message ${messageId}`);

    // OPTIONNEL: Vous pouvez ajouter un champ dans le message existant
    // Mais puisque vous ne voulez pas de nouvelle table, on ne fait que logger
    console.log(`✅ [IA] Message analysé - Intention probable: ${contenu.substring(0, 30)}...`);
    
    // Pas de stockage en base, juste un log
    res.json({ success: true, message: "Message analysé" });
    
  } catch (error) {
    console.error("❌ [IA] Erreur analyse silencieuse:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 2️⃣ ROUTE PRINCIPALE DE RELANCE AUTOMATIQUE
// ============================================

// POST /api/ai/handle-inactivity - Gestion des relances automatiques
router.post('/handle-inactivity', authenticateToken, async (req, res) => {
  try {
    const { demandeId, heuresInactivite } = req.body;
    
    console.log(`🤖 [IA] Relance automatique pour demande #${demandeId} (${heuresInactivite}h)`);

    // Récupérer la conversation et la demande
    const conversation = await prisma.conversation.findFirst({
      where: { demandeId: parseInt(demandeId) },
      include: { 
        demande: { 
          include: { 
            client: true,
            artisan: true,
            service: true,
            metier: true
          } 
        },
        messages: { 
          orderBy: { createdAt: 'desc' }, 
          take: 5,
          include: { expediteur: true }
        }
      }
    });

    if (!conversation) {
      console.log(`❌ [IA] Conversation non trouvée pour demande #${demandeId}`);
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    const joursInactivite = Math.floor(heuresInactivite / 24);
    const typeRelance = joursInactivite >= 5 ? 'SECONDE' : 'PREMIERE';
    
    console.log(`📊 [IA] Jours d'inactivité: ${joursInactivite} (${typeRelance} relance)`);

    // Générer le message de relance avec Gemini
    const prompt = `
    Tu es un assistant commercial professionnel pour une plateforme de services.

    CONTEXTE:
    - Prénom du client: ${conversation.demande.client?.prenom || 'Client'}
    - Service demandé: ${conversation.demande.service?.libelle || conversation.demande.metier?.libelle || 'service'}
    - Description initiale: "${conversation.demande.description || 'Non spécifiée'}"
    - Dernier message du client: "${conversation.messages[0]?.contenu || 'Aucun message récent'}"
    - Jours sans réponse: ${joursInactivite}
    - Type de relance: ${typeRelance === 'SECONDE' ? 'SECONDE RELANCE (plus insistante)' : 'PREMIÈRE RELANCE'}

    GÉNÈRE UN MESSAGE DE RELANCE:
    - Maximum 3 phrases
    - Ton professionnel mais chaleureux
    - Rappelle poliment la demande initiale
    - Propose une action claire
    - Inclut une formule de politesse
    ${typeRelance === 'SECONDE' ? '- Sois un peu plus direct car c\'est la seconde relance' : ''}

    Retourne UNIQUEMENT le texte du message, sans guillemets ni formatage.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const messageRelance = result.response.text().trim();

    console.log(`💬 [IA] Message généré: "${messageRelance.substring(0, 50)}..."`);

    // 1️⃣ ENVOYER LE MESSAGE DANS LA CONVERSATION
    const nouveauMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: conversation.demande.artisanId, // L'artisan
        contenu: messageRelance,
        type: "TEXT",
        evenementType: "RELANCE_AUTOMATIQUE",
        createdAt: new Date()
      }
    });

    console.log(`✅ [IA] Message ajouté à la conversation #${conversation.id}`);

    // 2️⃣ ENVOYER UN EMAIL DE NOTIFICATION au client
    if (conversation.demande.client?.email) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6B8E23, #556B2F); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2>📧 Nouveau message de ${conversation.demande.artisan?.prenom || 'votre artisan'}</h2>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Bonjour ${conversation.demande.client?.prenom || 'Client'},</p>
            
            <p>Vous avez reçu un nouveau message concernant votre demande de ${conversation.demande.service?.libelle || conversation.demande.metier?.libelle || 'service'} :</p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #6B8E23; margin: 20px 0; border-radius: 5px;">
              <p style="font-style: italic; color: #333;">"${messageRelance}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/discussion/${demandeId}" 
                 style="background: #6B8E23; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                ➡️ Voir le message et répondre
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
              Cet email est envoyé automatiquement par l'assistant commercial.<br>
              Merci de ne pas répondre à cet email.
            </p>
          </div>
        </div>
      `;

      try {
        await EmailService.sendEmail(
          conversation.demande.client.email,
          `📧 Nouveau message concernant votre demande de ${conversation.demande.service?.libelle || conversation.demande.metier?.libelle || 'service'}`,
          emailContent
        );
        console.log(`✅ [IA] Email envoyé à ${conversation.demande.client.email}`);
      } catch (emailError) {
        console.error(`⚠️ [IA] Erreur envoi email:`, emailError.message);
        // On continue même si l'email échoue
      }
    } else {
      console.log(`⚠️ [IA] Pas d'email client, notification non envoyée`);
    }

    console.log(`🎉 [IA] Relance ${typeRelance} J+${joursInactivite} complétée avec succès`);
    
    res.json({ 
      success: true, 
      message: "Relance envoyée avec succès",
      contenu: messageRelance,
      type: typeRelance,
      jours: joursInactivite
    });

  } catch (error) {
    console.error('❌ [IA] Erreur relance automatique:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 3️⃣ QUALIFICATION AUTOMATIQUE DES DEMANDES
// ============================================

// POST /api/ai/qualifier-demande - Qualifie une nouvelle demande
router.post('/qualifier-demande', authenticateToken, async (req, res) => {
  try {
    const { description, service, localisation, budget } = req.body;

    const prompt = `
    Tu es un assistant commercial qui qualifie les demandes clients.

    DEMANDE À QUALIFIER:
    - Description: "${description}"
    - Service demandé: "${service || 'Non spécifié'}"
    - Localisation: "${localisation || 'Non spécifiée'}"
    - Budget mentionné: "${budget || 'Non spécifié'}"

    ANALYSE:
    1. Résume la demande en 1 phrase claire
    2. Détermine le type: URGENT (mots comme urgent, vite, rapidement), DEVIS (prix, combien, tarif), INFO (renseignement, question), TECHNIQUE (termes spécifiques)
    3. Qualifie le lead: 
       - CHAUD: urgence + budget mentionné + prêt à acheter
       - TIEDE: intérêt clair mais pas d'urgence
       - FROID: simple demande d'information
    4. Estime le budget si possible (à partir du contexte)
    5. Détecte le délai souhaité

    Réponds UNIQUEMENT avec un objet JSON valide (sans texte avant/après):
    {
      "resume": "résumé en 1 phrase",
      "type": "URGENT|DEVIS|INFO|TECHNIQUE",
      "leadScore": "CHAUD|TIEDE|FROID",
      "budgetEstime": null ou nombre en euros,
      "delai": "24h|48h|semaine|mois|null",
      "motsCles": ["mot1", "mot2"],
      "confiance": 0-100,
      "suggestion": "conseil pour l'artisan"
    }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const qualification = JSON.parse(jsonMatch[0]);
      console.log(`✅ [IA] Demande qualifiée: ${qualification.type} / ${qualification.leadScore}`);
      res.json(qualification);
    } else {
      throw new Error("Format de réponse invalide");
    }

  } catch (error) {
    console.error("❌ [IA] Erreur qualification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 4️⃣ GÉNÉRATION DE RÉPONSES TYPES
// ============================================

// GET /api/ai/reponse-type/:demandeId - Génère une réponse type
router.get("/reponse-type/:demandeId", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const { typeReponse } = req.query;

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        service: true,
        metier: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    const contexte = {
      service: demande.service?.libelle || demande.metier?.libelle || 'service',
      description: demande.description,
      statut: demande.statut,
      derniersMessages: demande.conversation?.messages
        ?.map(m => m.contenu)
        .join("\n"),
    };

    const reponseType = await iaAssistantService.genererReponseType(
      contexte,
      typeReponse || "generale"
    );

    res.json({ reponse: reponseType });
  } catch (error) {
    console.error("Erreur génération réponse type:", error);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" });
  }
});

// ============================================
// 5️⃣ ANALYSE DE CONVERSATION
// ============================================

// POST /api/ai/analyser/:conversationId - Analyse une conversation
router.post("/analyser/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            expediteur: {
              select: {
                firstName: true,
                lastName: true,
                userType: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation non trouvée" });
    }

    const messagesFormates = conversation.messages.map(m => ({
      expediteur: m.expediteur.userType === "artisan" ? "Artisan" : "Client",
      contenu: m.contenu,
      date: m.createdAt,
    }));

    // Analyse simple sans stockage
    const prompt = `
    Analyse cette conversation entre un client et un artisan:

    ${JSON.stringify(messagesFormates, null, 2)}

    Donne:
    1. Le sujet principal
    2. Si le client est intéressé (oui/non/peut-être)
    3. Les prochaines étapes suggérées
    4. Un conseil pour l'artisan

    Réponds en JSON.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analyse = JSON.parse(jsonMatch[0]);
      res.json(analyse);
    } else {
      res.json({ analyse: text });
    }

  } catch (error) {
    console.error("Erreur analyse conversation:", error);
    res.status(500).json({ error: "Erreur lors de l'analyse" });
  }
});

// ============================================
// 6️⃣ GÉNÉRATION DE RELANCE SPÉCIFIQUE
// ============================================

// POST /api/ai/generer-relance/:conversationId
router.post("/generer-relance/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { typeRelance } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(conversationId) },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        demande: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation non trouvée" });
    }

    const contexte = {
      service: conversation.demande.service?.libelle || 'service',
      dernierEchange: conversation.messages[0]?.contenu || "Aucun échange récent",
      devisEnvoye: conversation.messages.some(m => m.type === "DEVIS"),
    };

    const prompt = `
    Génère un message de relance ${typeRelance || 'standard'}.

    Contexte:
    - Service: ${contexte.service}
    - Dernier message: "${contexte.dernierEchange}"
    - Devis envoyé: ${contexte.devisEnvoye ? 'Oui' : 'Non'}

    Message de relance professionnel (max 3 phrases):
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const messageRelance = result.response.text().trim();

    res.json({ relance: messageRelance });
  } catch (error) {
    console.error("Erreur génération relance:", error);
    res.status(500).json({ error: "Erreur lors de la génération" });
  }
});

// ============================================
// 7️⃣ TEST DE CONNEXION IA
// ============================================

// GET /api/ai/test - Test simple
router.get('/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Service IA opérationnel',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;