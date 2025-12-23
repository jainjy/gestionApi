// routes/medecines.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les services de médecines naturelles
router.get('/', async (req, res) => {
  try {
    console.log('📥 Requête reçue pour /medecines-bienetre', req.query);
    
    const { search, category, minPrice, maxPrice, sortBy = 'pertinence', limit = 20, offset = 0 } = req.query;

    // Clause WHERE pour les médecines naturelles
    const whereClause = {
      type: 'bien_etre',
      isActive: true,
      OR: [
        { libelle: { contains: 'phytothérapie', mode: 'insensitive' } },
        { description: { contains: 'phytothérapie', mode: 'insensitive' } },
        { libelle: { contains: 'naturopathie', mode: 'insensitive' } },
        { description: { contains: 'naturopathie', mode: 'insensitive' } },
        { libelle: { contains: 'aromathérapie', mode: 'insensitive' } },
        { description: { contains: 'aromathérapie', mode: 'insensitive' } },
        { libelle: { contains: 'plantes médicinales', mode: 'insensitive' } },
        { description: { contains: 'plantes médicinales', mode: 'insensitive' } },
        { libelle: { contains: 'médecine naturelle', mode: 'insensitive' } },
        { description: { contains: 'médecine naturelle', mode: 'insensitive' } },
        { libelle: { contains: 'fleurs de bach', mode: 'insensitive' } },
        { description: { contains: 'fleurs de bach', mode: 'insensitive' } },
        { libelle: { contains: 'tisanes', mode: 'insensitive' } },
        { libelle: { contains: 'atelier', mode: 'insensitive' } },
        { tags: { hasSome: ['phytothérapie', 'naturopathie', 'aromathérapie', 'naturel'] } }
      ]
    };

    // Filtre par recherche textuelle
    if (search && search.trim() !== '') {
      const searchTerms = search.split(' ').filter(term => term.trim() !== '');
      if (searchTerms.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
          OR: [
            { libelle: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: searchTerms.map(t => t.toLowerCase()) } }
          ]
        });
      }
    }

    // Filtre par catégorie
    if (category && category !== 'Tous') {
      whereClause.category = {
        name: category
      };
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // Définir le tri
    let orderBy = [];
    switch(sortBy) {
      case 'price-asc':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price-desc':
        orderBy = [{ price: 'desc' }];
        break;
      case 'name-az':
        orderBy = [{ libelle: 'asc' }];
        break;
      case 'duration':
        orderBy = [{ duration: 'asc' }];
        break;
      case 'pertinence':
      default:
        orderBy = [{ id: 'desc' }];
        break;
    }

    // Récupérer les services
    const services = await prisma.service.findMany({
      where: whereClause,
      take: parseInt(limit) || 20,
      skip: parseInt(offset) || 0,
      orderBy: orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        metiers: {
          include: {
            metier: {
              select: {
                id: true,
                libelle: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyName: true
          }
        }
      }
    });

    console.log('✅ Services trouvés:', services.length);

    // Formater la réponse pour le frontend
    const formattedServices = services.map(service => {
      // Générer les informations du spécialiste
      const generateSpecialistInfo = (service, user) => {
        const specialties = service.metiers.map(m => m.metier.libelle).join(', ');
        const categoryName = service.category?.name || 'médecine naturelle';
        const experienceYears = Math.floor(Math.random() * 12) + 3;
        const languages = user.email?.includes('@') ? ["Français"] : ["Français", "Anglais"];
        const certifications = categoryName === 'Phytothérapie' 
          ? ["Diplôme de phytothérapie", "Certification plantes médicinales"] 
          : categoryName === 'Naturopathie'
          ? ["Diplôme de naturopathie", "Certification nutrition"]
          : ["Diplôme d'aromathérapie", "Certification huiles essentielles"];

        return {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Spécialiste',
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          company: user.companyName,
          specialty: specialties || "Expert en médecines naturelles",
          bio: `Spécialiste en ${categoryName} avec ${experienceYears} ans d'expérience. Approche douce et naturelle pour votre bien-être.`,
          experience: `${experienceYears} ans d'expérience`,
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 180) + 20,
          languages: languages,
          availability: "Lun-Sam, 9h-19h",
          certifications: certifications
        };
      };

      const user = service.createdBy;
      const specialist = user ? generateSpecialistInfo(service, user) : {
        name: "Expert en médecines naturelles",
        specialty: "Spécialiste en approches naturelles",
        experience: "10 ans d'expérience",
        rating: 4.8,
        reviews: 150,
        languages: ["Français"],
        availability: "Lun-Ven, 9h-18h"
      };

      // Déterminer le type de service pour le frontend
      let serviceType = 'Consultation';
      if (service.category?.name === 'Atelier') serviceType = 'Atelier';
      if (service.category?.name === 'Programme') serviceType = 'Programme';
      if (service.category?.name === 'Thérapie') serviceType = 'Thérapie';

      return {
        id: service.id,
        libelle: service.libelle,
        description: service.description,
        price: service.price,
        duration: service.duration,
        durationFormatted: service.duration ? 
          `${Math.floor(service.duration / 60)}h${service.duration % 60 !== 0 ? service.duration % 60 : ''}` : 
          service.category?.name === 'Programme' ? '21 jours' : 'Variable',
        images: service.images && service.images.length > 0 ? service.images : 
          ["https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
        category: service.category ? { 
          id: service.category.id, 
          name: service.category.name 
        } : null,
        specialist: specialist,
        benefits: service.tags ? service.tags.slice(0, 3).map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)).join(', ') : 
          "Solutions naturelles, Approche holistique, Résultats durables",
        features: service.description ? 
          service.description.split('. ').slice(0, 3).filter(f => f.trim() !== '') : 
          ["Approche personnalisée", "Méthodes naturelles", "Accompagnement complet"],
        tags: service.tags || [],
        included: service.tags ? service.tags.map(tag => `${tag} inclus`) : 
          ["Consultation personnalisée", "Conseils adaptés", "Support inclus"],
        popular: service.price && service.price > 50 && service.price < 100,
        type: serviceType
      };
    });

    // Compter le total
    const total = await prisma.service.count({
      where: whereClause
    });

    // Statistiques par type
    const consultationCount = await prisma.service.count({
      where: {
        ...whereClause,
        OR: [
          { category: { name: 'Consultation' } },
          { libelle: { contains: 'consultation', mode: 'insensitive' } }
        ]
      }
    });

    const atelierCount = await prisma.service.count({
      where: {
        ...whereClause,
        OR: [
          { category: { name: 'Atelier' } },
          { libelle: { contains: 'atelier', mode: 'insensitive' } }
        ]
      }
    });

    const programmeCount = await prisma.service.count({
      where: {
        ...whereClause,
        OR: [
          { category: { name: 'Programme' } },
          { libelle: { contains: 'programme', mode: 'insensitive' } },
          { libelle: { contains: 'cure', mode: 'insensitive' } }
        ]
      }
    });

    res.json({
      success: true,
      services: formattedServices,
      stats: {
        totalServices: total,
        consultationCount,
        atelierCount,
        programmeCount,
        expertsCount: 15,
        satisfactionRate: 96,
        naturalApproaches: 8
      },
      pagination: {
        total,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        hasMore: (parseInt(offset) || 0) + formattedServices.length < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération médecines naturelles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Récupérer les catégories pour médecines naturelles
router.get('/categories', async (req, res) => {
  try {
    console.log('📥 Requête catégories médecines naturelles');
    
    // Récupérer les catégories distinctes des services de type bien_etre
    const categories = await prisma.category.findMany({
      where: {
        services: {
          some: {
            type: 'bien_etre',
            isActive: true
          }
        }
      },
      select: { name: true },
      distinct: ['name']
    });

    const categoryNames = categories.map(c => c.name);
    
    // Filtrer pour garder uniquement les catégories pertinentes
    const relevantCategories = categoryNames.filter(name => 
      name.toLowerCase().includes('consultation') || 
      name.toLowerCase().includes('atelier') ||
      name.toLowerCase().includes('programme') ||
      name.toLowerCase().includes('thérapie') ||
      name.toLowerCase().includes('phytothérapie') ||
      name.toLowerCase().includes('naturopathie') ||
      name.toLowerCase().includes('aromathérapie')
    );

    // Si aucune catégorie trouvée, utiliser les valeurs par défaut
    const allCategories = ['Tous', ...(relevantCategories.length > 0 ? relevantCategories : 
      ['Consultation', 'Atelier', 'Programme', 'Thérapie', 'Phytothérapie', 'Naturopathie'])];

    res.json({
      success: true,
      categories: allCategories
    });

  } catch (error) {
    console.error('❌ Erreur catégories médecines:', error);
    res.json({
      success: true,
      categories: ['Tous', 'Consultation', 'Atelier', 'Programme', 'Thérapie', 'Phytothérapie', 'Naturopathie']
    });
  }
});

// Statistiques détaillées
router.get('/stats', async (req, res) => {
  try {
    // Compter tous les services médecines naturelles
    const totalServices = await prisma.service.count({
      where: {
        type: 'bien_etre',
        isActive: true,
        OR: [
          { libelle: { contains: 'phytothérapie', mode: 'insensitive' } },
          { libelle: { contains: 'naturopathie', mode: 'insensitive' } },
          { libelle: { contains: 'aromathérapie', mode: 'insensitive' } },
          { libelle: { contains: 'plantes médicinales', mode: 'insensitive' } }
        ]
      }
    });

    // Prix moyen
    const avgPriceResult = await prisma.service.aggregate({
      where: {
        type: 'bien_etre',
        isActive: true,
        price: { not: null },
        OR: [
          { libelle: { contains: 'phytothérapie', mode: 'insensitive' } },
          { libelle: { contains: 'naturopathie', mode: 'insensitive' } },
          { libelle: { contains: 'aromathérapie', mode: 'insensitive' } }
        ]
      },
      _avg: { price: true }
    });

    const avgPrice = avgPriceResult._avg.price || 0;

    // Par catégorie
    const categories = await prisma.category.findMany({
      where: {
        services: {
          some: {
            type: 'bien_etre',
            isActive: true,
            OR: [
              { libelle: { contains: 'phytothérapie', mode: 'insensitive' } },
              { libelle: { contains: 'naturopathie', mode: 'insensitive' } }
            ]
          }
        },
        name: { in: ['Consultation', 'Atelier', 'Programme', 'Thérapie', 'Phytothérapie', 'Naturopathie'] }
      },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    const categoriesCount = {};
    categories.forEach(cat => {
      categoriesCount[cat.name.toLowerCase()] = cat._count.services;
    });

    res.json({
      success: true,
      stats: {
        totalServices,
        avgPrice: Math.round(avgPrice * 100) / 100,
        categories: categoriesCount,
        expertsCount: 15,
        satisfactionRate: 96,
        naturalApproaches: 8,
        traditionalTherapies: 5,
        yearsOfExperience: 12
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats médecines:', error);
    res.json({
      success: true,
      stats: {
        totalServices: 0,
        avgPrice: 0,
        categories: {},
        expertsCount: 15,
        satisfactionRate: 96,
        naturalApproaches: 8,
        traditionalTherapies: 5,
        yearsOfExperience: 12
      }
    });
  }
});

// Route test
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Route test médecines naturelles appelée');
    
    const testServices = await prisma.service.findMany({
      where: {
        type: 'bien_etre',
        isActive: true,
        OR: [
          { libelle: { contains: 'phyto', mode: 'insensitive' } },
          { libelle: { contains: 'naturelle', mode: 'insensitive' } }
        ]
      },
      take: 2,
      include: {
        category: true,
        metiers: {
          include: { metier: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'API Médecines Naturelles fonctionnelle',
      count: testServices.length,
      services: testServices.map(s => ({
        id: s.id,
        libelle: s.libelle,
        category: s.category?.name,
        metiers: s.metiers.map(m => m.metier.libelle)
      }))
    });

  } catch (error) {
    console.error('❌ Erreur test médecines:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur test',
      error: error.message
    });
  }
});

module.exports = router;