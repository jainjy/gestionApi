// routes/alternance.js - VERSION COMPLÈTEMENT CORRIGÉE
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ✅ GET statistiques publiques alternance/stage
router.get('/public/stats', async (req, res) => {
  try {
    console.log('📡 GET /alternance/public/stats - Statistiques publiques');

    // Compter les offres actives
    const totalActive = await prisma.alternanceStage.count({
      where: { status: 'active' }
    });

    // Compter les offres urgentes
    const totalUrgent = await prisma.alternanceStage.count({
      where: { 
        status: 'active',
        urgent: true
      }
    });

    // Compter par type
    const alternanceCount = await prisma.alternanceStage.count({
      where: { 
        status: 'active',
        type: 'Alternance (Contrat pro)'
      }
    });

    const stageCount = await prisma.alternanceStage.count({
      where: { 
        status: 'active',
        type: 'Stage conventionné'
      }
    });

    // Nombre d'offres publiées cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = await prisma.alternanceStage.count({
      where: {
        status: 'active',
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Répartition par niveau d'étude
    const emploisByNiveau = await prisma.alternanceStage.groupBy({
      by: ['niveauEtude'],
      where: { status: 'active' },
      _count: true
    });

    const niveauxMap = {};
    emploisByNiveau.forEach(item => {
      if (item.niveauEtude) {
        niveauxMap[item.niveauEtude] = item._count;
      }
    });

    const statsData = {
      total: totalActive || 0,
      urgent: totalUrgent || 0,
      alternance: alternanceCount || 0,
      stage: stageCount || 0,
      nouvellesSemaine: newThisWeek || 0,
      parNiveau: niveauxMap || {}
    };

    console.log('📊 Stats publiques alternance calculées:', statsData);

    res.status(200).json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats publiques alternance:', error);
    
    // Retourner des stats par défaut en cas d'erreur
    res.status(200).json({
      success: true,
      data: {
        total: 0,
        urgent: 0,
        alternance: 0,
        stage: 0,
        nouvellesSemaine: 0,
        parNiveau: {}
      }
    });
  }
});

// ✅ GET offres d'alternance/stage publiques
router.get('/public', async (req, res) => {
  try {
    console.log('📡 GET /alternance/public - Requête publique');
    
    const {
      search = '',
      status = 'active',
      type,
      niveau,
      location,
      minRemuneration,
      maxRemuneration,
      ecolePartenaire,
      remoteOnly,
      urgentOnly,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire les filtres - uniquement les offres actives
    const where = {
      status: 'active'
    };

    // Filtre par recherche
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ecolePartenaire: { contains: search, mode: 'insensitive' } },
        { niveauEtude: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par type
    if (type && type !== 'all' && type !== 'tous') {
      where.type = type;
    }

    // Filtre par niveau d'étude
    if (niveau && niveau !== 'all' && niveau !== 'tous') {
      where.niveauEtude = niveau;
    }

    // Filtre par localisation
    if (location && location.trim() !== '') {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Filtre par école partenaire
    if (ecolePartenaire && ecolePartenaire.trim() !== '') {
      where.ecolePartenaire = { contains: ecolePartenaire, mode: 'insensitive' };
    }

    // Filtres booléens
    if (remoteOnly === 'true') {
      where.location = { contains: 'Télétravail', mode: 'insensitive' };
    }
    if (urgentOnly === 'true') {
      where.urgent = true;
    }

    // Compter le total
    const total = await prisma.alternanceStage.count({ where });

    // Récupérer les offres d'alternance/stage
    const offres = await prisma.alternanceStage.findMany({
      where,
      skip: skip >= 0 ? skip : 0,
      take: parseInt(limit) > 0 ? parseInt(limit) : 50,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true
          }
        }
      }
    });

    // Formater la réponse
    const formattedOffres = offres.map(offre => ({
      id: offre.id,
      title: offre.title,
      description: offre.description,
      type: offre.type,
      niveauEtude: offre.niveauEtude,
      duree: offre.duree,
      remuneration: offre.remuneration,
      location: offre.location,
      ecolePartenaire: offre.ecolePartenaire,
      rythmeAlternance: offre.rythmeAlternance,
      pourcentageTemps: offre.pourcentageTemps,
      urgent: offre.urgent,
      missions: offre.missions || [],
      competences: offre.competences || [],
      avantages: offre.avantages || [],
      dateDebut: offre.dateDebut,
      dateFin: offre.dateFin,
      candidaturesCount: offre.candidaturesCount || 0,
      vues: offre.vues || 0,
      status: offre.status,
      createdAt: offre.createdAt,
      updatedAt: offre.updatedAt,
      organisme: offre.user?.companyName || 
                offre.user?.commercialName || 
                (offre.user?.firstName && offre.user?.lastName 
                  ? `${offre.user.firstName} ${offre.user.lastName}`
                  : 'Organisme')
    }));

    res.status(200).json({
      success: true,
      data: formattedOffres,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération alternances publiques:', error);
    
    // Données fictives pour développement
    const mockOffres = [
      {
        id: 1,
        title: 'Alternance Développeur Web Full Stack',
        description: 'Alternance en développement web sur les technologies modernes',
        type: 'Alternance (Contrat pro)',
        niveauEtude: 'BAC+3',
        duree: '12 mois',
        remuneration: '1200€/mois',
        location: 'Paris + 2 jours télétravail',
        ecolePartenaire: 'ESGI',
        rythmeAlternance: '3 jours entreprise / 2 jours école',
        pourcentageTemps: '60%',
        urgent: true,
        missions: ['Développement frontend', 'Maintenance applicative'],
        competences: ['JavaScript', 'React', 'Node.js'],
        avantages: ['Mutuelle', 'Tickets restaurant'],
        dateDebut: new Date('2024-09-01'),
        dateFin: new Date('2025-08-31'),
        candidaturesCount: 8,
        vues: 120,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        organisme: 'TechCorp'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: mockOffres,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        pages: 1
      }
    });
  }
});

// ✅ POST postuler à une alternance/stage (authentification requise)
router.post('/public/:id/apply', authenticateToken, async (req, res) => {
  console.log('\n🚨🚨🚨 DEBUT POST /alternance/public/:id/apply 🚨🚨🚨');
  console.log('👤 User ID:', req.user?.id);
  console.log('👤 User email:', req.user?.email);
  console.log('🔢 Param ID:', req.params.id);
  console.log('📦 Body complet:', JSON.stringify(req.body, null, 2));

  try {
    const { id } = req.params;
    const { motivation, cvUrl, nomCandidat, emailCandidat, telephoneCandidat } = req.body;
    
    // CONVERTIR userId en String (comme votre schéma l'attend)
    const userId = String(req.user.id);
    
    console.log('✅ User ID converti en string:', userId);

    // Validation
    if (!motivation || motivation.trim() === '') {
      console.log('❌ Motivation manquante');
      return res.status(400).json({
        success: false,
        error: 'Le message de motivation est requis'
      });
    }

    // Convertir l'ID
    const offreId = parseInt(id);
    if (isNaN(offreId)) {
      console.log('❌ ID invalide:', id);
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }

    console.log(`🔍 Vérification offre ${offreId}...`);
    
    // Vérifier si l'offre existe et est active
    const offre = await prisma.alternanceStage.findFirst({
      where: {
        id: offreId,
        status: 'active'
      }
    });

    if (!offre) {
      console.log(`❌ Offre ${offreId} non trouvée`);
      return res.status(404).json({
        success: false,
        error: 'Offre non disponible'
      });
    }

    console.log(`✅ Offre trouvée: "${offre.title}" (ID: ${offre.id})`);

    // Vérifier si l'utilisateur a déjà postulé
    console.log(`🔍 Vérification candidature existante pour user ${userId}...`);
    const existingCandidature = await prisma.candidature.findFirst({
      where: {
        userId: userId,
        alternanceStageId: offreId,
        offreType: 'ALTERNANCE'
      }
    });

    if (existingCandidature) {
      console.log(`❌ Candidature déjà existante: ${existingCandidature.id}`);
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà postulé à cette offre'
      });
    }

    console.log('✅ Pas de candidature existante');

    // Préparer les données
    const candidatureData = {
      userId: userId,
      alternanceStageId: offreId,
      offreType: 'ALTERNANCE',
      titreOffre: offre.title,
      messageMotivation: motivation.trim(),
      statut: 'en_attente',
      nomCandidat: nomCandidat?.trim() || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      emailCandidat: emailCandidat?.trim() || req.user.email,
      telephoneCandidat: telephoneCandidat?.trim() || null
    };

    // Ajouter cvUrl si présent
    if (cvUrl && cvUrl.trim() !== '' && cvUrl !== 'undefined') {
      candidatureData.cvUrl = cvUrl.trim();
    }

    console.log('📝 Données préparées pour création:');
    console.log(JSON.stringify(candidatureData, null, 2));

    // Créer la candidature
    console.log('💾 Tentative création candidature...');
    const candidature = await prisma.candidature.create({
      data: candidatureData
    });
    console.log(`✅✅✅ Candidature créée avec succès! ID: ${candidature.id}`);

    // Tenter d'incrémenter le compteur
    console.log('➕ Tentative incrément compteur...');
    try {
      await prisma.alternanceStage.update({
        where: { id: offreId },
        data: {
          candidaturesCount: {
            increment: 1
          },
          updatedAt: new Date()
        }
      });
      console.log('✅ Compteur incrémenté');
    } catch (updateError) {
      console.warn('⚠️ Erreur incrément compteur (non critique):', updateError.message);
    }

    console.log('🎉🎉🎉 SUCCÈS COMPLET! 🎉🎉🎉');
    
    res.status(201).json({
      success: true,
      data: {
        id: candidature.id,
        offreId: offreId,
        titre: offre.title,
        statut: 'en_attente',
        appliedAt: candidature.createdAt
      },
      message: 'Candidature envoyée avec succès !'
    });

  } catch (error) {
    console.error('\n💥💥💥 ERREUR FATALE 💥💥💥');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
    console.error('Stack:', error.stack);

    let errorMessage = 'Erreur lors de l\'envoi de la candidature';
    let statusCode = 500;

    if (error.code === 'P2002') {
      errorMessage = 'Vous avez déjà postulé à cette offre';
      statusCode = 400;
    } else if (error.code === 'P2003') {
      errorMessage = 'Erreur de référence (offre non valide)';
      statusCode = 400;
    } else if (error.code === 'P2025') {
      errorMessage = 'Offre non trouvée';
      statusCode = 404;
    }

    const response = {
      success: false,
      error: errorMessage
    };

    // Ajouter des infos de debug en développement
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        message: error.message,
        code: error.code
      };
    }

    res.status(statusCode).json(response);
  } finally {
    console.log('🏁 FIN POST /alternance/public/:id/apply 🏁\n');
  }
});

