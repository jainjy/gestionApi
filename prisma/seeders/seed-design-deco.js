const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données de produits design & décoration réalistes
const designProductsData = [
  // Tableaux et Art mural
  {
    name: "Tableau abstrait moderne 'Harmonie'",
    description: "Tableau d'art abstrait aux couleurs vives, parfait pour donner une touche contemporaine à votre intérieur. Encadrement en bois naturel.",
    category: "Design & Décoration",
    subcategory: "Tableaux",
    price: 189.99,
    comparePrice: 229.99,
    cost: 95.00,
    sku: "TAB-ABST-HARM-001",
    barcode: "9876543210001",
    trackQuantity: true,
    quantity: 18,
    lowStock: 3,
    weight: 4.2,
    dimensions: { length: 120, width: 5, height: 80 },
    images: [
      "https://images.unsplash.com/photo-1579762594264-d83c8fb8678e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Tableau abstrait moderne Harmonie - Décoration murale",
    seoDescription: "Tableau d'art abstrait contemporain aux couleurs vibrantes, idéal pour salon ou bureau",
    productType: "design"
  },
  {
    name: "Triptyque paysage marin",
    description: "Collection de 3 tableaux représentant un paysage marin en nuances de bleu. Toile tendue sur châssis.",
    category: "Design & Décoration",
    subcategory: "Tableaux",
    price: 299.00,
    comparePrice: 349.00,
    cost: 150.00,
    sku: "TRIP-MARIN-3P",
    barcode: "9876543210002",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 8.5,
    dimensions: { length: 180, width: 5, height: 60 },
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Triptyque paysage marin - Collection 3 tableaux",
    seoDescription: "Triptyque de tableaux paysage marin en bleu, décoration murale élégante",
    productType: "design"
  },

  // Vases et Récipients décoratifs
  {
    name: "Vase en céramique artisanale",
    description: "Vase haut en céramique émaillée, finition mate avec motifs géométriques. Pièce unique artisanale.",
    category: "Design & Décoration",
    subcategory: "Vases",
    price: 79.99,
    comparePrice: 99.99,
    cost: 35.00,
    sku: "VASE-CERAM-ART-01",
    barcode: "9876543210003",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 2.8,
    dimensions: { length: 15, width: 15, height: 40 },
    images: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Vase en céramique artisanale - Décoration intérieure",
    seoDescription: "Vase décoratif en céramique émaillée, pièce artisanale unique",
    productType: "design"
  },
  {
    name: "Set de 3 vases en verre soufflé",
    description: "Collection de 3 vases en verre soufflé à la main, tailles assorties. Parfait pour centre de table.",
    category: "Design & Décoration",
    subcategory: "Vases",
    price: 129.00,
    comparePrice: 159.00,
    cost: 65.00,
    sku: "VASE-VERRE-3P",
    barcode: "9876543210004",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 3.5,
    dimensions: { length: 30, width: 30, height: 35 },
    images: [
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Set de 3 vases en verre soufflé - Décoration moderne",
    seoDescription: "Collection de vases en verre soufflé à la main, design contemporain",
    productType: "design"
  },

  // Lampes et Éclairage décoratif
  {
    name: "Lampe de sol design arc",
    description: "Lampe de sol avec structure en arc métallique, abat-jour en tissu. Hauteur réglable.",
    category: "Design & Décoration",
    subcategory: "Luminaires",
    price: 249.00,
    comparePrice: 299.00,
    cost: 130.00,
    sku: "LAMPE-ARC-DESIGN",
    barcode: "9876543210005",
    trackQuantity: true,
    quantity: 8,
    lowStock: 2,
    weight: 6.5,
    dimensions: { length: 40, width: 40, height: 160 },
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lampe de sol design arc - Éclairage moderne",
    seoDescription: "Lampe de sol design avec structure en arc, éclairage d'ambiance",
    productType: "design"
  },
  {
    name: "Suspension en rotin tressé",
    description: "Suspension design en rotin tressé à la main, style bohème. Diamètre 45cm.",
    category: "Design & Décoration",
    subcategory: "Luminaires",
    price: 149.00,
    comparePrice: 179.00,
    cost: 75.00,
    sku: "SUSP-ROTIN-BOHO",
    barcode: "9876543210006",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 2.3,
    dimensions: { length: 45, width: 45, height: 30 },
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Suspension en rotin tressé - Style bohème",
    seoDescription: "Suspension design en rotin tressé à la main, ambiance chaleureuse",
    productType: "design"
  },

  // Miroirs décoratifs
  {
    name: "Miroir soleil doré",
    description: "Miroir décoratif forme soleil avec rayons dorés. Diamètre 80cm. Cadre en résine dorée.",
    category: "Design & Décoration",
    subcategory: "Miroirs",
    price: 199.00,
    comparePrice: 249.00,
    cost: 95.00,
    sku: "MIROIR-SOLEIL-DOR",
    barcode: "9876543210007",
    trackQuantity: true,
    quantity: 7,
    lowStock: 1,
    weight: 8.2,
    dimensions: { length: 80, width: 5, height: 80 },
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Miroir soleil doré - Décoration murale glamour",
    seoDescription: "Miroir décoratif forme soleil avec rayons dorés, style Hollywood",
    productType: "design"
  },
  {
    name: "Miroir ovale avec cadre en bois",
    description: "Miroir ovale avec cadre en chêne massif sculpté. Dimensions 60x90cm.",
    category: "Design & Décoration",
    subcategory: "Miroirs",
    price: 159.00,
    comparePrice: 189.00,
    cost: 80.00,
    sku: "MIROIR-OVAL-CHENE",
    barcode: "9876543210008",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 7.5,
    dimensions: { length: 60, width: 5, height: 90 },
    images: [
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Miroir ovale cadre bois - Style classique",
    seoDescription: "Miroir ovale avec cadre en chêne massif, élégance intemporelle",
    productType: "design"
  },

  // Coussins et Textiles
  {
    name: "Coussin velours côtelé",
    description: "Coussin décoratif en velours côtelé de qualité. Remplissage plumes. 45x45cm.",
    category: "Design & Décoration",
    subcategory: "Coussins",
    price: 34.99,
    comparePrice: 44.99,
    cost: 15.00,
    sku: "COUSS-VELOURS-45",
    barcode: "9876543210009",
    trackQuantity: true,
    quantity: 40,
    lowStock: 10,
    weight: 0.8,
    dimensions: { length: 45, width: 45, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Coussin velours côtelé - Décoration canapé",
    seoDescription: "Coussin décoratif en velours côtelé, confort et élégance",
    productType: "design"
  },
  {
    name: "Collection coussins brodés",
    description: "Set de 4 coussins avec broderies ethniques. Tissu coton, motifs uniques.",
    category: "Design & Décoration",
    subcategory: "Coussins",
    price: 89.00,
    comparePrice: 119.00,
    cost: 42.00,
    sku: "SET-COUSS-BRODE-4",
    barcode: "9876543210010",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 3.2,
    dimensions: { length: 40, width: 40, height: 40 },
    images: [
      "https://images.unsplash.com/photo-1579656593065-5c4c8f7d6c7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Collection coussins brodés ethniques - Set 4 pièces",
    seoDescription: "Set de 4 coussins décoratifs avec broderies artisanales",
    productType: "design"
  },

  // Bougies et Parfums d'ambiance
  {
    name: "Bougie parfumée vanille",
    description: "Bougie artisanale parfum vanille bourbon. 300g, brûlée environ 50 heures.",
    category: "Design & Décoration",
    subcategory: "Bougies",
    price: 29.99,
    comparePrice: 39.99,
    cost: 12.00,
    sku: "BOUGIE-VANILLE-300",
    barcode: "9876543210011",
    trackQuantity: true,
    quantity: 50,
    lowStock: 15,
    weight: 0.5,
    dimensions: { length: 8, width: 8, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Bougie parfumée vanille bourbon - Ambiance chaleureuse",
    seoDescription: "Bougie artisanale parfum vanille, brûlée longue durée",
    productType: "design"
  },
  {
    name: "Diffuseur d'huiles essentielles",
    description: "Diffuseur ultrasonique avec lumière LED colorée. Capacité 300ml.",
    category: "Design & Décoration",
    subcategory: "Parfums",
    price: 49.99,
    comparePrice: 59.99,
    cost: 22.00,
    sku: "DIFFUSEUR-ULTRA-300",
    barcode: "9876543210012",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 0.9,
    dimensions: { length: 12, width: 12, height: 18 },
    images: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Diffuseur huiles essentielles - Aromathérapie",
    seoDescription: "Diffuseur ultrasonique avec LED, bien-être à domicile",
    productType: "design"
  },

  // Pots et Jardinières
  {
    name: "Jardinière suspendue macramé",
    description: "Pot de fleurs suspendu avec support macramé fait main. Diamètre 20cm.",
    category: "Design & Décoration",
    subcategory: "Jardinières",
    price: 34.99,
    comparePrice: 44.99,
    cost: 16.00,
    sku: "POT-SUSP-MACRAME",
    barcode: "9876543210013",
    trackQuantity: true,
    quantity: 30,
    lowStock: 8,
    weight: 0.7,
    dimensions: { length: 20, width: 20, height: 60 },
    images: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Jardinière suspendue macramé - Décoration végétale",
    seoDescription: "Pot de fleurs suspendu avec support macramé artisanal",
    productType: "design"
  },
  {
    name: "Pot design en béton ciré",
    description: "Pot de fleurs design en béton ciré, finition lisse. Hauteur 35cm.",
    category: "Design & Décoration",
    subcategory: "Jardinières",
    price: 59.00,
    comparePrice: 79.00,
    cost: 25.00,
    sku: "POT-BETON-CIRE-35",
    barcode: "9876543210014",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 4.5,
    dimensions: { length: 25, width: 25, height: 35 },
    images: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Pot design béton ciré - Style industriel",
    seoDescription: "Pot de fleurs design en béton, finition moderne",
    productType: "design"
  },

  // Tapis et Dessus de lit
  {
    name: "Tapis shaggy haute qualité",
    description: "Tapis moelleux en fibres synthétiques. 160x230cm, lavable en machine.",
    category: "Design & Décoration",
    subcategory: "Tapis",
    price: 129.00,
    comparePrice: 169.00,
    cost: 60.00,
    sku: "TAPIS-SHAGGY-160",
    barcode: "9876543210015",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 8.0,
    dimensions: { length: 160, width: 230, height: 2 },
    images: [
      "https://images.unsplash.com/photo-1575414003591-ece6b6c7cb2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Tapis shaggy haute qualité - Confort maximal",
    seoDescription: "Tapis moelleux et doux, idéal pour chambre ou salon",
    productType: "design"
  },
  {
    name: "Couette design motifs géométriques",
    description: "Housse de couette double face avec motifs géométriques. 220x240cm.",
    category: "Design & Décoration",
    subcategory: "Textiles",
    price: 89.00,
    comparePrice: 119.00,
    cost: 40.00,
    sku: "COUV-GEOM-220",
    barcode: "9876543210016",
    trackQuantity: true,
    quantity: 18,
    lowStock: 4,
    weight: 2.3,
    dimensions: { length: 220, width: 240, height: 5 },
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Couette design motifs géométriques - Décoration chambre",
    seoDescription: "Housse de couette design, motifs modernes et élégants",
    productType: "design"
  }
];

// Fonction pour générer un slug à partir du nom
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 100)
}

async function main() {
  console.log('🎨 Début du seeding des produits Design & Décoration...')

  try {
    // Récupérer tous les utilisateurs existants
    const users = await prisma.user.findMany({
      select: { id: true }
    })

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données')
      console.log('💡 Veuillez d\'abord créer des utilisateurs avant de lancer ce seed')
      return
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`)

    // Vérifier s'il y a déjà des produits design
    const existingDesignProducts = await prisma.product.count({
      where: {
        category: 'Design & Décoration'
      }
    });

    if (existingDesignProducts > 0) {
      console.log(`⚠️  ${existingDesignProducts} produits design existants détectés`)
      console.log('🗑️  Suppression des anciens produits design...')
      await prisma.product.deleteMany({
        where: {
          category: 'Design & Décoration'
        }
      })
      console.log('✅ Anciens produits design supprimés')
    }

    // Créer les produits design
    console.log(`🖼️  Création de ${designProductsData.length} produits design & décoration...`)

    let createdCount = 0;
    for (const productData of designProductsData) {
      // Sélectionner un utilisateur au hasard
      const randomUser = users[Math.floor(Math.random() * users.length)]
      
      // Générer le slug
      const slug = generateSlug(productData.name)

      await prisma.product.create({
        data: {
          ...productData,
          slug,
          userId: randomUser.id,
          publishedAt: productData.status === 'active' ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      createdCount++;
      if (createdCount % 5 === 0) {
        console.log(`📝 ${createdCount}/${designProductsData.length} produits créés...`);
      }
    }

    console.log('🎉 Seeding des produits Design & Décoration terminé avec succès!')
    console.log(`📊 ${designProductsData.length} produits créés`)

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: 'Design & Décoration'
      },
      _count: {
        id: true
      },
      orderBy: {
        subcategory: 'asc'
      }
    })

    console.log('\n📈 Résumé par sous-catégorie:')
    productsBySubcategory.forEach(cat => {
      console.log(`   📍 ${cat.subcategory || 'Non catégorisé'}: ${cat._count.id} produits`)
    })

    // Afficher les produits en vedette
    const featuredProducts = await prisma.product.findMany({
      where: {
        category: 'Design & Décoration',
        featured: true
      },
      select: {
        name: true,
        price: true
      },
      take: 5
    })

    console.log('\n⭐ Produits en vedette:')
    featuredProducts.forEach(product => {
      console.log(`   ✨ ${product.name} - ${product.price}€`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })