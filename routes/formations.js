const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation');
const { prisma } = require('../config/prisma');

// Validation rules
const formationValidation = [
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('description').trim().notEmpty().withMessage('La description est requise'),
  body('category').trim().notEmpty().withMessage('La catégorie est requise'),
  body('format').trim().notEmpty().withMessage('Le format est requis'),
  body('duration').trim().notEmpty().withMessage('La durée est requise'),
  body('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Le nombre maximum de participants doit être supérieur à 0'),
  body('startDate').isISO8601().withMessage('La date de début doit être une date valide')
];

// GET all formations for a pro
router.get('/', async (req, res) => {
  try {
    const { 
      search = '', 
      status = 'all', 
      category = 'all', 
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
    
    if (category !== 'all') {
      where.category = category;
    }
    
    // Get total count
    const total = await prisma.formation.count({ where });
    
    // Get formations with pagination
    const formations = await prisma.formation.findMany({
      where,
      include: {
        _count: {
          select: { candidatures: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });
    
    // Format response
    const formattedFormations = formations.map(formation => ({
      ...formation,
      applications_count: formation._count.candidatures
    }));
    
    res.json({
      formations: formattedFormations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching formations:', error);
    res.status(500).json({ error: 'Error fetching formations' });
  }
});

// GET single formation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    const formation = await prisma.formation.findFirst({
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

    if (!formation) {
      return res.status(404).json({ error: 'Formation not found' });
    }

    res.json({
      ...formation,
      applications_count: formation._count.candidatures
    });
  } catch (error) {
    console.error('Error fetching formation:', error);
    res.status(500).json({ error: 'Error fetching formation' });
  }
});

// CREATE formation
router.post('/', formationValidation, validationMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      format,
      duration,
      price,
      maxParticipants,
      certification,
      startDate,
      endDate,
      location,
      requirements,
      program,
      status,
      isCertified,
      isFinanced,
      isOnline
    } = req.body;

    const formation = await prisma.formation.create({
      data: {
        proId: req.user.proId,
        title,
        description,
        category,
        format,
        duration,
        price: parseFloat(price),
        maxParticipants: parseInt(maxParticipants),
        certification,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        requirements,
        program: program || [],
        status: status || 'draft',
        isCertified: isCertified || false,
        isFinanced: isFinanced || false,
        isOnline: isOnline || false
      }
    });

    // Increment views
    await prisma.formation.update({
      where: { id: formation.id },
      data: { views: { increment: 1 } }
    });

    res.status(201).json(formation);
  } catch (error) {
    console.error('Error creating formation:', error);
    res.status(500).json({ error: 'Error creating formation' });
  }
});

// UPDATE formation
router.put('/:id', formationValidation, validationMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;
    
    const {
      title,
      description,
      category,
      format,
      duration,
      price,
      maxParticipants,
      certification,
      startDate,
      endDate,
      location,
      requirements,
      program,
      status,
      isCertified,
      isFinanced,
      isOnline
    } = req.body;

    // Check if formation belongs to pro
    const existingFormation = await prisma.formation.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingFormation) {
      return res.status(404).json({ error: 'Formation not found or unauthorized' });
    }

    const formation = await prisma.formation.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        category,
        format,
        duration,
        price: parseFloat(price),
        maxParticipants: parseInt(maxParticipants),
        certification,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        requirements,
        program: program || [],
        status,
        isCertified,
        isFinanced,
        isOnline
      }
    });

    res.json(formation);
  } catch (error) {
    console.error('Error updating formation:', error);
    res.status(500).json({ error: 'Error updating formation' });
  }
});

// DELETE formation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proId = req.user.proId;

    // Check if formation belongs to pro
    const existingFormation = await prisma.formation.findFirst({
      where: {
        id: parseInt(id),
        proId
      }
    });

    if (!existingFormation) {
      return res.status(404).json({ error: 'Formation not found or unauthorized' });
    }

    // Delete formation
    await prisma.formation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Formation deleted successfully' });
  } catch (error) {
    console.error('Error deleting formation:', error);
    res.status(500).json({ error: 'Error deleting formation' });
  }
});

// UPDATE formation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const proId = req.user.proId;

    const validStatuses = ['draft', 'active', 'archived', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const formation = await prisma.formation.update({
      where: {
        id: parseInt(id),
        proId
      },
      data: { status }
    });

    if (!formation) {
      return res.status(404).json({ error: 'Formation not found or unauthorized' });
    }

    res.json(formation);
  } catch (error) {
    console.error('Error updating formation status:', error);
    res.status(500).json({ error: 'Error updating formation status' });
  }
});

// GET formation statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const proId = req.user.proId;

    const stats = await prisma.formation.aggregate({
      where: { proId },
      _count: true,
      _sum: {
        currentParticipants: true,
        applications: true,
        views: true
      }
    });

    const statusCounts = await prisma.formation.groupBy({
      by: ['status'],
      where: { proId },
      _count: true
    });

    const statusMap = {
      active: 0,
      draft: 0,
      archived: 0,
      completed: 0
    };

    statusCounts.forEach(item => {
      statusMap[item.status] = item._count;
    });

    res.json({
      total: stats._count,
      ...statusMap,
      total_participants: stats._sum.currentParticipants || 0,
      total_applications: stats._sum.applications || 0,
      total_views: stats._sum.views || 0
    });
  } catch (error) {
    console.error('Error fetching formation stats:', error);
    res.status(500).json({ error: 'Error fetching formation statistics' });
  }
});

// GET export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const proId = req.user.proId;
    
    const formations = await prisma.formation.findMany({
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
      'Catégorie',
      'Format',
      'Durée',
      'Prix',
      'Participants max',
      'Participants actuels',
      'Certification',
      'Date début',
      'Date fin',
      'Lieu',
      'Statut',
      'Certifiée',
      'Financement',
      'En ligne',
      'Candidatures',
      'Vues',
      'Date création'
    ].join(','));

    // Data rows
    formations.forEach(formation => {
      csvRows.push([
        formation.id,
        `"${formation.title.replace(/"/g, '""')}"`,
        formation.category,
        formation.format,
        formation.duration,
        formation.price,
        formation.maxParticipants,
        formation.currentParticipants || 0,
        formation.certification || '',
        formation.startDate.toISOString().split('T')[0],
        formation.endDate ? formation.endDate.toISOString().split('T')[0] : '',
        formation.location || '',
        formation.status,
        formation.isCertified ? 'Oui' : 'Non',
        formation.isFinanced ? 'Oui' : 'Non',
        formation.isOnline ? 'Oui' : 'Non',
        formation._count.candidatures,
        formation.views || 0,
        formation.createdAt.toISOString().split('T')[0]
      ].join(','));
    });

    const csvString = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=formations-${Date.now()}.csv`);
    res.send(csvString);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Error exporting CSV' });
  }
});

module.exports = router;