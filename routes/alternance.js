const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');
const { prisma } = require('../config/prisma');

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

// GET all alternance/stages for a pro
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all', 
      type = 'all', 
      niveau = 'all',
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
    
    // Get alternances with pagination
    const alternances = await prisma.alternanceStage.findMany({
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
    const formattedAlternances = alternances.map(alternance => ({
      ...alternance,
      candidatures_count: alternance._count.candidatures
    }));
    
    res.json({
      alternances: formattedAlternances,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching alternances:', error);
    res.status(500).json({ error: 'Error fetching alternances' });
  }
});

// GET single alternance/stage
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    const alternance = await prisma.alternanceStage.findFirst({
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

    if (!alternance) {
      return res.status(404).json({ error: 'Offre not found' });
    }

    res.json({
      ...alternance,
      candidatures_count: alternance._count.candidatures
    });
  } catch (error) {
    console.error('Error fetching alternance:', error);
    res.status(500).json({ error: 'Error fetching alternance' });
  }
});

// CREATE alternance/stage
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
      missions,
      competences,
      avantages,
      ecolePartenaire,
      rythmeAlternance,
      pourcentageTemps,
      urgent,
      status
    } = req.body;

    const alternance = await prisma.alternanceStage.create({
      data: {
        proId: req.user.proId,
        title,
        description,
        type,
        niveauEtude,
        duree,
        remuneration,
        location,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        missions: missions || [],
        competences: competences || [],
        avantages: avantages || [],
        ecolePartenaire,
        rythmeAlternance,
        pourcentageTemps,
        urgent: urgent || false,
        status: status || 'draft'
      }
    });

    // Increment views
    await prisma.alternanceStage.update({
      where: { id: alternance.id },
      data: { vues: { increment: 1 } }
    });

    res.status(201).json(alternance);
  } catch (error) {
    console.error('Error creating alternance:', error);
    res.status(500).json({ error: 'Error creating alternance' });
  }
});

// UPDATE alternance/stage
router.put('/:id', alternanceValidation, validationMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;
    
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
      missions,
      competences,
      avantages,
      ecolePartenaire,
      rythmeAlternance,
      pourcentageTemps,
      urgent,
      status
    } = req.body;

    // Check if alternance belongs to pro
    const existingAlternance = await prisma.alternanceStage.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingAlternance) {
      return res.status(404).json({ error: 'Offre not found or unauthorized' });
    }

    const alternance = await prisma.alternanceStage.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        type,
        niveauEtude,
        duree,
        remuneration,
        location,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        missions: missions || [],
        competences: competences || [],
        avantages: avantages || [],
        ecolePartenaire,
        rythmeAlternance,
        pourcentageTemps,
        urgent,
        status
      }
    });

    res.json(alternance);
  } catch (error) {
    console.error('Error updating alternance:', error);
    res.status(500).json({ error: 'Error updating alternance' });
  }
});

// DELETE alternance/stage
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    // Check if alternance belongs to pro
    const existingAlternance = await prisma.alternanceStage.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingAlternance) {
      return res.status(404).json({ error: 'Offre not found or unauthorized' });
    }

    // Delete alternance
    await prisma.alternanceStage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Offre deleted successfully' });
  } catch (error) {
    console.error('Error deleting alternance:', error);
    res.status(500).json({ error: 'Error deleting alternance' });
  }
});

// UPDATE alternance status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const proId = req.user.proId;

    const validStatuses = ['draft', 'active', 'archived', 'filled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const alternance = await prisma.alternanceStage.update({
      where: {
        id: parseInt(id),
        proId
      },
      data: { status }
    });

    if (!alternance) {
      return res.status(404).json({ error: 'Offre not found or unauthorized' });
    }

    res.json(alternance);
  } catch (error) {
    console.error('Error updating alternance status:', error);
    res.status(500).json({ error: 'Error updating alternance status' });
  }
});

// GET alternance statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const proId = req.user.proId;

    const stats = await prisma.alternanceStage.aggregate({
      where: { proId },
      _count: true,
      _sum: {
        candidaturesCount: true,
        vues: true
      }
    });

    const statusCounts = await prisma.alternanceStage.groupBy({
      by: ['status'],
      where: { proId },
      _count: true
    });

    const typeCounts = await prisma.alternanceStage.groupBy({
      by: ['type'],
      where: { proId },
      _count: true
    });

    const urgentCount = await prisma.alternanceStage.count({
      where: {
        proId,
        urgent: true
      }
    });

    const statusMap = {
      active: 0,
      draft: 0,
      archived: 0,
      filled: 0
    };

    statusCounts.forEach(item => {
      statusMap[item.status] = item._count;
    });

    const typeMap = {};
    typeCounts.forEach(item => {
      typeMap[item.type] = item._count;
    });

    res.json({
      total: stats._count,
      ...statusMap,
      ...typeMap,
      urgent: urgentCount,
      total_candidatures: stats._sum.candidaturesCount || 0,
      total_vues: stats._sum.vues || 0
    });
  } catch (error) {
    console.error('Error fetching alternance stats:', error);
    res.status(500).json({ error: 'Error fetching alternance statistics' });
  }
});


// GET export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const proId = req.user.proId;
    
    const alternances = await prisma.alternanceStage.findMany({
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
      'Urgent',
      'Candidatures',
      'Vues',
      'Date création'
    ].join(','));

    // Data rows
    alternances.forEach(alternance => {
      csvRows.push([
        alternance.id,
        `"${alternance.title.replace(/"/g, '""')}"`,
        alternance.type,
        alternance.niveauEtude,
        alternance.duree,
        alternance.remuneration,
        alternance.location,
        alternance.dateDebut.toISOString().split('T')[0],
        alternance.dateFin ? alternance.dateFin.toISOString().split('T')[0] : '',
        alternance.status,
        alternance.ecolePartenaire ? `"${alternance.ecolePartenaire.replace(/"/g, '""')}"` : '',
        alternance.rythmeAlternance,
        alternance.urgent ? 'Oui' : 'Non',
        alternance._count.candidatures,
        alternance.vues,
        alternance.createdAt.toISOString().split('T')[0]
      ].join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=offres-alternance-${Date.now()}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error exporting CSV' });
  }
});
module.exports = router;