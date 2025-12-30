// routes/emploi.js - VERSION COMPLÈTE POUR LE BACKEND
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { prisma } = require('../lib/db');
const { authenticateToken } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const emploiValidation = [
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('typeContrat').trim().notEmpty().withMessage('Le type de contrat est requis'),
  body('secteur').trim().notEmpty().withMessage('Le secteur est requis'),
  body('experience').trim().notEmpty().withMessage('Le niveau d\'expérience est requis'),
  body('salaire').trim().notEmpty().withMessage('Le salaire est requis'),
  body('location').trim().notEmpty().withMessage('Le lieu de travail est requis'),
  body('nombrePostes').isInt({ min: 1 }).withMessage('Le nombre de postes doit être supérieur à 0')
];

// Middleware: Vérifier si l'utilisateur est un professionnel
const isProfessional = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Non authentifié' 
    });
  }

  const allowedRoles = ['professional', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      error: 'Accès refusé. Seuls les professionnels peuvent gérer les offres d\'emploi.' 
    });
  }
  
  if (!req.user.id) {
    return res.status(400).json({ 
      success: false,
      error: 'ID utilisateur manquant' 
    });
  }
  
  next();
};



// ======================
// ROUTES PUBLIQUES (doivent être placées AVANT les routes protégées)
// ======================

