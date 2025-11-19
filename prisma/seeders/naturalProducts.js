// seeders/naturalProducts.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Fonction pour générer des dates d'expiration
function getExpiryDate(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

// Fonction pour générer un SKU
function generateSKU(name, category) {
  const prefix = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${nameCode}-${random}`;
}

// Fonction pour générer un code-barres
function generateBarcode() {
  return '7' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
}

// Données de produits naturels organisées par catégories
const naturalProductsData = [
  // ======================
  // HUILES ESSENTIELLES
  // ======================
  {
    name: "Huile Essentielle de Lavande",
    description: "Huile essentielle pure pour relaxation et sommeil réparateur. Produit 100% naturel et biologique.",
    category: "Huiles Essentielles",
    subcategory: "Relaxantes",
    price: 12.9,
    comparePrice: 15.9,
    cost: 6.5,
    sku: "HE-LAV-001",
    barcode: "7123456789001",
    trackQuantity: true,
    quantity: 85,
    lowStock: 15,
    weight: 0.05,
    dimensions: { length: 5, width: 5, height: 8 },
    images: ["https://i.pinimg.com/736x/4d/11/69/4d1169db7a9cdde4d0182d0bfb73bb52.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Huile Essentielle de Lavande Bio - Relaxation et Sommeil",
    seoDescription: "Huile essentielle de lavande pure 100% naturelle pour relaxation et sommeil réparateur",
    productType: "produitnaturel",
    foodCategory: "huiles-essentielles",
    isPerishable: true,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver à l'abri de la lumière et de la chaleur",
    nutritionalInfo: { usage: "Aromathérapie", application: "Cutané, diffusion", precautions: "Diluer avant utilisation" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Nature & Essence",
    unit: "flacon",
  },
  {
    name: "Huile Essentielle de Menthe Poivrée",
    description: "Huile essentielle revitalisante pour la digestion et la concentration. Fraîcheur intense.",
    category: "Huiles Essentielles",
    subcategory: "Énergisantes",
    price: 14.5,
    comparePrice: 17.0,
    cost: 7.2,
    sku: "HE-MENT-001",
    barcode: "7123456789002",
    trackQuantity: true,
    quantity: 65,
    lowStock: 12,
    weight: 0.05,
    dimensions: { length: 5, width: 5, height: 8 },
    images: ["https://i.pinimg.com/736x/8a/3b/8f/8a3b8f8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Huile Essentielle Menthe Poivrée - Digestion et Concentration",
    seoDescription: "Huile essentielle de menthe poivrée pour digestion et concentration optimale",
    productType: "produitnaturel",
    foodCategory: "huiles-essentielles",
    isPerishable: true,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver au frais et à l'abri de la lumière",
    nutritionalInfo: { usage: "Aromathérapie", application: "Cutané, diffusion", precautions: "Éviter yeux et muqueuses" },
    allergens: [],
    isOrganic: true,
    origin: "Inde",
    brand: "Nature & Essence",
    unit: "flacon",
  },
  {
    name: "Huile Essentielle d'Eucalyptus",
    description: "Purifiante et décongestionnante, idéale pour les voies respiratoires.",
    category: "Huiles Essentielles",
    subcategory: "Respiratoires",
    price: 11.9,
    comparePrice: 13.9,
    cost: 5.8,
    sku: "HE-EUC-001",
    barcode: "7123456789003",
    trackQuantity: true,
    quantity: 75,
    lowStock: 15,
    weight: 0.05,
    dimensions: { length: 5, width: 5, height: 8 },
    images: ["https://i.pinimg.com/736x/9b/2c/7d/9b2c7d8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Huile Essentielle Eucalyptus - Voies Respiratoires",
    seoDescription: "Huile essentielle d'eucalyptus purifiante pour les voies respiratoires",
    productType: "produitnaturel",
    foodCategory: "huiles-essentielles",
    isPerishable: true,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver dans un endroit frais et sec",
    nutritionalInfo: { usage: "Aromathérapie", application: "Diffusion, inhalation", precautions: "Déconseillé aux asthmatiques" },
    allergens: [],
    isOrganic: true,
    origin: "Australie",
    brand: "Nature & Essence",
    unit: "flacon",
  },

  // ======================
  // THÉS & INFUSIONS
  // ======================
  {
    name: "Thé Vert Matcha Bio",
    description: "Matcha premium japonais riche en antioxydants pour l'énergie et la concentration.",
    category: "Thés & Infusions",
    subcategory: "Thés Vert",
    price: 24.5,
    comparePrice: 29.9,
    cost: 12.0,
    sku: "THE-MATCHA-001",
    barcode: "7123456789004",
    trackQuantity: true,
    quantity: 45,
    lowStock: 8,
    weight: 0.1,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://i.pinimg.com/1200x/2c/e5/54/2ce554437d2e0e036297bd67dae73037.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Thé Vert Matcha Bio Premium - Antioxydants Naturels",
    seoDescription: "Matcha premium japonais bio riche en antioxydants pour énergie et concentration",
    productType: "produitnaturel",
    foodCategory: "thes-infusions",
    isPerishable: false,
    expiryDate: getExpiryDate(545),
    storageTips: "Conserver dans un contenant hermétique à l'abri de la lumière",
    nutritionalInfo: { calories: 3, antioxidants: "Élevés", caffeine: "Modérée", ltheanine: "Présente" },
    allergens: [],
    isOrganic: true,
    origin: "Japon",
    brand: "Jardins du Thé",
    unit: "boite",
  },
  {
    name: "Infusion Nuit Paisible",
    description: "Mélange de plantes apaisantes pour favoriser un sommeil profond et réparateur.",
    category: "Thés & Infusions",
    subcategory: "Infusions",
    price: 8.9,
    comparePrice: 10.5,
    cost: 4.2,
    sku: "INF-NUIT-001",
    barcode: "7123456789005",
    trackQuantity: true,
    quantity: 120,
    lowStock: 20,
    weight: 0.08,
    dimensions: { length: 10, width: 6, height: 15 },
    images: ["https://i.pinimg.com/736x/5a/6b/8d/5a6b8d8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Infusion Nuit Paisible - Sommeil Réparateur Naturel",
    seoDescription: "Infusion de plantes apaisantes pour un sommeil profond et réparateur naturel",
    productType: "produitnaturel",
    foodCategory: "thes-infusions",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver à l'abri de l'humidité et de la lumière",
    nutritionalInfo: { ingredients: "Tilleul, camomille, verveine", caffeine: "Sans", properties: "Apaisant" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Herboristerie Traditionnelle",
    unit: "sachet",
  },
  {
    name: "Thé Noir Earl Grey Bio",
    description: "Thé noir parfumé à la bergamote, riche et aromatique pour le matin.",
    category: "Thés & Infusions",
    subcategory: "Thés Noir",
    price: 12.9,
    comparePrice: 15.0,
    cost: 6.5,
    sku: "THE-EARL-001",
    barcode: "7123456789006",
    trackQuantity: true,
    quantity: 80,
    lowStock: 15,
    weight: 0.1,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://i.pinimg.com/736x/6c/7d/8a/6c7d8a8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Thé Noir Earl Grey Bio - Bergamote Naturelle",
    seoDescription: "Thé noir Earl Grey bio parfumé à la bergamote naturelle pour un réveil énergique",
    productType: "produitnaturel",
    foodCategory: "thes-infusions",
    isPerishable: false,
    expiryDate: getExpiryDate(545),
    storageTips: "Conserver dans une boîte hermétique",
    nutritionalInfo: { calories: 2, caffeine: "Élevée", antioxidants: "Présents" },
    allergens: [],
    isOrganic: true,
    origin: "Sri Lanka",
    brand: "Jardins du Thé",
    unit: "boite",
  },

  // ======================
  // AMBIANCE & RELAXATION
  // ======================
  {
    name: "Bougie Naturelle à la Cire de Soja",
    description: "Bougie parfumée aux huiles essentielles, cire 100% végétale, mèche coton.",
    category: "Ambiance & Relaxation",
    subcategory: "Bougies",
    price: 18.0,
    comparePrice: 22.0,
    cost: 9.0,
    sku: "BOUG-SOJA-001",
    barcode: "7123456789007",
    trackQuantity: true,
    quantity: 60,
    lowStock: 10,
    weight: 0.4,
    dimensions: { length: 8, width: 8, height: 10 },
    images: ["https://i.pinimg.com/1200x/13/e0/b5/13e0b52ed51c7dfe7b7d89bbd9b1f058.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Bougie Naturelle Cire de Soja - Huiles Essentielles Pures",
    seoDescription: "Bougie naturelle en cire de soja avec huiles essentielles pures, mèche coton écologique",
    productType: "produitnaturel",
    foodCategory: "ambiance-relaxation",
    isPerishable: false,
    expiryDate: getExpiryDate(1095),
    storageTips: "Conserver à l'abri de la lumière directe",
    nutritionalInfo: { composition: "Cire de soja 100%", parfum: "Huiles essentielles", duree: "40 heures" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Artisanat Naturel",
    unit: "pièce",
  },
  {
    name: "Pierre de Sel de l'Himalaya",
    description: "Pierre de sel naturelle pour purification de l'air et ambiance apaisante.",
    category: "Ambiance & Relaxation",
    subcategory: "Décorations Naturelles",
    price: 25.9,
    comparePrice: 32.0,
    cost: 12.5,
    sku: "PIERRE-SEL-001",
    barcode: "7123456789008",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 2.5,
    dimensions: { length: 15, width: 15, height: 20 },
    images: ["https://i.pinimg.com/736x/7c/8d/9a/7c8d9a8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Pierre de Sel Himalaya - Purification Naturelle",
    seoDescription: "Pierre de sel de l'Himalaya naturelle pour purification de l'air et ambiance zen",
    productType: "produitnaturel",
    foodCategory: "ambiance-relaxation",
    isPerishable: false,
    expiryDate: null,
    storageTips: "Éviter l'humidité excessive",
    nutritionalInfo: { composition: "Sel cristallin naturel", proprietes: "Ionisation naturelle" },
    allergens: [],
    isOrganic: true,
    origin: "Himalaya",
    brand: "Nature Minérale",
    unit: "pièce",
  },

  // ======================
  // SOINS BIEN-ÊTRE
  // ======================
  {
    name: "Roller Stress Stop aux Plantes",
    description: "Synergie d'huiles essentielles en roller pour apaiser instantanément les tensions.",
    category: "Soins Bien-être",
    subcategory: "Rollers",
    price: 9.9,
    comparePrice: 12.5,
    cost: 4.8,
    sku: "ROLL-STRESS-001",
    barcode: "7123456789009",
    trackQuantity: true,
    quantity: 95,
    lowStock: 18,
    weight: 0.02,
    dimensions: { length: 3, width: 3, height: 8 },
    images: ["https://i.pinimg.com/736x/7b/15/c1/7b15c1eea303a45bb231665e2aebac05.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Roller Stress Stop - Huiles Essentielles Apaisantes",
    seoDescription: "Roller aux huiles essentielles pour apaiser instantanément le stress et les tensions",
    productType: "produitnaturel",
    foodCategory: "soins-bien-etre",
    isPerishable: true,
    expiryDate: getExpiryDate(365),
    storageTips: "Appliquer sur les poignets et tempes",
    nutritionalInfo: { usage: "Cutané", application: "Pulses, tempes", composition: "Lavande, camomille, orange" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Aroma Zen",
    unit: "roller",
  },
  {
    name: "Baume Réparateur au Calendula",
    description: "Baume 100% naturel pour apaiser et réparer les peaux sensibles et irritées.",
    category: "Soins Bien-être",
    subcategory: "Soins Corporels",
    price: 14.9,
    comparePrice: 17.9,
    cost: 7.2,
    sku: "BAUME-CALEND-001",
    barcode: "7123456789010",
    trackQuantity: true,
    quantity: 70,
    lowStock: 12,
    weight: 0.05,
    dimensions: { length: 5, width: 5, height: 3 },
    images: ["https://i.pinimg.com/736x/8d/9a/6b/8d9a6b8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Baume Réparateur Calendula - Peaux Sensibles",
    seoDescription: "Baume 100% naturel au calendula pour apaiser et réparer les peaux sensibles",
    productType: "produitnaturel",
    foodCategory: "soins-bien-etre",
    isPerishable: true,
    expiryDate: getExpiryDate(545),
    storageTips: "Conserver à température ambiante",
    nutritionalInfo: { ingredients: "Calendula, cire d'abeille, huile d'olive", usage: "Cutané", proprietes: "Apaisant, réparateur" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Nature & Peau",
    unit: "pot",
  },

  // ======================
  // COMPLÉMENTS ALIMENTAIRES
  // ======================
  {
    name: "Complexe de Vitamines Bio",
    description: "Mélange de vitamines et minéraux essentiels pour booster votre immunité naturellement.",
    category: "Compléments Alimentaires",
    subcategory: "Multivitamines",
    price: 29.9,
    comparePrice: 35.9,
    cost: 15.0,
    sku: "COMP-VIT-001",
    barcode: "7123456789011",
    trackQuantity: true,
    quantity: 0,
    lowStock: 10,
    weight: 0.15,
    dimensions: { length: 6, width: 6, height: 10 },
    images: ["https://i.pinimg.com/1200x/bd/14/6a/bd146a09437e560fbd86d37240b3585b.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Complexe Vitamines Bio - Immunité Naturelle",
    seoDescription: "Complexe de vitamines et minéraux bio essentiels pour booster l'immunité naturellement",
    productType: "produitnaturel",
    foodCategory: "complements-alimentaires",
    isPerishable: true,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver au frais et au sec",
    nutritionalInfo: { vitamins: "A, C, D, E, B", minerals: "Zinc, Sélénium", dosage: "1 gélule par jour" },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Vitalité Naturelle",
    unit: "flacon",
  },
  {
    name: "Spiruline Bio en Poudre",
    description: "Super aliment riche en protéines, fer et antioxydants pour une vitalité au quotidien.",
    category: "Compléments Alimentaires",
    subcategory: "Super Aliments",
    price: 19.9,
    comparePrice: 24.5,
    cost: 9.8,
    sku: "SPIRULINE-001",
    barcode: "7123456789012",
    trackQuantity: true,
    quantity: 55,
    lowStock: 10,
    weight: 0.2,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://i.pinimg.com/736x/9a/6b/8d/9a6b8d8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Spiruline Bio en Poudre - Protéines Végétales",
    seoDescription: "Spiruline bio en poudre, super aliment riche en protéines, fer et antioxydants naturels",
    productType: "produitnaturel",
    foodCategory: "complements-alimentaires",
    isPerishable: true,
    expiryDate: getExpiryDate(545),
    storageTips: "Conserver à l'abri de la lumière et de l'humidité",
    nutritionalInfo: { proteines: "60%", fer: "Élevé", vitamines: "B12, Beta-carotène", dosage: "1 cuillère par jour" },
    allergens: [],
    isOrganic: true,
    origin: "Chine",
    brand: "Super Foods Nature",
    unit: "pot",
  },

  // ======================
  // ACCESSOIRES
  // ======================
  {
    name: "Diffuseur Ultrasonique Bambou",
    description: "Diffuseur design en bambou pour purifier l'air et diffuser vos huiles essentielles.",
    category: "Accessoires",
    subcategory: "Diffuseurs",
    price: 45.0,
    comparePrice: 55.0,
    cost: 22.5,
    sku: "DIFF-BAMBOU-001",
    barcode: "7123456789013",
    trackQuantity: true,
    quantity: 30,
    lowStock: 5,
    weight: 0.6,
    dimensions: { length: 12, width: 12, height: 15 },
    images: ["https://i.pinimg.com/736x/51/b4/41/51b44175cf8228773b048a51864bfaad.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Diffuseur Ultrasonique Bambou - Design Naturel",
    seoDescription: "Diffuseur ultrasonique en bambou naturel pour purification air et diffusion huiles essentielles",
    productType: "produitnaturel",
    foodCategory: "accessoires",
    isPerishable: false,
    expiryDate: null,
    storageTips: "Nettoyer régulièrement avec du vinaigre blanc",
    nutritionalInfo: { materiau: "Bambou naturel", capacite: "300ml", duree: "8 heures", fonction: "Ultrasonique" },
    allergens: [],
    isOrganic: false,
    origin: "Chine",
    brand: "Zen Diffusion",
    unit: "pièce",
  },
  {
    name: "Set de Bols en Céramique pour Huiles",
    description: "Set de 6 bols en céramique naturelle pour vos mélanges d'huiles essentielles.",
    category: "Accessoires",
    subcategory: "Matériel",
    price: 22.9,
    comparePrice: 27.5,
    cost: 11.0,
    sku: "BOLS-CERAM-001",
    barcode: "7123456789014",
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 0.8,
    dimensions: { length: 15, width: 15, height: 10 },
    images: ["https://i.pinimg.com/736x/6b/8d/9a/6b8d9a8c7f4c4e4e4e4e4e4e4e4e4e4e.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Set Bols Céramique - Huiles Essentielles Naturelles",
    seoDescription: "Set de 6 bols en céramique naturelle pour mélanges d'huiles essentielles et préparations",
    productType: "produitnaturel",
    foodCategory: "accessoires",
    isPerishable: false,
    expiryDate: null,
    storageTips: "Laver à la main avec un détergent doux",
    nutritionalInfo: { materiau: "Céramique naturelle", nombre: "6 pièces", usage: "Mélanges huiles essentielles" },
    allergens: [],
    isOrganic: false,
    origin: "Portugal",
    brand: "Artisanat Naturel",
    unit: "set",
  }
];

// Fonction pour générer un slug à partir du nom
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 100);
}

async function main() {
  console.log("🌱 Début du seeding des produits naturels avec productType 'produitnaturel'...");

  try {
    // Récupérer tous les utilisateurs existants
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données");
      console.log("💡 Veuillez d'abord créer des utilisateurs avant de lancer ce seed");
      return;
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`);

    // Vérifier s'il y a déjà des produits naturels
    const existingNaturalProducts = await prisma.product.count({
      where: {
        productType: "produitnaturel",
      },
    });

    if (existingNaturalProducts > 0) {
      console.log(`⚠️  ${existingNaturalProducts} produits naturels existants détectés`);
      console.log("🗑️  Suppression des anciens produits naturels...");
      await prisma.product.deleteMany({
        where: {
          productType: "produitnaturel",
        },
      });
      console.log("✅ Anciens produits naturels supprimés");
    }

    // Créer les produits naturels
    console.log(`🛍️  Création de ${naturalProductsData.length} produits naturels...`);

    for (const productData of naturalProductsData) {
      // Sélectionner un utilisateur au hasard
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Générer le slug
      const slug = generateSlug(productData.name);

      await prisma.product.create({
        data: {
          ...productData,
          slug,
          userId: randomUser.id,
          publishedAt: productData.status === "active" ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Produit naturel créé: ${productData.name}`);
    }

    console.log("🎉 Seeding des produits naturels terminé avec succès!");
    console.log(`📊 ${naturalProductsData.length} produits naturels créés`);

    // Afficher un résumé par foodCategory
    const productsByFoodCategory = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "produitnaturel",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n📈 Résumé par foodCategory:");
    productsByFoodCategory.forEach((cat) => {
      console.log(`   ${cat.foodCategory}: ${cat._count.id} produits`);
    });

    // Résumé par catégorie traditionnelle
    const productsByCategory = await prisma.product.groupBy({
      by: ["category"],
      where: {
        productType: "produitnaturel",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n🌿 Résumé par catégorie:");
    productsByCategory.forEach((cat) => {
      console.log(`   ${cat.category}: ${cat._count.id} produits`);
    });

  } catch (error) {
    console.error("❌ Erreur lors du seeding des produits naturels:", error);
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