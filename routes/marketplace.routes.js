const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer les produits d'occasion
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
      category: 'Marketplace Occasion',
      status: 'active',
      visibility: 'public',
      quantity: { gt: 0 } // Seulement les produits disponibles
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
      case 'economy': // Tri par meilleure économie
        orderBy = [{ price: 'asc' }]; // Prix le plus bas d'abord = meilleure économie
        break;
      case 'featured':
      default:
        orderBy = [
          { featured: 'desc' },
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
    }

    // 🔥 CORRECTION : Retirer les champs qui n'existent pas dans le modèle
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
        // ⚠️ Retirer: condition, warrantyMonths, usageYears, originalPrice
        // car ils n'existent pas dans votre modèle Prisma actuel
      }
    });

    const total = await prisma.product.count({
      where: whereClause
    });

    // Récupérer les filtres disponibles
    const brands = await prisma.product.findMany({
      where: {
        category: 'Marketplace Occasion',
        status: 'active',
        brand: { not: null }
      },
      distinct: ['brand'],
      select: {
        brand: true
      }
    });

    const subcategoriesList = await prisma.product.findMany({
      where: {
        category: 'Marketplace Occasion',
        status: 'active',
        subcategory: { not: null }
      },
      distinct: ['subcategory'],
      select: {
        subcategory: true
      }
    });

    // Calculer les statistiques d'économie
    const calculateEconomyStats = async () => {
      const productsWithCompare = await prisma.product.findMany({
        where: {
          category: 'Marketplace Occasion',
          status: 'active',
          comparePrice: { gt: 0 },
          price: { gt: 0 }
        },
        select: {
          price: true,
          comparePrice: true
        }
      });

      if (productsWithCompare.length === 0) return { average: 0 };

      const totalDiscount = productsWithCompare.reduce((sum, product) => {
        const discount = 1 - (product.price / product.comparePrice);
        return sum + discount;
      }, 0);

      return {
        average: Math.round((totalDiscount / productsWithCompare.length) * 100)
      };
    };

    res.json({
      products,
      filters: {
        brands: brands.map(b => b.brand).filter(Boolean),
        subcategories: subcategoriesList.map(s => s.subcategory).filter(Boolean),
        priceRange: {
          min: await prisma.product.aggregate({
            where: { category: 'Marketplace Occasion', status: 'active' },
            _min: { price: true }
          }),
          max: await prisma.product.aggregate({
            where: { category: 'Marketplace Occasion', status: 'active' },
            _max: { price: true }
          })
        }
      },
      stats: {
        totalProducts: total,
        averageEconomy: await calculateEconomyStats()
      },
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + products.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      // Fallback pour le développement
      products: getMockProducts()
    });
  }
});

// Récupérer les catégories
router.get('/categories', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: 'Marketplace Occasion',
        status: 'active',
        visibility: 'public'
      },
      select: {
        subcategory: true,
        brand: true,
        price: true,
        comparePrice: true
      }
    });

    // Compter les produits par sous-catégorie
    const categoryCounts = {};
    
    products.forEach(product => {
      const subcategory = product.subcategory || 'Non catégorisé';
      categoryCounts[subcategory] = (categoryCounts[subcategory] || 0) + 1;
    });

    const categories = Object.entries(categoryCounts).map(([name, count]) => {
      const categoryConfig = getCategoryConfig(name);
      return {
        name,
        description: categoryConfig.description,
        image: categoryConfig.image,
        productCount: count
      };
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching marketplace categories:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      // Fallback pour le développement
      categories: [
        {
          name: "Électroménager",
          description: "Réfrigérateurs, lave-linge, fours et tous les appareils électroménagers d'occasion",
          image: "https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          productCount: 2
        },
        {
          name: "Ameublement",
          description: "Meubles d'occasion : canapés, tables, armoires, lits et chaises",
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          productCount: 3
        },
        {
          name: "Outils",
          description: "Outils de bricolage d'occasion : perceuses, scies, visseuses, matériel professionnel",
          image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          productCount: 2
        }
      ]
    });
  }
});

// Configuration des catégories marketplace
function getCategoryConfig(subcategory) {
  const configs = {
    'Électroménager': {
      description: 'Réfrigérateurs, lave-linge, fours et tous les appareils électroménagers d\'occasion',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Ameublement': {
      description: 'Meubles d\'occasion : canapés, tables, armoires, lits et chaises',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Outils': {
      description: 'Outils de bricolage d\'occasion : perceuses, scies, visseuses, matériel professionnel',
      image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Jardinage': {
      description: 'Matériel de jardinage d\'occasion : tondeuses, taille-haies, souffleurs',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Décoration': {
      description: 'Objets déco d\'occasion : lustres, miroirs, tableaux, vases',
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'High-tech': {
      description: 'Produits high-tech d\'occasion : tablettes, téléphones, ordinateurs',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Bricolage': {
      description: 'Matériel de bricolage d\'occasion : aspirateurs, ponceuses, compresseurs',
      image: 'https://images.unsplash.com/photo-1584568695800-3fcecaf6d1b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Cuisine': {
      description: 'Équipement cuisine d\'occasion : hottes, robots, ustensiles',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    'Bureau': {
      description: 'Mobilier de bureau d\'occasion : chaises, bureaux, rangements',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    }
  };

  return configs[subcategory] || {
    description: `Produits d'occasion de ${subcategory}`,
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  };
}

// Récupérer les statistiques marketplace
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.product.aggregate({
      where: {
        category: 'Marketplace Occasion',
        status: 'active'
      },
      _count: {
        id: true
      },
      _avg: {
        price: true,
        comparePrice: true
      },
      _sum: {
        quantity: true,
        viewCount: true,
        purchaseCount: true
      }
    });

    // Calculer l'économie moyenne
    const calculateAverageDiscount = async () => {
      const products = await prisma.product.findMany({
        where: {
          category: 'Marketplace Occasion',
          status: 'active',
          comparePrice: { gt: 0 },
          price: { gt: 0 }
        },
        select: {
          price: true,
          comparePrice: true
        }
      });

      if (products.length === 0) return 0;

      const totalDiscount = products.reduce((sum, product) => {
        const discount = 1 - (product.price / product.comparePrice);
        return sum + discount;
      }, 0);

      return Math.round((totalDiscount / products.length) * 100);
    };

    const averageDiscount = await calculateAverageDiscount();

    // Produits les plus vus
    const mostViewed = await prisma.product.findMany({
      where: {
        category: 'Marketplace Occasion',
        status: 'active'
      },
      select: {
        name: true,
        viewCount: true,
        subcategory: true
      },
      orderBy: {
        viewCount: 'desc'
      },
      take: 5
    });

    // Catégories les plus populaires
    const topCategories = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: 'Marketplace Occasion',
        status: 'active'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    res.json({
      summary: {
        totalProducts: stats._count.id,
        totalStock: stats._sum.quantity,
        averagePrice: stats._avg.price ? stats._avg.price.toFixed(2) : 0,
        averageOriginalPrice: stats._avg.comparePrice ? stats._avg.comparePrice.toFixed(2) : 0,
        averageDiscount: averageDiscount + '%',
        totalViews: stats._sum.viewCount || 0,
        totalPurchases: stats._sum.purchaseCount || 0
      },
      mostViewed: mostViewed,
      topCategories: topCategories.map(cat => ({
        name: cat.subcategory || 'Non catégorisé',
        count: cat._count.id
      }))
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      // Fallback pour le développement
      summary: {
        totalProducts: 12,
        totalStock: 20,
        averagePrice: "250.00",
        averageOriginalPrice: "450.00",
        averageDiscount: "45%",
        totalViews: 1500,
        totalPurchases: 120
      }
    });
  }
});