// ✅ GET statistiques publiques
router.get('/public/stats', async (req, res) => {
  try {
    console.log('📡 GET /emploi/public/stats - Statistiques publiques');

    // Compter les offres actives
    const totalActive = await prisma.emploi.count({
      where: { status: 'active' }
    });

    // Compter les offres urgentes
    const totalUrgent = await prisma.emploi.count({
      where: { 
        status: 'active',
        urgent: true
      }
    });

    // Compter les offres en télétravail
    const totalRemote = await prisma.emploi.count({
      where: { 
        status: 'active',
        remotePossible: true
      }
    });

    // Nombre d'offres publiées cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = await prisma.emploi.count({
      where: {
        status: 'active',
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Répartition par secteur
    const emploisBySecteur = await prisma.emploi.groupBy({
      by: ['secteur'],
      where: { status: 'active' },
      _count: true
    });

    const secteursMap = {};
    emploisBySecteur.forEach(item => {
      if (item.secteur) {
        secteursMap[item.secteur] = item._count;
      }
    });

    const statsData = {
      total: totalActive || 0,
      urgent: totalUrgent || 0,
      remotePossible: totalRemote || 0,
      nouvellesSemaine: newThisWeek || 0,
      parSecteur: secteursMap || {}
    };

    console.log('📊 Stats publiques calculées:', statsData);

    res.status(200).json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats publiques:', error);
    
    // Retourner des stats par défaut en cas d'erreur
    res.status(200).json({
      success: true,
      data: {
        total: 0,
        urgent: 0,
        remotePossible: 0,
        nouvellesSemaine: 0,
        parSecteur: {}
      }
    });
  }
});

// ✅ GET offres d'emploi publiques
router.get('/public', async (req, res) => {
  try {
    console.log('📡 GET /emploi/public - Requête publique');
    
    const {
      search = '',
      status = 'active',
      secteur,
      type,
      experience,
      location,
      minSalary,
      maxSalary,
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
        { entreprise: { contains: search, mode: 'insensitive' } },
        { secteur: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par secteur
    if (secteur && secteur !== 'all' && secteur !== 'tous') {
      where.secteur = secteur;
    }

    // Filtre par type de contrat
    if (type && type !== 'all' && type !== 'tous') {
      where.typeContrat = type;
    }

    // Filtre par expérience
    if (experience && experience !== 'all' && experience !== 'tous') {
      where.experience = experience;
    }

    // Filtre par localisation
    if (location && location.trim() !== '') {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Filtres booléens
    if (remoteOnly === 'true') {
      where.remotePossible = true;
    }
    if (urgentOnly === 'true') {
      where.urgent = true;
    }

    // Compter le total
    const total = await prisma.emploi.count({ where });

    // Récupérer les offres d'emploi
    const emplois = await prisma.emploi.findMany({
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
    const formattedEmplois = emplois.map(emploi => ({
      id: emploi.id,
      title: emploi.title,
      description: emploi.description,
      entreprise: emploi.entreprise || (emploi.user?.companyName || emploi.user?.commercialName || 'Entreprise'),
      secteur: emploi.secteur,
      typeContrat: emploi.typeContrat,
      experience: emploi.experience,
      salaire: emploi.salaire,
      location: emploi.location,
      remotePossible: emploi.remotePossible,
      urgent: emploi.urgent,
      missions: emploi.missions || [],
      competences: emploi.competences || [],
      avantages: emploi.avantages || [],
      datePublication: emploi.datePublication,
      dateLimite: emploi.dateLimite,
      nombrePostes: emploi.nombrePostes,
      candidaturesCount: emploi.candidaturesCount || 0,
      vues: emploi.vues || 0,
      status: emploi.status,
      createdAt: emploi.createdAt,
      updatedAt: emploi.updatedAt,
      organisme: emploi.user?.companyName || 
                emploi.user?.commercialName || 
                (emploi.user?.firstName && emploi.user?.lastName 
                  ? `${emploi.user.firstName} ${emploi.user.lastName}`
                  : 'Entreprise')
    }));

    res.status(200).json({
      success: true,
      data: formattedEmplois,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération emplois publics:', error);
    
    // Données fictives pour développement
    const mockEmplois = [
      {
        id: 1,
        title: 'Développeur Full Stack JavaScript',
        description: 'Nous recherchons un développeur full stack passionné.',
        entreprise: 'TechCorp',
        secteur: 'Informatique & Tech',
        typeContrat: 'CDI',
        experience: '3-5 ans',
        salaire: '45-55K€',
        location: 'Paris + Télétravail',
        remotePossible: true,
        urgent: false,
        missions: ['Développement', 'Maintenance'],
        competences: ['JavaScript', 'React', 'Node.js'],
        avantages: ['Mutuelle', 'Télétravail'],
        datePublication: new Date(),
        dateLimite: new Date('2024-12-31'),
        nombrePostes: 2,
        candidaturesCount: 12,
        vues: 150,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        organisme: 'TechCorp'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: mockEmplois,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        pages: 1
      }
    });
  }
});

// routes/emploi.js - VERSION CORRIGÉE POUR VOTRE SCHÉMA
router.post('/public/:id/apply', authenticateToken, async (req, res) => {
  console.log('\n🚀 NOUVELLE CANDIDATURE =============');
  console.log('User ID (string attendu):', req.user?.id, 'Type:', typeof req.user?.id);
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('===================================\n');

  try {
    const { id } = req.params;
    const { motivation, cvUrl, nomCandidat, emailCandidat, telephoneCandidat } = req.body;
    
    // CONVERTIR userId en String (comme votre schéma l'attend)
    const userId = String(req.user.id); // <-- IMPORTANT: Conversion en String
    
    console.log('✅ User ID converti en string:', userId);

    // Validation simple
    if (!motivation || motivation.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le message de motivation est requis'
      });
    }

    // Convertir l'ID
    const emploiId = parseInt(id);
    if (isNaN(emploiId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }

    // Vérifier si l'offre existe
    const emploi = await prisma.emploi.findUnique({
      where: { id: emploiId }
    });

    if (!emploi || emploi.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Offre non disponible'
      });
    }

    // Vérifier si l'utilisateur a déjà postulé
    // NOTE: userId est maintenant un String
    const existingCandidature = await prisma.candidature.findFirst({
      where: {
        userId: userId, // <-- String ici
        emploiId: emploiId,
        offreType: 'EMPLOI' // <-- Utiliser l'enum OffreType.EMPLOI
      }
    });

    if (existingCandidature) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà postulé à cette offre'
      });
    }

    // Préparer les données pour création - selon votre schéma
    const candidatureData = {
      userId: userId, // String
      emploiId: emploiId, // Int
      offreType: 'EMPLOI', // Enum OffreType.EMPLOI
      titreOffre: emploi.title,
      messageMotivation: motivation.trim(),
      statut: 'en_attente', // Default dans votre schéma
      nomCandidat: nomCandidat?.trim() || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      emailCandidat: emailCandidat?.trim() || req.user.email,
      telephoneCandidat: telephoneCandidat?.trim() || null
    };

    // Ajouter cvUrl si présent
    if (cvUrl && cvUrl.trim() !== '' && cvUrl !== 'undefined') {
      candidatureData.cvUrl = cvUrl.trim();
    }

    console.log('📝 Données candidature (schéma corrigé):', candidatureData);

    // Créer la candidature
    const candidature = await prisma.candidature.create({
      data: candidatureData
    });

    console.log('✅ Candidature créée avec succès! ID:', candidature.id);

    // Mettre à jour le compteur de candidatures
    try {
      await prisma.emploi.update({
        where: { id: emploiId },
        data: {
          candidaturesCount: {
            increment: 1
          }
        }
      });
      console.log('✅ Compteur candidatures mis à jour');
    } catch (counterError) {
      console.warn('⚠️ Erreur mise à jour compteur (non critique):', counterError.message);
    }

    // Réponse de succès
    res.status(201).json({
      success: true,
      data: {
        id: candidature.id,
        emploiId: emploiId,
        titre: emploi.title,
        statut: 'en_attente',
        appliedAt: candidature.createdAt
      },
      message: 'Candidature envoyée avec succès !'
    });

  } catch (error) {
    console.error('💥 ERREUR DÉTAILLÉE:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Messages d'erreur spécifiques
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
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      // Debug info en développement
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          code: error.code,
          meta: error.meta
        }
      })
    });
  }
});

