// backend/middleware/autoQualificationMiddleware.js - VERSION PLUS PERMISSIVE
const aiAssistantService = require('../services/aiAssistantService');
const { prisma } = require("../lib/db");

const autoQualificationMiddleware = (req, res, next) => {
  console.log("🔍 [MIDDLEWARE] Requête reçue:", req.method, req.originalUrl);
  
  const originalJson = res.json;
  
  res.json = async function(data) {
    console.log("📦 [MIDDLEWARE] Réponse interceptée pour:", req.method, req.originalUrl);
    
    // Exécuter la réponse originale
    const result = await originalJson.call(this, data);
    
    // Vérification plus large
    const estCreationDemande = req.method === 'POST' && 
                               (req.originalUrl.includes('/demandes/immobilier') || 
                                req.path.includes('/demandes/immobilier')) && 
                               data?.demande?.id;
    
    if (estCreationDemande) {
      const demandeId = data.demande.id;
      console.log(`✅ [MIDDLEWARE] 🎯 QUALIFICATION DÉCLENCHÉE pour demande #${demandeId}`);
      
      setTimeout(async () => {
        try {
          console.log(`🤖 [MIDDLEWARE] Début qualification #${demandeId}`);
          
          const demande = await prisma.demande.findUnique({
            where: { id: demandeId },
            include: { property: true }
          });

          if (!demande) {
            console.log(`❌ [MIDDLEWARE] Demande #${demandeId} non trouvée`);
            return;
          }

          const qualification = await aiAssistantService.qualifierDemande({
            description: demande.description,
            contactPrenom: demande.contactPrenom,
            contactNom: demande.contactNom,
            dateSouhaitee: demande.dateSouhaitee,
            heureSouhaitee: demande.heureSouhaitee,
            property: demande.property
          });

          await prisma.demande.update({
            where: { id: demandeId },
            data: {
              aiSummary: qualification.aiSummary,
              aiClass: qualification.aiClass,
              aiScore: qualification.aiScore,
              aiBudget: qualification.aiBudget,
              aiInterventionTime: qualification.aiInterventionTime,
              aiProcessedAt: qualification.aiProcessedAt,
              aiConfidence: qualification.aiConfidence
            }
          });

          console.log(`✅ [MIDDLEWARE] Demande #${demandeId} qualifiée: ${qualification.aiClass} / ${qualification.aiScore}`);
          
        } catch (error) {
          console.error(`❌ [MIDDLEWARE] Erreur:`, error.message);
        }
      }, 2000);
    }
    
    return result;
  };
  
  next();
};

module.exports = autoQualificationMiddleware;