// backend/routes/aiQualification.js - VERSION FINALE
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const aiAssistantService = require("../services/aiAssistantService");
const { prisma } = require("../lib/db");

// GET /api/ai/qualification/:demandeId - Version avec fallback
router.get("/qualification/:demandeId", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const id = parseInt(demandeId);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de demande invalide" });
    }

    // Récupérer la demande sans spécifier les champs (pour éviter les erreurs)
    const demande = await prisma.demande.findUnique({
      where: { id: id }
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    // Vérifier si les champs IA existent dans l'objet retourné
    const hasAI = demande.aiSummary !== null || 
                  demande.aiClass !== null || 
                  demande.aiScore !== null;

    if (!hasAI) {
      return res.status(404).json({ 
        error: "NON_QUALIFIEE",
        message: "Cette demande n'a pas encore été analysée par l'IA"
      });
    }

    // Retourner les données
    res.json({
      resume: demande.aiSummary || "Analyse en cours",
      type: demande.aiClass?.toUpperCase() || "INFO",
      leadScore: demande.aiScore?.toUpperCase() || "TIEDE",
      budgetEstime: demande.aiBudget,
      delai: demande.aiInterventionTime,
      suggestion: demande.aiSuggestion,
      dateTraitement: demande.aiProcessedAt,
      confiance: demande.aiConfidence || 0.5
    });

  } catch (error) {
    console.error("❌ Erreur récupération qualification:", error);
    
    // Envoyer une réponse plus informative
    res.status(500).json({ 
      error: "Erreur serveur",
      message: error.message,
      // En développement, on peut voir la stack
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/ai/qualifier/:demandeId - Version robuste
router.post("/qualifier/:demandeId", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const id = parseInt(demandeId);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID de demande invalide" });
    }

    console.log(`🔍 Qualification demande #${id}`);

    const demande = await prisma.demande.findUnique({
      where: { id: id },
      include: { 
        property: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    // Qualifier avec l'IA
    const qualification = await aiAssistantService.qualifierDemande({
      description: demande.description,
      contactPrenom: demande.contactPrenom || demande.createdBy?.firstName,
      contactNom: demande.contactNom || demande.createdBy?.lastName,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      property: demande.property
    });

    console.log("🤖 Résultat IA:", qualification);

    // Mise à jour - on essaie d'utiliser Prisma, si ça échoue on renvoie quand même
    try {
      const updatedDemande = await prisma.demande.update({
        where: { id: id },
        data: {
          aiSummary: qualification.aiSummary,
          aiClass: qualification.aiClass,
          aiScore: qualification.aiScore,
          aiBudget: qualification.aiBudget,
          aiInterventionTime: qualification.aiInterventionTime,
          aiSuggestion: qualification.aiSuggestion,
          aiProcessedAt: qualification.aiProcessedAt,
          aiConfidence: qualification.aiConfidence
        }
      });

      console.log(`✅ Demande #${id} qualifiée avec succès`);

      res.json({
        success: true,
        message: "Demande qualifiée avec succès",
        qualification: {
          resume: updatedDemande.aiSummary,
          type: updatedDemande.aiClass?.toUpperCase(),
          leadScore: updatedDemande.aiScore?.toUpperCase(),
          budgetEstime: updatedDemande.aiBudget,
          delai: updatedDemande.aiInterventionTime,
          suggestion: updatedDemande.aiSuggestion,
          dateTraitement: updatedDemande.aiProcessedAt,
          confiance: updatedDemande.aiConfidence
        }
      });

    } catch (dbError) {
      console.error("⚠️ Erreur mise à jour DB (mais qualification réussie):", dbError.message);
      
      // Renvoyer quand même le résultat de l'IA
      res.json({
        success: true,
        message: "Demande qualifiée (mais non sauvegardée en DB)",
        qualification: {
          resume: qualification.aiSummary,
          type: qualification.aiClass?.toUpperCase(),
          leadScore: qualification.aiScore?.toUpperCase(),
          budgetEstime: qualification.aiBudget,
          delai: qualification.aiInterventionTime,
          suggestion: qualification.aiSuggestion,
          dateTraitement: qualification.aiProcessedAt,
          confiance: qualification.aiConfidence
        }
      });
    }

  } catch (error) {
    console.error("❌ Erreur qualification:", error);
    res.status(500).json({ 
      error: "Erreur lors de la qualification",
      details: error.message 
    });
  }
});

// GET /api/ai/test - Test simple
router.get('/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Service IA opérationnel',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;