// Fonction pour générer des produits mockés (pour le développement)
function getMockProducts() {
  return [
    {
      id: "1",
      name: "Lave-linge Samsung 8kg - WW80J5355MW",
      description: "Lave-linge frontal 8kg, technologie EcoBubble, programme Rapide 15 minutes, classe A+++, excellent état, seulement 2 ans d'utilisation. Vérifié et nettoyé par nos experts. **OCCASION - GARANTIE 6 MOIS**",
      price: 250.00,
      comparePrice: 450.00,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Électroménager",
      quantity: 3,
      featured: true,
      slug: "lave-linge-samsung-8kg-ww80j5355mw",
      brand: "Samsung",
      viewCount: 156,
      purchaseCount: 45,
      clickCount: 320,
      productType: "occasion",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "Réfrigérateur Américain Whirlpool 550L",
      description: "Réfrigérateur américain 550L, distributeur d'eau et de glaçons, contrôle électronique, compartiment fraîcheur, classe A++, 3 ans d'utilisation, fonctionne parfaitement. **OCCASION - GARANTIE 6 MOIS**",
      price: 650.00,
      comparePrice: 1200.00,
      images: ["https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Électroménager",
      quantity: 2,
      featured: true,
      slug: "refrigerateur-americain-whirlpool-550l",
      brand: "Whirlpool",
      viewCount: 89,
      purchaseCount: 32,
      clickCount: 210,
      productType: "occasion",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Table à Manger Bois Massif Chêne Extensible",
      description: "Table extensible en chêne massif pour 6-10 personnes, style industriel avec pieds métal, quelques marques d'usage donnant du caractère. **OCCASION - ÉTAT BON**",
      price: 380.00,
      comparePrice: 750.00,
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Ameublement",
      quantity: 1,
      featured: true,
      slug: "table-manger-chene-massif-extensible",
      brand: "Artisan",
      viewCount: 124,
      purchaseCount: 8,
      clickCount: 280,
      productType: "occasion",
      createdAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "Canapé 3 Places d'Angle Convertible",
      description: "Canapé d'angle convertible en lit 140x200, tissu microfibre gris anthracite, mécanisme récent vérifié, nettoyé professionnellement. **OCCASION - ÉTAT TRÈS BON**",
      price: 450.00,
      comparePrice: 850.00,
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Ameublement",
      quantity: 1,
      featured: false,
      slug: "canape-3-places-angle-convertible",
      brand: "Conforama",
      viewCount: 67,
      purchaseCount: 18,
      clickCount: 145,
      productType: "occasion",
      createdAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "Scie Circulaire sur Table Bosch PTS 10",
      description: "Scie circulaire sur table 1500W, profondeur de coupe 70mm, inclinaison 45°, guide parallèle, peu utilisée, manuel d'origine, tous accessoires présents. **OCCASION - COMME NEUF**",
      price: 95.00,
      comparePrice: 220.00,
      images: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Outils",
      quantity: 2,
      featured: true,
      slug: "scie-circulaire-bosch-pts-10",
      brand: "Bosch",
      viewCount: 92,
      purchaseCount: 15,
      clickCount: 178,
      productType: "occasion",
      createdAt: new Date().toISOString()
    },
    {
      id: "6",
      name: "Tondeuse Thermique Autotractée McCulloch",
      description: "Tondeuse thermique 163cc, bac ramassage 70L, démarrage électrique, largeur coupe 46cm, hauteur réglable 25-75mm, très peu utilisée (10h environ). **OCCASION - COMME NEUF**",
      price: 320.00,
      comparePrice: 650.00,
      images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Jardinage",
      quantity: 1,
      featured: true,
      slug: "tondeuse-thermique-mcculloch",
      brand: "McCulloch",
      viewCount: 145,
      purchaseCount: 22,
      clickCount: 267,
      productType: "occasion",
      createdAt: new Date().toISOString()
    }
  ];
}

module.exports = router;