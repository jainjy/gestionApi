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