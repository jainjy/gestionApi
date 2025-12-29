// seeders/foodProductsLaReunion.js
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
  return '2' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
}

// Données de produits alimentaires spécifiques à La Réunion
const foodProductsData = [
  // ======================
  // RESTAURANTS & SNACKS
  // ======================
  {
    name: "Cari Poulet Traditionnel",
    description: "Cari poulet créole avec riz, grains et rougail. Plat emblématique de La Réunion.",
    category: "Restaurants Traditionnels",
    subcategory: "Plats Créoles",
    price: 14.9,
    comparePrice: 16.5,
    cost: 8.5,
    sku: "CARIPOU-TRAD-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 50,
    lowStock: 10,
    weight: 0.8,
    dimensions: { length: 20, width: 15, height: 8 },
    images: ["https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Cari Poulet Traditionnel Réunionnais",
    seoDescription: "Cari poulet créole authentique de La Réunion avec riz et rougail",
    productType: "food",
    foodCategory: "restaurants-traditionnels",
    isPerishable: true,
    expiryDate: getExpiryDate(2),
    storageTips: "Conserver au réfrigérateur et consommer sous 48h",
    nutritionalInfo: { calories: 450, proteins: 32, carbs: 55, fats: 12, fiber: 6, sodium: 850 },
    allergens: [],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Snack Créole",
    unit: "portion",
    isVegan: false,
    isVegetarian: false,
    healthScore: 6,
  },
  {
    name: "Samoussas Boeuf",
    description: "Samoussas traditionnels au boeuf épicé, croustillants et parfumés.",
    category: "Snacks Rapides",
    subcategory: "Beignets",
    price: 2.5,
    comparePrice: 3.0,
    cost: 1.2,
    sku: "SAMOU-BOEUF-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 120,
    lowStock: 25,
    weight: 0.08,
    dimensions: { length: 12, width: 6, height: 3 },
    images: ["https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Samoussas Boeuf Réunionnais",
    seoDescription: "Samoussas traditionnels au boeuf épicé, snack typique de l'île",
    productType: "food",
    foodCategory: "snacks-rapides",
    isPerishable: true,
    expiryDate: getExpiryDate(1),
    storageTips: "Déguster chaud ou réchauffer au four",
    nutritionalInfo: { calories: 180, proteins: 8, carbs: 18, fats: 9, fiber: 2, sodium: 420 },
    allergens: ["gluten"],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Snack du Coin",
    unit: "pièce",
    isVegan: false,
    isVegetarian: false,
    healthScore: 4,
  },
  {
    name: "Rougail Saucisse Food Truck",
    description: "Rougail saucisse frais préparé, spécialité des food trucks réunionnais.",
    category: "Food Trucks",
    subcategory: "Plats à emporter",
    price: 9.9,
    comparePrice: 11.5,
    cost: 5.8,
    sku: "ROUGAI-SAUC-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 0.6,
    dimensions: { length: 18, width: 12, height: 6 },
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Rougail Saucisse Food Truck",
    seoDescription: "Rougail saucisse frais préparé, spécialité street food réunionnaise",
    productType: "food",
    foodCategory: "food-trucks",
    isPerishable: true,
    expiryDate: getExpiryDate(2),
    storageTips: "Réchauffer avant dégustation",
    nutritionalInfo: { calories: 380, proteins: 22, carbs: 42, fats: 14, fiber: 5, sodium: 920 },
    allergens: [],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Food Truck Créole",
    unit: "portion",
    isVegan: false,
    isVegetarian: false,
    healthScore: 5,
  },
  {
    name: "Café Bourbon Pointu",
    description: "Café bourbon pointu de La Réunion, arabica rare et aromatique.",
    category: "Brasseries & Cafés",
    subcategory: "Cafés",
    price: 5.5,
    comparePrice: 6.5,
    cost: 3.2,
    sku: "CAFE-BOURBON-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 80,
    lowStock: 15,
    weight: 0.15,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Café Bourbon Pointu Réunion",
    seoDescription: "Café bourbon pointu arabica rare et aromatique de La Réunion",
    productType: "food",
    foodCategory: "brasseries-cafes",
    isPerishable: false,
    expiryDate: getExpiryDate(180),
    storageTips: "Conserver à l'abri de l'humidité et de la lumière",
    nutritionalInfo: { calories: 2, caffeine: 85 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Plantations Réunionnaises",
    unit: "tasse",
    isVegan: true,
    isVegetarian: true,
    healthScore: 5,
  },

  // ======================
  // PRODUITS LOCAUX
  // ======================
  {
    name: "Letchis de La Réunion",
    description: "Letchis frais de La Réunion, pulpe juteuse et parfumée. Récolte de saison.",
    category: "Fruits Tropicaux",
    subcategory: "Fruits Frais",
    price: 8.9,
    comparePrice: 10.5,
    cost: 5.2,
    sku: "LETCHIS-FRAIS-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 200,
    lowStock: 40,
    weight: 1.0,
    dimensions: { length: 25, width: 20, height: 15 },
    images: ["https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Letchis Frais de La Réunion",
    seoDescription: "Letchis frais de La Réunion, fruit tropical emblématique de l'île",
    productType: "food",
    foodCategory: "fruits-tropicaux",
    isPerishable: true,
    expiryDate: getExpiryDate(5),
    storageTips: "Conserver au frais et consommer rapidement",
    nutritionalInfo: { calories: 66, proteins: 0.8, carbs: 17, fats: 0.4, fiber: 1.3, vitaminC: 72 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Vergers Réunionnais",
    unit: "kg",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    name: "Vanille Bourbon de La Réunion",
    description: "Gousses de vanille bourbon de qualité supérieure, aromatiques et huileuses.",
    category: "Épices & Saveurs",
    subcategory: "Vanille",
    price: 22.5,
    comparePrice: 26.0,
    cost: 14.8,
    sku: "VANILLE-BOURB-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 60,
    lowStock: 12,
    weight: 0.05,
    dimensions: { length: 15, width: 3, height: 3 },
    images: ["https://images.unsplash.com/photo-1596040033221-a1f4f8a7c526?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Vanille Bourbon de La Réunion",
    seoDescription: "Gousses de vanille bourbon de qualité supérieure, produit d'exception réunionnais",
    productType: "food",
    foodCategory: "epices-saveurs",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver dans un bocal hermétique à l'abri de la lumière",
    nutritionalInfo: { calories: 288, proteins: 0.1, carbs: 13, fats: 0.1, fiber: 0 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Plantations de Vanille",
    unit: "gousse",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    name: "Miel de Baies Roses",
    description: "Miel crémeux de baies roses, saveur douce et florale. Récolte artisanale.",
    category: "Miels & Confitures",
    subcategory: "Miels",
    price: 12.9,
    comparePrice: 14.8,
    cost: 7.5,
    sku: "MIEL-BAIES-ROSES",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 75,
    lowStock: 15,
    weight: 0.5,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Miel de Baies Roses Réunion",
    seoDescription: "Miel crémeux de baies roses, récolte artisanale de La Réunion",
    productType: "food",
    foodCategory: "miels-confitures",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver à température ambiante",
    nutritionalInfo: { calories: 304, proteins: 0.3, carbs: 82, fats: 0, fiber: 0.2 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Ruchers de l'Île",
    unit: "pot",
    isVegan: false,
    isVegetarian: true,
    healthScore: 7,
  },
  {
    name: "Rhum Arrangé Vanille-Combava",
    description: "Rhum arrangé traditionnel aux saveurs vanille et combava. Préparation artisanale.",
    category: "Rhum Arrangé",
    subcategory: "Spiritueux",
    price: 28.9,
    comparePrice: 32.5,
    cost: 18.5,
    sku: "RHUM-VAN-COMBAVA",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 45,
    lowStock: 9,
    weight: 1.0,
    dimensions: { length: 8, width: 8, height: 25 },
    images: ["https://images.unsplash.com/photo-1516456712011-4b6b2c6c40d6?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Rhum Arrangé Vanille-Combava Réunion",
    seoDescription: "Rhum arrangé traditionnel aux saveurs vanille et combava de La Réunion",
    productType: "food",
    foodCategory: "rhum-arrange",
    isPerishable: false,
    expiryDate: getExpiryDate(1825),
    storageTips: "Conserver à l'abri de la lumière",
    nutritionalInfo: { calories: 245, alcohol: 40 },
    allergens: [],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Distillerie Réunionnaise",
    unit: "bouteille",
    isVegan: true,
    isVegetarian: true,
    healthScore: 3,
  },

  // ======================
  // MARCHÉS & ARTISANS
  // ======================
  {
    name: "Boudin Créole Artisanal",
    description: "Boudin créole frais, préparation traditionnelle au porc et aux épices.",
    category: "Artisans Alimentaires",
    subcategory: "Charcuterie",
    price: 16.5,
    comparePrice: 18.9,
    cost: 10.2,
    sku: "BOUDIN-CREOLE-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 35,
    lowStock: 7,
    weight: 0.4,
    dimensions: { length: 25, width: 8, height: 8 },
    images: ["https://images.unsplash.com/photo-1606811841685-b30c263852bb?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Boudin Créole Artisanal Réunion",
    seoDescription: "Boudin créole frais, préparation traditionnelle artisanale de La Réunion",
    productType: "food",
    foodCategory: "artisans-alimentaires",
    isPerishable: true,
    expiryDate: getExpiryDate(3),
    storageTips: "Conserver au réfrigérateur et cuire avant consommation",
    nutritionalInfo: { calories: 310, proteins: 18, carbs: 5, fats: 24, fiber: 1, sodium: 680 },
    allergens: [],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Charcuterie Créole",
    unit: "pièce",
    isVegan: false,
    isVegetarian: false,
    healthScore: 4,
  },
  {
    name: "Bonbons Piments Maison",
    description: "Bonbons piments frais, beignets de lentilles épicés. Préparation du jour.",
    category: "Boutiques de Producteurs",
    subcategory: "Produits Frais",
    price: 6.9,
    comparePrice: 7.9,
    cost: 3.8,
    sku: "BONBONS-PIMENTS",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 90,
    lowStock: 18,
    weight: 0.3,
    dimensions: { length: 15, width: 12, height: 5 },
    images: ["https://images.unsplash.com/photo-1558310442-0d8f9f36c539?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Bonbons Piments Maison Réunion",
    seoDescription: "Bonbons piments frais, beignets de lentilles épicés préparés maison",
    productType: "food",
    foodCategory: "boutiques-producteurs",
    isPerishable: true,
    expiryDate: getExpiryDate(1),
    storageTips: "Consommer le jour même ou réchauffer légèrement",
    nutritionalInfo: { calories: 210, proteins: 9, carbs: 28, fats: 7, fiber: 4, sodium: 450 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Producteur Local",
    unit: "portion",
    isVegan: true,
    isVegetarian: true,
    healthScore: 6,
  },
  {
    name: "Pâté Créole au Poulet",
    description: "Pâté créole farci au poulet et aux épices. Spécialité boulangère.",
    category: "Épiceries Créoles",
    subcategory: "Pâtisseries Salées",
    price: 4.2,
    comparePrice: 4.8,
    cost: 2.3,
    sku: "PATE-CREOLE-POUL",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 65,
    lowStock: 13,
    weight: 0.2,
    dimensions: { length: 15, width: 10, height: 5 },
    images: ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Pâté Créole au Poulet Réunion",
    seoDescription: "Pâté créole farci au poulet et aux épices, spécialité boulangère réunionnaise",
    productType: "food",
    foodCategory: "epiceries-creoles",
    isPerishable: true,
    expiryDate: getExpiryDate(2),
    storageTips: "Déguster chaud ou réchauffer au four",
    nutritionalInfo: { calories: 280, proteins: 14, carbs: 32, fats: 11, fiber: 2, sodium: 520 },
    allergens: ["gluten"],
    isOrganic: false,
    origin: "La Réunion",
    brand: "Boulangerie Créole",
    unit: "pièce",
    isVegan: false,
    isVegetarian: false,
    healthScore: 5,
  },
  {
    name: "Sauce Rougail Tomates",
    description: "Sauce rougail aux tomates fraîches, base de la cuisine créole.",
    category: "Marchés Forains",
    subcategory: "Condiments",
    price: 5.9,
    comparePrice: 6.5,
    cost: 3.2,
    sku: "ROUGAIL-TOMATE-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 55,
    lowStock: 11,
    weight: 0.3,
    dimensions: { length: 10, width: 10, height: 10 },
    images: ["https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Sauce Rougail Tomates Réunion",
    seoDescription: "Sauce rougail aux tomates fraîches, condiment essentiel de la cuisine créole",
    productType: "food",
    foodCategory: "marches-forains",
    isPerishable: true,
    expiryDate: getExpiryDate(7),
    storageTips: "Conserver au réfrigérateur après ouverture",
    nutritionalInfo: { calories: 45, proteins: 1, carbs: 8, fats: 1, fiber: 2, sodium: 320 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Producteur Marché",
    unit: "pot",
    isVegan: true,
    isVegetarian: true,
    healthScore: 7,
  },

  // ======================
  // BIEN-ÊTRE & ALIMENTATION
  // ======================
  {
    name: "Curcuma Bio de La Réunion",
    description: "Curcuma racine biologique frais, puissant anti-inflammatoire naturel.",
    category: "Produits Bio & Naturels",
    subcategory: "Épices Santé",
    price: 9.9,
    comparePrice: 11.5,
    cost: 6.2,
    sku: "CURCUMA-BIO-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 85,
    lowStock: 17,
    weight: 0.2,
    dimensions: { length: 12, width: 8, height: 8 },
    images: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Curcuma Bio Frais de La Réunion",
    seoDescription: "Curcuma racine biologique frais, anti-inflammatoire naturel de qualité",
    productType: "food",
    foodCategory: "produits-bio",
    isPerishable: true,
    expiryDate: getExpiryDate(14),
    storageTips: "Conserver au frais et à l'abri de la lumière",
    nutritionalInfo: { calories: 354, proteins: 8, carbs: 65, fats: 10, fiber: 21, curcumine: 3.1 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Jardin Bio Tropical",
    unit: "kg",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    name: "Baies de Goji Réunionnaises",
    description: "Baies de goji séchées cultivées localement, riches en antioxydants.",
    category: "Super-aliments Tropicaux",
    subcategory: "Fruits Secs",
    price: 18.5,
    comparePrice: 21.0,
    cost: 11.8,
    sku: "BAIES-GOJI-REUN",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 60,
    lowStock: 12,
    weight: 0.25,
    dimensions: { length: 15, width: 10, height: 8 },
    images: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Baies de Goji Réunionnaises Bio",
    seoDescription: "Baies de goji séchées cultivées localement, super-aliment riche en antioxydants",
    productType: "food",
    foodCategory: "super-aliments",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver dans un endroit sec et à l'abri de la lumière",
    nutritionalInfo: { calories: 349, proteins: 14, carbs: 77, fats: 0.4, fiber: 13, antioxidants: 3290 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Super-aliments Tropicaux",
    unit: "paquet",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    name: "Tisane Vétiver Relaxante",
    description: "Tisane aux racines de vétiver, apaisante et relaxante. Produit local.",
    category: "Infusions & Tisanes",
    subcategory: "Tisanes",
    price: 12.5,
    comparePrice: 14.2,
    cost: 7.8,
    sku: "TISANE-VETIVER-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 70,
    lowStock: 14,
    weight: 0.1,
    dimensions: { length: 12, width: 8, height: 5 },
    images: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Tisane Vétiver Relaxante Réunion",
    seoDescription: "Tisane aux racines de vétiver, infusion apaisante et relaxante de La Réunion",
    productType: "food",
    foodCategory: "infusions-tisanes",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver dans un endroit sec",
    nutritionalInfo: { calories: 2 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Herboristerie Tropicale",
    unit: "sachet",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    name: "Gelée Royale Bio Réunionnaise",
    description: "Gelée royale fraîche biologique, tonique naturel et riche en nutriments.",
    category: "Compléments Alimentaires",
    subcategory: "Produits de la Ruche",
    price: 42.9,
    comparePrice: 49.9,
    cost: 28.0,
    sku: "GELEE-ROYALE-BIO",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 0.03,
    dimensions: { length: 5, width: 5, height: 5 },
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Gelée Royale Bio de La Réunion",
    seoDescription: "Gelée royale fraîche biologique, complément alimentaire naturel et tonifiant",
    productType: "food",
    foodCategory: "complements-alimentaires",
    isPerishable: true,
    expiryDate: getExpiryDate(30),
    storageTips: "Conserver au réfrigérateur",
    nutritionalInfo: { calories: 139, proteins: 11, carbs: 14, fats: 5, vitamins: "B complex" },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Apiculteurs Réunionnais",
    unit: "flacon",
    isVegan: false,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    name: "Huile Essentielle de Niaouli",
    description: "Huile essentielle de niaouli bio, antiseptique et immunostimulante.",
    category: "Compléments Alimentaires",
    subcategory: "Huiles Essentielles",
    price: 24.9,
    comparePrice: 28.5,
    cost: 16.0,
    sku: "HE-NIAOULI-BIO",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 0.01,
    dimensions: { length: 4, width: 4, height: 8 },
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Huile Essentielle Niaouli Bio Réunion",
    seoDescription: "Huile essentielle de niaouli biologique, antiseptique et immunostimulante",
    productType: "food",
    foodCategory: "complements-alimentaires",
    isPerishable: false,
    expiryDate: getExpiryDate(730),
    storageTips: "Conserver à l'abri de la lumière et de la chaleur",
    nutritionalInfo: {},
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Distillerie Bio",
    unit: "flacon",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    name: "Ananas Victoria Bio",
    description: "Ananas victoria bio, variété sucrée et parfumée de La Réunion.",
    category: "Fruits Tropicaux",
    subcategory: "Ananas",
    price: 6.5,
    comparePrice: 7.5,
    cost: 4.2,
    sku: "ANANAS-VICTORIA-BIO",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 95,
    lowStock: 19,
    weight: 1.2,
    dimensions: { length: 20, width: 15, height: 15 },
    images: ["https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Ananas Victoria Bio Réunion",
    seoDescription: "Ananas victoria biologique, variété sucrée et parfumée de La Réunion",
    productType: "food",
    foodCategory: "fruits-tropicaux",
    isPerishable: true,
    expiryDate: getExpiryDate(7),
    storageTips: "Conserver à température ambiante jusqu'à maturité",
    nutritionalInfo: { calories: 50, proteins: 0.5, carbs: 13, fats: 0.1, fiber: 1.4, vitaminC: 48 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Plantations Bio",
    unit: "pièce",
    isVegan: true,
    isVegetarian: true,
    healthScore: 9,
  },
  {
    name: "Poivre de La Réunion",
    description: "Poivre noir de qualité, récolté et séché artisanalement sur l'île.",
    category: "Épices & Saveurs",
    subcategory: "Poivres",
    price: 14.9,
    comparePrice: 17.0,
    cost: 9.5,
    sku: "POIVRE-REUNION-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 50,
    lowStock: 10,
    weight: 0.1,
    dimensions: { length: 8, width: 8, height: 12 },
    images: ["https://images.unsplash.com/photo-1596040033221-a1f4f8a7c526?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Poivre de La Réunion Artisanal",
    seoDescription: "Poivre noir de qualité, récolté et séché artisanalement à La Réunion",
    productType: "food",
    foodCategory: "epices-saveurs",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver dans un moulin ou un bocal hermétique",
    nutritionalInfo: { calories: 251, proteins: 10, carbs: 64, fats: 3.3, fiber: 25, piperine: 5 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Épicerie Créole",
    unit: "moulin",
    isVegan: true,
    isVegetarian: true,
    healthScore: 8,
  },
  {
    name: "Confiture de Goyavier",
    description: "Confiture artisanale de goyavier, fruit sauvage de l'île au goût unique.",
    category: "Miels & Confitures",
    subcategory: "Confitures",
    price: 8.9,
    comparePrice: 10.2,
    cost: 5.5,
    sku: "CONFIT-GOYAVIER-001",
    barcode: generateBarcode(),
    trackQuantity: true,
    quantity: 65,
    lowStock: 13,
    weight: 0.37,
    dimensions: { length: 8, width: 8, height: 10 },
    images: ["https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=500&auto=format&fit=crop&q=60"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Confiture de Goyavier Artisanale Réunion",
    seoDescription: "Confiture artisanale de goyavier, fruit sauvage de La Réunion au goût unique",
    productType: "food",
    foodCategory: "miels-confitures",
    isPerishable: false,
    expiryDate: getExpiryDate(365),
    storageTips: "Conserver à température ambiante après ouverture",
    nutritionalInfo: { calories: 260, proteins: 0.4, carbs: 65, fats: 0.1, fiber: 1.2, sugar: 60 },
    allergens: [],
    isOrganic: true,
    origin: "La Réunion",
    brand: "Confiturerie Artisanale",
    unit: "pot",
    isVegan: true,
    isVegetarian: true,
    healthScore: 6,
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
  console.log("🌱 Début du seeding des produits alimentaires Réunionnais...");

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

    // Vérifier s'il y a déjà des produits alimentaires
    const existingFoodProducts = await prisma.product.count({
      where: {
        productType: "food",
      },
    });

    if (existingFoodProducts > 0) {
      console.log(`⚠️  ${existingFoodProducts} produits alimentaires existants détectés`);
      console.log("🗑️  Suppression des anciens produits alimentaires...");
      await prisma.product.deleteMany({
        where: {
          productType: "food",
        },
      });
      console.log("✅ Anciens produits alimentaires supprimés");
    }

    // Créer les produits alimentaires
    console.log(`🛍️  Création de ${foodProductsData.length} produits alimentaires réunionnais...`);

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

      console.log(`✅ Produit créé: ${productData.name}`);
    }

    console.log("🎉 Seeding des produits alimentaires réunionnais terminé avec succès!");
    console.log(`📊 ${foodProductsData.length} produits créés`);

    // Afficher un résumé par foodCategory
    const productsByFoodCategory = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    console.log("\n📈 Résumé par catégorie (foodCategory):");
    productsByFoodCategory.forEach((cat) => {
      console.log(`   ${cat.foodCategory}: ${cat._count.id} produits`);
    });

    // Résumé par section
    const sections = {
      "restaurants-traditionnels": "Restaurants & Snacks",
      "snacks-rapides": "Restaurants & Snacks",
      "food-trucks": "Restaurants & Snacks",
      "brasseries-cafes": "Restaurants & Snacks",
      "fruits-tropicaux": "Produits Locaux",
      "epices-saveurs": "Produits Locaux",
      "miels-confitures": "Produits Locaux",
      "rhum-arrange": "Produits Locaux",
      "marches-forains": "Marchés & Artisans",
      "artisans-alimentaires": "Marchés & Artisans",
      "boutiques-producteurs": "Marchés & Artisans",
      "epiceries-creoles": "Marchés & Artisans",
      "produits-bio": "Bien-être & Alimentation",
      "super-aliments": "Bien-être & Alimentation",
      "infusions-tisanes": "Bien-être & Alimentation",
      "complements-alimentaires": "Bien-être & Alimentation",
    };

    const sectionSummary = {};
    productsByFoodCategory.forEach((cat) => {
      const section = sections[cat.foodCategory] || "Autres";
      sectionSummary[section] = (sectionSummary[section] || 0) + cat._count.id;
    });

    console.log("\n🏝️  Résumé par section:");
    Object.entries(sectionSummary).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} produits`);
    });

    // Résumé par type de régime
    const veganCount = await prisma.product.count({
      where: {
        productType: "food",
        isVegan: true,
      },
    });

    const vegetarianCount = await prisma.product.count({
      where: {
        productType: "food",
        isVegetarian: true,
      },
    });

    console.log("\n🌱 Résumé par type de régime:");
    console.log(`   Produits Vegan: ${veganCount}`);
    console.log(`   Produits Végétariens: ${vegetarianCount}`);
    console.log(`   Produits Non-végétariens: ${foodProductsData.length - vegetarianCount}`);

    // Résumé par score santé
    console.log("\n💚 Répartition des scores santé:");
    for (let score = 10; score >= 1; score--) {
      const count = await prisma.product.count({
        where: {
          productType: "food",
          healthScore: score,
        },
      });
      if (count > 0) {
        console.log(`   Score ${score}: ${count} produits`);
      }
    }

    // Résumé par origine
    console.log("\n📍 Origine des produits:");
    const origins = await prisma.product.groupBy({
      by: ["origin"],
      where: {
        productType: "food",
      },
      _count: {
        id: true,
      },
    });
    origins.forEach((origin) => {
      console.log(`   ${origin.origin}: ${origin._count.id} produits`);
    });

  } catch (error) {
    console.error("❌ Erreur lors du seeding des produits alimentaires:", error);
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