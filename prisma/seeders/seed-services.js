// prisma/seed-services.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed des services Entreprise & Pro...')

  // ID de la catégorie (à adapter selon votre base)
  const categoryId = 62

  // Vérifier si la catégorie existe
  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId }
  })

  if (!categoryExists) {
    console.error(`❌ Catégorie avec ID ${categoryId} non trouvée`)
    return
  }

  console.log(`✅ Catégorie trouvée: ${categoryExists.name} (ID: ${categoryId})`)

  // Données des services - SEULEMENT les champs du modèle
  const servicesData = [
    {
      libelle: "Création d'entreprise",
      description: "Accompagnement complet pour la création de votre entreprise : choix du statut, formalités juridiques, immatriculation",
      images: ["/images/services/creation-entreprise.jpg"],
      duration: 120,
      price: 299.99,
      type: "entreprise",
      tags: ["entreprise", "juridique", "création", "formalités"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Rachat d'entreprise",
      description: "Acquisition d'entreprises existantes : due diligence, négociation, transmission",
      images: ["/images/services/rachat-entreprise.jpg"],
      duration: 180,
      price: 499.99,
      type: "entreprise",
      tags: ["rachat", "acquisition", "due diligence", "transmission"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Cession & Liquidation",
      description: "Conseil et accompagnement pour la cession ou la liquidation de votre entreprise",
      images: ["/images/services/cession-liquidation.jpg"],
      duration: 150,
      price: 399.99,
      type: "entreprise",
      tags: ["cession", "liquidation", "transmission", "juridique"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Communication & Marketing",
      description: "Stratégies de communication et marketing digital pour développer votre entreprise",
      images: ["/images/services/communication-marketing.jpg"],
      duration: 90,
      price: 199.99,
      type: "entreprise",
      tags: ["communication", "marketing", "digital", "branding"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Comptabilité & Fiscalité",
      description: "Gestion comptable complète et optimisation fiscale pour votre entreprise",
      images: ["/images/services/comptabilite-fiscalite.jpg"],
      duration: 60,
      price: 149.99,
      type: "entreprise",
      tags: ["comptabilité", "fiscalité", "tva", "bilan"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Conseil Juridique",
      description: "Accompagnement juridique et conseil en droit des affaires",
      images: ["/images/services/conseil-juridique.jpg"],
      duration: 60,
      price: 179.99,
      type: "entreprise",
      tags: ["juridique", "droit", "contrats", "litiges"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Conseils & Accompagnement",
      description: "Coaching stratégique et accompagnement personnalisé pour entrepreneurs",
      images: ["/images/services/conseils-accompagnement.jpg"],
      duration: 90,
      price: 249.99,
      type: "entreprise",
      tags: ["conseil", "coaching", "stratégie", "accompagnement"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Financement & Subventions",
      description: "Aide à l'obtention de financements, prêts et subventions pour entreprises",
      images: ["/images/services/financement-subventions.jpg"],
      duration: 120,
      price: 349.99,
      type: "entreprise",
      tags: ["financement", "subventions", "business-plan", "levée-fonds"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Transformation Digitale",
      description: "Accompagnement dans la digitalisation de votre entreprise",
      images: ["/images/services/transformation-digitale.jpg"],
      duration: 120,
      price: 299.99,
      type: "entreprise",
      tags: ["digital", "transformation", "saas", "automatisation"],
      isCustom: false,
      isActive: true
    },
    {
      libelle: "Développement International",
      description: "Conseil pour l'expansion internationale de votre entreprise",
      images: ["/images/services/development-international.jpg"],
      duration: 150,
      price: 449.99,
      type: "entreprise",
      tags: ["international", "export", "développement", "implantation"],
      isCustom: false,
      isActive: true
    }
  ]

  // Compteurs
  let createdCount = 0
  let updatedCount = 0
  let errorCount = 0

  // Insérer ou mettre à jour les services
  for (const serviceData of servicesData) {
    try {
      // Vérifier si le service existe déjà (par libelle et catégorie)
      const existingService = await prisma.service.findFirst({
        where: {
          libelle: serviceData.libelle,
          categoryId: categoryId
        }
      })

      const serviceDataToCreate = {
        libelle: serviceData.libelle,
        description: serviceData.description,
        images: serviceData.images,
        duration: serviceData.duration,
        price: serviceData.price,
        type: serviceData.type,
        tags: serviceData.tags,
        isCustom: serviceData.isCustom,
        isActive: serviceData.isActive,
        categoryId: categoryId
      }

      if (existingService) {
        // Mettre à jour le service existant
        await prisma.service.update({
          where: { id: existingService.id },
          data: serviceDataToCreate
        })
        updatedCount++
        console.log(`↻ Service mis à jour: ${serviceData.libelle}`)
      } else {
        // Créer un nouveau service
        await prisma.service.create({
          data: serviceDataToCreate
        })
        createdCount++
        console.log(`✅ Service créé: ${serviceData.libelle}`)
      }
    } catch (error) {
      errorCount++
      console.error(`❌ Erreur avec le service "${serviceData.libelle}":`, error)
    }
  }

  // Résumé
  console.log('\n📊 Résumé du seed:')
  console.log(`✅ Services créés: ${createdCount}`)
  console.log(`↻ Services mis à jour: ${updatedCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`📝 Total traités: ${servicesData.length} services`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })