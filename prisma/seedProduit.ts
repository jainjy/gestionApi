import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Données de produits réalistes
const productsData = [
  // Équipements de chauffage
  {
    name: "Radiateur électrique à inertie",
    description: "Radiateur électrique à inertie fluide, économique et performant. Programmateur intégré.",
    category: "Équipements de chauffage",
    subcategory: "Radiateurs",
    price: 299.99,
    comparePrice: 349.99,
    cost: 180.00,
    sku: "RAD-INERT-001",
    barcode: "1234567890123",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 12.5,
    dimensions: { length: 80, width: 15, height: 60 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Radiateur électrique à inertie - Économique",
    seoDescription: "Radiateur électrique à inertie haute performance avec programmateur"
  },
  {
    name: "Pompe à chaleur air-eau",
    description: "Pompe à chaleur haute performance pour chauffage et eau chaude sanitaire.",
    category: "Équipements de chauffage",
    subcategory: "Pompes à chaleur",
    price: 4500.00,
    comparePrice: 5200.00,
    cost: 3200.00,
    sku: "PAC-AE-2024",
    barcode: "1234567890124",
    trackQuantity: true,
    quantity: 8,
    lowStock: 2,
    weight: 85.0,
    dimensions: { length: 120, width: 45, height: 90 },
    images: [
      "https://images.unsplash.com/photo-1611348586801-0c0ec7eb5e96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Pompe à chaleur air-eau haute performance",
    seoDescription: "PAC air-eau pour chauffage économique et écologique"
  },

  // Électroménager
  {
    name: "Lave-linge séchant 8kg",
    description: "Lave-linge séchant avec technologie vapeur et connexion Wi-Fi.",
    category: "Électroménager",
    subcategory: "Lave-linge",
    price: 699.00,
    comparePrice: 799.00,
    cost: 450.00,
    sku: "LL-SEC-8KG",
    barcode: "1234567890125",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 72.0,
    dimensions: { length: 60, width: 60, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Lave-linge séchant 8kg connecté",
    seoDescription: "Lave-linge séchant intelligent avec fonction vapeur"
  },
  {
    name: "Réfrigérateur américain",
    description: "Réfrigérateur américain avec distributeur de glaçons et écran tactile.",
    category: "Électroménager",
    subcategory: "Réfrigérateurs",
    price: 1299.00,
    comparePrice: 1499.00,
    cost: 850.00,
    sku: "FRIGO-USA-650L",
    barcode: "1234567890126",
    trackQuantity: true,
    quantity: 6,
    lowStock: 1,
    weight: 125.0,
    dimensions: { length: 95, width: 75, height: 180 },
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Réfrigérateur américain avec distributeur",
    seoDescription: "Grand réfrigérateur américain équipé d'un distributeur de glaçons"
  },

  // Meubles
  {
    name: "Canapé 3 places en tissu",
    description: "Canapé design 3 places en tissu résistant, assises confortables.",
    category: "Meubles",
    subcategory: "Canapés",
    price: 899.00,
    comparePrice: 1099.00,
    cost: 550.00,
    sku: "CANAP-3P-GRIS",
    barcode: "1234567890127",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 45.0,
    dimensions: { length: 220, width: 95, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Canapé 3 places design en tissu",
    seoDescription: "Canapé contemporain 3 places ultra confortable"
  },
  {
    name: "Table à manger extensible",
    description: "Table à manger en chêne massif, extensible jusqu'à 8 personnes.",
    category: "Meubles",
    subcategory: "Tables",
    price: 650.00,
    comparePrice: 750.00,
    cost: 380.00,
    sku: "TABLE-CHENE-EXT",
    barcode: "1234567890128",
    trackQuantity: true,
    quantity: 8,
    lowStock: 1,
    weight: 35.0,
    dimensions: { length: 160, width: 90, height: 75 },
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Table à manger extensible en chêne",
    seoDescription: "Table en chêne massif extensible pour 8 personnes"
  },

  // Décoration
  {
    name: "Set de 3 tableaux abstraits",
    description: "Collection de 3 tableaux abstraits modernes, cadres en bois.",
    category: "Décoration",
    subcategory: "Tableaux",
    price: 129.00,
    comparePrice: 159.00,
    cost: 65.00,
    sku: "TAB-ABSTRAIT-3P",
    barcode: "1234567890129",
    trackQuantity: true,
    quantity: 30,
    lowStock: 5,
    weight: 4.5,
    dimensions: { length: 120, width: 5, height: 80 },
    images: [
      "https://images.unsplash.com/photo-1578321272177-56b7ce3a14e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Set de 3 tableaux abstraits modernes",
    seoDescription: "Collection de tableaux abstraits pour décoration murale"
  },

  // Jardinage
  {
    name: "Tondeuse à gazon robot",
    description: "Tondeuse robot intelligente avec programmation et détection d'obstacles.",
    category: "Jardinage",
    subcategory: "Tondeuses",
    price: 899.00,
    comparePrice: 1099.00,
    cost: 600.00,
    sku: "TONDO-ROBOT-PRO",
    barcode: "1234567890130",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 12.0,
    dimensions: { length: 70, width: 55, height: 30 },
    images: [
      "https://images.unsplash.com/photo-1596638787647-904b822dcee8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Tondeuse robot intelligente pour jardin",
    seoDescription: "Tondeuse robot autonome avec programmation avancée"
  },

  // Matériaux de construction
  {
    name: "Carrelage imitation parquet",
    description: "Carrelage céramique imitation bois, antidérapant, pour intérieur/extérieur.",
    category: "Matériaux de construction",
    subcategory: "Carrelage",
    price: 45.00,
    comparePrice: 55.00,
    cost: 28.00,
    sku: "CARREL-BOIS-30x60",
    barcode: "1234567890131",
    trackQuantity: true,
    quantity: 500,
    lowStock: 50,
    weight: 25.0,
    dimensions: { length: 60, width: 30, height: 1 },
    images: [
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Carrelage imitation parquet antidérapant",
    seoDescription: "Carrelage céramique aspect bois pour sols intérieurs et extérieurs"
  },

  // Outillage
  {
    name: "Perceuse-visseuse sans fil",
    description: "Perceuse-visseuse 18V avec 2 batteries, couple réglable, LED.",
    category: "Outillage",
    subcategory: "Perceuses",
    price: 149.00,
    comparePrice: 179.00,
    cost: 85.00,
    sku: "PERC-VISS-18V",
    barcode: "1234567890132",
    trackQuantity: true,
    quantity: 40,
    lowStock: 5,
    weight: 2.1,
    dimensions: { length: 25, width: 8, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1572981779307-38f8b0456222?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Perceuse-visseuse sans fil 18V professionnelle",
    seoDescription: "Perceuse-visseuse puissante avec batteries et accessoires"
  },

  // Luminaires
  {
    name: "Suspension design industriel",
    description: "Suspension métal noir avec ampoule Edison, style industriel.",
    category: "Luminaires",
    subcategory: "Suspensions",
    price: 89.00,
    comparePrice: 109.00,
    cost: 45.00,
    sku: "SUSP-INDUST-NOIR",
    barcode: "1234567890133",
    trackQuantity: true,
    quantity: 25,
    lowStock: 3,
    weight: 3.2,
    dimensions: { length: 40, width: 40, height: 150 },
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Suspension industrielle design avec ampoule Edison",
    seoDescription: "Suspension style industriel pour décoration intérieure"
  }
]

// Fonction pour générer un slug à partir du nom
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 100) // Limiter la longueur du slug
}

async function main() {
  console.log('🌱 Début du seeding des produits...')

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

    // Vérifier s'il y a déjà des produits
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0) {
      console.log(`⚠️  ${existingProducts} produits existants détectés`)
      console.log('🗑️  Suppression des anciens produits...')
      await prisma.product.deleteMany({})
      console.log('✅ Anciens produits supprimés')
    }

    // Créer les produits
    console.log(`🛍️  Création de ${productsData.length} produits...`)

    for (const productData of productsData) {
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

      console.log(`✅ Produit créé: ${productData.name}`)
    }

    console.log('🎉 Seeding des produits terminé avec succès!')
    console.log(`📊 ${productsData.length} produits créés`)

    // Afficher un résumé par catégorie
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })

    console.log('\n📈 Résumé par catégorie:')
    productsByCategory.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.id} produits`)
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