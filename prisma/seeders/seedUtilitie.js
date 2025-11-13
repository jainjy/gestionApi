const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Données de produits pour Utilities
const utilitiesProducts = [
  // Électricité
  {
    name: "Compteur électrique intelligent",
    description: "Compteur électrique connecté pour suivre votre consommation en temps réel et optimiser vos dépenses énergétiques.",
    category: "Utilities",
    subcategory: "Électricité",
    price: 299.00,
    comparePrice: 349.00,
    cost: 180.00,
    sku: "COMPTEUR-ELECT-SMART",
    barcode: "1234567890301",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 3.5,
    dimensions: { length: 20, width: 15, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1563297007-0686b7003af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Compteur électrique intelligent connecté",
    seoDescription: "Compteur électrique moderne pour monitoring de consommation énergétique"
  },

  // Eau
  {
    name: "Compteur d'eau numérique",
    description: "Compteur d'eau digital avec lecture facile et transmission des données pour suivi de consommation.",
    category: "Utilities",
    subcategory: "Eau",
    price: 89.99,
    comparePrice: 119.99,
    cost: 50.00,
    sku: "COMPTEUR-EAU-DIGITAL",
    barcode: "1234567890303",
    trackQuantity: true,
    quantity: 30,
    lowStock: 6,
    weight: 2.2,
    dimensions: { length: 15, width: 12, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Compteur d'eau numérique haute précision",
    seoDescription: "Compteur d'eau digital pour monitoring de consommation hydrique"
  },
  {
    name: "Réducteur de pression d'eau",
    description: "Réducteur de pression pour protéger vos installations sanitaires et économiser l'eau.",
    category: "Utilities",
    subcategory: "Eau",
    price: 34.99,
    comparePrice: 44.99,
    cost: 18.00,
    sku: "REDUCT-PRESSION-EAU",
    barcode: "1234567890304",
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 1.5,
    dimensions: { length: 10, width: 8, height: 6 },
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Réducteur de pression d'eau économique",
    seoDescription: "Réducteur de pression pour protection installations et économies d'eau"
  },

  // Internet
  {
    name: "Routeur Wi-Fi 6 haute performance",
    description: "Routeur Wi-Fi 6 avec couverture étendue, idéal pour maison connectée et télétravail.",
    category: "Utilities",
    subcategory: "Internet",
    price: 199.00,
    comparePrice: 249.00,
    cost: 120.00,
    sku: "ROUTEUR-WIFI6-PRO",
    barcode: "1234567890305",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 1.8,
    dimensions: { length: 25, width: 20, height: 5 },
    images: [
      "https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Routeur Wi-Fi 6 performance ultime",
    seoDescription: "Routeur Wi-Fi dernière génération pour connexion internet optimale"
  },
  {
    name: "Boîtier fibre optique",
    description: "Boîtier de terminaison optique pour installation fibre avec connecteurs SC/APC.",
    category: "Utilities",
    subcategory: "Internet",
    price: 59.99,
    comparePrice: 79.99,
    cost: 32.00,
    sku: "BOITIER-FIBRE-TERM",
    barcode: "1234567890306",
    trackQuantity: true,
    quantity: 35,
    lowStock: 7,
    weight: 0.9,
    dimensions: { length: 18, width: 12, height: 4 },
    images: [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Boîtier fibre optique installation professionnelle",
    seoDescription: "Boîtier de terminaison pour connexion fibre optique haut débit"
  },
  {
    name: "Compteur gaz intelligent",
    description: "Compteur gaz connecté communicant pour relevé automatique et suivi consommation.",
    category: "Utilities",
    subcategory: "Gaz",
    price: 189.00,
    comparePrice: 229.00,
    cost: 110.00,
    sku: "COMPTEUR-GAZ-SMART",
    barcode: "1234567890308",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 2.8,
    dimensions: { length: 18, width: 14, height: 10 },
    images: [
      "https://images.unsplash.com/photo-1563297007-0686b7003af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Compteur gaz intelligent connecté",
    seoDescription: "Compteur gaz communicant pour monitoring consommation gaz naturel"
  },

  // Smart Meter
  {
    name: "Station météo connectée",
    description: "Station météo intelligente avec capteurs température, humidité, pression et connexion Wi-Fi.",
    category: "Utilities",
    subcategory: "Smart Meter",
    price: 129.00,
    comparePrice: 159.00,
    cost: 75.00,
    sku: "STATION-METEO-SMART",
    barcode: "1234567890309",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 1.2,
    dimensions: { length: 15, width: 12, height: 8 },
    images: [
      "https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Station météo connectée intelligente",
    seoDescription: "Station météo smart avec monitoring environnemental en temps réel"
  },
  {
    name: "Capteur qualité air intérieur",
    description: "Capteur connecté mesurant CO2, particules fines, humidité et température ambiante.",
    category: "Utilities",
    subcategory: "Smart Meter",
    price: 89.99,
    comparePrice: 119.99,
    cost: 50.00,
    sku: "CAPTEUR-AIR-INTERIEUR",
    barcode: "1234567890310",
    trackQuantity: true,
    quantity: 30,
    lowStock: 6,
    weight: 0.4,
    dimensions: { length: 10, width: 8, height: 3 },
    images: [
      "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Capteur qualité air intérieur connecté",
    seoDescription: "Capteur monitoring CO2 et qualité air pour environnement sain"
  },

  // Solar Energy
  {
    name: "Kit solaire autonome 300W",
    description: "Kit solaire complet avec panneau 300W, régulateur et batterie pour alimentation autonome.",
    category: "Utilities",
    subcategory: "Solar Energy",
    price: 499.00,
    comparePrice: 599.00,
    cost: 280.00,
    sku: "KIT-SOLAIRE-300W",
    barcode: "1234567890311",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 15.5,
    dimensions: { length: 80, width: 60, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Kit solaire autonome 300W énergie renouvelable",
    seoDescription: "Kit solaire complet pour production électricité autonome écologique"
  },
  {
    name: "Onduleur solaire hybride 2000W",
    description: "Onduleur hybride pour installation photovoltaïque, conversion DC/AC haute efficacité.",
    category: "Utilities",
    subcategory: "Solar Energy",
    price: 349.00,
    comparePrice: 429.00,
    cost: 200.00,
    sku: "ONDULEUR-SOLAIRE-2KW",
    barcode: "1234567890312",
    trackQuantity: true,
    quantity: 8,
    lowStock: 1,
    weight: 8.2,
    dimensions: { length: 40, width: 30, height: 15 },
    images: [
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Onduleur solaire hybride 2000W performance",
    seoDescription: "Onduleur pour installation photovoltaïque conversion énergie solaire"
  },

  // Waste Management
  {
    name: "Bac composteur jardin 400L",
    description: "Bac composteur robuste 400L pour recyclage déchets organiques et production compost naturel.",
    category: "Utilities",
    subcategory: "Waste Management",
    price: 79.99,
    comparePrice: 99.99,
    cost: 45.00,
    sku: "COMPOSTEUR-400L-JARDIN",
    barcode: "1234567890313",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 12.8,
    dimensions: { length: 80, width: 80, height: 80 },
    images: [
      "https://images.pexels.com/photos/5997993/pexels-photo-5997993.jpeg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Bac composteur jardin 400L écologique",
    seoDescription: "Composteur déchets organiques pour recyclage et jardinage écologique"
  },
  {
    name: "Poubelle tri sélectif 3 compartiments",
    description: "Poubelle tri sélectif avec 3 bacs pour recyclage verre, plastique, papier et déchets organiques.",
    category: "Utilities",
    subcategory: "Waste Management",
    price: 49.99,
    comparePrice: 64.99,
    cost: 28.00,
    sku: "POUBELLE-TRI-3BACS",
    barcode: "1234567890314",
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 4.5,
    dimensions: { length: 60, width: 40, height: 90 },
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Poubelle tri sélectif 3 compartiments recyclage",
    seoDescription: "Poubelle tri sélectif pour gestion déchets et recyclage efficace"
  },

  // Home Battery
  {
    name: "Batterie lithium-ion 5kWh",
    description: "Batterie de stockage énergie 5kWh pour autoconsommation solaire et secours électrique.",
    category: "Utilities",
    subcategory: "Home Battery",
    price: 2999.00,
    comparePrice: 3599.00,
    cost: 1800.00,
    sku: "BATTERIE-LITHIUM-5KWH",
    barcode: "1234567890315",
    trackQuantity: true,
    quantity: 6,
    lowStock: 1,
    weight: 52.0,
    dimensions: { length: 60, width: 45, height: 25 },
    images: [
      "https://images.pexels.com/photos/4792383/pexels-photo-4792383.jpeg"],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Batterie lithium-ion 5kWh stockage énergie",
    seoDescription: "Batterie haute capacité pour stockage énergie solaire et autonomie"
  },
  {
    name: "Onduleur-batterie hybride 3kW",
    description: "Système hybride onduleur-batterie intégré pour installation solaire et backup électrique.",
    category: "Utilities",
    subcategory: "Home Battery",
    price: 1899.00,
    comparePrice: 2299.00,
    cost: 1100.00,
    sku: "ONDULEUR-BATTERIE-3KW",
    barcode: "1234567890316",
    trackQuantity: true,
    quantity: 8,
    lowStock: 2,
    weight: 28.5,
    dimensions: { length: 50, width: 35, height: 20 },
    images: [
      "https://images.unsplash.com/photo-1563297007-0686b7003af7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Onduleur-batterie hybride 3kW système intégré",
    seoDescription: "Système hybride onduleur-batterie pour énergie solaire autonome"
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
    .substring(0, 100)
}

async function main() {
  console.log('🌱 Début du seeding des Utilities...')

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

    // Vérifier s'il y a déjà des produits dans cette catégorie
    const existingUtilities = await prisma.product.count({
      where: {
        category: "Utilities"
      }
    })

    if (existingUtilities > 0) {
      console.log(`🗑️  Suppression de ${existingUtilities} produits existants dans Utilities...`)
      await prisma.product.deleteMany({
        where: {
          category: "Utilities"
        }
      })
      console.log('✅ Anciens produits Utilities supprimés')
    }

    // Créer les produits Utilities
    console.log(`⚡ Création de ${utilitiesProducts.length} produits Utilities...`)

    for (const productData of utilitiesProducts) {
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

      console.log(`✅ Produit créé: ${productData.name} (${productData.subcategory})`)
    }

    console.log('🎉 Seeding des Utilities terminé avec succès!')
    console.log(`📊 ${utilitiesProducts.length} produits créés dans Utilities`)

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: "Utilities"
      },
      _count: {
        id: true
      }
    })

    console.log('\n📈 Résumé par sous-catégorie Utilities:')
    productsBySubcategory.forEach(subcat => {
      console.log(`   ${subcat.subcategory}: ${subcat._count.id} produits`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding Utilities:', error)
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