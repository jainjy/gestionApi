const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');
const { prisma } = require('../config/prisma');

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

// GET all emplois for a pro
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all', 
      type = 'all', 
      secteur = 'all',
      page = 1, 
      limit = 10 
    } = req.query;
    const proId = req.user.proId;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause
    const where = { proId };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
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
    
    // Get total count
    const total = await prisma.emploi.count({ where });
    
    // Get emplois with pagination
    const emplois = await prisma.emploi.findMany({
      where,
      include: {
        _count: {
          select: { candidatures: true }
        }
      },
      orderBy: [
        { urgent: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });
    
    // Format response
    const formattedEmplois = emplois.map(emploi => ({
      ...emploi,
      candidatures_count: emploi._count.candidatures
    }));
    
    res.json({
      emplois: formattedEmplois,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching emplois:', error);
    res.status(500).json({ error: 'Error fetching emplois' });
  }
});

// GET single emploi
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    const emploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      },
      include: {
        _count: {
          select: { candidatures: true }
        }
      }
    });

    if (!emploi) {
      return res.status(404).json({ error: 'Emploi not found' });
    }

    res.json({
      ...emploi,
      candidatures_count: emploi._count.candidatures
    });
  } catch (error) {
    console.error('Error fetching emploi:', error);
    res.status(500).json({ error: 'Error fetching emploi' });
  }
});

// CREATE emploi
router.post('/', emploiValidation, validationMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      typeContrat,
      secteur,
      experience,
      salaire,
      location,
      remotePossible,
      urgent,
      missions,
      competences,
      avantages,
      datePublication,
      dateLimite,
      nombrePostes,
      status
    } = req.body;

    const emploi = await prisma.emploi.create({
      data: {
        proId: req.user.proId,
        title,
        description,
        typeContrat,
        secteur,
        experience,
        salaire,
        location,
        remotePossible: remotePossible || false,
        urgent: urgent || false,
        missions: missions || [],
        competences: competences || [],
        avantages: avantages || [],
        datePublication: datePublication ? new Date(datePublication) : null,
        dateLimite: dateLimite ? new Date(dateLimite) : null,
        nombrePostes: parseInt(nombrePostes),
        status: status || 'draft'
      }
    });

    // Increment views
    await prisma.emploi.update({
      where: { id: emploi.id },
      data: { vues: { increment: 1 } }
    });

    res.status(201).json(emploi);
  } catch (error) {
    console.error('Error creating emploi:', error);
    res.status(500).json({ error: 'Error creating emploi' });
  }
});

// UPDATE emploi
router.put('/:id', emploiValidation, validationMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;
    
    const {
      title,
      description,
      typeContrat,
      secteur,
      experience,
      salaire,
      location,
      remotePossible,
      urgent,
      missions,
      competences,
      avantages,
      datePublication,
      dateLimite,
      nombrePostes,
      status
    } = req.body;

    // Check if emploi belongs to pro
    const existingEmploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingEmploi) {
      return res.status(404).json({ error: 'Emploi not found or unauthorized' });
    }

    const emploi = await prisma.emploi.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        typeContrat,
        secteur,
        experience,
        salaire,
        location,
        remotePossible,
        urgent,
        missions: missions || [],
        competences: competences || [],
        avantages: avantages || [],
        datePublication: datePublication ? new Date(datePublication) : null,
        dateLimite: dateLimite ? new Date(dateLimite) : null,
        nombrePostes: parseInt(nombrePostes),
        status
      }
    });

    res.json(emploi);
  } catch (error) {
    console.error('Error updating emploi:', error);
    res.status(500).json({ error: 'Error updating emploi' });
  }
});

// DELETE emploi
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    // Check if emploi belongs to pro
    const existingEmploi = await prisma.emploi.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingEmploi) {
      return res.status(404).json({ error: 'Emploi not found or unauthorized' });
    }

    // Delete emploi
    await prisma.emploi.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Emploi deleted successfully' });
  } catch (error) {
    console.error('Error deleting emploi:', error);
    res.status(500).json({ error: 'Error deleting emploi' });
  }
});

// UPDATE emploi status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const proId = req.user.proId;

    const validStatuses = ['draft', 'active', 'archived', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const emploi = await prisma.emploi.update({
      where: {
        id: parseInt(id),
        proId
      },
      data: { status }
    });

    if (!emploi) {
      return res.status(404).json({ error: 'Emploi not found or unauthorized' });
    }

    res.json(emploi);
  } catch (error) {
    console.error('Error updating emploi status:', error);
    res.status(500).json({ error: 'Error updating emploi status' });
  }
});

// GET emploi statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const proId = req.user.proId;

    const stats = await prisma.emploi.aggregate({
      where: { proId },
      _count: true,
      _sum: {
        candidaturesCount: true,
        vues: true,
        nombrePostes: true
      }
    });

    const statusCounts = await prisma.emploi.groupBy({
      by: ['status'],
      where: { proId },
      _count: true
    });

    const urgentCount = await prisma.emploi.count({
      where: {
        proId,
        urgent: true
      }
    });

    const statusMap = {
      active: 0,
      draft: 0,
      archived: 0,
      closed: 0
    };

    statusCounts.forEach(item => {
      statusMap[item.status] = item._count;
    });

    res.json({
      total: stats._count,
      ...statusMap,
      urgent,
      total_candidatures: stats._sum.candidaturesCount || 0,
      total_vues: stats._sum.vues || 0,
      total_postes: stats._sum.nombrePostes || 0
    });
  } catch (error) {
    console.error('Error fetching emploi stats:', error);
    res.status(500).json({ error: 'Error fetching emploi statistics' });
  }
});

// GET export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const proId = req.user.proId;
    
    const emplois = await prisma.emploi.findMany({
      where: { proId },
      include: {
        _count: {
          select: { candidatures: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format CSV
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
      'Date limite',
      'Statut',
      'Candidatures',
      'Vues',
      'Date création'
    ].join(','));

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
        emploi.dateLimite ? emploi.dateLimite.toISOString().split('T')[0] : '',
        emploi.status,
        emploi._count.candidatures,
        emploi.vues,
        emploi.createdAt.toISOString().split('T')[0]
      ].join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=offres-emploi-${Date.now()}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error exporting CSV' });
  }
});

module.exports = router;