// ✅ GET détails d'une offre publique
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offreId = parseInt(id);
    
    if (isNaN(offreId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }

    // Récupérer l'offre
    const offre = await prisma.alternanceStage.findFirst({
      where: {
        id: offreId,
        status: 'active'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!offre) {
      return res.status(404).json({
        success: false,
        error: 'Offre non disponible'
      });
    }

    // Incrémenter les vues
    await prisma.alternanceStage.update({
      where: { id: offreId },
      data: { vues: { increment: 1 } }
    });

    const formattedOffre = {
      id: offre.id,
      title: offre.title,
      description: offre.description,
      type: offre.type,
      niveauEtude: offre.niveauEtude,
      duree: offre.duree,
      remuneration: offre.remuneration,
      location: offre.location,
      ecolePartenaire: offre.ecolePartenaire,
      rythmeAlternance: offre.rythmeAlternance,
      pourcentageTemps: offre.pourcentageTemps,
      urgent: offre.urgent,
      missions: offre.missions || [],
      competences: offre.competences || [],
      avantages: offre.avantages || [],
      dateDebut: offre.dateDebut,
      dateFin: offre.dateFin,
      candidaturesCount: offre.candidaturesCount || 0,
      vues: offre.vues + 1,
      status: offre.status,
      createdAt: offre.createdAt,
      updatedAt: offre.updatedAt,
      organisme: offre.user?.companyName || 
                offre.user?.commercialName || 
                (offre.user?.firstName && offre.user?.lastName 
                  ? `${offre.user.firstName} ${offre.user.lastName}`
                  : 'Organisme'),
      contact: {
        email: offre.user?.email || null,
        phone: offre.user?.phone || null
      }
    };

    res.status(200).json({
      success: true,
      data: formattedOffre
    });

  } catch (error) {
    console.error('❌ Erreur récupération offre:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'offre'
    });
  }
});

