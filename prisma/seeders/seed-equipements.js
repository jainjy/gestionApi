const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Données de produits équipement maison
const equipementsData = [
  // Électroménager
  {
    name: "Réfrigérateur Américain Samsung Family Hub",
    description: "Réfrigérateur américain 615L avec distributeur d'eau et de glaçons, écran tactile intelligent 21,5\", technologie Twin Cooling Plus, No Frost, connecté WiFi, reconnaissance vocale.",
    category: "Équipement Maison",
    subcategory: "Électroménager",
    price: 1899.99,
    comparePrice: 2299.99,
    cost: 1250.00,
    sku: "FRIGO-SAMSUNG-615",
    barcode: "EQUIP001001",
    trackQuantity: true,
    quantity: 18,
    lowStock: 3,
    weight: 125.5,
    dimensions: { length: 91.2, width: 91.1, height: 178.8 },
    images: [
      "https://images.unsplash.com/photo-1571175443880-49e1d1b7b3a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584568695800-3fcecaf6d1b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Réfrigérateur américain Samsung connecté - 615L",
    seoDescription: "Réfrigérateur américain Samsung Family Hub avec écran tactile, distributeur eau/glaçons, connecté WiFi",
    productType: "equipement",
    brand: "Samsung",
    unit: "unité"
  },
  {
    name: "Lave-linge Séchant Bosch Heat Pump",
    description: "Lave-linge séchant 9kg/5kg avec technologie Heat Pump, 1400 tours/min, programmes intelligents EcoSilence Drive, connexion WiFi Home Connect, affichage LED, classe A+++.",
    category: "Équipement Maison",
    subcategory: "Électroménager",
    price: 899.99,
    comparePrice: 1099.99,
    cost: 550.00,
    sku: "LAVE-BOSCH-HP9",
    barcode: "EQUIP001002",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 75.0,
    dimensions: { length: 60.0, width: 60.0, height: 85.0 },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lave-linge séchant Bosch Heat Pump - 9kg",
    seoDescription: "Lave-linge séchant Bosch avec technologie Heat Pump, économique et silencieux",
    productType: "equipement",
    brand: "Bosch",
    unit: "unité"
  },
  {
    name: "Four encastrable Siemens Pyrolyse",
    description: "Four multifonction 71L avec nettoyage pyrolyse, système 4D Hotair, commande tactile TFT, 14 programmes automatiques, classe A.",
    category: "Équipement Maison",
    subcategory: "Électroménager",
    price: 799.99,
    comparePrice: 949.99,
    cost: 480.00,
    sku: "FOUR-SIEMENS-PYRO",
    barcode: "EQUIP001003",
    trackQuantity: true,
    quantity: 15,
    lowStock: 2,
    weight: 42.0,
    dimensions: { length: 59.5, width: 56.0, height: 59.5 },
    images: [
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Four encastrable Siemens avec pyrolyse - 71L",
    seoDescription: "Four multifonction Siemens avec nettoyage pyrolyse et système 4D Hotair",
    productType: "equipement",
    brand: "Siemens",
    unit: "unité"
  },

  // Cuisine sur mesure
  {
    name: "Cuisine Équipée Modulaire sur Mesure",
    description: "Cuisine complète sur mesure avec électroménager intégré, plan de travail quartz 3cm, meubles haute gamme laqué mat, éclairage LED intégré, système de rangement optimisé.",
    category: "Équipement Maison",
    subcategory: "Cuisine",
    price: 7500.00,
    comparePrice: 0,
    cost: 4500.00,
    sku: "CUISINE-SUR-MESURE",
    barcode: "EQUIP002001",
    trackQuantity: false,
    quantity: 0,
    lowStock: 0,
    weight: 0,
    dimensions: null,
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Cuisine équipée sur mesure - Design personnalisé",
    seoDescription: "Cuisine complète sur mesure avec électroménager intégré et plan de travail quartz",
    productType: "equipement",
    brand: "Cuisines Avosoa",
    unit: "projet"
  },

  // Salon
  {
    name: "Canapé Modulaire 5 Places en Tissu Velours",
    description: "Canapé modulaire en tissu velours premium, convertible en lit 140x200, mousse mémoire de forme, nombreux modules interchangeables, tête et accoudoirs réglables.",
    category: "Équipement Maison",
    subcategory: "Salon",
    price: 1499.99,
    comparePrice: 1899.99,
    cost: 850.00,
    sku: "CANAP-MOD-VELOURS",
    barcode: "EQUIP003001",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 95.0,
    dimensions: { length: 280, width: 100, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Canapé modulaire 5 places en velours - Convertible",
    seoDescription: "Canapé modulaire convertible en lit avec tissu velours premium et mousse mémoire de forme",
    productType: "equipement",
    brand: "Maison du Confort",
    unit: "unité"
  },

  // Salle à manger
  {
    name: "Table à Manger Extensible en Chêne Massif",
    description: "Table en chêne massif français extensible de 6 à 10 personnes, style scandinave, finition huile naturelle écologique, système d'extension silencieux, dimensions 180x90cm (extendable à 240cm).",
    category: "Équipement Maison",
    subcategory: "Salle à manger",
    price: 1299.99,
    comparePrice: 1599.99,
    cost: 750.00,
    sku: "TABLE-CHENE-EXT",
    barcode: "EQUIP004001",
    trackQuantity: true,
    quantity: 8,
    lowStock: 1,
    weight: 65.0,
    dimensions: { length: 240, width: 90, height: 75 },
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Table à manger extensible chêne massif - 6-10 personnes",
    seoDescription: "Table extensible en chêne massif français, style scandinave, finition naturelle",
    productType: "equipement",
    brand: "Artisan Bois",
    unit: "unité"
  },

  // Chambre
  {
    name: "Lit 160x200 avec Tête de Lit Rembourrée",
    description: "Lit coffre en bois massif hévéa 160x200 avec tête de lit rembourrée en tissu, rangement intégré par tiroirs latéraux, sommier réglable en 3 zones, structure renforcée.",
    category: "Équipement Maison",
    subcategory: "Chambre",
    price: 899.99,
    comparePrice: 1149.99,
    cost: 520.00,
    sku: "LIT-HEVEA-160",
    barcode: "EQUIP005001",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 85.0,
    dimensions: { length: 210, width: 170, height: 95 },
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lit coffre 160x200 bois hévéa avec tête de lit",
    seoDescription: "Lit coffre en bois massif avec rangement intégré et tête de lit rembourrée",
    productType: "equipement",
    brand: "Dodo Design",
    unit: "unité"
  },

  // Climatisation
  {
    name: "Climatiseur Réversible Daikin Inverter",
    description: "Climatiseur split réversible 9000 BTU, technologie Inverter Flash Streamer, WiFi intégré, très silencieux (19dB intérieur), classe A+++, filtration air avancée, contrôle par application.",
    category: "Équipement Maison",
    subcategory: "Climatisation",
    price: 1299.99,
    comparePrice: 1599.99,
    cost: 780.00,
    sku: "CLIM-DAIKIN-9K",
    barcode: "EQUIP006001",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 28.5,
    dimensions: { length: 80, width: 23, height: 30 },
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Climatiseur réversible Daikin Inverter - 9000 BTU",
    seoDescription: "Climatiseur split Daikin avec WiFi, très silencieux et économique",
    productType: "equipement",
    brand: "Daikin",
    unit: "unité"
  },

  // Purification air
  {
    name: "Purificateur d'Air Dyson Pure Cool",
    description: "Purificateur d'air et ventilateur avec filtration HEPA et charbon actif, détection automatique particules et gaz, purification 360°, contrôle via application, design award-winning.",
    category: "Équipement Maison",
    subcategory: "Qualité air",
    price: 549.99,
    comparePrice: 649.99,
    cost: 320.00,
    sku: "PURI-DYSON-PURE",
    barcode: "EQUIP007001",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 4.75,
    dimensions: { length: 20, width: 20, height: 100 },
    images: [
      "https://images.unsplash.com/photo-1588614959060-4d144f28b207?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Purificateur d'air Dyson Pure Cool - HEPA et charbon",
    seoDescription: "Purificateur d'air Dyson avec filtration avancée et contrôle application",
    productType: "equipement",
    brand: "Dyson",
    unit: "unité"
  },

  // Nettoyage
  {
    name: "Aspirateur Robot iRobot Roomba i7+",
    description: "Aspirateur robot avec station auto-vidage, cartographie Imprint Smart Mapping, navigation intelligente, détection de saletés, compatible avec Google Home et Alexa.",
    category: "Équipement Maison",
    subcategory: "Nettoyage",
    price: 699.99,
    comparePrice: 849.99,
    cost: 420.00,
    sku: "ROOMBA-I7-PLUS",
    barcode: "EQUIP008001",
    trackQuantity: true,
    quantity: 18,
    lowStock: 4,
    weight: 3.8,
    dimensions: { length: 34, width: 34, height: 9 },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Aspirateur robot iRobot Roomba i7+ avec auto-vidage",
    seoDescription: "Aspirateur robot intelligent avec station auto-vidage et cartographie",
    productType: "equipement",
    brand: "iRobot",
    unit: "unité"
  },

  // Hotte cuisine
  {
    name: "Hotte Aspirante Design 90cm Extraction Extérieure",
    description: "Hotte aspirante design 90cm avec extraction extérieure 750m³/h, écran tactile capacitif, éclairage LED Xénon, niveau sonore réduit (52dB), filtres métalliques lavables.",
    category: "Équipement Maison",
    subcategory: "Cuisine",
    price: 599.99,
    comparePrice: 749.99,
    cost: 350.00,
    sku: "HOTTE-90CM-DESIGN",
    barcode: "EQUIP002002",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 22.0,
    dimensions: { length: 90, width: 50, height: 18 },
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Hotte aspirante design 90cm - Extraction 750m³/h",
    seoDescription: "Hotte aspirante design avec écran tactile et éclairage LED",
    productType: "equipement",
    brand: "Falmec",
    unit: "unité"
  },

  // Rangement sur mesure
  {
    name: "Dressing sur Mesure avec Portes Coulissantes",
    description: "Dressing intégré sur mesure avec portes coulissantes miroir/laqué, éclairage LED intégré avec détecteur de mouvement, rangements optimisés (tiroirs, étagères, penderies), finition haute qualité.",
    category: "Équipement Maison",
    subcategory: "Rangement",
    price: 2200.00,
    comparePrice: 0,
    cost: 1350.00,
    sku: "DRESSING-SUR-MESURE",
    barcode: "EQUIP009001",
    trackQuantity: false,
    quantity: 0,
    lowStock: 0,
    weight: 0,
    dimensions: null,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Dressing sur mesure avec portes coulissantes - Rangement optimisé",
    seoDescription: "Dressing intégré sur mesure avec éclairage LED et rangements personnalisés",
    productType: "equipement",
    brand: "Avosoa Dressing",
    unit: "projet"
  },

  // Énergie
  {
    name: "Chauffe-eau Thermodynamique Atlantic 270L",
    description: "Chauffe-eau thermodynamique 270L, classe A, pompe à chaleur intégrée, COP 3,5, économie jusqu'à 70% sur la production d'eau chaude, programmateur intelligent, silencieux.",
    category: "Équipement Maison",
    subcategory: "Énergie",
    price: 2499.99,
    comparePrice: 2999.99,
    cost: 1600.00,
    sku: "CHAUFF-EAU-ATL-270",
    barcode: "EQUIP010001",
    trackQuantity: true,
    quantity: 6,
    lowStock: 1,
    weight: 95.0,
    dimensions: { length: 60, width: 60, height: 180 },
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Chauffe-eau thermodynamique Atlantic 270L - Classe A",
    seoDescription: "Chauffe-eau thermodynamique économique avec pompe à chaleur intégrée",
    productType: "equipement",
    brand: "Atlantic",
    unit: "unité"
  },

  // Bureau
  {
    name: "Bureau Électrique Assis-Debout",
    description: "Bureau électrique hauteur réglable, mémoire 4 positions, plateau 160x80cm en chêne massif, moteur silencieux, contrôle numérique, câble management intégré.",
    category: "Équipement Maison",
    subcategory: "Bureau",
    price: 499.99,
    comparePrice: 649.99,
    cost: 280.00,
    sku: "BUREAU-ELECT-160",
    barcode: "EQUIP011001",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 48.0,
    dimensions: { length: 160, width: 80, height: 130 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Bureau électrique assis-debout - Plateau chêne 160x80",
    seoDescription: "Bureau électrique réglable en hauteur avec mémoire positions",
    productType: "equipement",
    brand: "FlexiSpot",
    unit: "unité"
  },

  // Salle de bain
  {
    name: "Meuble Vasque Salle de Bain 120cm",
    description: "Meuble de salle de bain 120cm avec vasque en céramique, 2 grands tiroirs coulissants silencieux, finition laqué mat anti-trace, pieds réglables, résistant à l'humidité.",
    category: "Équipement Maison",
    subcategory: "Salle de bain",
    price: 699.99,
    comparePrice: 899.99,
    cost: 420.00,
    sku: "MEUBLE-SDB-120",
    barcode: "EQUIP012001",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 65.0,
    dimensions: { length: 120, width: 48, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Meuble vasque salle de bain 120cm - Rangement optimisé",
    seoDescription: "Meuble de salle de bain avec vasque céramique et tiroirs silencieux",
    productType: "equipement",
    brand: "Jacob Delafon",
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
  console.log('🏠 Début du seeding des équipements maison...');

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

    // Vérifier s'il y a déjà des produits équipement
    const existingEquipements = await prisma.product.count({
      where: {
        category: 'Équipement Maison'
      }
    });

    if (existingEquipements > 0) {
      console.log(`⚠️  ${existingEquipements} équipements existants détectés`);
      console.log('🗑️  Suppression des anciens équipements...');
      await prisma.product.deleteMany({
        where: {
          category: 'Équipement Maison'
        }
      });
      console.log('✅ Anciens équipements supprimés');
    }

    // Créer les équipements
    console.log(`🛠️  Création de ${equipementsData.length} équipements maison...`);

    let createdCount = 0;
    for (const productData of equipementsData) {
      // Sélectionner un utilisateur au hasard
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Générer le slug
      const slug = generateSlug(productData.name);

      await prisma.product.create({
        data: {
          ...productData,
          slug,
          userId: randomUser.id,
          publishedAt: productData.status === 'active' ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Champs supplémentaires pour les équipements
          viewCount: Math.floor(Math.random() * 500) + 50,
          clickCount: Math.floor(Math.random() * 200) + 20,
          purchaseCount: Math.floor(Math.random() * 100) + 5
        }
      });

      createdCount++;
      if (createdCount % 5 === 0) {
        console.log(`📝 ${createdCount}/${equipementsData.length} équipements créés...`);
      }
    }

    console.log('🎉 Seeding des équipements maison terminé avec succès!');
    console.log(`📊 ${equipementsData.length} équipements créés`);

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: 'Équipement Maison'
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

    // Afficher les équipements en vedette
    const featuredProducts = await prisma.product.findMany({
      where: {
        category: 'Équipement Maison',
        featured: true
      },
      select: {
        name: true,
        price: true,
        subcategory: true
      },
      take: 8
    });

    console.log('\n⭐ Équipements en vedette:');
    featuredProducts.forEach(product => {
      console.log(`   ✨ ${product.name} (${product.subcategory}) - ${product.price.toFixed(2)}€`);
    });

    // Statistiques générales
    const stats = await prisma.product.aggregate({
      where: {
        category: 'Équipement Maison'
      },
      _count: {
        id: true
      },
      _avg: {
        price: true,
        quantity: true
      },
      _sum: {
        quantity: true
      }
    });

    console.log('\n📊 Statistiques des équipements:');
    console.log(`   💰 Prix moyen: ${stats._avg.price.toFixed(2)}€`);
    console.log(`   📦 Stock total: ${stats._sum.quantity} unités`);
    console.log(`   🏷️  Catégories différentes: ${productsBySubcategory.length}`);

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