// routes/art-creation.js - VERSION NETTOYÉE
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ✅ ROUTE DE TEST
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Art & Création fonctionne!',
    timestamp: new Date().toISOString()
  });
});

// ✅ ROUTE POUR LES CATÉGORIES DE PHOTOGRAPHIE
router.get('/photographie/categories', async (req, res) => {
  try {
    const photoMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'photo', mode: 'insensitive' } },
          { libelle: { contains: 'photographe', mode: 'insensitive' } },
          { libelle: { contains: 'image', mode: 'insensitive' } },
          { libelle: { contains: 'camera', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

    const categoriesWithCount = [];
    
    for (const metier of photoMetiers) {
      try {
        const userCount = await prisma.utilisateurMetier.count({
          where: {
            metierId: metier.id,
            user: {
              OR: [
                { role: 'professional' },
                { userType: 'PRESTATAIRE' },
                { userType: 'PROFESSIONAL' }
              ]
            }
          }
        });
        
        categoriesWithCount.push({
          id: metier.id,
          name: metier.libelle || 'Photographe',
          count: userCount,
          slug: (metier.libelle || 'photographe')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        });
      } catch (error) {
        categoriesWithCount.push({
          id: metier.id,
          name: metier.libelle || 'Photographe',
          count: 0,
          slug: 'photographe'
        });
      }
    }

    const categories = categoriesWithCount.filter(cat => cat.count > 0);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error("Erreur récupération catégories photo:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories"
    });
  }
});

// ✅ ROUTE PRINCIPALE POUR LES PHOTOGRAPHES
router.get('/photographers', async (req, res) => {

  try {
    const { 
      search = '', 
      location = '', 
      category = '',
      limit = 20,
      page = 1,
      sort = 'newest'
    } = req.query;

    const photoMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'photo', mode: 'insensitive' } },
          { libelle: { contains: 'photographe', mode: 'insensitive' } },
          { libelle: { contains: 'image', mode: 'insensitive' } },
          { libelle: { contains: 'camera', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

    if (photoMetiers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier photographie trouvé dans la base',
        data: []
      });
    }

    const metierIds = photoMetiers.map(m => m.id);

    const where = {
      ...(metierIds.length > 0 && {
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        }
      })
    };

    const roleCondition = {
      OR: [
        { role: 'professional' },
        { userType: 'PRESTATAIRE' },
        { userType: 'PROFESSIONAL' }
      ]
    };
    
    where.AND = [roleCondition];

    if (search && search.trim() !== '') {
      where.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { commercialName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (location && location.trim() !== '') {
      where.AND.push({
        city: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      });
    }

    const orderBy = {};
    switch (sort) {
      case 'name':
        orderBy.firstName = 'asc';
        orderBy.lastName = 'asc';
        break;
      case 'rating':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          companyName: true,
          commercialName: true,
          userType: true,
          role: true,
          address: true,
          city: true,
          zipCode: true,
          createdAt: true,
          status: true,
          
          metiers: {
            where: metierIds.length > 0 ? {
              metierId: {
                in: metierIds
              }
            } : {},
            include: {
              metier: {
                select: {
                  id: true,
                  libelle: true
                }
              }
            }
          }
        },
        orderBy
      }),
      prisma.user.count({ where })
    ]);

    const formattedProfessionals = users.map(user => {
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.companyName || user.commercialName || 'Professionnel';
      
      const userMetiers = user.metiers || [];
      const primaryMetier = userMetiers[0]?.metier;
      
      const rating = Math.random() * 2 + 3;
      const reviewCount = Math.floor(Math.random() * 50);

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: name,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        commercialName: user.commercialName,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        avatar: user.avatar,
        verified: false,
        status: user.status,
        createdAt: user.createdAt,
        
        specialty: primaryMetier?.libelle || 'Photographe',
        
        metiers: userMetiers.map(um => ({
          id: um.metier.id,
          name: um.metier.libelle
        })),
        
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount,
        
        services: [],
        
        isAvailable: user.status === 'active'
      };
    });

    res.json({
      success: true,
      count: formattedProfessionals.length,
      total: totalCount,
      message: formattedProfessionals.length > 0 
        ? `${formattedProfessionals.length} professionnels trouvés`
        : 'Aucun professionnel ne correspond à vos critères',
      data: formattedProfessionals,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(totalCount / take) || 1
      }
    });

  } catch (error) {
    console.error("ERREUR récupération photographes:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message
    });
  }
});

