const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth'); // Assurez-vous que ce middleware existe

const prisma = new PrismaClient();

// ======================
// ROUTES PUBLIQUES
// ======================

// ✅ Récupérer toutes les formations publiques
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /formations - Requête publique reçue');
    
    const {
      search = '',
      status = 'active',
      category,
      format,
      minPrice,
      maxPrice,
      isCertified,
      isFinanced,
      isOnline,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where = {
      status: 'active'
    };

    // Filtre par recherche
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par catégorie
    if (category && category !== 'all' && category !== 'tous') {
      where.category = category;
    }

    // Filtre par format
    if (format && format !== 'all' && format !== 'tous') {
      where.format = format;
    }

    // Filtre par prix
    if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }

    // Filtres booléens
    if (isCertified === 'true') {
      where.isCertified = true;
    }
    if (isFinanced === 'true') {
      where.isFinanced = true;
    }
    if (isOnline === 'true') {
      where.isOnline = true;
    }

    // Compter le total
    const total = await prisma.formation.count({ where });

    // Récupérer les formations
    const formations = await prisma.formation.findMany({
      where,
      skip: skip >= 0 ? skip : 0,
      take: limitNum > 0 ? limitNum : 50,
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
    const formattedFormations = formations.map(formation => ({
      id: formation.id,
      title: formation.title,
      description: formation.description,
      category: formation.category,
      format: formation.format,
      duration: formation.duration,
      price: formation.price,
      maxParticipants: formation.maxParticipants,
      currentParticipants: formation.currentParticipants,
      certification: formation.certification || null,
      startDate: formation.startDate,
      endDate: formation.endDate || null,
      location: formation.location || null,
      requirements: formation.requirements || null,
      program: formation.program || [],
      status: formation.status,
      isCertified: formation.isCertified,
      isFinanced: formation.isFinanced,
      isOnline: formation.isOnline,
      views: formation.views,
      applications: formation.applications,
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
      organisme: formation.user?.companyName || 
                formation.user?.commercialName || 
                (formation.user?.firstName && formation.user?.lastName 
                  ? `${formation.user.firstName} ${formation.user.lastName}`
                  : 'Organisme'),
      rating: 4.5,
      reviews: 0
    }));

    res.status(200).json({
      success: true,
      data: formattedFormations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération formations publiques:', error);
    
    // Données fictives pour développement
    if (process.env.NODE_ENV === 'development') {
      const mockFormations = [
        {
          id: 1,
          title: 'Développeur Web Full Stack',
          description: 'Formation complète pour devenir développeur full stack avec projets concrets',
          category: 'Informatique & Numérique',
          format: '100% en ligne',
          duration: '6 mois',
          price: 2990,
          maxParticipants: 25,
          currentParticipants: 15,
          certification: 'RNCP niveau 6',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-07-15'),
          location: '100% en ligne',
          requirements: 'Bonne maîtrise de l\'ordinateur, logique algorithmique',
          program: ['HTML/CSS avancé', 'JavaScript moderne', 'React & Node.js', 'Bases de données'],
          status: 'active',
          isCertified: true,
          isFinanced: true,
          isOnline: true,
          views: 1000,
          applications: 50,
          createdAt: new Date('2023-12-01'),
          updatedAt: new Date('2023-12-01'),
          organisme: 'OpenClassrooms'
        }
      ];
      
      res.status(200).json({
        success: true,
        data: mockFormations,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des formations'
      });
    }
  }
});

// ✅ Récupérer une formation publique par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const formationId = parseInt(id);
    
    if (isNaN(formationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de formation invalide'
      });
    }

    // Récupérer la formation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
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

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non disponible'
      });
    }

    // Incrémenter les vues
    await prisma.formation.update({
      where: { id: formationId },
      data: { views: { increment: 1 } }
    });

    // Formater la réponse
    const formattedFormation = {
      id: formation.id,
      title: formation.title,
      description: formation.description,
      category: formation.category,
      format: formation.format,
      duration: formation.duration,
      price: formation.price,
      maxParticipants: formation.maxParticipants,
      currentParticipants: formation.currentParticipants,
      certification: formation.certification || null,
      startDate: formation.startDate,
      endDate: formation.endDate || null,
      location: formation.location || null,
      requirements: formation.requirements || null,
      program: formation.program || [],
      status: formation.status,
      isCertified: formation.isCertified,
      isFinanced: formation.isFinanced,
      isOnline: formation.isOnline,
      views: formation.views + 1,
      applications: formation.applications,
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
      organisme: formation.user?.companyName || 
                formation.user?.commercialName || 
                (formation.user?.firstName && formation.user?.lastName 
                  ? `${formation.user.firstName} ${formation.user.lastName}`
                  : 'Organisme'),
      rating: 4.5,
      reviews: 0,
      contact: {
        email: formation.user?.email || null,
        phone: formation.user?.phone || null
      }
    };

    res.status(200).json({
      success: true,
      data: formattedFormation
    });

  } catch (error) {
    console.error('❌ Erreur récupération formation:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la formation'
    });
  }
});

