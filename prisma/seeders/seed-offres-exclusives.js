// seed-offres-exclusives.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Données de produits pour offres exclusives
const offresExclusivesData = [
  {
    name: "Smartphone Premium - Offre Flash",
    description: "Smartphone dernier cri avec triple caméra, 256GB de stockage. Offre flash limitée !",
    category: "shopping",
    subcategory: "Électronique",
    price: 499.99,
    comparePrice: 999.99, // Prix original pour calculer la réduction
    cost: 400.00,
    sku: "SMART-FLASH-001",
    barcode: "OFFRE001234567",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 0.2,
    dimensions: { length: 15, width: 7, height: 1 },
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "TechMaster",
    productType: "product",
    seoTitle: "Smartphone Premium - Offre Flash",
    seoDescription: "Smartphone haut de gamme à moitié prix, offre limitée !"
  },
  {
    name: "Casque Audio Sans Fil",
    description: "Casque audio sans fil avec réduction de bruit active. Derniers exemplaires !",
    category: "shopping",
    subcategory: "Audio",
    price: 89.99,
    comparePrice: 149.99,
    cost: 60.00,
    sku: "CASQUE-FLASH-002",
    barcode: "OFFRE001234568",
    trackQuantity: true,
    quantity: 8,
    lowStock: 2,
    weight: 0.3,
    dimensions: { length: 20, width: 18, height: 8 },
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "SoundPro",
    productType: "product",
    seoTitle: "Casque Audio Sans Fil",
    seoDescription: "Casque audio premium avec réduction de bruit, offre spéciale"
  },
  {
    name: "Montre Connectée Sport",
    description: "Montre connectée étanche avec GPS et moniteur de fréquence cardiaque.",
    category: "shopping",
    subcategory: "Montres",
    price: 129.99,
    comparePrice: 199.99,
    cost: 90.00,
    sku: "MONTRE-FLASH-003",
    barcode: "OFFRE001234569",
    trackQuantity: true,
    quantity: 12,
    lowStock: 4,
    weight: 0.05,
    dimensions: { length: 4, width: 4, height: 1 },
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1434493650001-5d43a6fea0a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "FitTech",
    productType: "product",
    seoTitle: "Montre Connectée Sport",
    seoDescription: "Montre connectée sportive étanche avec GPS intégré"
  },
  {
    name: "Week-end à Paris",
    description: "Package week-end à Paris : hôtel 3* + visite guidée + croisière sur la Seine.",
    category: "voyages",
    subcategory: "Séjours",
    price: 299.00,
    comparePrice: 450.00,
    cost: 200.00,
    sku: "PARIS-FLASH-004",
    barcode: "OFFRE001234570",
    trackQuantity: true,
    quantity: 20,
    lowStock: 5,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "TravelEasy",
    productType: "product",
    seoTitle: "Week-end Paris Offre Flash",
    seoDescription: "Package week-end à Paris tout inclus, offre limitée"
  },
  {
    name: "Saut en Parachute",
    description: "Expérience de saut en parachute tandem avec instructeur certifié.",
    category: "loisirs",
    subcategory: "Sports extrêmes",
    price: 199.00,
    comparePrice: 299.00,
    cost: 120.00,
    sku: "PARACHUTE-FLASH-005",
    barcode: "OFFRE001234571",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: [
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "AdrenaLife",
    productType: "product",
    seoTitle: "Saut en Parachute Offre Flash",
    seoDescription: "Expérience inoubliable de saut en parachute tandem"
  },
  {
    name: "Diagnostic Immobilier",
    description: "Diagnostic complet pour vente ou location : plomb, amiante, électricité, gaz.",
    category: "immobilier",
    subcategory: "Services",
    price: 299.00,
    comparePrice: 450.00,
    cost: 150.00,
    sku: "DIAG-FLASH-006",
    barcode: "OFFRE001234572",
    trackQuantity: true,
    quantity: 40,
    lowStock: 10,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "ProDiagnostic",
    productType: "product",
    seoTitle: "Diagnostic Immobilier Offre Flash",
    seoDescription: "Diagnostic complet obligatoire pour transaction immobilière"
  },
  {
    name: "Pass VIP Soirée Électro",
    description: "Pass VIP pour soirée électro : accès prioritaire + consommation offerte.",
    category: "soirees",
    subcategory: "Concerts",
    price: 49.00,
    comparePrice: 79.00,
    cost: 20.00,
    sku: "SOIREE-FLASH-007",
    barcode: "OFFRE001234573",
    trackQuantity: true,
    quantity: 50,
    lowStock: 10,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1492684223066-e9e4aab4d25e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "NightLife",
    productType: "product",
    seoTitle: "Pass VIP Soirée Électro",
    seoDescription: "Pass VIP pour soirée électro exclusive"
  },
  {
    name: "Canapé Design",
    description: "Canapé 3 places design en velours, livraison et installation incluses.",
    category: "shopping",
    subcategory: "Meubles",
    price: 699.00,
    comparePrice: 1165.00,
    cost: 450.00,
    sku: "CANAPE-FLASH-008",
    barcode: "OFFRE001234574",
    trackQuantity: true,
    quantity: 10,
    lowStock: 2,
    weight: 45.0,
    dimensions: { length: 220, width: 95, height: 85 },
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    ],
    status: "published",
    featured: true,
    visibility: "public",
    brand: "DesignHome",
    productType: "product",
    seoTitle: "Canapé Design Offre Flash",
    seoDescription: "Canapé design premium avec livraison incluse"
  }
]