// ✅ ROUTE POUR LES SCULPTEURS (CORRIGÉE)
router.get('/sculpture/products', async (req, res) => {
  try {
    
    const { 
      search = '', 
      location = '', 
      limit = 20,
      page = 1,
      sort = 'newest'
    } = req.query;

    // Récupérer les métiers de sculpture - VERSION SIMPLIFIÉE
    const sculptureMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'sculpteur', mode: 'insensitive' } },
          { libelle: { contains: 'sculpture', mode: 'insensitive' } },
          { libelle: { contains: 'sculpt', mode: 'insensitive' } }
          // Supprimez { categorie: { equals: 'sculpture', mode: 'insensitive' } }
          // si la colonne 'categorie' n'existe pas dans votre base
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

    

    if (sculptureMetiers.length === 0) {
      console.log("⚠️ Aucun métier sculpture trouvé");
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier sculpture trouvé dans la base',
        data: []
      });
    }

    const metierIds = sculptureMetiers.map(m => m.id);
    

    // Construction de la requête WHERE
    const whereConditions = {
      AND: [
        {
          OR: [
            { role: 'professional' },
            { userType: 'PRESTATAIRE' },
            { userType: 'PROFESSIONAL' }
          ]
        }
      ]
    };

    // Ajout de la condition des métiers
    if (metierIds.length > 0) {
      whereConditions.AND.push({
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        }
      });
    }

    // Condition de recherche
    if (search && search.trim() !== '') {
      whereConditions.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { commercialName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Condition de localisation
    if (location && location.trim() !== '') {
      whereConditions.AND.push({
        city: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      });
    }
    
    const orderBy = {};
    switch (sort) {
      case 'name':
        orderBy.firstName = 'asc';
        orderBy.lastName = 'asc';
        break;
      case 'rating':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereConditions,
          skip,
          take,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyName: true,
            commercialName: true,
            userType: true,
            role: true,
            address: true,
            city: true,
            zipCode: true,
            createdAt: true,
            status: true,
            
            metiers: {
              where: {
                metierId: {
                  in: metierIds
                }
              },
              include: {
                metier: {
                  select: {
                    id: true,
                    libelle: true
                  }
                }
              }
            }
          },
          orderBy
        }),
        prisma.user.count({ where: whereConditions })
      ]);


      const formattedSculptors = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Sculpteur';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        // Générer un rating et review count pour l'affichage
        const rating = Math.random() * 2 + 3; // Entre 3 et 5
        const reviewCount = Math.floor(Math.random() * 50);

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: name,
          email: user.email,
          phone: user.phone,
          companyName: user.companyName,
          commercialName: user.commercialName,
          address: user.address,
          city: user.city,
          zipCode: user.zipCode,
          avatar: user.avatar,
          verified: user.status === 'active',
          status: user.status,
          createdAt: user.createdAt,
          
          specialty: primaryMetier?.libelle || 'Sculpteur',
          
          metiers: userMetiers.map(um => ({
            id: um.metier.id,
            name: um.metier.libelle
          })),
          
          rating: parseFloat(rating.toFixed(1)),
          reviewCount: reviewCount,
          
          services: [],
          
          isAvailable: user.status === 'active'
        };
      });

      res.json({
        success: true,
        count: formattedSculptors.length,
        total: totalCount,
        message: formattedSculptors.length > 0 
          ? `${formattedSculptors.length} sculpteurs trouvés`
          : 'Aucun sculpteur ne correspond à vos critères',
        data: formattedSculptors,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(totalCount / take) || 1
        }
      });

    } catch (prismaError) {
      console.error("❌ Erreur Prisma:", prismaError);
      res.status(500).json({
        success: false,
        error: "Erreur de base de données",
        message: prismaError.message,
        stack: process.env.NODE_ENV === 'development' ? prismaError.stack : undefined
      });
    }

  } catch (error) {
    console.error("🔥 ERREUR récupération sculpteurs:", error);
    console.error("🔥 Stack:", error.stack);
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ROUTE POUR LES PEINTRES
router.get('/peinture/products', async (req, res) => {
  try {
    
    
    const { 
      search = '', 
      location = '', 
      category = '',
      limit = 20,
      page = 1,
      sort = 'newest'
    } = req.query;

    // Récupérer les métiers de peinture - VERSION CORRIGÉE
    const peintureMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'peintre', mode: 'insensitive' } },
          { libelle: { contains: 'peinture', mode: 'insensitive' } },
          { libelle: { contains: 'peint', mode: 'insensitive' } }
          // Supprimez la condition sur 'categorie' car la colonne n'existe pas
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

   

    if (peintureMetiers.length === 0) {
      console.log("⚠️ Aucun métier peinture trouvé");
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier peinture trouvé dans la base',
        data: []
      });
    }

    const metierIds = peintureMetiers.map(m => m.id);
   

    // Construction de la requête WHERE
    const whereConditions = {
      AND: [
        {
          OR: [
            { role: 'professional' },
            { userType: 'PRESTATAIRE' },
            { userType: 'PROFESSIONAL' }
          ]
        }
      ]
    };

    // Ajout de la condition des métiers
    if (metierIds.length > 0) {
      whereConditions.AND.push({
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        }
      });
    }

    // Condition de recherche
    if (search && search.trim() !== '') {
      whereConditions.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { commercialName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Condition de localisation
    if (location && location.trim() !== '') {
      whereConditions.AND.push({
        city: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      });
    }


    const orderBy = {};
    switch (sort) {
      case 'name':
        orderBy.firstName = 'asc';
        orderBy.lastName = 'asc';
        break;
      case 'rating':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereConditions,
          skip,
          take,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyName: true,
            commercialName: true,
            userType: true,
            role: true,
            address: true,
            city: true,
            zipCode: true,
            createdAt: true,
            status: true,
            
            metiers: {
              where: {
                metierId: {
                  in: metierIds
                }
              },
              include: {
                metier: {
                  select: {
                    id: true,
                    libelle: true
                  }
                }
              }
            }
          },
          orderBy
        }),
        prisma.user.count({ where: whereConditions })
      ]);


      const formattedPainters = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Peintre';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        // Générer un rating et review count pour l'affichage
        const rating = Math.random() * 2 + 3; // Entre 3 et 5
        const reviewCount = Math.floor(Math.random() * 50);
        const worksCount = Math.floor(Math.random() * 30) + 5; // Entre 5 et 35 œuvres

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: name,
          email: user.email,
          phone: user.phone,
          companyName: user.companyName,
          commercialName: user.commercialName,
          address: user.address,
          city: user.city,
          zipCode: user.zipCode,
          avatar: user.avatar,
          verified: user.status === 'active',
          status: user.status,
          createdAt: user.createdAt,
          
          specialty: primaryMetier?.libelle || 'Peintre',
          works: worksCount,
          
          metiers: userMetiers.map(um => ({
            id: um.metier.id,
            name: um.metier.libelle
          })),
          
          rating: parseFloat(rating.toFixed(1)),
          reviewCount: reviewCount,
          
          bio: user.commercialName || user.companyName || 'Artiste spécialisé dans la peinture',
          
          isAvailable: user.status === 'active'
        };
      });

      res.json({
        success: true,
        count: formattedPainters.length,
        total: totalCount,
        message: formattedPainters.length > 0 
          ? `${formattedPainters.length} peintres trouvés`
          : 'Aucun peintre ne correspond à vos critères',
        data: formattedPainters,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(totalCount / take) || 1
        }
      });

    } catch (prismaError) {
      console.error("❌ Erreur Prisma:", prismaError);
      res.status(500).json({
        success: false,
        error: "Erreur de base de données",
        message: prismaError.message,
        stack: process.env.NODE_ENV === 'development' ? prismaError.stack : undefined
      });
    }

  } catch (error) {
    console.error("🔥 ERREUR récupération peintres:", error);
    console.error("🔥 Stack:", error.stack);
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ROUTE POUR LES ARTISANS
router.get('/artisanat/products', async (req, res) => {
  try {
        
    const { 
      search = '', 
      location = '', 
      category = '',
      limit = 20,
      page = 1,
      sort = 'newest'
    } = req.query;

    // Récupérer les métiers d'artisanat basés sur votre seed
    const artisanatMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'céramiste', mode: 'insensitive' } },
          { libelle: { contains: 'poterie', mode: 'insensitive' } },
          { libelle: { contains: 'tisserand', mode: 'insensitive' } },
          { libelle: { contains: 'maroquinier', mode: 'insensitive' } },
          { libelle: { contains: 'bijoutier', mode: 'insensitive' } },
          { libelle: { contains: 'ébéniste', mode: 'insensitive' } },
          { libelle: { contains: 'verrier', mode: 'insensitive' } },
          { libelle: { contains: 'vannier', mode: 'insensitive' } },
          { libelle: { contains: 'créateur textile', mode: 'insensitive' } },
          { libelle: { contains: 'créateur céramique', mode: 'insensitive' } },
          { libelle: { contains: 'créateur mobilier', mode: 'insensitive' } },
          { libelle: { contains: 'artisan', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });


    if (artisanatMetiers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier artisanat trouvé dans la base',
        data: []
      });
    }

    const metierIds = artisanatMetiers.map(m => m.id);

    // Construction de la requête WHERE
    const whereConditions = {
      AND: [
        {
          OR: [
            { role: 'professional' },
            { userType: 'PRESTATAIRE' },
            { userType: 'PROFESSIONAL' }
          ]
        }
      ]
    };

    // Ajout de la condition des métiers
    if (metierIds.length > 0) {
      whereConditions.AND.push({
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        }
      });
    }

    // Condition de recherche
    if (search && search.trim() !== '') {
      whereConditions.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { commercialName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Condition de localisation
    if (location && location.trim() !== '') {
      whereConditions.AND.push({
        city: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      });
    }

    const orderBy = {};
    switch (sort) {
      case 'name':
        orderBy.firstName = 'asc';
        orderBy.lastName = 'asc';
        break;
      case 'rating':
        orderBy.createdAt = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereConditions,
          skip,
          take,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            companyName: true,
            commercialName: true,
            userType: true,
            role: true,
            address: true,
            city: true,
            zipCode: true,
            createdAt: true,
            status: true,
            
            metiers: {
              where: {
                metierId: {
                  in: metierIds
                }
              },
              include: {
                metier: {
                  select: {
                    id: true,
                    libelle: true
                  }
                }
              }
            }
          },
          orderBy
        }),
        prisma.user.count({ where: whereConditions })
      ]);

      const formattedArtisans = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Artisan';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        // Générer des données pour l'affichage
        const rating = Math.random() * 2 + 3; // Entre 3 et 5
        const reviewCount = Math.floor(Math.random() * 50);
        const worksCount = Math.floor(Math.random() * 30) + 5;
        const yearsExperience = Math.floor(Math.random() * 20) + 5;
        const deliveryOptions = ['Sous 7 jours', 'Sous 10 jours', 'Sur devis', 'Sous 15 jours'];
        const deliveryTime = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: name,
          email: user.email,
          phone: user.phone,
          companyName: user.companyName,
          commercialName: user.commercialName,
          address: user.address,
          city: user.city,
          zipCode: user.zipCode,
          avatar: user.avatar,
          verified: user.status === 'active',
          status: user.status,
          createdAt: user.createdAt,
          
          specialty: primaryMetier?.libelle || 'Artisan',
          works: worksCount,
          yearsExperience: yearsExperience,
          deliveryTime: deliveryTime,
          
          metiers: userMetiers.map(um => ({
            id: um.metier.id,
            name: um.metier.libelle
          })),
          
          rating: parseFloat(rating.toFixed(1)),
          reviewCount: reviewCount,
          
          bio: user.commercialName || user.companyName || `Artisan spécialisé dans ${primaryMetier?.libelle || "l'artisanat"} depuis ${yearsExperience} ans.`,
          
          isAvailable: user.status === 'active'
        };
      });

      res.json({
        success: true,
        count: formattedArtisans.length,
        total: totalCount,
        message: formattedArtisans.length > 0 
          ? `${formattedArtisans.length} artisans trouvés`
          : 'Aucun artisan ne correspond à vos critères',
        data: formattedArtisans,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(totalCount / take) || 1
        }
      });

    } catch (prismaError) {
      console.error("❌ Erreur Prisma:", prismaError);
      res.status(500).json({
        success: false,
        error: "Erreur de base de données",
        message: prismaError.message,
        stack: process.env.NODE_ENV === 'development' ? prismaError.stack : undefined
      });
    }

  } catch (error) {
    console.error("🔥 ERREUR récupération artisans:", error);
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
const ProduitsArtEtCreation = require('./ProduitsArtEtCreation');

router.use('/products', ProduitsArtEtCreation);
module.exports = router;