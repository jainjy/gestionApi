// scripts/qualifier-toutes-demandes.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const aiAssistantService = require('../services/aiAssistantService');

const prisma = new PrismaClient();

async function qualifierToutesLesDemandes() {
  console.log("🚀 Début de la qualification de toutes les demandes...");
  
  try {
    const demandes = await prisma.demande.findMany({
      include: { 
        property: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 ${demandes.length} demandes trouvées`);

    let successCount = 0;
    let errorCount = 0;

    for (const demande of demandes) {
      try {
        console.log(`\n🔍 Qualification demande #${demande.id}...`);
        
        const qualification = await aiAssistantService.qualifierDemande({
          description: demande.description,
          contactPrenom: demande.contactPrenom || demande.createdBy?.firstName,
          contactNom: demande.contactNom || demande.createdBy?.lastName,
          dateSouhaitee: demande.dateSouhaitee,
          heureSouhaitee: demande.heureSouhaitee,
          property: demande.property
        });

        // Mise à jour SANS aiSuggestion
        await prisma.demande.update({
          where: { id: demande.id },
          data: {
            aiSummary: qualification.aiSummary,
            aiClass: qualification.aiClass,
            aiScore: qualification.aiScore,
            aiBudget: qualification.aiBudget,
            aiInterventionTime: qualification.aiInterventionTime,
            // aiSuggestion: qualification.aiSuggestion, // COMMENTÉ CAR N'EXISTE PAS
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

      // Pause de 15 secondes pour respecter le quota Gemini (5 req/min)
      console.log("⏳ Pause de 15 secondes pour respecter le quota...");
      await new Promise(resolve => setTimeout(resolve, 15000));
    }

    console.log(`\n🎉 Terminé ! ${successCount} succès, ${errorCount} erreurs`);

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
}

qualifierToutesLesDemandes();