// ✅ GET détails d'une offre publique
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const emploiId = parseInt(id);
    
    if (isNaN(emploiId)) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'offre invalide'
      });
    }

    // Récupérer l'offre
    const emploi = await prisma.emploi.findFirst({
      where: {
        id: emploiId,
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

    if (!emploi) {
      return res.status(404).json({
        success: false,
        error: 'Offre non disponible'
      });
    }

    // Incrémenter les vues
    await prisma.emploi.update({
      where: { id: emploiId },
      data: { vues: { increment: 1 } }
    });

    const formattedEmploi = {
      id: emploi.id,
      title: emploi.title,
      description: emploi.description,
      entreprise: emploi.entreprise || emploi.user?.companyName || 'Entreprise',
      secteur: emploi.secteur,
      typeContrat: emploi.typeContrat,
      experience: emploi.experience,
      salaire: emploi.salaire,
      location: emploi.location,
      remotePossible: emploi.remotePossible,
      urgent: emploi.urgent,
      missions: emploi.missions || [],
      competences: emploi.competences || [],
      avantages: emploi.avantages || [],
      datePublication: emploi.datePublication,
      dateLimite: emploi.dateLimite,
      nombrePostes: emploi.nombrePostes,
      candidaturesCount: emploi.candidaturesCount || 0,
      vues: emploi.vues + 1,
      status: emploi.status,
      createdAt: emploi.createdAt,
      updatedAt: emploi.updatedAt,
      organisme: emploi.user?.companyName || 
                emploi.user?.commercialName || 
                (emploi.user?.firstName && emploi.user?.lastName 
                  ? `${emploi.user.firstName} ${emploi.user.lastName}`
                  : 'Entreprise'),
      contact: {
        email: emploi.user?.email || null,
        phone: emploi.user?.phone || null
      }
    };

    res.status(200).json({
      success: true,
      data: formattedEmploi
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

    await prisma.emploi.update({
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

// ✅ GET secteurs disponibles
router.get('/public/secteurs', async (req, res) => {
  try {
    const secteurs = await prisma.emploi.findMany({
      distinct: ['secteur'],
      select: {
        secteur: true
      },
      where: {
        status: 'active'
      }
    });

    const secteurList = secteurs.map(s => s.secteur).filter(Boolean);

    res.status(200).json({
      success: true,
      data: secteurList
    });
  } catch (error) {
    console.error('❌ Erreur récupération secteurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des secteurs'
    });
  }
});

// ✅ GET types de contrat disponibles
router.get('/public/types-contrat', async (req, res) => {
  try {
    const types = await prisma.emploi.findMany({
      distinct: ['typeContrat'],
      select: {
        typeContrat: true
      },
      where: {
        status: 'active'
      }
    });

    const typeList = types.map(t => t.typeContrat).filter(Boolean);

    res.status(200).json({
      success: true,
      data: typeList
    });
  } catch (error) {
    console.error('❌ Erreur récupération types contrat:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des types de contrat'
    });
  }
});



// ======================
// ROUTES API
// ======================

// GET all emplois
router.get('/', authenticateToken, isProfessional, async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all', 
      type = 'all', 
      secteur = 'all',
      page = 1, 
      limit = 10 
    } = req.query;
    
    const proId = req.user.id;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Construction de la clause WHERE
    const where = { proId };
    
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { secteur: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (type !== 'all') {
      where.typeContrat = type;
    }
    
    if (secteur !== 'all') {
      where.secteur = secteur;
    }
    
    // Compte total
    const total = await prisma.emploi.count({ where });
    
    // Récupération des emplois
    const emplois = await prisma.emploi.findMany({
      where,
      orderBy: [
        { urgent: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });

    // Formatage des données pour le frontend
    const formattedEmplois = emplois.map(emploi => ({
      ...emploi,
      candidatures_count: emploi.candidaturesCount || 0
    }));

    res.json({
      success: true,
      emplois: formattedEmplois,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur GET /api/emploi:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des offres d\'emploi'
    });
  }
});

// GET stats
router.get('/stats/summary', authenticateToken, isProfessional, async (req, res) => {
  try {
    const proId = req.user.id;

    const [
      total,
      active,
      urgent,
      totalCandidatures,
      totalPostes,
      draft,
      archived,
      closed
    ] = await Promise.all([
      prisma.emploi.count({ where: { proId } }),
      prisma.emploi.count({ where: { proId, status: 'active' } }),
      prisma.emploi.count({ where: { proId, urgent: true } }),
      prisma.emploi.aggregate({
        where: { proId },
        _sum: { candidaturesCount: true }
      }),
      prisma.emploi.aggregate({
        where: { proId },
        _sum: { nombrePostes: true }
      }),
      prisma.emploi.count({ where: { proId, status: 'draft' } }),
      prisma.emploi.count({ where: { proId, status: 'archived' } }),
      prisma.emploi.count({ where: { proId, status: 'closed' } })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        urgent,
        total_candidatures: totalCandidatures._sum.candidaturesCount || 0,
        total_postes: totalPostes._sum.nombrePostes || 0,
        draft,
        archived,
        closed
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur GET /api/emploi/stats/summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// CREATE emploi
router.post('/', authenticateToken, isProfessional, emploiValidation, validate, async (req, res) => {
  try {
    const {
      title,
      description,
      typeContrat,
      secteur,
      experience,
      salaire,
      location,
      remotePossible = false,
      urgent = false,
      missions = [],
      competences = [],
      avantages = [],
      datePublication,
      dateLimite,
      nombrePostes,
      status = 'draft'
    } = req.body;

    const proId = req.user.id;

    // Conversion et nettoyage des tableaux
    const missionsArray = Array.isArray(missions) ? missions.filter(m => m && m.trim() !== '') : 
                         (typeof missions === 'string' && missions.trim() !== '' ? [missions.trim()] : []);
    
    const competencesArray = Array.isArray(competences) ? competences.filter(c => c && c.trim() !== '') : 
                           (typeof competences === 'string' && competences.trim() !== '' ? [competences.trim()] : []);
    
    const avantagesArray = Array.isArray(avantages) ? avantages.filter(a => a && a.trim() !== '') : 
                         (typeof avantages === 'string' && avantages.trim() !== '' ? [avantages.trim()] : []);

    const emploi = await prisma.emploi.create({
      data: {
        proId,
        title: title.trim(),
        description: description.trim(),
        typeContrat: typeContrat.trim(),
        secteur: secteur.trim(),
        experience: experience.trim(),
        salaire: salaire.trim(),
        location: location.trim(),
        remotePossible,
        urgent,
        missions: missionsArray,
        competences: competencesArray,
        avantages: avantagesArray,
        datePublication: datePublication ? new Date(datePublication) : null,
        dateLimite: dateLimite ? new Date(dateLimite) : null,
        nombrePostes: parseInt(nombrePostes) || 1,
        status,
        vues: 0,
        candidaturesCount: 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Offre d\'emploi créée avec succès',
      emploi: {
        ...emploi,
        candidatures_count: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur POST /api/emploi:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de l\'offre d\'emploi'
    });
  }
});

// UPDATE emploi
router.put('/:id', authenticateToken, isProfessional, emploiValidation, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.id;
    
    const {
      title,
      description,
      typeContrat,
      secteur,
      experience,
      salaire,
      location,
      remotePossible = false,
      urgent = false,
      missions = [],
      competences = [],
      avantages = [],
      datePublication,
      dateLimite,
      nombrePostes,
      status
    } = req.body;

    // Vérifier que l'offre appartient au professionnel
    const existingEmploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingEmploi) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre d\'emploi non trouvée ou non autorisée' 
      });
    }

    // Conversion et nettoyage des tableaux
    const missionsArray = Array.isArray(missions) ? missions.filter(m => m && m.trim() !== '') : 
                         (typeof missions === 'string' && missions.trim() !== '' ? [missions.trim()] : []);
    
    const competencesArray = Array.isArray(competences) ? competences.filter(c => c && c.trim() !== '') : 
                           (typeof competences === 'string' && competences.trim() !== '' ? [competences.trim()] : []);
    
    const avantagesArray = Array.isArray(avantages) ? avantages.filter(a => a && a.trim() !== '') : 
                         (typeof avantages === 'string' && avantages.trim() !== '' ? [avantages.trim()] : []);

    const emploi = await prisma.emploi.update({
      where: { id: parseInt(id) },
      data: {
        title: title.trim(),
        description: description.trim(),
        typeContrat: typeContrat.trim(),
        secteur: secteur.trim(),
        experience: experience.trim(),
        salaire: salaire.trim(),
        location: location.trim(),
        remotePossible,
        urgent,
        missions: missionsArray,
        competences: competencesArray,
        avantages: avantagesArray,
        datePublication: datePublication ? new Date(datePublication) : null,
        dateLimite: dateLimite ? new Date(dateLimite) : null,
        nombrePostes: parseInt(nombrePostes) || 1,
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Offre d\'emploi mise à jour avec succès',
      emploi: {
        ...emploi,
        candidatures_count: emploi.candidaturesCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT /api/emploi/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour de l\'offre d\'emploi'
    });
  }
});

// DELETE emploi
router.delete('/:id', authenticateToken, isProfessional, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.id;

    // Vérifier que l'offre appartient au professionnel
    const existingEmploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingEmploi) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre d\'emploi non trouvée ou non autorisée' 
      });
    }

    await prisma.emploi.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Offre d\'emploi supprimée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/emploi/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de l\'offre d\'emploi' 
    });
  }
});