// Fonction pour générer un slug
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
  console.log('🚀 Début du seeding des offres exclusives...')

  try {
    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    })

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé')
      console.log('💡 Créez d\'abord des utilisateurs')
      return
    }

    console.log(`👥 ${users.length} utilisateurs disponibles`)

    // Vérifier les produits existants avec SKU commençant par "FLASH"
    const existingOffres = await prisma.product.findMany({
      where: {
        sku: {
          startsWith: "FLASH"
        }
      }
    })

    if (existingOffres.length > 0) {
      console.log(`🗑️  Suppression de ${existingOffres.length} anciennes offres exclusives...`)
      await prisma.product.deleteMany({
        where: {
          sku: {
            startsWith: "FLASH"
          }
        }
      })
      console.log('✅ Anciennes offres supprimées')
    }

    // Créer les offres exclusives
    console.log(`🎯 Création de ${offresExclusivesData.length} offres exclusives...`)

    const createdProducts = []
    
    for (let i = 0; i < offresExclusivesData.length; i++) {
      const productData = offresExclusivesData[i]
      const user = users[i % users.length]
      
      // Générer le slug
      const slug = generateSlug(productData.name)
      
      // Calculer le pourcentage de réduction pour l'affichage
      const discount = productData.comparePrice 
        ? Math.round((1 - productData.price / productData.comparePrice) * 100)
        : 0
      
      // Préparer les données sans le champ discountPercentage
      const productDataToCreate = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        subcategory: productData.subcategory,
        price: productData.price,
        comparePrice: productData.comparePrice,
        cost: productData.cost,
        sku: productData.sku,
        barcode: productData.barcode,
        trackQuantity: productData.trackQuantity,
        quantity: productData.quantity,
        lowStock: productData.lowStock,
        weight: productData.weight,
        dimensions: productData.dimensions,
        images: productData.images,
        status: productData.status,
        featured: productData.featured,
        visibility: productData.visibility,
        brand: productData.brand,
        productType: productData.productType,
        seoTitle: productData.seoTitle,
        seoDescription: productData.seoDescription,
        slug: slug,
        userId: user.id,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const product = await prisma.product.create({
        data: productDataToCreate
      })
      
      createdProducts.push(product)
      console.log(`✅ ${i + 1}. ${productData.name} (${discount}% de réduction)`)
    }

    console.log('\n🎉 Seeding des offres exclusives terminé avec succès!')
    console.log(`📊 ${createdProducts.length} offres créées`)

    // Statistiques par catégorie
    console.log('\n📈 Statistiques par catégorie:')
    const categories = {}
    createdProducts.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1
    })
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} offres`)
    })

    // Information pour tester
    console.log('\n🔗 Pour tester:')
    console.log('   1. Vérifiez l\'API: GET /api/offres-exclusives/flash')
    console.log('   2. Accédez à la page /offres-exclusives')
    console.log('   3. Les réductions seront calculées automatiquement par comparePrice')
    console.log('   4. Testez l\'ajout au panier (tous doivent fonctionner)')

    // Vérification directe
    console.log('\n🔍 Vérification directe:')
    const testProducts = await prisma.product.findMany({
      where: {
        sku: {
          contains: "FLASH"
        }
      },
      select: {
        name: true,
        category: true,
        price: true,
        comparePrice: true,
        status: true
      },
      take: 3
    })
    
    console.log('   Exemples de produits créés:')
    testProducts.forEach(p => {
      const discount = p.comparePrice 
        ? Math.round((1 - p.price / p.comparePrice) * 100)
        : 0
      console.log(`   - ${p.name}: ${p.price}€ (était ${p.comparePrice}€) - ${discount}%`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    console.error('Détails:', error.message)
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