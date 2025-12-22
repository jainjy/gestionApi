// routes/art-creation.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// ✅ CORRIGÉ: Récupérer les pros associés aux photographes
router.get('/products', async (req, res) => {
  try {
    const { metierId, type = 'service', category, location, limit = 20 } = req.query;
    
    console.log('📡 API appelée avec params:', { metierId, type, category, location });

    // Vérifier d'abord si le métier "photographe" existe
    let targetMetierId = metierId;
    
    if (!targetMetierId && (category?.includes('photo') || category?.includes('photographe'))) {
      const photoMetier = await prisma.metier.findFirst({
        where: {
          OR: [
            { name: { contains: 'photographe', mode: 'insensitive' } },
            { category: { contains: 'photo', mode: 'insensitive' } }
          ]
        }
      });
      
      if (photoMetier) {
        targetMetierId = photoMetier.id;
        console.log('📸 Métier photographe trouvé:', photoMetier.id, photoMetier.name);
      }
    }

    // Construire le filtre pour trouver les PROS ASSOCIÉS (pas les photographes eux-mêmes)
    const whereClause = {
      isActive: true,
      productType: 'service', // Seulement les services professionnels
      isProfessionalService: true,
      OR: [
        // Recherche par métier associé
        targetMetierId ? {
          tags: {
            has: `associated_metier:${targetMetierId}`
          }
        } : {},
        // Recherche par tags spécifiques aux pros photo
        {
          tags: {
            hasSome: ['galeriste_photo', 'agent_photographe', 'editeur_photo', 'marchand_photo']
          }
        },
        // Recherche par catégorie de service
        category ? {
          category: {
            contains: category,
            mode: 'insensitive'
          }
        } : {
          category: {
            contains: 'photo',
            mode: 'insensitive'
          }
        }
      ]
    };

    // Filtrer par localisation
    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    console.log('🔍 Filtre Prisma:', JSON.stringify(whereClause, null, 2));

    const products = await prisma.product.findMany({
      where: whereClause,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            city: true,
            verified: true,
            phone: true,
            email: true,
            bio: true,
            metiers: {
              include: {
                metier: {
                  select: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${products.length} produits trouvés`);

    // Formater la réponse pour les pros associés
    const formattedProducts = products.map(product => {
      // Trouver les métiers de l'utilisateur
      const userMetiers = product.user?.metiers || [];
      const primaryMetier = userMetiers[0]?.metier;
      
      return {
        id: product.id,
        userId: product.user.id,
        name: product.user.name || product.user.username,
        title: product.title || `Service ${product.category}`,
        specialty: product.category || primaryMetier?.name || 'Professionnel associé',
        description: product.description,
        location: product.location || product.user.city,
        rating: product.rating || 0,
        priceRange: product.price ? `${product.price}€` : 'Sur devis',
        price: product.price,
        image: product.images?.[0] || product.user.avatar,
        verified: product.user.verified || false,
        experience: 'Professionnel confirmé',
        tags: product.tags,
        type: 'pro',
        // Informations de contact
        contact: {
          phone: product.user.phone,
          email: product.user.email,
          canContact: true
        },
        // Métiers de l'utilisateur
        metiers: userMetiers.map(um => ({
          id: um.metier.id,
          name: um.metier.name,
          category: um.metier.category
        })),
        // Pour affichage
        isAvailable: product.availability !== 'unavailable'
      };
    });

    res.json({
      success: true,
      count: formattedProducts.length,
      message: formattedProducts.length > 0 
        ? `${formattedProducts.length} professionnels associés trouvés`
        : 'Aucun professionnel associé trouvé pour le moment',
      data: formattedProducts
    });

  } catch (error) {
    console.error("❌ Erreur récupération produits:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur de récupération des professionnels associés",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ NOUVELLE ROUTE: Récupérer les photographes ET leurs pros associés
router.get('/photography-ecosystem', async (req, res) => {
  try {
    const { includePhotographers = false } = req.query;
    
    // 1. Trouver le métier "photographe"
    const photoMetier = await prisma.metier.findFirst({
      where: {
        OR: [
          { name: { contains: 'photographe', mode: 'insensitive' } },
          { category: { contains: 'photo', mode: 'insensitive' } }
        ]
      }
    });

    if (!photoMetier) {
      return res.json({
        success: true,
        count: 0,
        message: 'Métier photographe non trouvé',
        photographers: [],
        associatedPros: []
      });
    }

    const results = {
      photographers: [],
      associatedPros: []
    };

    // 2. Récupérer les photographes (si demandé)
    if (includePhotographers === 'true') {
      const photographers = await prisma.userMetier.findMany({
        where: {
          metierId: photoMetier.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              city: true,
              verified: true,
              bio: true
            }
          },
          metier: true
        }
      });

      results.photographers = photographers.map(um => ({
        id: um.user.id,
        name: um.user.name,
        type: 'photographe',
        metier: um.metier.name,
        location: um.user.city,
        image: um.user.avatar,
        verified: um.user.verified
      }));
    }

    // 3. Récupérer les pros associés (services pour photographes)
    const associatedPros = await prisma.product.findMany({
      where: {
        isActive: true,
        productType: 'service',
        isProfessionalService: true,
        OR: [
          { tags: { has: `associated_metier:${photoMetier.id}` } },
          { tags: { hasSome: ['galeriste', 'agent', 'editeur', 'marchand'] } },
          { category: { contains: 'photo', mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            verified: true
          }
        }
      },
      take: 20
    });

    results.associatedPros = associatedPros.map(pro => ({
      id: pro.id,
      name: pro.user.name,
      title: pro.title,
      type: 'pro_associe',
      specialty: pro.category,
      location: pro.location || pro.user.city,
      image: pro.images?.[0] || pro.user.avatar,
      description: pro.description,
      price: pro.price ? `${pro.price}€` : 'Sur devis'
    }));

    res.json({
      success: true,
      count: results.photographers.length + results.associatedPros.length,
      message: `${results.photographers.length} photographes, ${results.associatedPros.length} pros associés`,
      ...results
    });

  } catch (error) {
    console.error("❌ Erreur écosystème photo:", error);
    res.status(500).json({
      success: false,
      error: "Erreur de récupération de l'écosystème photographique"
    });
  }
});

module.exports = router;