const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ✅ Récupérer toutes les formations publiques (GET /)
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

    console.log('📊 Paramètres de filtrage:', { 
      search, status, category, format, 
      minPrice, maxPrice, page: pageNum, limit: limitNum 
    });

    // Construire les filtres
    const where = {
      status: 'active' // Seulement les formations actives
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

    console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

    // Compter le total
    const total = await prisma.formation.count({ where });
    console.log(`📈 Total formations: ${total}`);

    // Récupérer les formations avec les relations nécessaires
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

    console.log(`✅ ${formations.length} formations trouvées`);

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
      // Informations de l'organisme
      organisme: formation.user?.companyName || 
                formation.user?.commercialName || 
                (formation.user?.firstName && formation.user?.lastName 
                  ? `${formation.user.firstName} ${formation.user.lastName}`
                  : 'Organisme'),
      // Pour la compatibilité avec le frontend
      rating: 4.5, // Valeur par défaut
      reviews: 0   // Valeur par défaut
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
    console.error('❌ Détails:', error.message);
    
    // En mode développement, retourner des données fictives
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Retour de données fictives pour le développement');
      
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
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-07-15T00:00:00.000Z',
          location: '100% en ligne',
          requirements: 'Bonne maîtrise de l\'ordinateur, logique algorithmique',
          program: ['HTML/CSS avancé', 'JavaScript moderne', 'React & Node.js', 'Bases de données'],
          status: 'active',
          isCertified: true,
          isFinanced: true,
          isOnline: true,
          rating: 4.8,
          reviews: 124,
          views: 1000,
          applications: 50,
          createdAt: '2023-12-01T00:00:00.000Z',
          updatedAt: '2023-12-01T00:00:00.000Z',
          organisme: 'OpenClassrooms'
        },
        {
          id: 2,
          title: 'Gestion de Projet Agile',
          description: 'Maîtrisez les méthodologies Agile et Scrum',
          category: 'Management & Leadership',
          format: 'Hybride',
          duration: '3 mois',
          price: 1850,
          maxParticipants: 18,
          currentParticipants: 12,
          certification: 'Certificat CNAM',
          startDate: '2024-02-20T00:00:00.000Z',
          endDate: '2024-05-20T00:00:00.000Z',
          location: 'Paris + Distanciel',
          requirements: 'Expérience en gestion de projet recommandée',
          program: ['Introduction Agile', 'Méthodologie Scrum', 'Ateliers pratiques'],
          status: 'active',
          isCertified: true,
          isFinanced: true,
          isOnline: false,
          rating: 4.6,
          reviews: 89,
          views: 800,
          applications: 35,
          createdAt: '2023-12-01T00:00:00.000Z',
          updatedAt: '2023-12-01T00:00:00.000Z',
          organisme: 'CNAM'
        },
        {
          id: 3,
          title: 'CAP Électricien',
          description: 'Formation complète avec stages en entreprise',
          category: 'Bâtiment & Construction',
          format: 'Présentiel',
          duration: '12 mois',
          price: 4500,
          maxParticipants: 15,
          currentParticipants: 10,
          certification: 'Diplôme d\'État',
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2025-01-10T00:00:00.000Z',
          location: 'Lyon',
          requirements: 'Niveau 3ème minimum',
          program: ['Électricité bâtiment', 'Normes sécurité', 'Installations électriques'],
          status: 'active',
          isCertified: true,
          isFinanced: true,
          isOnline: false,
          rating: 4.9,
          reviews: 156,
          views: 1200,
          applications: 40,
          createdAt: '2023-12-01T00:00:00.000Z',
          updatedAt: '2023-12-01T00:00:00.000Z',
          organisme: 'AFPA'
        }
      ];

      res.status(200).json({
        success: true,
        data: mockFormations,
        pagination: {
          page: 1,
          limit: 50,
          total: mockFormations.length,
          pages: 1
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des formations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// ✅ Récupérer une formation publique par ID - VERSION CORRIGÉE
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📡 GET /formations/${id} - Détails formation`);

    // Vérifier et convertir l'ID
    const formationId = parseInt(id);
    
    if (isNaN(formationId)) {
      console.log(`❌ ID invalide: ${id}`);
      return res.status(400).json({
        success: false,
        error: 'ID de formation invalide'
      });
    }

    // Récupérer la formation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId, // ✅ AJOUTÉ: Condition id
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
      console.log(`❌ Formation ${id} non trouvée ou inactive`);
      return res.status(404).json({
        success: false,
        error: 'Formation non disponible'
      });
    }

    // Incrémenter le compteur de vues
    await prisma.formation.update({
      where: { id: formationId },
      data: { views: { increment: 1 } }
    });

    console.log(`✅ Formation ${id} trouvée, vues incrémentées`);

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
      views: formation.views + 1, // +1 pour la vue actuelle
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

// ✅ Postuler à une formation
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivation } = req.body;
    
    console.log(`📡 POST /formations/${id}/apply - Candidature`);

    // Vérifier si la formation existe et est active
    const formation = await prisma.formation.findFirst({
      where: {
        id: parseInt(id),
        status: 'active'
      }
    });

    if (!formation) {
      console.log(`❌ Formation ${id} non trouvée ou inactive`);
      return res.status(404).json({
        success: false,
        error: 'Formation non disponible'
      });
    }

    // Vérifier l'authentification pour les candidatures
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Pas de token pour la candidature');
      return res.status(401).json({
        success: false,
        error: 'Veuillez vous connecter pour postuler'
      });
    }

    // Ici, vous devriez vérifier le token JWT et récupérer l'utilisateur
    // Pour l'instant, on simule une application réussie
    
    // Vérifier si l'utilisateur a déjà postulé (vous devriez vérifier dans la table Candidature)
    // Pour l'instant, on suppose que c'est la première candidature

    // Incrémenter le compteur de candidatures
    await prisma.formation.update({
      where: { id: parseInt(id) },
      data: {
        applications: { increment: 1 },
        currentParticipants: { increment: 1 }
      }
    });

    console.log(`✅ Candidature enregistrée pour formation ${id}`);

    res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès !',
      data: {
        formationId: id,
        formationTitle: formation.title,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Erreur postulation formation:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la postulation'
    });
  }
});

// ✅ Recherche avancée de formations
router.get('/search/advanced', async (req, res) => {
  try {
    const filters = req.query;
    console.log('🔍 Recherche avancée:', filters);

    // Cette route peut être utilisée pour des recherches plus complexes
    // Pour l'instant, redirige vers la route principale
    res.redirect(`/api/formations?${new URLSearchParams(filters).toString()}`);
  } catch (error) {
    console.error('❌ Erreur recherche avancée:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
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

module.exports = router;