// ✅ POST enregistrer une vue
router.post('/public/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.alternanceStage.update({
      where: { id: parseInt(id) },
      data: {
        vues: {
          increment: 1
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Vue enregistrée'
    });
  } catch (error) {
    console.error('❌ Erreur incrément vue:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de la vue'
    });
  }
});

// ✅ GET types disponibles
router.get('/public/types', async (req, res) => {
  try {
    const types = await prisma.alternanceStage.findMany({
      distinct: ['type'],
      select: {
        type: true
      },
      where: {
        status: 'active'
      }
    });

    const typeList = types.map(t => t.type).filter(Boolean);

    res.status(200).json({
      success: true,
      data: typeList
    });
  } catch (error) {
    console.error('❌ Erreur récupération types:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des types'
    });
  }
});

// ✅ GET niveaux d'étude disponibles
router.get('/public/niveaux', async (req, res) => {
  try {
    const niveaux = await prisma.alternanceStage.findMany({
      distinct: ['niveauEtude'],
      select: {
        niveauEtude: true
      },
      where: {
        status: 'active'
      }
    });

    const niveauList = niveaux.map(n => n.niveauEtude).filter(Boolean);

    res.status(200).json({
      success: true,
      data: niveauList
    });
  } catch (error) {
    console.error('❌ Erreur récupération niveaux:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des niveaux d\'étude'
    });
  }
});

