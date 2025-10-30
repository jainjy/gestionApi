import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Données de produits alimentaires réalistes
const foodProductsData = [
  // ======================
  // FRUITS FRAIS
  // ======================
  {
    name: "Pommes Golden Bio",
    description:
      "Pommes Golden biologiques, croquantes et sucrées. Cultivées en France sans pesticides.",
    category: "Fruits Frais",
    subcategory: "Pommes",
    price: 3.5,
    comparePrice: 4.2,
    cost: 2.1,
    sku: "POMME-GOLD-BIO-001",
    barcode: "1234567891001",
    trackQuantity: true,
    quantity: 150,
    lowStock: 20,
    weight: 1.0,
    dimensions: { length: 30, width: 20, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Pommes Golden Bio - Agriculture Biologique",
    seoDescription:
      "Pommes Golden biologiques françaises, croquantes et sucrées",
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
    brand: "Fermes Bio de France",
    unit: "kg",
  },
  {
    name: "Fraises Gariguette",
    description:
      "Fraises Gariguette de saison, sucrées et parfumées. Récoltées à maturité.",
    category: "Fruits Frais",
    subcategory: "Fruits Rouges",
    price: 6.9,
    comparePrice: 7.5,
    cost: 4.2,
    sku: "FRAISE-GARIG-001",
    barcode: "1234567891002",
    trackQuantity: true,
    quantity: 80,
    lowStock: 15,
    weight: 0.5,
    dimensions: { length: 25, width: 15, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Fraises Gariguette Fraîches - Producteur Local",
    seoDescription: "Fraises Gariguette de saison, sucrées et parfumées",
    productType: "food",
    foodCategory: "fruits",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
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
    isOrganic: false,
    origin: "Périgord, France",
    brand: "Verger du Sud-Ouest",
    unit: "barquette",
  },

  // ======================
  // FRUITS EXOTIQUES
  // ======================
  {
    name: "Mangues Kent Bio",
    description:
      "Mangues Kent biologiques, juteuses et sucrées. Importation équitable.",
    category: "Fruits Exotiques",
    subcategory: "Mangues",
    price: 4.5,
    comparePrice: 5.2,
    cost: 2.8,
    sku: "MANGUE-KENT-BIO-001",
    barcode: "1234567891003",
    trackQuantity: true,
    quantity: 60,
    lowStock: 10,
    weight: 0.8,
    dimensions: { length: 15, width: 10, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1553279768-865429fa0078?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Mangues Kent Bio - Commerce Équitable",
    seoDescription: "Mangues Kent biologiques juteuses et sucrées",
    productType: "food",
    foodCategory: "fruits",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    storageTips: "Conserver à température ambiante jusqu'à maturation",
    nutritionalInfo: {
      calories: 60,
      proteins: 0.8,
      carbs: 15,
      fats: 0.4,
      fiber: 1.6,
      vitaminA: 1082,
      vitaminC: 36,
    },
    allergens: [],
    isOrganic: true,
    origin: "Pérou",
    brand: "Terra Equa",
    unit: "pièce",
  },

  // ======================
  // LÉGUMES FRAIS
  // ======================
  {
    name: "Carottes Nouvelles Bio",
    description:
      "Carottes nouvelles biologiques, croquantes et sucrées. Récolte du jour.",
    category: "Légumes Frais",
    subcategory: "Légumes Racines",
    price: 2.8,
    comparePrice: 3.2,
    cost: 1.5,
    sku: "CAROTTE-NOUV-BIO-001",
    barcode: "1234567891004",
    trackQuantity: true,
    quantity: 200,
    lowStock: 30,
    weight: 1.0,
    dimensions: { length: 35, width: 20, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Carottes Nouvelles Bio - Agriculture Biologique",
    seoDescription: "Carottes nouvelles biologiques, croquantes et sucrées",
    productType: "food",
    foodCategory: "legumes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
    storageTips: "Conserver au frais et à l'abri de la lumière",
    nutritionalInfo: {
      calories: 41,
      proteins: 0.9,
      carbs: 10,
      fats: 0.2,
      fiber: 2.8,
      vitaminA: 16706,
      betaCarotene: 8285,
    },
    allergens: [],
    isOrganic: true,
    origin: "Val de Loire, France",
    brand: "Jardins Bio de France",
    unit: "kg",
  },
  {
    name: "Salade Laitue Bio",
    description:
      "Laitue biologique croquante, idéale pour les salades fraîches.",
    category: "Légumes Frais",
    subcategory: "Salades & Herbes",
    price: 1.9,
    comparePrice: 2.2,
    cost: 0.95,
    sku: "SALADE-LAITUE-BIO-001",
    barcode: "1234567891005",
    trackQuantity: true,
    quantity: 120,
    lowStock: 20,
    weight: 0.4,
    dimensions: { length: 20, width: 15, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Salade Laitue Bio - Fraîcheur Garantie",
    seoDescription: "Laitue biologique croquante pour salades fraîches",
    productType: "food",
    foodCategory: "legumes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
    storageTips: "Conserver au réfrigérateur dans un sac plastique",
    nutritionalInfo: {
      calories: 15,
      proteins: 1.4,
      carbs: 2.9,
      fats: 0.2,
      fiber: 1.3,
      vitaminK: 126,
    },
    allergens: [],
    isOrganic: true,
    origin: "Bretagne, France",
    brand: "Maraîchers Bio",
    unit: "pièce",
  },

  // ======================
  // PRODUITS LAITIERS
  // ======================
  {
    name: "Lait Entier Bio 1L",
    description:
      "Lait entier biologique pasteurisé, riche en calcium et en goût.",
    category: "Produits Laitiers",
    subcategory: "Lait",
    price: 1.6,
    comparePrice: 1.8,
    cost: 0.9,
    sku: "LAIT-ENTIER-BIO-1L",
    barcode: "1234567891006",
    trackQuantity: true,
    quantity: 90,
    lowStock: 15,
    weight: 1.03,
    dimensions: { length: 8, width: 8, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lait Entier Bio 1L - Riche en Calcium",
    seoDescription: "Lait entier biologique pasteurisé de qualité supérieure",
    productType: "food",
    foodCategory: "produits-laitiers",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    storageTips: "Conserver au réfrigérateur à 4°C",
    nutritionalInfo: {
      calories: 61,
      proteins: 3.2,
      carbs: 4.8,
      fats: 3.6,
      calcium: 120,
      vitaminD: 1.3,
    },
    allergens: ["lactose"],
    isOrganic: true,
    origin: "Normandie, France",
    brand: "Fermes Bio Normandes",
    unit: "litre",
  },
  {
    name: "Fromage de Chèvre Frais",
    description: "Fromage de chèvre frais crémeux, idéal pour l'apéritif.",
    category: "Produits Laitiers",
    subcategory: "Fromages",
    price: 4.2,
    comparePrice: 4.8,
    cost: 2.5,
    sku: "FROM-CHÈVRE-FRAIS-001",
    barcode: "1234567891007",
    trackQuantity: true,
    quantity: 45,
    lowStock: 8,
    weight: 0.2,
    dimensions: { length: 10, width: 10, height: 5 },
    images: [
      "https://images.unsplash.com/photo-1486297678162-eb2a1b331e84?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Fromage de Chèvre Frais - Produit Artisanal",
    seoDescription: "Fromage de chèvre frais crémeux de qualité artisanale",
    productType: "food",
    foodCategory: "produits-laitiers",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
    storageTips: "Conserver au réfrigérateur dans son emballage",
    nutritionalInfo: {
      calories: 104,
      proteins: 7.0,
      carbs: 1.0,
      fats: 8.0,
      calcium: 90,
      sodium: 180,
    },
    allergens: ["lactose"],
    isOrganic: false,
    origin: "Périgord, France",
    brand: "Fromagerie du Périgord",
    unit: "pièce",
  },

  // ======================
  // BOUCHERIE
  // ======================
  {
    name: "Filet de Poulet Fermier",
    description:
      "Filet de poulet fermier élevé en plein air, tendre et savoureux.",
    category: "Boucherie",
    subcategory: "Volailles",
    price: 12.9,
    comparePrice: 14.5,
    cost: 8.2,
    sku: "FILET-POULET-FERM-001",
    barcode: "1234567891008",
    trackQuantity: true,
    quantity: 35,
    lowStock: 5,
    weight: 0.5,
    dimensions: { length: 15, width: 10, height: 5 },
    images: [
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Filet de Poulet Fermier - Élevé en Plein Air",
    seoDescription: "Filet de poulet fermier tendre et savoureux",
    productType: "food",
    foodCategory: "viandes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
    storageTips: "Conserver au réfrigérateur à 2-4°C",
    nutritionalInfo: {
      calories: 165,
      proteins: 31,
      carbs: 0,
      fats: 3.6,
      cholesterol: 85,
      iron: 1.0,
    },
    allergens: [],
    isOrganic: false,
    origin: "Bresse, France",
    brand: "Élevages de Bresse",
    unit: "kg",
  },
  {
    name: "Steak Haché 15% MG",
    description: "Steak haché 15% de matières grasses, pur bœuf français.",
    category: "Boucherie",
    subcategory: "Bœuf",
    price: 9.5,
    comparePrice: 10.5,
    cost: 6.0,
    sku: "STEAK-HACHE-15-001",
    barcode: "1234567891009",
    trackQuantity: true,
    quantity: 60,
    lowStock: 10,
    weight: 0.4,
    dimensions: { length: 12, width: 8, height: 3 },
    images: [
      "https://images.unsplash.com/photo-1588347818122-c6c8d03ad3d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Steak Haché 15% MG - Pur Bœuf Français",
    seoDescription: "Steak haché 15% de matières grasses de qualité supérieure",
    productType: "food",
    foodCategory: "viandes",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours
    storageTips: "Conserver au réfrigérateur et consommer rapidement",
    nutritionalInfo: {
      calories: 215,
      proteins: 26,
      carbs: 0,
      fats: 12,
      cholesterol: 75,
      iron: 2.5,
    },
    allergens: [],
    isOrganic: false,
    origin: "Charolais, France",
    brand: "Boucherie Française",
    unit: "pièce",
  },

  // ======================
  // POISSONNERIE
  // ======================
  {
    name: "Saumon Frais Norvégien",
    description: "Filet de saumon frais de Norvège, riche en oméga-3.",
    category: "Poissonnerie",
    subcategory: "Poissons",
    price: 24.9,
    comparePrice: 27.5,
    cost: 16.0,
    sku: "SAUMON-FRAIS-NOR-001",
    barcode: "1234567891010",
    trackQuantity: true,
    quantity: 25,
    lowStock: 3,
    weight: 0.6,
    dimensions: { length: 25, width: 12, height: 4 },
    images: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Saumon Frais Norvégien - Riche en Oméga-3",
    seoDescription: "Filet de saumon frais de Norvège de qualité supérieure",
    productType: "food",
    foodCategory: "poissons",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours
    storageTips: "Conserver au réfrigérateur sur de la glace",
    nutritionalInfo: {
      calories: 208,
      proteins: 20,
      carbs: 0,
      fats: 13,
      omega3: 2.3,
      vitaminD: 14,
    },
    allergens: ["poisson"],
    isOrganic: false,
    origin: "Norvège",
    brand: "Pêcheries Norvégiennes",
    unit: "kg",
  },
  {
    name: "Crevettes Roses Crues",
    description:
      "Crevettes roses crues de Méditerranée, idéales pour les grillades.",
    category: "Poissonnerie",
    subcategory: "Crustacés",
    price: 18.5,
    comparePrice: 20.0,
    cost: 11.0,
    sku: "CREVETTES-ROSES-001",
    barcode: "1234567891011",
    trackQuantity: true,
    quantity: 40,
    lowStock: 6,
    weight: 0.4,
    dimensions: { length: 20, width: 15, height: 5 },
    images: [
      "https://images.unsplash.com/photo-1587332278432-d1c19c5de318?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Crevettes Roses Crues - Méditerranée",
    seoDescription: "Crevettes roses crues de Méditerranée pour grillades",
    productType: "food",
    foodCategory: "crustaces",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 jour
    storageTips: "Conserver au réfrigérateur et consommer le jour même",
    nutritionalInfo: {
      calories: 85,
      proteins: 18,
      carbs: 0.9,
      fats: 1.1,
      cholesterol: 160,
      sodium: 119,
    },
    allergens: ["crustaces"],
    isOrganic: false,
    origin: "Méditerranée, France",
    brand: "Pêcheries Méditerranéennes",
    unit: "kg",
  },

  // ======================
  // ÉPICERIE BIO
  // ======================
  {
    name: "Riz Basmati Bio 1kg",
    description:
      "Riz Basmati biologique de qualité supérieure, grains longs et parfumés.",
    category: "Épicerie Bio",
    subcategory: "Riz & Céréales",
    price: 4.9,
    comparePrice: 5.5,
    cost: 2.8,
    sku: "RIZ-BASMATI-BIO-1KG",
    barcode: "1234567891012",
    trackQuantity: true,
    quantity: 120,
    lowStock: 20,
    weight: 1.0,
    dimensions: { length: 20, width: 8, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Riz Basmati Bio 1kg - Qualité Supérieure",
    seoDescription: "Riz Basmati biologique aux grains longs et parfumés",
    productType: "food",
    foodCategory: "cereales",
    isPerishable: false,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    storageTips: "Conserver dans un endroit sec et à l'abri de la lumière",
    nutritionalInfo: {
      calories: 130,
      proteins: 2.7,
      carbs: 28,
      fats: 0.3,
      fiber: 0.4,
      iron: 1.2,
    },
    allergens: [],
    isOrganic: true,
    origin: "Inde",
    brand: "Terre Bio",
    unit: "kg",
  },
  {
    name: "Pâtes Fusilli Bio 500g",
    description:
      "Pâtes fusilli biologiques à base de blé dur, idéales pour les salades.",
    category: "Épicerie Bio",
    subcategory: "Pâtes",
    price: 2.8,
    comparePrice: 3.2,
    cost: 1.5,
    sku: "PATES-FUSILLI-BIO-500G",
    barcode: "1234567891013",
    trackQuantity: true,
    quantity: 200,
    lowStock: 30,
    weight: 0.5,
    dimensions: { length: 18, width: 8, height: 12 },
    images: [
      "https://images.unsplash.com/photo-1551462147-37885a3acb98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Pâtes Fusilli Bio 500g - Blé Dur Biologique",
    seoDescription: "Pâtes fusilli biologiques à base de blé dur de qualité",
    productType: "food",
    foodCategory: "pates",
    isPerishable: false,
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 ans
    storageTips: "Conserver dans un endroit sec et frais",
    nutritionalInfo: {
      calories: 158,
      proteins: 5.8,
      carbs: 31,
      fats: 0.9,
      fiber: 1.8,
      iron: 1.3,
    },
    allergens: ["gluten"],
    isOrganic: true,
    origin: "Italie",
    brand: "Bio Italia",
    unit: "kg",
  },

  // ======================
  // BOULANGERIE
  // ======================
  {
    name: "Pain Campagne Artisanal",
    description: "Pain de campagne artisanal au levain, cuit au feu de bois.",
    category: "Boulangerie",
    subcategory: "Pains",
    price: 3.2,
    comparePrice: 3.6,
    cost: 1.4,
    sku: "PAIN-CAMPAGNE-ART-001",
    barcode: "1234567891014",
    trackQuantity: true,
    quantity: 50,
    lowStock: 8,
    weight: 0.8,
    dimensions: { length: 30, width: 15, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Pain Campagne Artisanal - Au Levain",
    seoDescription: "Pain de campagne artisanal au levain cuit au feu de bois",
    productType: "food",
    foodCategory: "boulangerie",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 jour
    storageTips: "Conserver dans un torchon à température ambiante",
    nutritionalInfo: {
      calories: 265,
      proteins: 9.0,
      carbs: 53,
      fats: 1.5,
      fiber: 2.7,
      sodium: 480,
    },
    allergens: ["gluten"],
    isOrganic: false,
    origin: "Boulangerie du Village",
    brand: "Artisans Boulangers",
    unit: "pièce",
  },
  {
    name: "Croissants au Beurre",
    description: "Croissants au beurre AOP, croustillants et feuilletés.",
    category: "Boulangerie",
    subcategory: "Viennoiseries",
    price: 1.2,
    comparePrice: 1.4,
    cost: 0.6,
    sku: "CROISSANT-BEURRE-001",
    barcode: "1234567891015",
    trackQuantity: true,
    quantity: 80,
    lowStock: 15,
    weight: 0.1,
    dimensions: { length: 15, width: 8, height: 5 },
    images: [
      "https://images.unsplash.com/photo-1555507036-ab794f27d2e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Croissants au Beurre AOP - Feuilletés",
    seoDescription: "Croissants au beurre AOP croustillants et feuilletés",
    productType: "food",
    foodCategory: "viennoiseries",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 jour
    storageTips: "Conserver à température ambiante et consommer le jour même",
    nutritionalInfo: {
      calories: 406,
      proteins: 6.6,
      carbs: 45,
      fats: 21,
      fiber: 2.1,
      cholesterol: 67,
    },
    allergens: ["gluten", "lactose"],
    isOrganic: false,
    origin: "Boulangerie Parisienne",
    brand: "Maison du Croissant",
    unit: "pièce",
  },

  // ======================
  // BOISSONS
  // ======================
  {
    name: "Jus d'Orange Pressé Bio 1L",
    description:
      "Jus d'orange pressé biologique sans additifs, riche en vitamine C.",
    category: "Boissons",
    subcategory: "Jus de Fruits",
    price: 3.9,
    comparePrice: 4.4,
    cost: 2.2,
    sku: "JUS-ORANGE-PRESSE-1L",
    barcode: "1234567891016",
    trackQuantity: true,
    quantity: 75,
    lowStock: 12,
    weight: 1.0,
    dimensions: { length: 8, width: 8, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Jus d'Orange Pressé Bio 1L - Riche en Vitamine C",
    seoDescription:
      "Jus d'orange pressé biologique sans additifs ni conservateurs",
    productType: "food",
    foodCategory: "boissons",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
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
  {
    name: "Lait d'Amande Bio 1L",
    description: "Lait d'amande biologique sans lactose, riche en calcium.",
    category: "Boissons",
    subcategory: "Boissons Végétales",
    price: 2.9,
    comparePrice: 3.3,
    cost: 1.6,
    sku: "LAIT-AMANDE-BIO-1L",
    barcode: "1234567891017",
    trackQuantity: true,
    quantity: 100,
    lowStock: 15,
    weight: 1.0,
    dimensions: { length: 8, width: 8, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1626635334479-1d0b098f41b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Lait d'Amande Bio 1L - Sans Lactose",
    seoDescription: "Lait d'amande biologique sans lactose, enrichi en calcium",
    productType: "food",
    foodCategory: "boissons-vegetales",
    isPerishable: true,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    storageTips: "Conserver au réfrigérateur après ouverture",
    nutritionalInfo: {
      calories: 24,
      proteins: 0.6,
      carbs: 2.0,
      fats: 1.1,
      calcium: 120,
      vitaminE: 4.0,
    },
    allergens: ["fruits-a-coque"],
    isOrganic: true,
    origin: "France",
    brand: "Veggie Bio",
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
    .substring(0, 100); // Limiter la longueur du slug
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

    // Afficher un résumé par catégorie alimentaire
    const productsByCategory = await prisma.product.groupBy({
      by: ["category"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n📈 Résumé par catégorie alimentaire:");
    productsByCategory.forEach((cat) => {
      console.log(`   ${cat.category}: ${cat._count.id} produits`);
    });

    // Résumé par type de produit alimentaire
    const productsByFoodCategory = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
    });

    console.log("\n🥦 Résumé par type d'aliment:");
    productsByFoodCategory.forEach((foodCat) => {
      console.log(
        `   ${foodCat.foodCategory || "Non spécifié"}: ${foodCat._count.id} produits`
      );
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
