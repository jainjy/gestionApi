// scripts/qualifier-demandes-existantes.js
const { PrismaClient } = require('@prisma/client');
const aiAssistantService = require('../services/aiAssistantService');
require('dotenv').config();

const prisma = new PrismaClient();

const qualifierToutesLesDemandes = async () => {
  console.log("🚀 Début de la qualification des demandes existantes...");
  
  try {
    // Récupérer toutes les demandes non qualifiées
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [
          { aiProcessedAt: null },
          { aiClass: null }
        ]
      },
      include: { property: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 ${demandes.length} demandes à qualifier trouvées`);

    let successCount = 0;
    let errorCount = 0;

    for (const demande of demandes) {
      try {
        console.log(`\n🔍 Qualification demande #${demande.id}...`);
        
        const qualification = await aiAssistantService.qualifierDemande({
          description: demande.description,
          contactPrenom: demande.contactPrenom,
          contactNom: demande.contactNom,
          dateSouhaitee: demande.dateSouhaitee,
          heureSouhaitee: demande.heureSouhaitee,
          property: demande.property
        });

        await prisma.demande.update({
          where: { id: demande.id },
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

        console.log(`✅ Demande #${demande.id} qualifiée: ${qualification.aiClass} / ${qualification.aiScore}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Erreur pour demande #${demande.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Terminé ! ${successCount} succès, ${errorCount} erreurs`);

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
};

// Exécuter
qualifierToutesLesDemandes();