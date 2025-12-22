const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données de produits d'occasion (utilisant uniquement les champs existants)
const marketplaceProductsData = [
  // Électroménager occasion
  {
    name: "Lave-linge Samsung 8kg - WW80J5355MW",
    description: "Lave-linge frontal 8kg, technologie EcoBubble, programme Rapide 15 minutes, classe A+++, excellent état, seulement 2 ans d'utilisation. Vérifié et nettoyé par nos experts. **OCCASION - GARANTIE 6 MOIS**",
    category: "Marketplace Occasion",
    subcategory: "Électroménager",
    price: 250.00,
    comparePrice: 450.00,
    cost: 150.00,
    sku: "OCC-LLA-SAM-8KG",
    barcode: "MKT001001",
    trackQuantity: true,
    quantity: 3,
    lowStock: 1,
    weight: 68.0,
    dimensions: { length: 60, width: 60, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584568695800-3fcecaf6d1b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lave-linge Samsung 8kg occasion - État vérifié",
    seoDescription: "Lave-linge frontal Samsung 8kg d'occasion, excellent état, garanti 6 mois",
    productType: "occasion",
    brand: "Samsung",
    unit: "unité"
  },
  {
    name: "Réfrigérateur Américain Whirlpool 550L",
    description: "Réfrigérateur américain 550L, distributeur d'eau et de glaçons, contrôle électronique, compartiment fraîcheur, classe A++, 3 ans d'utilisation, fonctionne parfaitement. **OCCASION - GARANTIE 6 MOIS**",
    category: "Marketplace Occasion",
    subcategory: "Électroménager",
    price: 650.00,
    comparePrice: 1200.00,
    cost: 400.00,
    sku: "OCC-FRIG-WHIR-550",
    barcode: "MKT001002",
    trackQuantity: true,
    quantity: 2,
    lowStock: 1,
    weight: 105.0,
    dimensions: { length: 91, width: 70, height: 179 },
    images: [
      "https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Réfrigérateur américain Whirlpool occasion 550L",
    seoDescription: "Réfrigérateur américain d'occasion Whirlpool avec distributeur eau/glaçons",
    productType: "occasion",
    brand: "Whirlpool",
    unit: "unité"
  },

  // Ameublement occasion
  {
    name: "Table à Manger Bois Massif Chêne Extensible",
    description: "Table extensible en chêne massif pour 6-10 personnes, style industriel avec pieds métal, quelques marques d'usage donnant du caractère. Dimensions : 180x90cm (extendable à 240cm). **OCCASION - ÉTAT BON**",
    category: "Marketplace Occasion",
    subcategory: "Ameublement",
    price: 380.00,
    comparePrice: 750.00,
    cost: 250.00,
    sku: "OCC-TABLE-CHENE-EXT",
    barcode: "MKT002001",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 85.0,
    dimensions: { length: 240, width: 90, height: 75 },
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Table à manger chêne massif extensible occasion",
    seoDescription: "Table extensible en chêne massif d'occasion, style industriel",
    productType: "occasion",
    brand: "Artisan",
    unit: "unité"
  },
  {
    name: "Canapé 3 Places d'Angle Convertible",
    description: "Canapé d'angle convertible en lit 140x200, tissu microfibre gris anthracite, mécanisme récent vérifié, nettoyé professionnellement. Dimensions : 280x170cm. **OCCASION - ÉTAT TRÈS BON**",
    category: "Marketplace Occasion",
    subcategory: "Ameublement",
    price: 450.00,
    comparePrice: 850.00,
    cost: 300.00,
    sku: "OCC-CANAP-ANGLE-CONV",
    barcode: "MKT002002",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 95.0,
    dimensions: { length: 280, width: 170, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Canapé d'angle convertible occasion - État vérifié",
    seoDescription: "Canapé d'angle convertible en lit, tissu microfibre, nettoyé professionnellement",
    productType: "occasion",
    brand: "Conforama",
    unit: "unité"
  },
  {
    name: "Armoire Vintage en Chêne Massif 4 Portes",
    description: "Armoire ancienne en chêne massif, 4 portes, étagères amovibles, patine naturelle, authentique pièce des années 50. Hauteur 210cm, largeur 180cm. **OCCASION - ÉTAT VINTAGE**",
    category: "Marketplace Occasion",
    subcategory: "Ameublement",
    price: 520.00,
    comparePrice: 950.00,
    cost: 350.00,
    sku: "OCC-ARM-VINTAGE-CHENE",
    barcode: "MKT002003",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 120.0,
    dimensions: { length: 180, width: 60, height: 210 },
    images: [
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Armoire vintage chêne massif occasion - Pièce unique",
    seoDescription: "Armoire ancienne en chêne massif des années 50, patine naturelle",
    productType: "occasion",
    brand: "Vintage",
    unit: "unité"
  },

  // Outils occasion
  {
    name: "Scie Circulaire sur Table Bosch PTS 10",
    description: "Scie circulaire sur table 1500W, profondeur de coupe 70mm, inclinaison 45°, guide parallèle, peu utilisée, manuel d'origine, tous accessoires présents. **OCCASION - COMME NEUF**",
    category: "Marketplace Occasion",
    subcategory: "Outils",
    price: 95.00,
    comparePrice: 220.00,
    cost: 60.00,
    sku: "OCC-SCIE-BOSCH-PTS10",
    barcode: "MKT003001",
    trackQuantity: true,
    quantity: 2,
    lowStock: 1,
    weight: 25.0,
    dimensions: { length: 80, width: 60, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584568695800-3fcecaf6d1b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Scie circulaire sur table Bosch occasion - Peu utilisée",
    seoDescription: "Scie circulaire sur table Bosch d'occasion, tous accessoires inclus",
    productType: "occasion",
    brand: "Bosch",
    unit: "unité"
  },
  {
    name: "Perceuse Visseuse 18V Makita sans Fil",
    description: "Kit complet perceuse-visseuse sans fil 18V, 2 batteries 3Ah, chargeur rapide, coffret de transport Makpac, couple max 60Nm, testée et fonctionne parfaitement. **OCCASION - ÉTAT TRÈS BON**",
    category: "Marketplace Occasion",
    subcategory: "Outils",
    price: 75.00,
    comparePrice: 180.00,
    cost: 45.00,
    sku: "OCC-PERCEUSE-MAKITA-18V",
    barcode: "MKT003002",
    trackQuantity: true,
    quantity: 3,
    lowStock: 1,
    weight: 4.5,
    dimensions: { length: 25, width: 20, height: 30 },
    images: [
      "https://images.unsplash.com/photo-1584568695800-3fcecaf6d1b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Perceuse visseuse Makita 18V occasion - Kit complet",
    seoDescription: "Perceuse visseuse sans fil Makita d'occasion avec 2 batteries",
    productType: "occasion",
    brand: "Makita",
    unit: "unité"
  },

  // Jardinage occasion
  {
    name: "Tondeuse Thermique Autotractée McCulloch",
    description: "Tondeuse thermique 163cc, bac ramassage 70L, démarrage électrique, largeur coupe 46cm, hauteur réglable 25-75mm, très peu utilisée (10h environ). **OCCASION - COMME NEUF**",
    category: "Marketplace Occasion",
    subcategory: "Jardinage",
    price: 320.00,
    comparePrice: 650.00,
    cost: 200.00,
    sku: "OCC-TONDEUSE-MCC-163CC",
    barcode: "MKT004001",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 45.0,
    dimensions: { length: 140, width: 60, height: 110 },
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Tondeuse thermique autotractée occasion - Peu utilisée",
    seoDescription: "Tondeuse thermique McCulloch d'occasion avec démarrage électrique",
    productType: "occasion",
    brand: "McCulloch",
    unit: "unité"
  },

  // Décoration occasion
  {
    name: "Lustre Cristal 8 Bras Style Empire",
    description: "Lustre suspendu avec cristaux Swarovski, 8 bras, éclairage LED dimmable, diamètre 80cm, parfait état, emballage d'origine inclus. **OCCASION - ÉTAT PARFAIT**",
    category: "Marketplace Occasion",
    subcategory: "Décoration",
    price: 180.00,
    comparePrice: 350.00,
    cost: 100.00,
    sku: "OCC-LUSTRE-CRISTAL-8BR",
    barcode: "MKT005001",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 8.5,
    dimensions: { length: 80, width: 80, height: 60 },
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lustre cristal 8 bras occasion - Style empire",
    seoDescription: "Lustre d'occasion avec cristaux Swarovski, éclairage LED",
    productType: "occasion",
    brand: "Cristal & Bronze",
    unit: "unité"
  },

  // High-tech occasion
  {
    name: "Tablette iPad Air 4 64GB Wi-Fi",
    description: "iPad Air 4ème génération 64GB Wi-Fi, écran 10.9\" Liquid Retina, processeur A14 Bionic, Touch ID, couleur vert, boîte et chargeur d'origine, écran parfait. **OCCASION - COMME NEUF**",
    category: "Marketplace Occasion",
    subcategory: "High-tech",
    price: 420.00,
    comparePrice: 699.00,
    cost: 280.00,
    sku: "OCC-IPAD-AIR-4-64GB",
    barcode: "MKT006001",
    trackQuantity: true,
    quantity: 2,
    lowStock: 1,
    weight: 0.5,
    dimensions: { length: 24, width: 17, height: 0.6 },
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "iPad Air 4 64GB occasion - État impeccable",
    seoDescription: "iPad Air 4 d'occasion 64GB Wi-Fi, écran parfait, boîte d'origine",
    productType: "occasion",
    brand: "Apple",
    unit: "unité"
  },

  // Bricolage occasion
  {
    name: "Aspirateur Souffleur Broyeur Stihl BG 86",
    description: "Aspirateur souffleur broyeur thermique Stihl, 0.75kW, sac collecteur 45L, ratio broyage 10:1, peu utilisé, démarre au premier coup. **OCCASION - ÉTAT TRÈS BON**",
    category: "Marketplace Occasion",
    subcategory: "Bricolage",
    price: 150.00,
    comparePrice: 320.00,
    cost: 95.00,
    sku: "OCC-ASPIR-STIHL-BG86",
    barcode: "MKT007001",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 5.2,
    dimensions: { length: 90, width: 30, height: 30 },
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Aspirateur souffleur Stihl occasion - Peu utilisé",
    seoDescription: "Aspirateur souffleur broyeur Stihl thermique d'occasion",
    productType: "occasion",
    brand: "Stihl",
    unit: "unité"
  },

  // Cuisine occasion
  {
    name: "Hotte Aspirante 60cm Évacuation Extérieure",
    description: "Hotte aspirante 60cm avec évacuation extérieure, débit 450m³/h, éclairage halogène, 3 vitesses, commandes mécaniques, nettoyée et vérifiée. **OCCASION - ÉTAT BON**",
    category: "Marketplace Occasion",
    subcategory: "Cuisine",
    price: 85.00,
    comparePrice: 180.00,
    cost: 55.00,
    sku: "OCC-HOTTE-60CM-EVAC",
    barcode: "MKT008001",
    trackQuantity: true,
    quantity: 1,
    lowStock: 1,
    weight: 15.0,
    dimensions: { length: 60, width: 50, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Hotte aspirante 60cm occasion - Évacuation extérieure",
    seoDescription: "Hotte d'occasion 60cm avec évacuation extérieure, nettoyée",
    productType: "occasion",
    brand: "Brandt",
    unit: "unité"
  },

  // Bureau occasion
  {
    name: "Chaise de Bureau Ergonomique Siège Mesh",
    description: "Chaise de bureau ergonomique, dossier mesh respirant, réglage hauteur et inclinaison, roulettes silencieuses, couleur noir, confortable. **OCCASION - ÉTAT BON**",
    category: "Marketplace Occasion",
    subcategory: "Bureau",
    price: 65.00,
    comparePrice: 140.00,
    cost: 40.00,
    sku: "OCC-CHAISE-BUREAU-ERG",
    barcode: "MKT009001",
    trackQuantity: true,
    quantity: 3,
    lowStock: 1,
    weight: 15.0,
    dimensions: { length: 60, width: 60, height: 130 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Chaise de bureau ergonomique occasion - Siège mesh",
    seoDescription: "Chaise de bureau d'occasion ergonomique avec dossier mesh",
    productType: "occasion",
    brand: "Ikea",
    unit: "unité"
  }
];

// Fonction pour générer un slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 100);
}

async function main() {
  console.log('🛒 Début du seeding des produits Marketplace Occasion...');

  try {
    // Récupérer tous les utilisateurs existants
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('💡 Veuillez d\'abord créer des utilisateurs avant de lancer ce seed');
      return;
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`);

    // Vérifier s'il y a déjà des produits marketplace
    const existingMarketplaceProducts = await prisma.product.count({
      where: {
        category: 'Marketplace Occasion'
      }
    });

    if (existingMarketplaceProducts > 0) {
      console.log(`⚠️  ${existingMarketplaceProducts} produits marketplace existants détectés`);
      console.log('🗑️  Suppression des anciens produits marketplace...');
      await prisma.product.deleteMany({
        where: {
          category: 'Marketplace Occasion'
        }
      });
      console.log('✅ Anciens produits marketplace supprimés');
    }

    // Créer les produits marketplace
    console.log(`🛍️  Création de ${marketplaceProductsData.length} produits marketplace occasion...`);

    let createdCount = 0;
    for (const productData of marketplaceProductsData) {
      // Sélectionner un utilisateur au hasard
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Générer le slug
      const slug = generateSlug(productData.name);

      // Ajouter des champs de statistiques
      const productWithStats = {
        ...productData,
        viewCount: Math.floor(Math.random() * 300) + 50,
        clickCount: Math.floor(Math.random() * 200) + 30,
        purchaseCount: Math.floor(Math.random() * 50) + 5,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)), // 0-365 jours
        updatedAt: new Date()
      };

      await prisma.product.create({
        data: {
          ...productWithStats,
          slug,
          userId: randomUser.id,
          publishedAt: productData.status === 'active' ? new Date() : null
        }
      });

      createdCount++;
      if (createdCount % 5 === 0) {
        console.log(`📝 ${createdCount}/${marketplaceProductsData.length} produits créés...`);
      }
    }

    console.log('🎉 Seeding des produits Marketplace Occasion terminé avec succès!');
    console.log(`📊 ${marketplaceProductsData.length} produits créés`);

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: 'Marketplace Occasion'
      },
      _count: {
        id: true
      },
      orderBy: {
        subcategory: 'asc'
      }
    });

    console.log('\n📈 Résumé par sous-catégorie:');
    productsBySubcategory.forEach(cat => {
      console.log(`   📍 ${cat.subcategory || 'Non catégorisé'}: ${cat._count.id} produits`);
    });

    // Statistiques générales
    const stats = await prisma.product.aggregate({
      where: {
        category: 'Marketplace Occasion'
      },
      _count: {
        id: true
      },
      _avg: {
        price: true,
        comparePrice: true
      },
      _sum: {
        quantity: true
      }
    });

    console.log('\n📊 Statistiques Marketplace:');
    console.log(`   💰 Prix moyen: ${stats._avg.price.toFixed(2)}€`);
    console.log(`   📈 Prix neuf moyen: ${stats._avg.comparePrice.toFixed(2)}€`);
    console.log(`   💸 Économie moyenne: ${Math.round((1 - stats._avg.price / stats._avg.comparePrice) * 100)}%`);
    console.log(`   📦 Stock total: ${stats._sum.quantity} unités`);

    // Afficher les meilleures affaires
    const bestDeals = await prisma.product.findMany({
      where: {
        category: 'Marketplace Occasion',
        comparePrice: { gt: 0 }
      },
      select: {
        name: true,
        price: true,
        comparePrice: true,
        subcategory: true
      },
      orderBy: {
        price: 'asc'
      },
      take: 5
    });

    console.log('\n🔥 Meilleures affaires:');
    bestDeals.forEach(product => {
      const economy = Math.round((1 - product.price / product.comparePrice) * 100);
      console.log(`   💰 ${product.name} (${product.subcategory}): ${product.price}€ (-${economy}%)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });