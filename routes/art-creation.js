// routes/art-creation.js - VERSION CORRIGÉE COMPLÈTE
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

// ✅ ROUTE PRINCIPALE POUR LES PHOTOGRAPHES - CORRIGÉE
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

    // ✅ CORRECTION : Utiliser une seule variable 'where'
    const where = {
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

    // ✅ Condition des métiers
    if (metierIds.length > 0) {
      where.AND.push({
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

    // Condition de localisation
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
        where, // ✅ Utiliser 'where' ici
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
          },
          
          // ✅ AJOUTER LES PRODUITS (ŒUVRES D'ART)
          Product: {
            where: {
              productType: 'artwork',
              status: 'published'
            },
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              quantity: true,
              status: true,
              category: true,
              subcategory: true
            },
            take: 5
          }
        },
        orderBy
      }),
      prisma.user.count({ 
        where // ✅ Utiliser 'where' ici aussi
      })
    ]);

    const formattedProfessionals = users.map(user => {
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.companyName || user.commercialName || 'Professionnel';
      
      const userMetiers = user.metiers || [];
      const primaryMetier = userMetiers[0]?.metier;
      
      const rating = Math.random() * 2 + 3;
      const reviewCount = Math.floor(Math.random() * 50);
      
      // ✅ Compter les œuvres disponibles
      const availableProducts = user.Product || [];
      const totalProducts = availableProducts.length;
      const availableCount = availableProducts.filter(p => p.quantity > 0).length;

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
        
        // ✅ AJOUTER LES INFORMATIONS SUR LES PRODUITS
        products: {
          total: totalProducts,
          available: availableCount,
          sample: availableProducts.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.images?.[0] || null,
            category: p.category,
            type: p.subcategory,
            quantity: p.quantity,
            isAvailable: p.quantity > 0
          }))
        },
        
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

// ✅ ROUTE POUR LES SCULPTEURS - CORRIGÉE
router.get('/sculpture/products', async (req, res) => {
  try {
    const { 
      search = '', 
      location = '', 
      limit = 20,
      page = 1,
      sort = 'newest'
    } = req.query;

    // Récupérer les métiers de sculpture
    const sculptureMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'sculpteur', mode: 'insensitive' } },
          { libelle: { contains: 'sculpture', mode: 'insensitive' } },
          { libelle: { contains: 'sculpt', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

    if (sculptureMetiers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier sculpture trouvé dans la base',
        data: []
      });
    }

    const metierIds = sculptureMetiers.map(m => m.id);

    // ✅ CORRECTION : Utiliser 'where' au lieu de 'whereConditions'
    const where = {
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
      where.AND.push({
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
      where.AND.push({
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

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where, // ✅ Utiliser 'where'
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
            },
            
            // ✅ AJOUTER LES PRODUITS
            Product: {
              where: {
                productType: 'artwork',
                status: 'published'
              },
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                quantity: true,
                status: true,
                category: true,
                subcategory: true
              },
              take: 5
            }
          },
          orderBy
        }),
        prisma.user.count({ 
          where // ✅ Utiliser 'where'
        })
      ]);

      const formattedSculptors = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Sculpteur';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        const rating = Math.random() * 2 + 3;
        const reviewCount = Math.floor(Math.random() * 50);
        
        // ✅ Compter les œuvres disponibles
        const availableProducts = user.Product || [];
        const totalProducts = availableProducts.length;
        const availableCount = availableProducts.filter(p => p.quantity > 0).length;

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
          
          // ✅ AJOUTER LES INFORMATIONS SUR LES PRODUITS
          products: {
            total: totalProducts,
            available: availableCount,
            sample: availableProducts.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.images?.[0] || null,
              category: p.category,
              type: p.subcategory,
              quantity: p.quantity,
              isAvailable: p.quantity > 0
            }))
          },
          
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
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ROUTE POUR LES PEINTRES - CORRIGÉE
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

    // Récupérer les métiers de peinture
    const peintureMetiers = await prisma.metier.findMany({
      where: {
        OR: [
          { libelle: { contains: 'peintre', mode: 'insensitive' } },
          { libelle: { contains: 'peinture', mode: 'insensitive' } },
          { libelle: { contains: 'peint', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        libelle: true
      }
    });

    if (peintureMetiers.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: 'Aucun métier peinture trouvé dans la base',
        data: []
      });
    }

    const metierIds = peintureMetiers.map(m => m.id);

    // ✅ CORRECTION : Utiliser 'where' au lieu de 'whereConditions'
    const where = {
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
      where.AND.push({
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
      where.AND.push({
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

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where, // ✅ Utiliser 'where'
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
            },
            
            // ✅ AJOUTER LES PRODUITS
            Product: {
              where: {
                productType: 'artwork',
                status: 'published'
              },
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                quantity: true,
                status: true,
                category: true,
                subcategory: true
              },
              take: 5
            }
          },
          orderBy
        }),
        prisma.user.count({ 
          where // ✅ Utiliser 'where'
        })
      ]);

      const formattedPainters = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Peintre';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        const rating = Math.random() * 2 + 3;
        const reviewCount = Math.floor(Math.random() * 50);
        const worksCount = Math.floor(Math.random() * 30) + 5;
        
        // ✅ Compter les œuvres disponibles
        const availableProducts = user.Product || [];
        const totalProducts = availableProducts.length;
        const availableCount = availableProducts.filter(p => p.quantity > 0).length;

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
          
          // ✅ AJOUTER LES INFORMATIONS SUR LES PRODUITS
          products: {
            total: totalProducts,
            available: availableCount,
            sample: availableProducts.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.images?.[0] || null,
              category: p.category,
              type: p.subcategory,
              quantity: p.quantity,
              isAvailable: p.quantity > 0
            }))
          },
          
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
    
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ ROUTE POUR LES ARTISANS - CORRIGÉE
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

    // Récupérer les métiers d'artisanat
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

    // ✅ CORRECTION : Utiliser 'where' au lieu de 'whereConditions'
    const where = {
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
      where.AND.push({
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
      where.AND.push({
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

    try {
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where, // ✅ Utiliser 'where'
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
            },
            
            // ✅ AJOUTER LES PRODUITS
            Product: {
              where: {
                productType: 'artwork',
                status: 'published'
              },
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                quantity: true,
                status: true,
                category: true,
                subcategory: true
              },
              take: 5
            }
          },
          orderBy
        }),
        prisma.user.count({ 
          where // ✅ Utiliser 'where'
        })
      ]);

      const formattedArtisans = users.map(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.companyName || user.commercialName || 'Artisan';
        
        const userMetiers = user.metiers || [];
        const primaryMetier = userMetiers[0]?.metier;
        
        const rating = Math.random() * 2 + 3;
        const reviewCount = Math.floor(Math.random() * 50);
        const worksCount = Math.floor(Math.random() * 30) + 5;
        const yearsExperience = Math.floor(Math.random() * 20) + 5;
        const deliveryOptions = ['Sous 7 jours', 'Sous 10 jours', 'Sur devis', 'Sous 15 jours'];
        const deliveryTime = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];
        
        // ✅ Compter les œuvres disponibles
        const availableProducts = user.Product || [];
        const totalProducts = availableProducts.length;
        const availableCount = availableProducts.filter(p => p.quantity > 0).length;

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
          
          // ✅ AJOUTER LES INFORMATIONS SUR LES PRODUITS
          products: {
            total: totalProducts,
            available: availableCount,
            sample: availableProducts.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.images?.[0] || null,
              category: p.category,
              type: p.subcategory,
              quantity: p.quantity,
              isAvailable: p.quantity > 0
            }))
          },
          
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

// ✅ ROUTE MARKETPLACE - CORRIGÉE
router.get('/marketplace/all', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12,
      search = '',
      location = '',
      type = '',
      category = ''
    } = req.query;

    console.log('📊 Route marketplace/all appelée avec params:', {
      page, limit, search, location, type, category
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // ✅ Ajouter le filtre de quantité si nécessaire (décommentez si vous voulez filtrer)
    const where = {
      productType: 'artwork',
      status: 'published'
      // quantity: { gt: 0 } // Décommentez pour ne montrer que les œuvres disponibles
    };

    // Filtre par recherche
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par type
    if (type && type !== 'all') {
      where.subcategory = type;
    }

    // Filtre par catégorie
    if (category && category !== 'all') {
      where.category = category;
    }

    // Filtre par localisation
    if (location && location.trim() !== '') {
      where.User = {
        city: {
          contains: location.trim(),
          mode: 'insensitive'
        }
      };
    }

    console.log('🔍 Requête Prisma WHERE:', JSON.stringify(where, null, 2));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              companyName: true,
              commercialName: true,
              city: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    console.log('📦 Résultats de la requête:', {
      productsCount: products.length,
      totalCount: total
    });

    // Formater les œuvres pour le marketplace
    const formattedOeuvres = products.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      images: product.images,
      price: product.price,
      quantity: product.quantity, // ✅ Ajouter la quantité
      isAvailable: product.quantity > 0, // ✅ Indiquer si disponible
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
      type: product.subcategory,
      category: product.category,
      userId: product.userId,
      artist: product.User?.companyName || 
             `${product.User?.firstName} ${product.User?.lastName}`.trim(),
      professional: {
        id: product.userId,
        name: product.User?.companyName || 
              `${product.User?.firstName} ${product.User?.lastName}`.trim(),
        avatar: product.User?.avatar,
        city: product.User?.city
      },
      dimensions: product.dimensions,
      views: product.viewCount || 0,
      likes: 0,
      status: product.status
    }));

    res.json({
      success: true,
      count: products.length,
      total,
      data: formattedOeuvres,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur marketplace:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des œuvres du marketplace',
      message: error.message
    });
  }
});

const ProduitsArtEtCreation = require('./ProduitsArtEtCreation');

router.use('/products', ProduitsArtEtCreation);

// ✅ ROUTE POUR LES ŒUVRES D'UN PROFESSIONNEL SPÉCIFIQUE
router.get('/products/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    
    console.log('🔍 Route œuvres par professionnel appelée:', professionalId);
    
    const { 
      status = 'published',
      quantity = 1
    } = req.query;

    // Chercher uniquement les œuvres d'art PUBLIÉES de ce professionnel
    const where = {
      userId: professionalId,
      productType: 'artwork',
      status: status,
      // Optionnel : filtrer par quantité disponible
      ...(quantity === '1' && { quantity: { gt: 0 } })
    };

    console.log('📊 Requête Prisma WHERE:', where);

    const [products, professional] = await Promise.all([
      // 1. Récupérer les œuvres
      prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              companyName: true,
              commercialName: true,
              city: true
            }
          }
        }
      }),
      
      // 2. Récupérer les infos du professionnel
      prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          commercialName: true,
          avatar: true,
          city: true,
          email: true
        }
      })
    ]);

    console.log('📦 Résultats:', {
      productsCount: products.length,
      professional: professional
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Professionnel non trouvé'
      });
    }

    // Formater les œuvres
    const formattedOeuvres = products.map(product => ({
      id: product.id,
      title: product.name,
      name: product.name,
      description: product.description,
      image: product.images && product.images.length > 0 ? product.images[0] : '',
      images: product.images || [],
      price: product.price,
      quantity: product.quantity,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
      type: product.subcategory,
      category: product.category,
      userId: product.userId,
      artist: product.User?.companyName || 
              `${product.User?.firstName} ${product.User?.lastName}`.trim(),
      professional: {
        id: product.userId,
        name: product.User?.companyName || 
              `${product.User?.firstName} ${product.User?.lastName}`.trim(),
        avatar: product.User?.avatar,
        city: product.User?.city
      },
      status: product.status
    }));

    res.json({
      success: true,
      count: products.length,
      data: formattedOeuvres,
      professional: {
        id: professionalId,
        name: professional.companyName || 
              `${professional.firstName} ${professional.lastName}`.trim(),
        email: professional.email,
        avatar: professional.avatar,
        city: professional.city
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération œuvres professionnel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des œuvres',
      message: error.message
    });
  }
});
module.exports = router;