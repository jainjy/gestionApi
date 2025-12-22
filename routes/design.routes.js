const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// design.routes.js - Correction de la route /products
router.get('/products', async (req, res) => {
  try {
    const { search, limit = 20, offset = 0, subcategory } = req.query;
    
    const whereClause = {
      category: 'Design & Décoration',
      status: 'active',
      visibility: 'public'
    };

    // Filtre par recherche
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par sous-catégorie
    if (subcategory && subcategory !== 'Toutes') {
      whereClause.subcategory = subcategory;
    }

    // 🔥 CORRECTION : orderBy doit être un tableau ou un objet unique
    const products = await prisma.product.findMany({
      where: whereClause,
      take: parseInt(limit),
      skip: parseInt(offset),
      // Option 1 : Tableau d'objets (recommandé)
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      // Option 2 : OU un objet unique si vous ne voulez qu'un critère
      // orderBy: { featured: 'desc' } // puis ajoutez un autre .sort() en JS si nécessaire
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
        createdAt: true
      }
    });

    const total = await prisma.product.count({
      where: whereClause
    });

    res.json({
      products,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + products.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching design products:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Version avec tri dynamique
router.get('/products/sorted', async (req, res) => {
  try {
    const { sortBy = 'popular', search, subcategory, limit = 50 } = req.query;
    
    const whereClause = {
      category: 'Design & Décoration',
      status: 'active',
      visibility: 'public'
    };

    // Filtre par recherche
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par sous-catégorie
    if (subcategory && subcategory !== 'Toutes') {
      whereClause.subcategory = subcategory;
    }

    // Définir le tri selon le paramètre
    let orderBy = [];
    switch(sortBy) {
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
      default:
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: parseInt(limit),
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
        category: true,
        tags: true,
        viewCount: true,
        createdAt: true
      }
    });

    res.json({ products });
    
  } catch (error) {
    console.error('❌ Error fetching sorted products:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      products: getMockProducts() // Fallback
    });
  }
});

// Ajouter au panier
router.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantity = 1, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non connecté' });
    }

    // Vérifier si le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ 
        message: `Quantité insuffisante. Il ne reste que ${product.quantity} unité(s) en stock.` 
      });
    }

    // Ici, vous ajouteriez le produit au panier de l'utilisateur
    // Pour l'instant, on simule le succès
    
    res.json({
      success: true,
      message: `${product.name} ajouté au panier`,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: quantity
      }
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer les sous-catégories disponibles
router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = await prisma.product.findMany({
      where: {
        category: 'Design & Décoration',
        status: 'active',
        visibility: 'public',
        subcategory: { not: null }
      },
      distinct: ['subcategory'],
      select: {
        subcategory: true
      }
    });

    const subcategoryList = subcategories
      .map(s => s.subcategory)
      .filter(s => s && s.trim() !== '')
      .sort();

    res.json({
      subcategories: ['Toutes', ...subcategoryList]
    });
    
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.json({
      subcategories: ['Toutes', 'Tableaux', 'Vases', 'Luminaires', 'Coussins', 'Bougies', 'Tapis', 'Miroirs']
    });
  }
});

// Fonction pour générer des produits mockés (pour le développement)
function getMockProducts() {
  return [
    {
      id: "1",
      name: "Tableau abstrait moderne 'Harmonie'",
      description: "Tableau d'art abstrait aux couleurs vives, parfait pour donner une touche contemporaine à votre intérieur. Encadrement en bois naturel.",
      price: 189.99,
      comparePrice: 229.99,
      images: ["https://images.unsplash.com/photo-1579762594264-d83c8fb8678e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Tableaux",
      quantity: 18,
      featured: true,
      slug: "tableau-abstrait-moderne-harmonie",
      category: "Design & Décoration",
      tags: ["art", "moderne", "décoration"],
      viewCount: 156,
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "Vase en céramique artisanale",
      description: "Vase haut en céramique émaillée, finition mate avec motifs géométriques. Pièce unique artisanale.",
      price: 79.99,
      comparePrice: 99.99,
      images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Vases",
      quantity: 25,
      featured: true,
      slug: "vase-en-ceramique-artisanale",
      category: "Design & Décoration",
      tags: ["céramique", "artisanal", "décoration"],
      viewCount: 89,
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Lampe de sol design arc",
      description: "Lampe de sol avec structure en arc métallique, abat-jour en tissu. Hauteur réglable, éclairage d'ambiance chaleureux.",
      price: 249.00,
      comparePrice: 299.00,
      images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Luminaires",
      quantity: 8,
      featured: true,
      slug: "lampe-de-sol-design-arc",
      category: "Design & Décoration",
      tags: ["lampe", "design", "éclairage"],
      viewCount: 124,
      createdAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "Coussin velours côtelé",
      description: "Coussin décoratif en velours côtelé de qualité. Remplissage plumes. 45x45cm. Doux et confortable.",
      price: 34.99,
      comparePrice: 44.99,
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Coussins",
      quantity: 40,
      featured: false,
      slug: "coussin-velours-cotile",
      category: "Design & Décoration",
      tags: ["coussin", "velours", "décoration"],
      viewCount: 67,
      createdAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "Bougie parfumée vanille",
      description: "Bougie artisanale parfum vanille bourbon. 300g, brûlée environ 50 heures. Ambiance chaleureuse garantie.",
      price: 29.99,
      comparePrice: 39.99,
      images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Bougies",
      quantity: 50,
      featured: false,
      slug: "bougie-parfumee-vanille",
      category: "Design & Décoration",
      tags: ["bougie", "parfum", "ambiance"],
      viewCount: 92,
      createdAt: new Date().toISOString()
    },
    {
      id: "6",
      name: "Tapis shaggy haute qualité",
      description: "Tapis moelleux en fibres synthétiques. 160x230cm, lavable en machine. Confort et élégance pour votre salon.",
      price: 129.00,
      comparePrice: 169.00,
      images: ["https://images.unsplash.com/photo-1575414003591-ece6b6c7cb2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Tapis",
      quantity: 10,
      featured: true,
      slug: "tapis-shaggy-haute-qualite",
      category: "Design & Décoration",
      tags: ["tapis", "moelleux", "salon"],
      viewCount: 145,
      createdAt: new Date().toISOString()
    },
    {
      id: "7",
      name: "Miroir soleil doré",
      description: "Miroir décoratif forme soleil avec rayons dorés. Diamètre 80cm. Cadre en résine dorée de haute qualité.",
      price: 199.00,
      comparePrice: 249.00,
      images: ["https://images.unsplash.com/photo-1618220179428-22790b461013?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Miroirs",
      quantity: 7,
      featured: true,
      slug: "miroir-soleil-dore",
      category: "Design & Décoration",
      tags: ["miroir", "doré", "décoration"],
      viewCount: 78,
      createdAt: new Date().toISOString()
    },
    {
      id: "8",
      name: "Set de 3 vases en verre soufflé",
      description: "Collection de 3 vases en verre soufflé à la main, tailles assorties. Parfait pour centre de table ou étagère.",
      price: 129.00,
      comparePrice: 159.00,
      images: ["https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
      subcategory: "Vases",
      quantity: 15,
      featured: false,
      slug: "set-de-3-vases-en-verre-souffle",
      category: "Design & Décoration",
      tags: ["vase", "verre", "collection"],
      viewCount: 56,
      createdAt: new Date().toISOString()
    }
  ];
}

module.exports = router;