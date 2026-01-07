const express = require('express');
const router = express.Router();
const candidaturesController = require('../controllers/candidaturesController');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Routes protégées
router.post('/', authenticateToken, candidaturesController.createCandidature);
router.get('/', authenticateToken, candidaturesController.getUserCandidatures);

// Middleware de debug temporaire
const debugAuth = async (req, res, next) => {
  console.log('\n🔐 ========== DEBUG AUTH ==========');
  console.log('📨 Authorization header:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🎫 Token brut:', token);
  
  if (!token) {
    console.log('❌ Pas de token');
    return res.status(401).json({ 
      success: false,
      error: 'Token manquant' 
    });
  }
  
  // Essayez de comprendre le format du token
  if (token.startsWith('real-jwt-token-')) {
    console.log('✅ Format reconnu: real-jwt-token-');
    const userId = token.replace('real-jwt-token-', '');
    console.log('👤 User ID extrait:', userId);
  } else if (token.includes('.')) {
    console.log('⚠️ Format JWT détecté');
  } else {
    console.log('⚠️ Format inconnu');
  }
  
  next();
};

// ✅ ROUTE ULTRA SIMPLIFIÉE
router.get('/formations/:formationId', authenticateToken, async (req, res) => {
  console.log('\n🔵 ========== ROUTE SIMPLIFIÉE CANDIDATURES ==========');
  
  try {
    console.log('👤 User ID from auth:', req.user.id);
    console.log('👤 User role:', req.user.role);
    console.log('📋 Formation ID:', req.params.formationId);
    
    // Vérification basique du rôle
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      console.log('❌ Rôle non autorisé:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    const formationId = parseInt(req.params.formationId);
    
    if (isNaN(formationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de formation invalide'
      });
    }
    
    console.log('🔍 Vérification formation...');
    
    // Vérifier que la formation existe
    const formation = await prisma.formation.findUnique({
      where: { id: formationId }
    });
    
    console.log('📊 Formation trouvée:', formation ? 'OUI' : 'NON');
    
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }
    
    // Vérifier que l'utilisateur est propriétaire (sauf admin)
    if (req.user.role === 'professional' && formation.proId !== req.user.id) {
      console.log('❌ Formation appartient à un autre user');
      console.log('Formation proId:', formation.proId);
      console.log('User ID:', req.user.id);
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas propriétaire de cette formation'
      });
    }
    
    console.log('🔍 Recherche candidatures...');
    
    // Recherche SIMPLE des candidatures
    let candidatures = [];
    
    try {
      // Essai 1: Recherche basique
      candidatures = await prisma.candidature.findMany({
        where: {
          formationId: formationId
        },
        take: 50,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`✅ ${candidatures.length} candidatures trouvées`);
      
    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError.message);
      
      // Données mockées en cas d'erreur
      candidatures = [
        {
          id: 999,
          nomCandidat: "Test Candidat",
          emailCandidat: "test@example.com",
          messageMotivation: "Test de motivation",
          statut: "en_attente",
          appliedAt: new Date(),
          createdAt: new Date()
        }
      ];
      
      console.log('⚠️ Utilisation données mockées');
    }
    
    console.log('🟢 ========== FIN ROUTE ==========\n');
    
    res.json({
      success: true,
      data: candidatures,
      count: candidatures.length
    });
    
  } catch (error) {
    console.error('\n🔴 ========== ERREUR FATALE ==========');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
    console.error('🟢 ========== FIN ERREUR ==========\n');
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Route pour mettre à jour le statut d'une candidature
router.patch('/:id/status', authenticateToken, async (req, res) => {
  console.log('\n🔄 ========== MISE À JOUR STATUT ==========');
  console.log('👤 User:', req.user);
  console.log('📋 Candidature ID:', req.params.id);
  console.log('📦 Body:', req.body);
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Vérifier le rôle
    if (userRole !== 'professional' && userRole !== 'admin') {
      console.log('❌ Rôle non autorisé:', userRole);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    // Statuts valides - CORRIGEZ ICI
    const validStatuses = ['en_attente', 'acceptée', 'refusée', 'annulée', 'pending', 'accepted', 'rejected'];
    
    if (!status || !validStatuses.includes(status)) {
      console.log('❌ Statut invalide:', status);
      console.log('✅ Statuts valides:', validStatuses);
      return res.status(400).json({
        success: false,
        error: 'Statut invalide',
        validStatuses: validStatuses
      });
    }

    // Convertir l'ID
    const candidatureId = parseInt(id);
    if (isNaN(candidatureId)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }

    // Vérifier que la candidature existe et que l'utilisateur a le droit de la modifier
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: {
        formation: true
      }
    });

    if (!candidature) {
      console.log('❌ Candidature non trouvée');
      return res.status(404).json({
        success: false,
        error: 'Candidature non trouvée'
      });
    }

    // Vérifier que l'utilisateur est propriétaire de la formation
    if (candidature.formation && candidature.formation.proId !== req.user.id && userRole !== 'admin') {
      console.log('❌ Pas propriétaire de la formation');
      console.log('Formation proId:', candidature.formation.proId);
      console.log('User ID:', req.user.id);
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à modifier cette candidature'
      });
    }

    // Normaliser le statut si nécessaire
    let normalizedStatus = status;
    if (status === 'pending') normalizedStatus = 'en_attente';
    if (status === 'accepted') normalizedStatus = 'acceptée';
    if (status === 'rejected') normalizedStatus = 'refusée';

    console.log('📝 Mise à jour du statut:', {
      ancien: candidature.statut,
      nouveau: normalizedStatus
    });

    // Mettre à jour la candidature
    const updatedCandidature = await prisma.candidature.update({
      where: { id: candidatureId },
      data: { statut: normalizedStatus }
    });

    console.log('✅ Candidature mise à jour:', updatedCandidature.id);

    res.status(200).json({
      success: true,
      data: updatedCandidature,
      message: 'Statut mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Candidature non trouvée'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour'
    });
  }
});

