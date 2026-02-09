// routes/profile-optimization.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const profileOptimizationService = require('../services/profileOptimization.service');
const { authenticateToken } = require('../middleware/auth');

// Route pour analyser un profil professionnel (version sans auth pour test)
// routes/profile-optimization.js - MODIFIEZ la route d'analyse
router.get('/:id/analysis', authenticateToken, async (req, res) => {
  try {
    const professionalId = req.params.id;
    
    console.log(`🔍 Analyse du profil pour l'ID: ${professionalId}`);
    
    // Récupérer les données du professionnel
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      include: {
        metiers: {
          include: {
            metier: true
          }
        },
        services: {
          include: {
            service: true
          }
        },
        Review: true,
        ProfessionalSettings: true,
        projets: true
      }
    });

    if (!professional) {
      console.log(`❌ Profil non trouvé pour ID: ${professionalId}`);
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    // Préparer les données pour l'analyse
    const professionalData = {
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
      userType: professional.userType,
      companyName: professional.companyName,
      commercialName: professional.commercialName,
      description: professional.description,
      avatar: professional.avatar,
      phone: professional.phone,
      email: professional.email,
      address: professional.address,
      city: professional.city,
      metiers: professional.metiers.map(m => m.metier?.libelle || 'Inconnu'),
      services: professional.services.map(s => ({
        name: s.service?.libelle || 'Service',
        description: s.service?.description || ''
      })),
      reviews: professional.Review,
      averageRating: professional.Review.length > 0 
        ? professional.Review.reduce((sum, r) => sum + r.rating, 0) / professional.Review.length
        : 0,
      projectPhotos: professional.projets ? professional.projets.filter(p => p.media).length : 0,
      hasSchedule: !!professional.ProfessionalSettings
    };

    // Calculer la complétion du profil
    const completion = this.calculateProfileCompletion(professionalData);
    
    // Générer l'analyse IA
    console.log(`🤖 Appel à Gemini AI...`);
    const analysis = await profileOptimizationService.analyzeProfessionalProfile(professionalData);

    // Combiner les résultats
    const combinedResult = {
      score: analysis.score,
      completion: completion.percentage,
      completionDetails: completion,
      missingElements: analysis.missingElements,
      blockingFactors: analysis.blockingFactors,
      seoRecommendations: analysis.seoRecommendations,
      conversionStats: analysis.conversionStats,
      timestamp: analysis.timestamp,
      isAIAnalysis: analysis.isAIAnalysis,
      summary: {
        totalScore: Math.round((analysis.score + completion.percentage) / 2),
        profileStatus: completion.percentage >= 80 ? 'Excellent' : completion.percentage >= 60 ? 'Bon' : 'À améliorer',
        nextSteps: completion.recommendations.slice(0, 3)
      }
    };

    console.log(`✅ Analyse générée - Score IA: ${analysis.score}% - Complétion: ${completion.percentage}%`);

    res.json({
      success: true,
      analysis: combinedResult
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse du profil',
      error: error.message
    });
  }
});

// Route de test simple sans DB
router.get('/test/mock-analysis', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Route de test mockée appelée');
    
    // Données mockées pour test
    const mockProfessionalData = {
      id: 'test-id-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      userType: 'professional',
      companyName: 'Plomberie Dupont',
      description: 'Plombier depuis 5 ans. Spécialiste en dépannage urgence.',
      avatar: null,
      phone: null,
      email: 'jean@example.com',
      address: null,
      city: 'Paris',
      metiers: ['Plombier'],
      services: [
        { name: 'Dépannage plomberie', description: 'Réparation urgente' }
      ],
      reviews: [],
      averageRating: 0,
      projectPhotos: 0,
      hasSchedule: false
    };

    const analysis = await profileOptimizationService.analyzeProfessionalProfile(mockProfessionalData);

    res.json({
      success: true,
      analysis,
      note: "Ceci est une réponse mockée pour test"
    });

  } catch (error) {
    console.error('Erreur test mock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur test',
      error: error.message
    });
  }
});

// Route pour envoyer une notification d'optimisation (version simplifiée)
router.post('/:id/notify', authenticateToken, async (req, res) => {
  try {
    const professionalId = req.params.id;
    const userId = req.body.userId || 'system'; // Pour test
    
    console.log(`📨 Envoi notification pour ID: ${professionalId}`);

    // Récupérer les données du professionnel
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      include: {
        metiers: { include: { metier: true } },
        services: { include: { service: true } },
        Review: true,
        projets: true
      }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professionnel non trouvé'
      });
    }

    const professionalData = {
      firstName: professional.firstName,
      lastName: professional.lastName,
      userType: professional.userType,
      companyName: professional.companyName,
      description: professional.description,
      avatar: professional.avatar,
      phone: professional.phone,
      address: professional.address,
      city: professional.city,
      metiers: professional.metiers.map(m => m.metier?.libelle || ''),
      services: professional.services,
      reviews: professional.Review,
      projectPhotos: professional.projets ? professional.projets.filter(p => p.media).length : 0
    };

    const analysis = await profileOptimizationService.analyzeProfessionalProfile(professionalData);

    // Créer la notification pour le professionnel
    const notification = await prisma.notification.create({
      data: {
        type: 'profile_optimization',
        title: '💡 Recommandations pour améliorer votre profil',
        message: `Votre profil est optimisé à ${analysis.score}%. Voici nos recommandations :`,
        relatedEntity: 'user',
        relatedEntityId: professionalId,
        userId: professionalId,
        read: false,
        metadata: JSON.stringify({
          analysis,
          timestamp: new Date().toISOString(),
          generatedBy: userId
        })
      }
    });

    // Envoyer en temps réel si Socket.io disponible
    if (req.io) {
      req.io.to(`user:${professionalId}`).emit('new-notification', {
        type: 'profile_optimization',
        title: '💡 Recommandations pour améliorer votre profil',
        message: `Votre profil est optimisé à ${analysis.score}%. Cliquez pour voir les détails.`,
        data: {
          analysis,
          notificationId: notification.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Notification envoyée avec succès',
      notificationId: notification.id,
      analysis
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification',
      error: error.message
    });
  }
});

// Route batch simplifiée pour test
router.post('/batch-analyze/test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Route batch test appelée');
    
    // Simuler quelques profils
    const mockResults = [
      {
        userId: 'test-1',
        status: 'notified',
        score: 45,
        notificationId: 9991
      },
      {
        userId: 'test-2',
        status: 'good_score',
        score: 85,
        reason: 'Score supérieur à 80%'
      }
    ];

    res.json({
      success: true,
      message: 'Analyse par lots test terminée',
      results: mockResults,
      total: 2,
      processed: 2
    });

  } catch (error) {
    console.error('Erreur batch test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur test batch',
      error: error.message
    });
  }
});

module.exports = router;