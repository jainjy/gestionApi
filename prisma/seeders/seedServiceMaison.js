const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Données de produits pour Services Maison
const servicesMaisonProducts = [
  // Ménage
  {
    name: "Kit de nettoyage professionnel",
    description: "Kit complet de produits ménagers écologiques pour un nettoyage en profondeur. Inclut nettoyant multi-surfaces, dégraissant et désinfectant.",
    category: "Services Maison",
    subcategory: "Ménage",
    price: 49.99,
    comparePrice: 64.99,
    cost: 28.00,
    sku: "KIT-MENAGE-PRO",
    barcode: "1234567890201",
    trackQuantity: true,
    quantity: 50,
    lowStock: 10,
    weight: 5.5,
    dimensions: { length: 30, width: 20, height: 15 },
    images: [
      "https://i.pinimg.com/736x/8c/9d/8b/8c9d8bbff5f660b4a78119e3c9f58a4c.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Kit de nettoyage professionnel écologique",
    seoDescription: "Kit complet de produits ménagers écologiques pour maison propre"
  },
  {
    name: "Aspirateur balai sans fil",
    description: "Aspirateur balai puissant avec batterie longue durée, parfait pour le ménage quotidien.",
    category: "Services Maison",
    subcategory: "Ménage",
    price: 199.00,
    comparePrice: 249.00,
    cost: 120.00,
    sku: "ASP-BALAI-2000W",
    barcode: "1234567890202",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 3.2,
    dimensions: { length: 30, width: 25, height: 120 },
    images: [
      "https://i.pinimg.com/736x/a1/7f/6d/a17f6d0d7e4a0dd16e01f84d41b51da3.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Aspirateur balai sans fil puissant",
    seoDescription: "Aspirateur balai autonome pour ménage facile et rapide"
  },

  // Jardinage
  {
    name: "Taille-haie électrique professionnel",
    description: "Taille-haie électrique 600W avec lame de 45cm, poignée rotative pour un confort optimal.",
    category: "Services Maison",
    subcategory: "Jardinage",
    price: 89.99,
    comparePrice: 119.99,
    cost: 55.00,
    sku: "TAILLE-HAIE-600W",
    barcode: "1234567890203",
    trackQuantity: true,
    quantity: 30,
    lowStock: 5,
    weight: 3.8,
    dimensions: { length: 70, width: 25, height: 15 },
    images: [
      "https://i.pinimg.com/736x/2d/db/f5/2ddbf5d2f6316db5454bee1c028f5cdf.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Taille-haie électrique professionnel 600W",
    seoDescription: "Taille-haie puissant pour l'entretien de vos haies et arbustes"
  },
  {
    name: "Tondeuse à gazon thermique",
    description: "Tondeuse thermique 140cc avec bac de ramassage 60L, démarrage facile.",
    category: "Services Maison",
    subcategory: "Jardinage",
    price: 349.00,
    comparePrice: 399.00,
    cost: 220.00,
    sku: "TONDO-THERM-140CC",
    barcode: "1234567890204",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 25.0,
    dimensions: { length: 120, width: 55, height: 45 },
    images: [
      "https://i.pinimg.com/736x/57/09/8b/57098b38d3e638fa7b8323cfd3ff4cda.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Tondeuse à gazon thermique 140cc",
    seoDescription: "Tondeuse thermique puissante avec grand bac de ramassage"
  },

  // Plomberie
  {
    name: "Kit réparation fuite d'eau",
    description: "Kit complet pour réparer les fuites d'eau, inclut mastic, ruban téflon et joints.",
    category: "Services Maison",
    subcategory: "Plomberie",
    price: 24.99,
    comparePrice: 34.99,
    cost: 12.00,
    sku: "KIT-PLOMB-URGENCE",
    barcode: "1234567890205",
    trackQuantity: true,
    quantity: 100,
    lowStock: 20,
    weight: 1.2,
    dimensions: { length: 20, width: 15, height: 5 },
    images: [
      "https://i.pinimg.com/736x/75/69/97/75699783760fa330cd3fdb2de372cbb3.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Kit réparation fuite d'eau d'urgence",
    seoDescription: "Kit complet pour réparer rapidement les fuites de plomberie"
  },
  {
    name: "Robinet mitigeur cuisine",
    description: "Robinet mitigeur design avec bec pivotant et douchette extractible, finition chrome.",
    category: "Services Maison",
    subcategory: "Plomberie",
    price: 129.00,
    comparePrice: 159.00,
    cost: 75.00,
    sku: "ROB-MITIG-CUISINE",
    barcode: "1234567890206",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 4.5,
    dimensions: { length: 25, width: 20, height: 30 },
    images: [
      "https://i.pinimg.com/736x/8f/dc/36/8fdc36d9a41f8aee52f10fb511f25d91.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Robinet mitigeur cuisine avec douchette",
    seoDescription: "Robinet mitigeur design pour évier de cuisine"
  },

  // Électricité
  {
    name: "Kit d'outils électricien",
    description: "Kit professionnel pour travaux électriques, inclut tournevis isolés, pince à dénuder, testeur.",
    category: "Services Maison",
    subcategory: "Électricité",
    price: 79.99,
    comparePrice: 99.99,
    cost: 45.00,
    sku: "KIT-ELECT-PRO",
    barcode: "1234567890207",
    trackQuantity: true,
    quantity: 40,
    lowStock: 8,
    weight: 2.8,
    dimensions: { length: 35, width: 25, height: 8 },
    images: [
      "https://i.pinimg.com/736x/e8/75/71/e87571a444014476b09293a6ca790b26.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Kit d'outils électricien professionnel",
    seoDescription: "Kit complet pour travaux électriques domestiques en sécurité"
  },
  {
    name: "Multiprise parasurtenseur",
    description: "Multiprise 6 prises avec protection parasurtenseur, câble 2m, indicateur de protection.",
    category: "Services Maison",
    subcategory: "Électricité",
    price: 34.99,
    comparePrice: 44.99,
    cost: 18.00,
    sku: "MULTI-PROTECT-6P",
    barcode: "1234567890208",
    trackQuantity: true,
    quantity: 75,
    lowStock: 15,
    weight: 1.1,
    dimensions: { length: 35, width: 10, height: 5 },
    images: [
      "https://i.pinimg.com/736x/2f/04/36/2f043687cb9218af9a19da972b52ead5.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Multiprise parasurtenseur 6 prises",
    seoDescription: "Multiprise sécurisée avec protection contre les surtensions"
  },

  // Peinture
  {
    name: "Kit peinture complète murale",
    description: "Kit complet pour peinture murale incluant rouleaux, bacs, bâches et outils de préparation.",
    category: "Services Maison",
    subcategory: "Peinture",
    price: 59.99,
    comparePrice: 79.99,
    cost: 32.00,
    sku: "KIT-PEINT-MURALE",
    barcode: "1234567890209",
    trackQuantity: true,
    quantity: 35,
    lowStock: 7,
    weight: 6.5,
    dimensions: { length: 50, width: 30, height: 20 },
    images: [
      "https://i.pinimg.com/736x/a1/7f/6d/a17f6d0d7e4a0dd16e01f84d41b51da3.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Kit complet peinture murale professionnelle",
    seoDescription: "Kit avec tous les outils nécessaires pour peindre vos murs"
  },
  {
    name: "Peinture acrylique mate 2.5L",
    description: "Peinture acrylique mate pour intérieur, couvrance exceptionnelle, lavable.",
    category: "Services Maison",
    subcategory: "Peinture",
    price: 39.99,
    comparePrice: 49.99,
    cost: 22.00,
    sku: "PEINT-ACRY-MATE-2.5L",
    barcode: "1234567890210",
    trackQuantity: true,
    quantity: 60,
    lowStock: 12,
    weight: 3.8,
    dimensions: { length: 20, width: 20, height: 30 },
    images: [
      "https://i.pinimg.com/736x/2d/db/f5/2ddbf5d2f6316db5454bee1c028f5cdf.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Peinture acrylique mate 2.5L lavable",
    seoDescription: "Peinture mate haute qualité pour murs intérieurs"
  },

  // Bricolage
  {
    name: "Perceuse-visseuse sans fil 18V",
    description: "Perceuse-visseuse sans fil avec 2 batteries, couple max 50Nm, LED de travail.",
    category: "Services Maison",
    subcategory: "Bricolage",
    price: 149.00,
    comparePrice: 179.00,
    cost: 85.00,
    sku: "PERC-VISS-18V-PRO",
    barcode: "1234567890211",
    trackQuantity: true,
    quantity: 30,
    lowStock: 6,
    weight: 2.3,
    dimensions: { length: 25, width: 8, height: 20 },
    images: [
      "https://i.pinimg.com/736x/75/69/97/75699783760fa330cd3fdb2de372cbb3.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Perceuse-visseuse sans fil 18V professionnelle",
    seoDescription: "Perceuse-visseuse puissante pour tous vos travaux de bricolage"
  },
  {
    name: "Scie circulaire plongeante",
    description: "Scie circulaire plongeante 1200W avec guide parallèle, profondeur de coupe 55mm.",
    category: "Services Maison",
    subcategory: "Bricolage",
    price: 129.00,
    comparePrice: 159.00,
    cost: 70.00,
    sku: "SCIE-CIRC-1200W",
    barcode: "1234567890212",
    trackQuantity: true,
    quantity: 18,
    lowStock: 4,
    weight: 5.2,
    dimensions: { length: 35, width: 25, height: 20 },
    images: [
      "https://i.pinimg.com/736x/8c/9d/8b/8c9d8bbff5f660b4a78119e3c9f58a4c.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Scie circulaire plongeante 1200W",
    seoDescription: "Scie circulaire puissante pour coupes précises dans le bois"
  },

  // Serrurerie
  {
    name: "Cylindre de sécurité haute performance",
    description: "Cylindre de sécurité anti-perçage, anti-crochetage, avec 5 clés.",
    category: "Services Maison",
    subcategory: "Serrurerie",
    price: 89.99,
    comparePrice: 119.99,
    cost: 50.00,
    sku: "CYLINDRE-SECU-PRO",
    barcode: "1234567890213",
    trackQuantity: true,
    quantity: 25,
    lowStock: 5,
    weight: 0.8,
    dimensions: { length: 12, width: 6, height: 3 },
    images: [
      "https://i.pinimg.com/736x/57/09/8b/57098b38d3e638fa7b8323cfd3ff4cda.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Cylindre de sécurité haute performance",
    seoDescription: "Cylindre de serrure anti-perçage et anti-crochetage"
  },
  {
    name: "Serrure multipoint blindée",
    description: "Serrure multipoint 3 points pour porte d'entrée, résistance renforcée.",
    category: "Services Maison",
    subcategory: "Serrurerie",
    price: 199.00,
    comparePrice: 249.00,
    cost: 110.00,
    sku: "SERR-MULTI-3PT",
    barcode: "1234567890214",
    trackQuantity: true,
    quantity: 15,
    lowStock: 3,
    weight: 4.5,
    dimensions: { length: 40, width: 15, height: 8 },
    images: [
      "https://i.pinimg.com/736x/8f/dc/36/8fdc36d9a41f8aee52f10fb511f25d91.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Serrure multipoint blindée 3 points",
    seoDescription: "Serrure de sécurité multipoint pour porte d'entrée"
  },

  // Climatisation
  {
    name: "Climatiseur mobile silencieux",
    description: "Climatiseur mobile 12000 BTU, fonction refroidissement et ventilation, télécommande.",
    category: "Services Maison",
    subcategory: "Climatisation",
    price: 449.00,
    comparePrice: 549.00,
    cost: 280.00,
    sku: "CLIM-MOBILE-12000",
    barcode: "1234567890215",
    trackQuantity: true,
    quantity: 12,
    lowStock: 2,
    weight: 32.0,
    dimensions: { length: 50, width: 35, height: 75 },
    images: [
      "https://i.pinimg.com/736x/e8/75/71/e87571a444014476b09293a6ca790b26.jpg"
    ],
    status: "active",
    featured: true,
    visibility: "public",
    seoTitle: "Climatiseur mobile silencieux 12000 BTU",
    seoDescription: "Climatiseur mobile puissant pour rafraîchir vos pièces"
  },
  {
    name: "Purificateur d'air avec filtre HEPA",
    description: "Purificateur d'air 4 en 1 avec filtre HEPA, ioniseur et contrôle de la qualité de l'air.",
    category: "Services Maison",
    subcategory: "Climatisation",
    price: 199.00,
    comparePrice: 249.00,
    cost: 120.00,
    sku: "PURIF-AIR-HEPA",
    barcode: "1234567890216",
    trackQuantity: true,
    quantity: 20,
    lowStock: 4,
    weight: 8.5,
    dimensions: { length: 35, width: 35, height: 60 },
    images: [
      "https://i.pinimg.com/736x/2f/04/36/2f043687cb9218af9a19da972b52ead5.jpg"
    ],
    status: "active",
    featured: false,
    visibility: "public",
    seoTitle: "Purificateur d'air avec filtre HEPA professionnel",
    seoDescription: "Purificateur d'air 4 en 1 pour air intérieur sain"
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
  console.log('🌱 Début du seeding des Services Maison...')

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
    const existingServicesMaison = await prisma.product.count({
      where: {
        category: "Services Maison"
      }
    })

    if (existingServicesMaison > 0) {
      console.log(`🗑️  Suppression de ${existingServicesMaison} produits existants dans Services Maison...`)
      await prisma.product.deleteMany({
        where: {
          category: "Services Maison"
        }
      })
      console.log('✅ Anciens produits Services Maison supprimés')
    }

    // Créer les produits Services Maison
    console.log(`🛠️  Création de ${servicesMaisonProducts.length} produits Services Maison...`)

    for (const productData of servicesMaisonProducts) {
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

    console.log('🎉 Seeding des Services Maison terminé avec succès!')
    console.log(`📊 ${servicesMaisonProducts.length} produits créés dans Services Maison`)

    // Afficher un résumé par sous-catégorie
    const productsBySubcategory = await prisma.product.groupBy({
      by: ['subcategory'],
      where: {
        category: "Services Maison"
      },
      _count: {
        id: true
      }
    })

    console.log('\n📈 Résumé par sous-catégorie Services Maison:')
    productsBySubcategory.forEach(subcat => {
      console.log(`   ${subcat.subcategory}: ${subcat._count.id} produits`)
    })

  } catch (error) {
    console.error('❌ Erreur lors du seeding Services Maison:', error)
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