// ✅ Route pour supprimer une candidature
router.delete('/:id', authenticateToken, async (req, res) => {
  console.log('\n🗑️ ========== SUPPRESSION CANDIDATURE ==========');
  console.log('👤 User:', req.user);
  console.log('📋 Candidature ID:', req.params.id);
  
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Vérifier le rôle
    if (userRole !== 'professional' && userRole !== 'admin') {
      console.log('❌ Rôle non autorisé:', userRole);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    // Convertir l'ID
    const candidatureId = parseInt(id);
    if (isNaN(candidatureId)) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide'
      });
    }

    // Vérifier que la candidature existe et que l'utilisateur a le droit de la supprimer
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: {
        formation: true
      }
    });

    if (!candidature) {
      console.log('❌ Candidature non trouvée');
      return res.status(404).json({
        success: false,
        error: 'Candidature non trouvée'
      });
    }

    // Vérifier que l'utilisateur est propriétaire de la formation
    if (candidature.formation && candidature.formation.proId !== req.user.id && userRole !== 'admin') {
      console.log('❌ Pas propriétaire de la formation');
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à supprimer cette candidature'
      });
    }

    // Supprimer la candidature
    await prisma.candidature.delete({
      where: { id: candidatureId }
    });

    console.log('✅ Candidature supprimée:', candidatureId);

    // Mettre à jour le compteur de candidatures si c'est une formation
    if (candidature.formationId) {
      try {
        await prisma.formation.update({
          where: { id: candidature.formationId },
          data: { 
            applications: { decrement: 1 },
            currentParticipants: { decrement: 1 }
          }
        });
        console.log('✅ Compteur mis à jour');
      } catch (counterError) {
        console.warn('⚠️ Erreur mise à jour compteur:', counterError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Candidature supprimée avec succès',
      deletedId: candidatureId
    });

  } catch (error) {
    console.error('❌ Erreur suppression candidature:', error);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Candidature non trouvée'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// routes/candidatures.js - API corrigée
router.get('/emplois/:emploiId', authenticateToken, async (req, res) => {
  try {
    const { emploiId } = req.params;
    const userId = req.user.id;
    
    console.log(`🔍 DEBUG: Récupération candidatures pour emploi ID: ${emploiId}`);
    console.log(`🔍 DEBUG: User ID: ${userId}`);
    
    // Vérifier que l'emploi existe et appartient à l'utilisateur
    const emploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(emploiId),
        proId: userId
      }
    });
    
    console.log(`🔍 DEBUG: Emploi trouvé:`, emploi ? 'OUI' : 'NON');
    
    if (!emploi) {
      return res.status(404).json({
        success: false,
        error: 'Offre non trouvée ou non autorisée'
      });
    }
    
    // 🔍 DEBUG: Vérifiez la requête Prisma
    const whereClause = {
      emploiId: parseInt(emploiId),
      offreType: 'EMPLOI' // Assurez-vous que c'est bien 'EMPLOI' et non 'EMPLOI ' (avec espace)
    };
    
    console.log(`🔍 DEBUG: Clause WHERE Prisma:`, whereClause);
    
    // Récupérer les candidatures
    const candidatures = await prisma.candidature.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🔍 DEBUG: Résultat Prisma:`, {
      count: candidatures.length,
      firstCandidature: candidatures[0],
      allCandidatures: candidatures
    });
    
    res.json({
      success: true,
      data: candidatures,
      count: candidatures.length,
      debug: {
        emploiId: parseInt(emploiId),
        userId,
        whereClause,
        prismaResultCount: candidatures.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération candidatures:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des candidatures',
      debug: error.message
    });
  }
});



// Route de diagnostic
router.get('/diagnostic/:emploiId', authenticateToken, async (req, res) => {
  console.log('\n🩺 ========== DIAGNOSTIC CANDIDATURES ==========');
  
  try {
    const emploiId = parseInt(req.params.emploiId);
    
    // 1. Vérifier l'emploi
    const emploi = await prisma.emploi.findUnique({
      where: { id: emploiId }
    });
    
    // 2. Compter toutes les candidatures
    const totalCandidatures = await prisma.candidature.count();
    
    // 3. Voir la structure des candidatures
    const sampleCandidatures = await prisma.candidature.findMany({
      take: 5,
      select: {
        id: true,
        emploiId: true,
        formationId: true,
        offreType: true,
        nomCandidat: true
      }
    });
    
    // 4. Chercher spécifiquement pour cet emploi
    const candidaturesPourEmploi = await prisma.candidature.findMany({
      where: { emploiId: emploiId }
    });
    
    console.log('📊 Résultats du diagnostic:');
    console.log('- Emploi trouvé:', emploi ? 'OUI' : 'NON');
    console.log('- Total candidatures DB:', totalCandidatures);
    console.log('- Candidatures pour cet emploi:', candidaturesPourEmploi.length);
    console.log('- Exemple structure:', sampleCandidatures);
    
    res.json({
      success: true,
      diagnostic: {
        emploi: emploi ? {
          id: emploi.id,
          titre: emploi.titre,
          proId: emploi.proId
        } : null,
        stats: {
          totalCandidatures,
          pourCetEmploi: candidaturesPourEmploi.length
        },
        structure: sampleCandidatures,
        candidatures: candidaturesPourEmploi
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Route pour récupérer les candidatures d'alternance/stage
router.get('/alternances/:offreId', authenticateToken, async (req, res) => {
  console.log('\n🔵 ========== GET CANDIDATURES ALTERNANCE ==========');
  console.log('👤 User ID:', req.user.id);
  console.log('👤 User Role:', req.user.role);
  console.log('📋 Offre ID:', req.params.offreId);
  
  try {
    // Vérifier le rôle
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      console.log('❌ Rôle non autorisé:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    const offreId = parseInt(req.params.offreId);
    
    if (isNaN(offreId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }
    
    console.log('🔍 Vérification offre...');
    
    // Vérifier que l'offre existe
    // Note: Vous devez ajuster le modèle selon votre schéma de base de données
    // Si vous avez un modèle "alternance" ou si c'est dans le modèle "emploi"
    
    // Option 1: Si vous avez un modèle spécifique pour les alternances
    try {
      const offre = await prisma.alternance.findUnique({
        where: { id: offreId }
      });
      
      console.log('📊 Offre alternance trouvée:', offre ? 'OUI' : 'NON');
      
      if (!offre) {
        // Essayer de chercher dans les emplois si c'est là que sont stockées les alternances
        const emploiAsAlternance = await prisma.emploi.findUnique({
          where: { id: offreId }
        });
        
        if (!emploiAsAlternance) {
          return res.status(404).json({
            success: false,
            error: 'Offre d\'alternance non trouvée'
          });
        }
        
        // Vérifier que c'est bien une alternance (selon votre logique métier)
        console.log('📋 Type d\'offre trouvée:', emploiAsAlternance.type);
      }
    } catch (error) {
      console.log('⚠️ Modèle Alternance non trouvé, vérification dans emploi...');
      
      // Option 2: Vérifier dans la table emploi si c'est là que sont stockées les alternances
      const emploi = await prisma.emploi.findUnique({
        where: { id: offreId }
      });
      
      if (!emploi) {
        return res.status(404).json({
          success: false,
          error: 'Offre d\'alternance/stage non trouvée'
        });
      }
      
      console.log('✅ Offre trouvée dans emploi:', emploi.titre);
    }
    
    // Vérifier que l'utilisateur est propriétaire (sauf admin)
    // Note: Adaptez selon votre modèle de données
    // Pour l'exemple, je vais vérifier dans la table emploi
    const emploi = await prisma.emploi.findUnique({
      where: { id: offreId }
    });
    
    if (emploi && emploi.proId !== req.user.id && req.user.role !== 'admin') {
      console.log('❌ Offre appartient à un autre user');
      console.log('Offre proId:', emploi.proId);
      console.log('User ID:', req.user.id);
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas propriétaire de cette offre'
      });
    }
    
    console.log('🔍 Recherche candidatures...');
    
    // Recherche des candidatures pour cette offre
    // Stratégie flexible:
    // 1. D'abord chercher avec offreType = 'ALTERNANCE'
    // 2. Sinon chercher toutes les candidatures pour cet ID d'offre
    
    let candidatures = [];
    
    try {
      // Essai 1: Chercher avec filtre offreType
      candidatures = await prisma.candidature.findMany({
        where: {
          emploiId: offreId,
          offreType: 'ALTERNANCE' // ou 'STAGE' selon votre schéma
        },
        include: {
          // Inclure des informations supplémentaires si nécessaire
          user: {
            select: {
              nom: true,
              prenom: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`✅ ${candidatures.length} candidatures avec filtre ALTERNANCE`);
      
      // Si aucune avec filtre, essayer sans filtre
      if (candidatures.length === 0) {
        console.log('🔍 Essai sans filtre offreType...');
        candidatures = await prisma.candidature.findMany({
          where: {
            emploiId: offreId
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        console.log(`✅ ${candidatures.length} candidatures sans filtre`);
      }
      
    } catch (dbError) {
      console.error('❌ Erreur recherche candidatures:', dbError.message);
      
      // En dernier recours, chercher toutes les candidatures pour cet emploiId
      candidatures = await prisma.candidature.findMany({
        where: {
          emploiId: offreId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`✅ ${candidatures.length} candidatures récupérées (fallback)`);
    }
    
    // Formater les résultats pour inclure des informations utiles
    const formattedCandidatures = candidatures.map(candidature => {
      // Essayer de récupérer le nom/prénom de l'utilisateur si disponible
      let nomCandidat = candidature.nomCandidat;
      let emailCandidat = candidature.emailCandidat;
      
      // Si l'utilisateur est connecté, utiliser ses infos
      if (candidature.user) {
        nomCandidat = `${candidature.user.prenom || ''} ${candidature.user.nom || ''}`.trim();
        if (candidature.user.email && !emailCandidat) {
          emailCandidat = candidature.user.email;
        }
      }
      
      return {
        id: candidature.id,
        nomCandidat: nomCandidat || 'Candidat inconnu',
        emailCandidat: emailCandidat || '',
        telCandidat: candidature.telCandidat || '',
        messageMotivation: candidature.messageMotivation || '',
        cvUrl: candidature.cvUrl || null,
        lettreMotivationUrl: candidature.lettreMotivationUrl || null,
        statut: candidature.statut || 'en_attente',
        appliedAt: candidature.appliedAt || candidature.createdAt,
        createdAt: candidature.createdAt,
        updatedAt: candidature.updatedAt,
        // Informations supplémentaires
        niveauEtude: candidature.niveauEtude || '',
        ecole: candidature.ecole || '',
        offreType: candidature.offreType || 'ALTERNANCE',
        emploiId: candidature.emploiId,
        formationId: candidature.formationId
      };
    });
    
    console.log('📊 Candidatures formatées:', formattedCandidatures.length);
    console.log('🟢 ========== FIN ROUTE ==========\n');
    
    res.json({
      success: true,
      data: formattedCandidatures,
      count: formattedCandidatures.length,
      note: formattedCandidatures.length === 0 ? 'Aucune candidature trouvée' : undefined
    });
    
  } catch (error) {
    console.error('\n🔴 ========== ERREUR FATALE ==========');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des candidatures',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Route générique pour les stages (si séparé des alternances)
router.get('/stages/:offreId', authenticateToken, async (req, res) => {
  console.log('\n🔵 ========== GET CANDIDATURES STAGE ==========');
  console.log('👤 User ID:', req.user.id);
  console.log('👤 User Role:', req.user.role);
  console.log('📋 Offre ID:', req.params.offreId);
  
  try {
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    const offreId = parseInt(req.params.offreId);
    
    if (isNaN(offreId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }
    
    console.log('🔍 Recherche candidatures stage...');
    
    // Chercher les candidatures avec offreType = 'STAGE'
    const candidatures = await prisma.candidature.findMany({
      where: {
        emploiId: offreId,
        offreType: 'STAGE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ ${candidatures.length} candidatures stage trouvées`);
    
    res.json({
      success: true,
      data: candidatures,
      count: candidatures.length,
      note: candidatures.length === 0 ? 'Aucune candidature trouvée' : undefined
    });
    
  } catch (error) {
    console.error('❌ Erreur candidatures stage:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ✅ Route pour combiner alternances et stages (si besoin)
router.get('/alternances-stages/:offreId', authenticateToken, async (req, res) => {
  console.log('\n🔵 ========== GET CANDIDATURES ALTERNANCE + STAGE ==========');
  
  try {
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    const offreId = parseInt(req.params.offreId);
    
    if (isNaN(offreId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }
    
    // Chercher toutes les candidatures pour cette offre, peu importe le type
    const candidatures = await prisma.candidature.findMany({
      where: {
        emploiId: offreId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ ${candidatures.length} candidatures trouvées pour offre ${offreId}`);
    
    // Filtrer par type si besoin dans l'interface
    const candidaturesAlternance = candidatures.filter(c => 
      c.offreType === 'ALTERNANCE' || !c.offreType
    );
    const candidaturesStage = candidatures.filter(c => 
      c.offreType === 'STAGE'
    );
    
    res.json({
      success: true,
      data: candidatures,
      count: candidatures.length,
      breakdown: {
        alternance: candidaturesAlternance.length,
        stage: candidaturesStage.length,
        autres: candidatures.length - (candidaturesAlternance.length + candidaturesStage.length)
      },
      note: candidatures.length === 0 ? 'Aucune candidature trouvée' : undefined
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ✅ Route pour créer une route spécifique à votre modèle Alternance
// (À utiliser si vous avez un modèle Alternance dans Prisma)
router.get('/model-alternance/:alternanceId', authenticateToken, async (req, res) => {
  console.log('\n🔵 ========== GET CANDIDATURES MODÈLE ALTERNANCE ==========');
  
  try {
    if (req.user.role !== 'professional' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    const alternanceId = parseInt(req.params.alternanceId);
    
    if (isNaN(alternanceId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'alternance invalide'
      });
    }
    
    // Vérifier que l'alternance existe
    const alternance = await prisma.alternance.findUnique({
      where: { id: alternanceId }
    });
    
    if (!alternance) {
      return res.status(404).json({
        success: false,
        error: 'Offre d\'alternance non trouvée'
      });
    }
    
    // Vérifier les droits de propriété
    if (alternance.proId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas propriétaire de cette offre'
      });
    }
    
    // Chercher les candidatures pour cette alternance
    // Note: Vous devez ajuster selon votre schéma de relations
    const candidatures = await prisma.candidature.findMany({
      where: {
        // Si vous avez un champ alternanceId dans le modèle Candidature
        alternanceId: alternanceId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ ${candidatures.length} candidatures trouvées pour alternance`);
    
    res.json({
      success: true,
      data: candidatures,
      count: candidatures.length,
      offre: {
        id: alternance.id,
        titre: alternance.title || alternance.titre,
        type: alternance.type
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    
    // Si le modèle Alternance n'existe pas, retourner un message clair
    if (error.message.includes("prisma.alternance") && error.message.includes("is not defined")) {
      return res.status(501).json({
        success: false,
        error: 'Modèle Alternance non configuré dans Prisma',
        suggestion: 'Utilisez la route /alternances/:offreId qui utilise le modèle Emploi'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Route de test publique
router.post('/test', (req, res) => {
  res.json({ success: true, message: 'Test OK' });
});

// Route ultra simple pour tester
router.get('/test-simple/:formationId', authenticateToken, async (req, res) => {
  console.log('\n🧪 ========== TEST SIMPLE ==========');
  console.log('Token reçu:', req.headers.authorization ? 'OUI' : 'NON');
  console.log('User:', JSON.stringify(req.user, null, 2));
  console.log('Formation ID param:', req.params.formationId);
  
  try {
    // 1. Test de base sans Prisma
    res.json({
      success: true,
      message: 'Test simple réussi',
      data: [
        {
          id: 1001,
          nomCandidat: "Test Candidat 1",
          emailCandidat: "test1@example.com",
          statut: "en_attente",
          appliedAt: new Date()
        },
        {
          id: 1002,
          nomCandidat: "Test Candidat 2",
          emailCandidat: "test2@example.com",
          statut: "acceptée",
          appliedAt: new Date()
        }
      ]
    });
  } catch (error) {
    console.error('Erreur test simple:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;