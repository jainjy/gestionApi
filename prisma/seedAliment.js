import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Données de produits alimentaires réalistes
const foodProductsData = [
  // === FRUITS FRAIS ===
  {
    name: "Pommes Golden Bio",
    description:
      "Pommes golden biologiques, croquantes et sucrées, cultivées en France. Parfaites pour la consommation directe ou en pâtisserie.",
    category: "Alimentation",
    subcategory: "Fruits Frais",
    price: 4.5,
    comparePrice: 5.2,
    cost: 2.8,
    sku: "POMME-GOLD-BIO-001",
    barcode: "3001234567890",
    trackQuantity: true,
    quantity: 150,
    lowStock: 20,
    weight: 1.0,
    dimensions: { length: 8, width: 8, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Pommes Golden Bio - Fruits frais de France",
    seoDescription:
      "Pommes golden biologiques cultivées en France, croquantes et sucrées",
    // Nouveaux champs alimentaires
    productType: "food",
    foodCategory: "fruits",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
    storageTips: "Conserver au frais et à l'abri de la lumière",
    nutritionalInfo: {
      calories: 52,
      proteins: 0.3,
      carbs: 14,
      fats: 0.2,
      fiber: 2.4,
      sugar: 10,
    },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Verger Bio de Normandie",
    unit: "kg",
  },
  {
    name: "Fraises Gariguette du Périgord",
    description:
      "Fraises gariguette du Périgord, parfumées et juteuses, cueillies à maturité. Idéales pour les desserts et confitures.",
    category: "Alimentation",
    subcategory: "Fruits Frais",
    price: 8.9,
    comparePrice: 10.5,
    cost: 5.2,
    sku: "FRAISE-GARIG-001",
    barcode: "3001234567891",
    trackQuantity: true,
    quantity: 75,
    lowStock: 10,
    weight: 0.5,
    dimensions: { length: 20, width: 15, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Fraises Gariguette du Périgord Bio",
    seoDescription:
      "Fraises gariguette biologiques du Périgord, cueillies à maturité",
    productType: "food",
    foodCategory: "fruits",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
    storageTips: "Conserver au réfrigérateur et consommer rapidement",
    nutritionalInfo: {
      calories: 32,
      proteins: 0.7,
      carbs: 7.7,
      fats: 0.3,
      fiber: 2.0,
      vitaminC: 59,
    },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Berry Farm Périgord",
    unit: "barquette 500g",
  },

  // === FRUITS EXOTIQUES ===
  {
    name: "Mangues Alphonso Indiennes",
    description:
      "Mangues alphonso indiennes, la reine des mangues. Chair fondante, parfumée et sans fibres. Saison limitée.",
    category: "Alimentation",
    subcategory: "Fruits Exotiques",
    price: 12.9,
    comparePrice: 15.0,
    cost: 8.5,
    sku: "MANGUE-ALPH-001",
    barcode: "3001234567892",
    trackQuantity: true,
    quantity: 45,
    lowStock: 5,
    weight: 0.3,
    dimensions: { length: 12, width: 8, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1553279768-865429fa0078?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Mangues Alphonso Indiennes - Fruit exotique premium",
    seoDescription: "Mangues alphonso d'Inde, chair fondante et parfumée",
    productType: "food",
    foodCategory: "fruits-exotiques",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver à température ambiante jusqu'à maturation",
    nutritionalInfo: {
      calories: 60,
      proteins: 0.8,
      carbs: 15,
      fats: 0.4,
      vitaminA: 25,
      vitaminC: 36,
    },
    allergens: [],
    isOrganic: false,
    origin: "Inde",
    brand: "Exotic Fruits Import",
    unit: "pièce",
  },

  // === LÉGUMES FRAIS ===
  {
    name: "Carottes Nantaises Bio",
    description:
      "Carottes nantaises biologiques, croquantes et sucrées. Parfaites crues ou cuites, riches en bêta-carotène.",
    category: "Alimentation",
    subcategory: "Légumes Frais",
    price: 2.8,
    comparePrice: 3.5,
    cost: 1.5,
    sku: "CAROTTE-NANT-001",
    barcode: "3001234567893",
    trackQuantity: true,
    quantity: 180,
    lowStock: 25,
    weight: 1.0,
    dimensions: { length: 25, width: 15, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Carottes Nantaises Bio - Légumes racines frais",
    seoDescription: "Carottes nantaises biologiques, croquantes et sucrées",
    productType: "food",
    foodCategory: "legumes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au frais et à l'abri de la lumière",
    nutritionalInfo: {
      calories: 41,
      proteins: 0.9,
      carbs: 10,
      fats: 0.2,
      fiber: 2.8,
      vitaminA: 16706,
    },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Potager Bio de l'Ouest",
    unit: "kg",
  },
  {
    name: "Tomates Anciennes Variées",
    description:
      "Assortiment de tomates anciennes : Cœur de Bœuf, Noire de Crimée, Green Zebra. Saveurs authentiques et textures variées.",
    category: "Alimentation",
    subcategory: "Légumes Frais",
    price: 7.9,
    comparePrice: 9.5,
    cost: 4.8,
    sku: "TOMATE-ANCIEN-001",
    barcode: "3001234567894",
    trackQuantity: true,
    quantity: 90,
    lowStock: 12,
    weight: 1.0,
    dimensions: { length: 20, width: 15, height: 12 },
    images: [
      "https://images.unsplash.com/photo-1561136594-7f68413baa99?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Tomates Anciennes Variées - Saveurs authentiques",
    seoDescription:
      "Assortiment de tomates anciennes biologiques aux saveurs uniques",
    productType: "food",
    foodCategory: "legumes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver à température ambiante, ne pas réfrigérer",
    nutritionalInfo: {
      calories: 18,
      proteins: 0.9,
      carbs: 3.9,
      fats: 0.2,
      fiber: 1.2,
      vitaminC: 14,
    },
    allergens: [],
    isOrganic: true,
    origin: "France",
    brand: "Jardins d'Antan",
    unit: "kg",
  },

  // === PRODUITS LAITIERS ===
  {
    name: "Lait Entier Bio 1L",
    description:
      "Lait entier biologique pasteurisé, riche en calcium et protéines. Issu de vaches élevées en plein air.",
    category: "Alimentation",
    subcategory: "Produits Laitiers",
    price: 1.8,
    comparePrice: 2.1,
    cost: 1.0,
    sku: "LAIT-ENTIER-BIO-001",
    barcode: "3001234567895",
    trackQuantity: true,
    quantity: 200,
    lowStock: 30,
    weight: 1.03,
    dimensions: { length: 8, width: 8, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lait Entier Bio 1L - Produit laitier frais",
    seoDescription: "Lait entier biologique pasteurisé, riche en calcium",
    productType: "food",
    foodCategory: "produits-laitiers",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au réfrigérateur à 4°C maximum",
    nutritionalInfo: {
      calories: 61,
      proteins: 3.2,
      carbs: 4.8,
      fats: 3.6,
      calcium: 120,
      vitaminD: 1.1,
    },
    allergens: ["lactose"],
    isOrganic: true,
    origin: "France",
    brand: "Ferme Bio Lactée",
    unit: "litre",
  },
  {
    name: "Fromage de Chèvre Frais Bio",
    description:
      "Fromage de chèvre frais au lait cru, onctueux et légèrement acidulé. Fabriqué artisanalement.",
    category: "Alimentation",
    subcategory: "Produits Laitiers",
    price: 4.2,
    comparePrice: 5.0,
    cost: 2.5,
    sku: "CHÈVRE-FRAIS-001",
    barcode: "3001234567896",
    trackQuantity: true,
    quantity: 85,
    lowStock: 15,
    weight: 0.15,
    dimensions: { length: 10, width: 6, height: 4 },
    images: [
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Fromage de Chèvre Frais Bio - Fromagerie artisanale",
    seoDescription: "Fromage de chèvre frais au lait cru biologique",
    productType: "food",
    foodCategory: "produits-laitiers",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au réfrigérateur dans son emballage",
    nutritionalInfo: {
      calories: 104,
      proteins: 9.0,
      carbs: 1.0,
      fats: 7.0,
      calcium: 100,
      sodium: 200,
    },
    allergens: ["lactose"],
    isOrganic: true,
    origin: "France",
    brand: "Fromagerie du Val",
    unit: "150g",
  },

  // === BOUCHERIE ===
  {
    name: "Filet de Bœuf Charolais",
    description:
      "Filet de bœuf charolais, tendre et persillé. Idéal pour rôtis ou grillade. Viande maturée 21 jours.",
    category: "Alimentation",
    subcategory: "Boucherie",
    price: 32.9,
    comparePrice: 38.0,
    cost: 22.0,
    sku: "BOEUF-FILET-001",
    barcode: "3001234567897",
    trackQuantity: true,
    quantity: 25,
    lowStock: 3,
    weight: 1.0,
    dimensions: { length: 25, width: 12, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1594046243099-15a5c0566c1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Filet de Bœuf Charolais - Viande premium",
    seoDescription: "Filet de bœuf charolais tendre, maturé 21 jours",
    productType: "food",
    foodCategory: "viandes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au réfrigérateur entre 0 et 4°C",
    nutritionalInfo: {
      calories: 205,
      proteins: 26,
      carbs: 0,
      fats: 11,
      iron: 2.5,
      zinc: 5.0,
    },
    allergens: [],
    isOrganic: false,
    origin: "France",
    brand: "Boucherie Tradition",
    unit: "kg",
  },

  // === POISSONNERIE ===
  {
    name: "Saumon Frais Norvégien",
    description:
      "Filets de saumon frais de Norvège, riches en oméga-3. Pêché durablement, peau présente.",
    category: "Alimentation",
    subcategory: "Poissonnerie",
    price: 24.9,
    comparePrice: 29.9,
    cost: 16.5,
    sku: "SAUMON-FRAIS-001",
    barcode: "3001234567898",
    trackQuantity: true,
    quantity: 35,
    lowStock: 5,
    weight: 0.3,
    dimensions: { length: 20, width: 12, height: 3 },
    images: [
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Saumon Frais Norvégien - Riche en oméga-3",
    seoDescription: "Filets de saumon frais de Norvège, pêche durable",
    productType: "food",
    foodCategory: "poissons",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au réfrigérateur et consommer rapidement",
    nutritionalInfo: {
      calories: 208,
      proteins: 20,
      carbs: 0,
      fats: 13,
      omega3: 2.5,
      vitaminD: 14,
    },
    allergens: ["poisson"],
    isOrganic: false,
    origin: "Norvège",
    brand: "Pêcheries du Nord",
    unit: "300g",
  },

  // === ÉPICERIE BIO ===
  {
    name: "Riz Basmati Bio 1kg",
    description:
      "Riz basmati biologique de qualité premium, grains longs et parfumés. Idéal pour plats asiatiques.",
    category: "Alimentation",
    subcategory: "Épicerie Bio",
    price: 5.9,
    comparePrice: 7.2,
    cost: 3.2,
    sku: "RIZ-BASMATI-001",
    barcode: "3001234567899",
    trackQuantity: true,
    quantity: 120,
    lowStock: 20,
    weight: 1.0,
    dimensions: { length: 20, width: 8, height: 25 },
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Riz Basmati Bio 1kg - Riz long grain parfumé",
    seoDescription: "Riz basmati biologique de qualité premium",
    productType: "food",
    foodCategory: "epicerie",
    isPerishable: false,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    storageTips: "Conserver dans un endroit sec et à l'abri de la lumière",
    nutritionalInfo: {
      calories: 130,
      proteins: 2.7,
      carbs: 28,
      fats: 0.3,
      fiber: 0.4,
      iron: 0.1,
    },
    allergens: [],
    isOrganic: true,
    origin: "Inde",
    brand: "Terre Bio",
    unit: "kg",
  },

  // === BOULANGERIE ===
  {
    name: "Pain de Campagne Artisanal",
    description:
      "Pain de campagne cuit au feu de bois, croûte croustillante et mie aérée. Préparé quotidiennement.",
    category: "Alimentation",
    subcategory: "Boulangerie",
    price: 4.5,
    comparePrice: 5.5,
    cost: 2.2,
    sku: "PAIN-CAMPAGNE-001",
    barcode: "3001234567900",
    trackQuantity: true,
    quantity: 30,
    lowStock: 5,
    weight: 0.8,
    dimensions: { length: 35, width: 15, height: 12 },
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Pain de Campagne Artisanal - Boulangerie traditionnelle",
    seoDescription:
      "Pain de campagne cuit au feu de bois, fabrication artisanale",
    productType: "food",
    foodCategory: "boulangerie",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver dans un torchon à température ambiante",
    nutritionalInfo: {
      calories: 265,
      proteins: 9,
      carbs: 49,
      fats: 1.5,
      fiber: 2.7,
      sodium: 480,
    },
    allergens: ["gluten"],
    isOrganic: false,
    origin: "France",
    brand: "Boulangerie du Village",
    unit: "pièce",
  },

  // === BOISSONS ===
  {
    name: "Jus d'Orange Pressé Bio 1L",
    description:
      "Jus d'orange 100% pur jus, pressé à froid. Sans additifs ni conservateurs. Riche en vitamine C.",
    category: "Alimentation",
    subcategory: "Boissons",
    price: 3.9,
    comparePrice: 4.8,
    cost: 2.1,
    sku: "JUS-ORANGE-001",
    barcode: "3001234567901",
    trackQuantity: true,
    quantity: 80,
    lowStock: 15,
    weight: 1.05,
    dimensions: { length: 8, width: 8, height: 23 },
    images: [
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Jus d'Orange Pressé Bio 1L - 100% pur jus",
    seoDescription:
      "Jus d'orange biologique pressé à froid, riche en vitamine C",
    productType: "food",
    foodCategory: "boissons",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    storageTips: "Conserver au réfrigérateur après ouverture",
    nutritionalInfo: {
      calories: 45,
      proteins: 0.7,
      carbs: 10,
      fats: 0.2,
      vitaminC: 50,
      potassium: 200,
    },
    allergens: [],
    isOrganic: true,
    origin: "Espagne",
    brand: "Jus Bio Nature",
    unit: "litre",
  },
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
  console.log("🌱 Début du seeding des produits alimentaires...");

  try {
    // Récupérer tous les utilisateurs existants
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données");
      console.log(
        "💡 Veuillez d'abord créer des utilisateurs avant de lancer ce seed"
      );
      return;
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`);

    // Vérifier s'il y a déjà des produits alimentaires
    const existingFoodProducts = await prisma.product.count({
      where: {
        productType: "food",
      },
    });

    if (existingFoodProducts > 0) {
      console.log(
        `⚠️  ${existingFoodProducts} produits alimentaires existants détectés`
      );
      console.log("🗑️  Suppression des anciens produits alimentaires...");
      await prisma.product.deleteMany({
        where: {
          productType: "food",
        },
      });
      console.log("✅ Anciens produits alimentaires supprimés");
    }

    // Créer les produits alimentaires
    console.log(
      `🛍️  Création de ${foodProductsData.length} produits alimentaires...`
    );

    for (const productData of foodProductsData) {
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

      console.log(`✅ Produit alimentaire créé: ${productData.name}`);
    }

    console.log("🎉 Seeding des produits alimentaires terminé avec succès!");
    console.log(`📊 ${foodProductsData.length} produits alimentaires créés`);

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ["subcategory"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n📈 Résumé par sous-catégorie alimentaire:");
    productsBySubcategory.forEach((cat) => {
      console.log(`   ${cat.subcategory}: ${cat._count.id} produits`);
    });

    // Résumé par type d'aliment
    const productsByFoodCategory = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n🍎 Résumé par catégorie alimentaire:");
    productsByFoodCategory.forEach((cat) => {
      console.log(`   ${cat.foodCategory}: ${cat._count.id} produits`);
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors du seeding des produits alimentaires:",
      error
    );
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