// 🔥 AJOUT: Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// Validation rules
const alternanceValidation = [
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('type').trim().notEmpty().withMessage('Le type est requis'),
  body('niveauEtude').trim().notEmpty().withMessage('Le niveau d\'étude est requis'),
  body('duree').trim().notEmpty().withMessage('La durée est requise'),
  body('remuneration').trim().notEmpty().withMessage('La rémunération est requise'),
  body('location').trim().notEmpty().withMessage('Le lieu de travail est requis'),
  body('dateDebut').isISO8601().withMessage('La date de début doit être une date valide')
];





// GET all alternance/stages for a pro - CORRIGÉ
router.get('/', async (req, res) => {
  try {
    console.log('🔍 API Alternance appelée pour user:', req.user?.id);
    
    const { 
      search = '', 
      status = 'all', 
      type = 'all', 
      niveau = 'all',
      page = 1, 
      limit = 10 
    } = req.query;
    
    const userId = req.user.id;
    
    console.log('User ID:', userId, 'filters:', { search, status, type, niveau });
    
    // Validation des paramètres
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where = { proId: userId };
    
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ecolePartenaire: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (type !== 'all') {
      where.type = type;
    }
    
    if (niveau !== 'all') {
      where.niveauEtude = niveau;
    }
    
    // Get total count
    const total = await prisma.alternanceStage.count({ where });
    console.log(`📊 Total alternances: ${total}`);
    
    // Get alternances with pagination
    const alternances = await prisma.alternanceStage.findMany({
      where,
      orderBy: [
        { urgent: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });
    
    console.log(`✅ Retrieved ${alternances.length} alternances`);
    
    // Récupérer le nombre de candidatures pour chaque offre
    const alternancesWithCandidatures = await Promise.all(
      alternances.map(async (alternance) => {
        try {
          const candidaturesCount = await prisma.candidature.count({
            where: {
    alternanceStageId: alternance.id, // ⬅️ CORRIGER ICI
    offreType: "ALTERNANCE" // ⬅️ Note: C'est "ALTERNANCE" (majuscule) selon votre enum
  }
          });
          
          return {
            ...alternance,
            candidatures_count: candidaturesCount,
            dateDebut: alternance.dateDebut ? alternance.dateDebut.toISOString() : null,
            dateFin: alternance.dateFin ? alternance.dateFin.toISOString() : null,
            createdAt: alternance.createdAt.toISOString(),
            updatedAt: alternance.updatedAt.toISOString()
          };
        } catch (error) {
          console.error(`Error counting candidatures for alternance ${alternance.id}:`, error);
          return {
            ...alternance,
            candidatures_count: 0,
            dateDebut: alternance.dateDebut ? alternance.dateDebut.toISOString() : null,
            dateFin: alternance.dateFin ? alternance.dateFin.toISOString() : null,
            createdAt: alternance.createdAt.toISOString(),
            updatedAt: alternance.updatedAt.toISOString()
          };
        }
      })
    );
    
    res.json({
      success: true,
      alternances: alternancesWithCandidatures,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching alternances:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching alternances',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET single alternance/stage - CORRIGÉ
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🔍 Fetching alternance ${id} for user ${userId}`);

    const alternance = await prisma.alternanceStage.findFirst({
      where: {
        id: parseInt(id),
        proId: userId
      }
    });

    if (!alternance) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre not found' 
      });
    }

    // Récupérer le nombre de candidatures
    const candidaturesCount = await prisma.candidature.count({
      where: {
        offreId: parseInt(id),
        offreType: 'alternance'
      }
    });

    // Formater les dates pour le frontend
    const formattedAlternance = {
      ...alternance,
      candidatures_count: candidaturesCount,
      dateDebut: alternance.dateDebut ? alternance.dateDebut.toISOString() : null,
      dateFin: alternance.dateFin ? alternance.dateFin.toISOString() : null,
      createdAt: alternance.createdAt.toISOString(),
      updatedAt: alternance.updatedAt.toISOString()
    };

    res.json({
      success: true,
      data: formattedAlternance
    });
  } catch (error) {
    console.error('❌ Error fetching alternance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching alternance',
      message: error.message
    });
  }
});

// CREATE alternance/stage - CORRIGÉ
router.post('/', alternanceValidation, validationMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      niveauEtude,
      duree,
      remuneration,
      location,
      dateDebut,
      dateFin,
      missions = [],
      competences = [],
      avantages = [],
      ecolePartenaire = '',
      rythmeAlternance = '',
      pourcentageTemps = '',
      urgent = false,
      status = 'draft'
    } = req.body;

    const userId = req.user.id;

    console.log('📝 Creating alternance for user:', userId);

    // Convertir les données en tableaux si nécessaire
    const missionsArray = Array.isArray(missions) ? missions : 
                         (typeof missions === 'string' ? missions.split('\n').filter(m => m.trim()) : []);
    
    const competencesArray = Array.isArray(competences) ? competences : 
                           (typeof competences === 'string' ? competences.split('\n').filter(c => c.trim()) : []);
    
    const avantagesArray = Array.isArray(avantages) ? avantages : 
                         (typeof avantages === 'string' ? avantages.split('\n').filter(a => a.trim()) : []);

    const alternance = await prisma.alternanceStage.create({
      data: {
        proId: userId,
        title: title.trim(),
        description: description.trim(),
        type: type.trim(),
        niveauEtude: niveauEtude.trim(),
        duree: duree.trim(),
        remuneration: remuneration.trim(),
        location: location.trim(),
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        missions: missionsArray.filter(m => m && m.trim() !== ''),
        competences: competencesArray.filter(c => c && c.trim() !== ''),
        avantages: avantagesArray.filter(a => a && a.trim() !== ''),
        ecolePartenaire: ecolePartenaire.trim(),
        rythmeAlternance: rythmeAlternance.trim(),
        pourcentageTemps: pourcentageTemps.trim(),
        urgent: Boolean(urgent),
        status: status || 'draft',
        vues: 0
      }
    });

    console.log('✅ Alternance created with ID:', alternance.id);

    res.status(201).json({
      success: true,
      message: 'Offre créée avec succès',
      data: {
        ...alternance,
        dateDebut: alternance.dateDebut.toISOString(),
        dateFin: alternance.dateFin ? alternance.dateFin.toISOString() : null,
        createdAt: alternance.createdAt.toISOString(),
        updatedAt: alternance.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error creating alternance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error creating alternance',
      message: error.message
    });
  }
});

// UPDATE alternance/stage - CORRIGÉ
router.put('/:id', alternanceValidation, validationMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const {
      title,
      description,
      type,
      niveauEtude,
      duree,
      remuneration,
      location,
      dateDebut,
      dateFin,
      missions = [],
      competences = [],
      avantages = [],
      ecolePartenaire = '',
      rythmeAlternance = '',
      pourcentageTemps = '',
      urgent = false,
      status = 'draft'
    } = req.body;

    console.log(`✏️ Updating alternance ${id} for user ${userId}`);

    // Check if alternance belongs to pro
    const existingAlternance = await prisma.alternanceStage.findFirst({
      where: {
        id: parseInt(id),
        proId: userId
      }
    });

    if (!existingAlternance) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre not found or unauthorized' 
      });
    }

    // Convertir les données en tableaux si nécessaire
    const missionsArray = Array.isArray(missions) ? missions : 
                         (typeof missions === 'string' ? missions.split('\n').filter(m => m.trim()) : []);
    
    const competencesArray = Array.isArray(competences) ? competences : 
                           (typeof competences === 'string' ? competences.split('\n').filter(c => c.trim()) : []);
    
    const avantagesArray = Array.isArray(avantages) ? avantages : 
                         (typeof avantages === 'string' ? avantages.split('\n').filter(a => a.trim()) : []);

    const alternance = await prisma.alternanceStage.update({
      where: { id: parseInt(id) },
      data: {
        title: title.trim(),
        description: description.trim(),
        type: type.trim(),
        niveauEtude: niveauEtude.trim(),
        duree: duree.trim(),
        remuneration: remuneration.trim(),
        location: location.trim(),
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        missions: missionsArray.filter(m => m && m.trim() !== ''),
        competences: competencesArray.filter(c => c && c.trim() !== ''),
        avantages: avantagesArray.filter(a => a && a.trim() !== ''),
        ecolePartenaire: ecolePartenaire.trim(),
        rythmeAlternance: rythmeAlternance.trim(),
        pourcentageTemps: pourcentageTemps.trim(),
        urgent: Boolean(urgent),
        status: status || 'draft'
      }
    });

    console.log(`✅ Alternance ${id} updated successfully`);

    res.json({
      success: true,
      message: 'Offre mise à jour avec succès',
      data: {
        ...alternance,
        dateDebut: alternance.dateDebut.toISOString(),
        dateFin: alternance.dateFin ? alternance.dateFin.toISOString() : null,
        createdAt: alternance.createdAt.toISOString(),
        updatedAt: alternance.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error updating alternance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating alternance',
      message: error.message
    });
  }
});

// DELETE alternance/stage - CORRIGÉ
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Deleting alternance ${id} for user ${userId}`);

    // Check if alternance belongs to pro
    const existingAlternance = await prisma.alternanceStage.findFirst({
      where: {
        id: parseInt(id),
        proId: userId
      }
    });

    if (!existingAlternance) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre not found or unauthorized' 
      });
    }

    // Supprimer d'abord les candidatures associées
    await prisma.candidature.deleteMany({
      where: {
        offreId: parseInt(id),
        offreType: 'alternance'
      }
    });

    // Delete alternance
    await prisma.alternanceStage.delete({
      where: { id: parseInt(id) }
    });

    console.log(`✅ Alternance ${id} deleted successfully`);

    res.json({ 
      success: true,
      message: 'Offre supprimée avec succès' 
    });
  } catch (error) {
    console.error('❌ Error deleting alternance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting alternance',
      message: error.message
    });
  }
});

// UPDATE alternance status - CORRIGÉ
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Updating status of alternance ${id} to ${status}`);

    const validStatuses = ['draft', 'active', 'archived', 'filled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status' 
      });
    }

    const alternance = await prisma.alternanceStage.update({
      where: {
        id: parseInt(id),
        proId: userId
      },
      data: { status }
    });

    if (!alternance) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre not found or unauthorized' 
      });
    }

    console.log(`✅ Status of alternance ${id} updated to ${status}`);

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data: alternance
    });
  } catch (error) {
    console.error('❌ Error updating alternance status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating alternance status',
      message: error.message
    });
  }
});

// GET alternance statistics - CORRECTION COMPLÈTE
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📈 Fetching stats for user ${userId}`);

    // Compter le total
    const total = await prisma.alternanceStage.count({
      where: { proId: userId }
    });

    // Compter par statut
    const statusCounts = await prisma.alternanceStage.groupBy({
      by: ['status'],
      where: { proId: userId },
      _count: true
    });

    // Compter par type
    const typeCounts = await prisma.alternanceStage.groupBy({
      by: ['type'],
      where: { proId: userId },
      _count: true
    });

    // Compter les urgentes
    const urgentCount = await prisma.alternanceStage.count({
      where: {
        proId: userId,
        urgent: true
      }
    });

    // Récupérer toutes les offres de l'utilisateur
    const userOffres = await prisma.alternanceStage.findMany({
      where: { proId: userId },
      select: { id: true }
    });

    const offreIds = userOffres.map(offre => offre.id);
    
    // Calculer le total des candidatures
    let totalCandidatures = 0;
    if (offreIds.length > 0) {
      totalCandidatures = await prisma.candidature.count({
         where: {
    alternanceStageId: { // ⬅️ CORRIGER ICI
      in: offreIds
    },
    offreType: "ALTERNANCE"
  }
      });
    }

    // Calculer le total des vues
    const totalVuesResult = await prisma.alternanceStage.aggregate({
      where: { proId: userId },
      _sum: { vues: true }
    });

    // Initialiser les statistiques
    const stats = {
      total: total || 0,
      active: 0,
      draft: 0,
      archived: 0,
      filled: 0,
      'Alternance (Contrat pro)': 0,
      'Alternance (Apprentissage)': 0,
      'Stage conventionné': 0,
      'Stage de fin d\'études': 0,
      urgent: urgentCount || 0,
      total_candidatures: totalCandidatures || 0,
      total_vues: totalVuesResult._sum?.vues || 0
    };

    // Remplir les statuts
    if (statusCounts && Array.isArray(statusCounts)) {
      statusCounts.forEach(item => {
        if (item.status && stats.hasOwnProperty(item.status)) {
          stats[item.status] = item._count || 0;
        }
      });
    }

    // Remplir les types
    if (typeCounts && Array.isArray(typeCounts)) {
      typeCounts.forEach(item => {
        if (item.type && stats.hasOwnProperty(item.type)) {
          stats[item.type] = item._count || 0;
        }
      });
    }

    console.log(`✅ Stats retrieved:`, stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching alternance stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching alternance statistics',
      message: error.message
    });
  }
});

// GET export CSV - CORRIGÉ
router.get('/export/csv', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📥 Exporting CSV for user ${userId}`);

    const alternances = await prisma.alternanceStage.findMany({
      where: { proId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Format CSV
    const csvRows = [];
    
    // Headers
    csvRows.push([
      'ID',
      'Titre',
      'Type',
      'Niveau d\'étude',
      'Durée',
      'Rémunération',
      'Lieu',
      'Date début',
      'Date fin',
      'Statut',
      'École partenaire',
      'Rythme alternance',
      '% Temps',
      'Urgent',
      'Candidatures',
      'Vues',
      'Date création'
    ].join(','));

    // Data rows
    for (const alternance of alternances) {
      const candidaturesCount = await prisma.candidature.count({
        where: {
          offreId: alternance.id,
          offreType: 'alternance'
        }
      });
      
      const row = [
        alternance.id,
        `"${(alternance.title || '').replace(/"/g, '""')}"`,
        alternance.type || '',
        alternance.niveauEtude || '',
        alternance.duree || '',
        alternance.remuneration || '',
        alternance.location || '',
        alternance.dateDebut ? alternance.dateDebut.toISOString().split('T')[0] : '',
        alternance.dateFin ? alternance.dateFin.toISOString().split('T')[0] : '',
        alternance.status || '',
        alternance.ecolePartenaire ? `"${alternance.ecolePartenaire.replace(/"/g, '""')}"` : '',
        alternance.rythmeAlternance || '',
        alternance.pourcentageTemps || '',
        alternance.urgent ? 'Oui' : 'Non',
        candidaturesCount,
        alternance.vues || 0,
        alternance.createdAt.toISOString().split('T')[0]
      ];
      
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');

    console.log(`✅ CSV exported with ${alternances.length} rows`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=offres-alternance-${Date.now()}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error exporting CSV',
      message: error.message
    });
  }
});

// Route de test - CORRIGÉE
router.get('/test', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }
    
    // Tester la connexion à la base de données
    const testCount = await prisma.alternanceStage.count({
      where: { proId: userId }
    });
    
    res.json({
      success: true,
      message: 'API Alternance fonctionne!',
      userId,
      timestamp: new Date().toISOString(),
      testCount,
      endpoints: [
        'GET / - Liste des offres',
        'GET /:id - Détails offre',
        'POST / - Créer offre',
        'PUT /:id - Mettre à jour offre',
        'DELETE /:id - Supprimer offre',
        'PATCH /:id/status - Changer statut',
        'GET /stats/summary - Statistiques',
        'GET /export/csv - Export CSV'
      ]
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;