// UPDATE status
router.patch('/:id/status', authenticateToken, isProfessional, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const proId = req.user.id;

    const validStatuses = ['draft', 'active', 'archived', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Statut invalide. Statuts autorisés: draft, active, archived, closed' 
      });
    }

    // Vérifier que l'offre appartient au professionnel
    const existingEmploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingEmploi) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre d\'emploi non trouvée ou non autorisée' 
      });
    }

    const emploi = await prisma.emploi.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      emploi: {
        ...emploi,
        candidatures_count: emploi.candidaturesCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/emploi/:id/status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
});

// GET single emploi
router.get('/:id', authenticateToken, isProfessional, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.id;

    const emploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!emploi) {
      return res.status(404).json({ 
        success: false,
        error: 'Offre d\'emploi non trouvée' 
      });
    }

    res.json({
      success: true,
      emploi: {
        ...emploi,
        candidatures_count: emploi.candidaturesCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur GET /api/emploi/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'offre d\'emploi' 
    });
  }
});

// Export CSV
router.get('/export/csv', authenticateToken, isProfessional, async (req, res) => {
  try {
    const proId = req.user.id;
    
    const emplois = await prisma.emploi.findMany({
      where: { proId },
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = [];
    
    // Headers
    csvRows.push([
      'ID',
      'Titre',
      'Type contrat',
      'Secteur',
      'Expérience',
      'Salaire',
      'Lieu',
      'Télétravail',
      'Urgent',
      'Nombre postes',
      'Date publication',
      'Date limite',
      'Statut',
      'Candidatures',
      'Vues',
      'Date création'
    ].join(';'));
    
    // Data rows
    emplois.forEach(emploi => {
      csvRows.push([
        emploi.id,
        `"${emploi.title.replace(/"/g, '""')}"`,
        emploi.typeContrat,
        emploi.secteur,
        emploi.experience,
        emploi.salaire,
        emploi.location,
        emploi.remotePossible ? 'Oui' : 'Non',
        emploi.urgent ? 'Oui' : 'Non',
        emploi.nombrePostes,
        emploi.datePublication ? emploi.datePublication.toISOString().split('T')[0] : '',
        emploi.dateLimite ? emploi.dateLimite.toISOString().split('T')[0] : '',
        emploi.status,
        emploi.candidaturesCount,
        emploi.vues,
        emploi.createdAt.toISOString().split('T')[0]
      ].join(';'));
    });

    const csvString = csvRows.join('\n');
    const fileName = `offres-emploi-${proId}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvString);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/emploi/export/csv:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'export CSV' 
    });
  }
});

// Route de test
router.get('/test/connection', authenticateToken, isProfessional, async (req, res) => {
  try {
    const proId = req.user.id;
    
    const testCount = await prisma.emploi.count({
      where: { proId }
    });
    
    res.json({
      success: true,
      message: 'API Emploi fonctionnelle',
      user: {
        id: proId,
        role: req.user.role,
        email: req.user.email
      },
      database: {
        connected: true,
        totalOffres: testCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur test connection:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de connexion à la base de données'
    });
  }
});

module.exports = router;