// ✅ POST Candidature à une formation (CORRECTION SIMILAIRE À EMPLOI)
router.post('/:id/apply', authenticateToken, async (req, res) => {
  console.log('\n🚀 NOUVELLE CANDIDATURE FORMATION =============');
  console.log('User ID:', req.user?.id, 'Type:', typeof req.user?.id);
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  console.log('===================================\n');

  try {
    const { id } = req.params;
    const { motivation, cvUrl, nomCandidat, emailCandidat, telephoneCandidat } = req.body;
    
    // CONVERTIR userId en String
    const userId = String(req.user.id);
    
    console.log('✅ User ID converti en string:', userId);

    // Validation simple
    if (!motivation || motivation.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le message de motivation est requis'
      });
    }

    // Convertir l'ID
    const formationId = parseInt(id);
    if (isNaN(formationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de formation invalide'
      });
    }

    // Vérifier si la formation existe
    const formation = await prisma.formation.findUnique({
      where: { id: formationId }
    });

    if (!formation || formation.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Formation non disponible'
      });
    }

    // Vérifier si l'utilisateur a déjà postulé
    const existingCandidature = await prisma.candidature.findFirst({
      where: {
        userId: userId,
        formationId: formationId,
        offreType: 'FORMATION'
      }
    });

    if (existingCandidature) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà postulé à cette formation'
      });
    }

    // Préparer les données pour création
    const candidatureData = {
      userId: userId,
      formationId: formationId,
      offreType: 'FORMATION',
      titreOffre: formation.title,
      messageMotivation: motivation.trim(),
      statut: 'en_attente',
      nomCandidat: nomCandidat?.trim() || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      emailCandidat: emailCandidat?.trim() || req.user.email,
      telephoneCandidat: telephoneCandidat?.trim() || null,
      cvUrl: (cvUrl && cvUrl.trim() !== '' && cvUrl !== 'undefined') ? cvUrl.trim() : null
    };

    console.log('📝 Données candidature formation:', candidatureData);

    // Créer la candidature
    const candidature = await prisma.candidature.create({
      data: candidatureData
    });

    console.log('✅ Candidature formation créée avec succès! ID:', candidature.id);

    // Mettre à jour le compteur de candidatures
    try {
      await prisma.formation.update({
        where: { id: formationId },
        data: {
          applications: {
            increment: 1
          },
          currentParticipants: {
            increment: 1
          }
        }
      });
      console.log('✅ Compteur candidatures formation mis à jour');
    } catch (counterError) {
      console.warn('⚠️ Erreur mise à jour compteur (non critique):', counterError.message);
    }

    // Réponse de succès
    res.status(201).json({
      success: true,
      data: {
        id: candidature.id,
        formationId: formationId,
        titre: formation.title,
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
      errorMessage = 'Vous avez déjà postulé à cette formation';
      statusCode = 400;
    } else if (error.code === 'P2003') {
      errorMessage = 'Erreur de référence (formation non valide)';
      statusCode = 400;
    } else if (error.code === 'P2025') {
      errorMessage = 'Formation non trouvée';
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

// ✅ POST enregistrer une vue
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.formation.update({
      where: { id: parseInt(id) },
      data: {
        views: {
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

// ✅ Récupérer les catégories disponibles
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.formation.findMany({
      distinct: ['category'],
      select: {
        category: true
      },
      where: {
        status: 'active'
      }
    });

    const categoryList = categories.map(cat => cat.category).filter(Boolean);

    res.status(200).json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error('❌ Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories'
    });
  }
});

// ✅ Récupérer les formats disponibles
router.get('/formats/list', async (req, res) => {
  try {
    const formats = await prisma.formation.findMany({
      distinct: ['format'],
      select: {
        format: true
      },
      where: {
        status: 'active'
      }
    });

    const formatList = formats.map(f => f.format).filter(Boolean);

    res.status(200).json({
      success: true,
      data: formatList
    });
  } catch (error) {
    console.error('❌ Erreur récupération formats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des formats'
    });
  }
});

// ✅ GET statistiques publiques des formations
router.get('/stats/public', async (req, res) => {
  try {
    console.log('📡 GET /formations/stats/public - Statistiques publiques');

    // Compter les formations actives
    const totalActive = await prisma.formation.count({
      where: { status: 'active' }
    });

    // Compter les formations certifiées
    const totalCertified = await prisma.formation.count({
      where: { 
        status: 'active',
        isCertified: true
      }
    });

    // Compter les formations financées
    const totalFinanced = await prisma.formation.count({
      where: { 
        status: 'active',
        isFinanced: true
      }
    });

    // Compter les formations en ligne
    const totalOnline = await prisma.formation.count({
      where: { 
        status: 'active',
        isOnline: true
      }
    });

    // Nombre de formations publiées cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = await prisma.formation.count({
      where: {
        status: 'active',
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Répartition par catégorie
    const formationsByCategory = await prisma.formation.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: true
    });

    const categoriesMap = {};
    formationsByCategory.forEach(item => {
      if (item.category) {
        categoriesMap[item.category] = item._count;
      }
    });

    const statsData = {
      total: totalActive || 0,
      certified: totalCertified || 0,
      financed: totalFinanced || 0,
      online: totalOnline || 0,
      nouvellesSemaine: newThisWeek || 0,
      parCategorie: categoriesMap || {}
    };

    console.log('📊 Stats publiques calculées:', statsData);

    res.status(200).json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats publiques:', error);
    
    res.status(200).json({
      success: true,
      data: {
        total: 0,
        certified: 0,
        financed: 0,
        online: 0,
        nouvellesSemaine: 0,
        parCategorie: {}
      }
    });
  }
});

module.exports = router;