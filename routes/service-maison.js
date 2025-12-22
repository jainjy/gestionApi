const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les services maison
router.get('/maison', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        category: {
          name: 'Services Maison'
        },
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        metiers: {
          include: {
            metier: {
              select: {
                libelle: true
              }
            }
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    });

    // Transformer les données
    const formattedServices = services.map(service => ({
      id: service.id,
      libelle: service.libelle,
      description: service.description || '',
      price: service.price,
      duration: service.duration,
      images: service.images || [],
      category: service.category || { name: 'Services Maison' },
      tags: service.tags || [],
      metiers: service.metiers || []
    }));

    res.json(formattedServices);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer les services avec filtres optionnels (si backend filtering nécessaire)
router.get('/', async (req, res) => {
  try {
    const { categoryName, minPrice, maxPrice, metier, sort } = req.query;
    
    let whereClause = {
      isActive: true
    };

    // Filtre par catégorie
    if (categoryName) {
      whereClause.category = {
        name: categoryName
      };
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // Filtre par métier
    if (metier) {
      whereClause.metiers = {
        some: {
          metier: {
            libelle: metier
          }
        }
      };
    }

    // Tri
    let orderBy = { libelle: 'asc' };
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    if (sort === 'price-desc') orderBy = { price: 'desc' };
    if (sort === 'duration-asc') orderBy = { duration: 'asc' };

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true
          }
        },
        metiers: {
          include: {
            metier: {
              select: {
                libelle: true
              }
            }
          }
        }
      },
      orderBy
    });

    res.json(services);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;