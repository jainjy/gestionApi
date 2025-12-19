// seeders/huilesEssentielles.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Fonction pour générer des dates d'expiration
function getExpiryDate(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

// Fonction pour générer un slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 100);
}

// Données des huiles essentielles avec seulement les champs du schéma
const huilesEssentiellesData = [
  {
    id: "HE001",
    name: "Lavande Vraie Bio",
    description: "Huile essentielle apaisante et relaxante, parfaite pour le sommeil et la détente. 100% pure et naturelle.",
    category: "Huiles Essentielles",
    subcategory: "Relaxation",
    price: 19.90,
    comparePrice: 24.90,
    cost: 12.50,
    sku: "LAV-BIO-001",
    barcode: "7123456789001",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 0.1,
    dimensions: { length: 5, width: 5, height: 10 },
    images: ["https://www.lecomptoirdeveronique.com/11193-home_default/lavande-vraie-huile-essentielle-bio.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Huile Essentielle Lavande Bio - Relaxation et Sommeil",
    seoDescription: "Huile essentielle de lavande bio 100% pure, idéale pour la relaxation et un sommeil profond",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver à l'abri de la lumière et de la chaleur, bien refermer après usage",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Nature & Bien-être",
    unit: "flacon 10ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
    // Note: Les champs supplémentaires comme purity, extractionMethod, etc.
    // seront stockés dans `extraFields` ou comme métadonnées si votre schéma le permet
  },
  {
    id: "HE002",
    name: "Menthe Poivrée",
    description: "Huile essentielle stimulante et rafraîchissante, idéale pour les maux de tête et la digestion.",
    category: "Huiles Essentielles",
    subcategory: "Énergie",
    price: 14.90,
    comparePrice: 18.50,
    cost: 9.80,
    sku: "MENTHE-POIV-002",
    barcode: "7123456789002",
    trackQuantity: true,
    quantity: 35,
    lowStock: 7,
    weight: 0.1,
    dimensions: { length: 5, width: 5, height: 10 },
    images: ["https://cdn.aroma-zone.com/d_default_placeholder.png/c_fill,q_auto,f_auto,w_626,h_441/b_none/v1/cf/0xsz2r7o7t3z/1GHWo1f8xRQFJVEPwS4CQt/5fed3192ce143128a4066bcd997d804b/FT-Plante_HE-Menthe-poivree-removebg-preview.png"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Huile Essentielle Menthe Poivrée - Fraîcheur et Digestion",
    seoDescription: "Huile essentielle de menthe poivrée pour fraîcheur immédiate et digestion facilitée",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "À conserver dans un endroit frais et sec",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: false,
    origin: "Inde",
    brand: "Aroma Pro",
    unit: "flacon 10ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    id: "HE003",
    name: "Tea Tree Bio",
    description: "Huile essentielle antiseptique puissante naturelle pour les problèmes cutanés et respiratoires.",
    category: "Huiles Essentielles",
    subcategory: "Santé",
    price: 16.90,
    comparePrice: 21.00,
    cost: 11.20,
    sku: "TEA-TREE-BIO-003",
    barcode: "7123456789003",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 0.15,
    dimensions: { length: 5, width: 5, height: 12 },
    images: ["https://www.lca-aroma.com/941-home_default/hydrolat-tea-tree-bio.jpg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Huile Essentielle Tea Tree Bio - Antiseptique Naturel",
    seoDescription: "Huile essentielle de tea tree bio, antiseptique naturel pour la peau et les voies respiratoires",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver loin de la lumière directe",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: true,
    origin: "Australie",
    brand: "Bio Aroma",
    unit: "flacon 15ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    id: "HE004",
    name: "Eucalyptus Radiata Bio",
    description: "Huile essentielle respiratoire, idéale pour dégager les voies respiratoires en hiver.",
    category: "Huiles Essentielles",
    subcategory: "Respiratoire",
    price: 13.50,
    comparePrice: 16.90,
    cost: 8.90,
    sku: "EUCALYPTUS-BIO-004",
    barcode: "7123456789004",
    trackQuantity: true,
    quantity: 30,
    lowStock: 6,
    weight: 0.1,
    dimensions: { length: 5, width: 5, height: 10 },
    images: ["https://cdn.shoplightspeed.com/shops/603058/files/69838324/700x700x2/divine-essence-huile-essentielle-eucalyptus-radiat.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Huile Essentielle Eucalyptus Bio - Voies Respiratoires",
    seoDescription: "Huile essentielle d'eucalyptus radiata bio pour dégager naturellement les voies respiratoires",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Bien fermer après chaque utilisation",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: true,
    origin: "Australie",
    brand: "Bio Aroma",
    unit: "flacon 10ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    id: "HE005",
    name: "Ravintsara Bio",
    description: "Huile essentielle immunostimulante, antivirale puissante contre les infections hivernales.",
    category: "Huiles Essentielles",
    subcategory: "Immunité",
    price: 17.90,
    comparePrice: 22.50,
    cost: 12.00,
    sku: "RAVINTSARA-BIO-005",
    barcode: "7123456789005",
    trackQuantity: true,
    quantity: 18,
    lowStock: 4,
    weight: 0.1,
    dimensions: { length: 5, width: 5, height: 10 },
    images: ["https://cdn.aroma-zone.com/d_default_placeholder.png/c_fill,q_auto,f_auto,w_626,h_626/b_none/v1/ctcdn/e5f608cf-85e6-4db5-8d00-81b1960857bb/00451-IOrlIVBI-yEB94nx2.png"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Huile Essentielle Ravintsara Bio - Immunité Renforcée",
    seoDescription: "Huile essentielle de ravintsara bio, puissante antivirale pour renforcer l'immunité",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "À conserver à température ambiante",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: true,
    origin: "Madagascar",
    brand: "Nature & Bien-être",
    unit: "flacon 10ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    id: "HE006",
    name: "Ylang Ylang Bio",
    description: "Huile essentielle aphrodisiaque et relaxante, parfum exotique et envoûtant.",
    category: "Huiles Essentielles",
    subcategory: "Relaxation",
    price: 21.90,
    comparePrice: 27.50,
    cost: 14.80,
    sku: "YLANG-YLANG-BIO-006",
    barcode: "7123456789006",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 0.1,
    dimensions: { length: 5, width: 5, height: 10 },
    images: ["https://horizane.com/2021-thickbox_default/eau-de-cologne-certifi%C3%A9e-bio-ylang-ylang-50-ml-.jpg"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Huile Essentielle Ylang Ylang Bio - Aphrodisiaque Naturel",
    seoDescription: "Huile essentielle d'ylang ylang bio, aphrodisiaque naturel au parfum exotique",
    productType: "aromatherapie",
    foodCategory: "huiles-essentielles",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver à l'abri de l'humidité",
    nutritionalInfo: null,
    allergens: [],
    isOrganic: true,
    origin: "Madagascar",
    brand: "Aroma Pro",
    unit: "flacon 10ml",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  }
];

async function main() {
  console.log("🌱 Début du seeding des huiles essentielles...");

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

    // Vérifier s'il y a déjà des huiles essentielles
    const existingHuiles = await prisma.product.count({
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ]
      },
    });

    if (existingHuiles > 0) {
      console.log(`⚠️  ${existingHuiles} huiles essentielles existantes détectées`);
      console.log("🗑️  Suppression des anciennes huiles essentielles...");
      await prisma.product.deleteMany({
        where: {
          OR: [
            { productType: "aromatherapie" },
            { foodCategory: "huiles-essentielles" }
          ]
        },
      });
      console.log("✅ Anciennes huiles essentielles supprimées");
    }

    // Créer les huiles essentielles
    console.log(`🛍️  Création de ${huilesEssentiellesData.length} huiles essentielles...`);

    let successCount = 0;
    let errorCount = 0;

    for (const huileData of huilesEssentiellesData) {
      try {
        // Sélectionner un utilisateur au hasard
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // Générer le slug
        const slug = generateSlug(huileData.name);

        // Créer seulement avec les champs du schéma
        const productData = {
          id: huileData.id,
          name: huileData.name,
          description: huileData.description,
          category: huileData.category,
          subcategory: huileData.subcategory,
          price: huileData.price,
          comparePrice: huileData.comparePrice,
          cost: huileData.cost,
          sku: huileData.sku,
          barcode: huileData.barcode,
          trackQuantity: huileData.trackQuantity,
          quantity: huileData.quantity,
          lowStock: huileData.lowStock,
          weight: huileData.weight,
          dimensions: huileData.dimensions,
          images: huileData.images,
          status: huileData.status,
          featured: huileData.featured,
          visibility: huileData.visibility,
          seoTitle: huileData.seoTitle,
          seoDescription: huileData.seoDescription,
          productType: huileData.productType,
          foodCategory: huileData.foodCategory,
          isPerishable: huileData.isPerishable,
          expiryDate: huileData.expiryDate,
          storageTips: huileData.storageTips,
          nutritionalInfo: huileData.nutritionalInfo,
          allergens: huileData.allergens,
          isOrganic: huileData.isOrganic,
          origin: huileData.origin,
          brand: huileData.brand,
          unit: huileData.unit,
          isVegan: huileData.isVegan,
          isVegetarian: huileData.isVegetarian,
          healthScore: huileData.healthScore,
          slug: slug,
          userId: randomUser.id,
          publishedAt: huileData.status === "active" ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await prisma.product.create({
          data: productData
        });

        console.log(`✅ Huile essentielle créée: ${huileData.name} (${huileData.unit})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur création ${huileData.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n🎉 Seeding terminé !`);
    console.log(`✅ ${successCount} huiles essentielles créées`);
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} erreurs`);
    }

    // Afficher un résumé
    const totalProducts = await prisma.product.count({
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ]
      },
    });

    console.log(`\n📊 Total huiles essentielles en base: ${totalProducts}`);

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ["subcategory"],
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ]
      },
      _count: {
        id: true,
      },
    });

    console.log("\n📈 Résumé par sous-catégorie:");
    productsBySubcategory.forEach((subcat) => {
      console.log(`   ${subcat.subcategory}: ${subcat._count.id} produits`);
    });

    // Résumé par origine
    const productsByOrigin = await prisma.product.groupBy({
      by: ["origin"],
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ]
      },
      _count: {
        id: true,
      },
    });

    console.log("\n🌍 Résumé par origine:");
    productsByOrigin.forEach((origin) => {
      console.log(`   ${origin.origin}: ${origin._count.id} produits`);
    });

    // Résumé par type de régime
    const veganCount = await prisma.product.count({
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ],
        isVegan: true,
      },
    });

    const organicCount = await prisma.product.count({
      where: {
        OR: [
          { productType: "aromatherapie" },
          { foodCategory: "huiles-essentielles" }
        ],
        isOrganic: true,
      },
    });

    console.log("\n🌱 Résumé par certification:");
    console.log(`   Produits Vegan: ${veganCount}`);
    console.log(`   Produits Bio: ${organicCount}`);

  } catch (error) {
    console.error("❌ Erreur générale lors du seeding:", error);
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