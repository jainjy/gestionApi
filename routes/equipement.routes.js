const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer les équipements
router.get('/products', async (req, res) => {
  try {
    const { 
      search, 
      limit = 20, 
      offset = 0, 
      subcategory,
      minPrice,
      maxPrice,
      sortBy = 'featured',
      brand
    } = req.query;
    
    const whereClause = {
      category: 'Équipement Maison',
      status: 'active',
      visibility: 'public'
    };

    // Filtre par recherche
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par sous-catégorie
    if (subcategory && subcategory !== 'Toutes') {
      whereClause.subcategory = subcategory;
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // Filtre par marque
    if (brand && brand !== 'Toutes') {
      whereClause.brand = brand;
    }

    // Déterminer l'ordre de tri
    let orderBy = [];
    switch (sortBy) {
      case 'price-asc':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price-desc':
        orderBy = [{ price: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'popular':
        orderBy = [{ viewCount: 'desc' }];
        break;
      case 'featured':
      default:
        orderBy = [
          { featured: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        comparePrice: true,
        images: true,
        subcategory: true,
        quantity: true,
        featured: true,
        slug: true,
        createdAt: true,
        brand: true,
        viewCount: true,
        purchaseCount: true,
        clickCount: true,
        productType: true
      }
    });

    const total = await prisma.product.count({
      where: whereClause
    });

    // Récupérer les marques disponibles pour le filtrage
    const brands = await prisma.product.findMany({
      where: {
        category: 'Équipement Maison',
        status: 'active',
        brand: { not: null }
      },
      distinct: ['brand'],
      select: {
        brand: true
      }
    });

    // Récupérer les sous-catégories disponibles
    const subcategories = await prisma.product.findMany({
      where: {
        category: 'Équipement Maison',
        status: 'active',
        subcategory: { not: null }
      },
      distinct: ['subcategory'],
      select: {
        subcategory: true
      }
    });

    res.json({
      products,
      filters: {
        brands: brands.map(b => b.brand).filter(Boolean),
        subcategories: subcategories.map(s => s.subcategory).filter(Boolean),
        priceRange: {
          min: await prisma.product.aggregate({
            where: { category: 'Équipement Maison', status: 'active' },
            _min: { price: true }
          }),
          max: await prisma.product.aggregate({
            where: { category: 'Équipement Maison', status: 'active' },
            _max: { price: true }
          })
        }
      },
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + products.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching equipement products:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Récupérer les catégories d'équipement
router.get('/categories', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Récupérer tous les produits d'équipement
    const products = await prisma.product.findMany({
      where: {
        category: 'Équipement Maison',
        status: 'active',
        visibility: 'public'
      },
      select: {
        subcategory: true,
        brand: true,
        price: true
      }
    });

    // Compter les produits par sous-catégorie
    const categoryCounts = {};
    const categoryPrices = {};
    
    products.forEach(product => {
      const subcategory = product.subcategory || 'Non catégorisé';
      categoryCounts[subcategory] = (categoryCounts[subcategory] || 0) + 1;
      
      if (!categoryPrices[subcategory]) {
        categoryPrices[subcategory] = [];
      }
      categoryPrices[subcategory].push(product.price);
    });

    // Calculer les prix moyens
    const categories = Object.entries(categoryCounts).map(([name, count]) => {
      const prices = categoryPrices[name] || [];
      const avgPrice = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 0;
      
      const categoryConfig = getCategoryConfig(name);
      return {
        name,
        description: categoryConfig.description,
        image: categoryConfig.image,
        iconName: categoryConfig.iconName,
        productCount: count,
        avgPrice: Math.round(avgPrice),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      };
    });

    // Filtrer si recherche
    let filteredCategories = categories;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description.toLowerCase().includes(searchLower)
      );
    }

    res.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching equipement categories:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Configuration des catégories d'équipement
function getCategoryConfig(subcategory) {
  const configs = {
    'Électroménager': {
      description: 'Réfrigérateurs, lave-linge, fours et tous les appareils électroménagers haut de gamme',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Refrigerator'
    },
    'Cuisine': {
      description: 'Cuisines équipées, hottes, meubles et accessoires de cuisine sur mesure',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Utensils'
    },
    'Salon': {
      description: 'Canapés, fauteuils, tables basses et meubles de salon design',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Sofa'
    },
    'Salle à manger': {
      description: 'Tables, chaises, buffets et meubles de salle à manger élégants',
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Coffee'
    },
    'Chambre': {
      description: 'Lits, matelas, armoires et meubles de chambre confortables',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Bed'
    },
    'Climatisation': {
      description: 'Climatiseurs, ventilateurs et systèmes de régulation température',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Thermometer'
    },
    'Qualité air': {
      description: 'Purificateurs d\'air, humidificateurs et déshumidificateurs',
      image: 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Wind'
    },
    'Nettoyage': {
      description: 'Aspirateurs, robots aspirateurs et accessoires de nettoyage',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Sparkles'
    },
    'Rangement': {
      description: 'Dressings, armoires, étagères et systèmes de rangement sur mesure',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Package'
    },
    'Énergie': {
      description: 'Chauffe-eau, ballons thermodynamiques et solutions économes',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Zap'
    },
    'Bureau': {
      description: 'Bureaux, chaises de bureau et meubles de travail ergonomiques',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      iconName: 'Monitor'
    },
    'Salle de bain': {
      description: 'Meubles vasque, miroirs et accessoires de salle de bain',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      iconName: 'Droplets'
    }
  };

  return configs[subcategory] || {
    description: `Équipements de ${subcategory} pour votre maison`,
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    iconName: 'Home'
  };
}

module.exports = router;