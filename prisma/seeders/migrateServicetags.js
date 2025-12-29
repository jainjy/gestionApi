const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Mapping anciens tags → tag principal
const TAG_MAPPING = {
  entreprise: "entreprise",
  création: "entreprise",
  cession: "entreprise",
  liquidation: "entreprise",
  transmission: "entreprise",

  juridique: "juridique",
  droit: "juridique",
  contrats: "juridique",
  litiges: "juridique",
  formalités: "juridique",

  comptabilité: "finance",
  fiscalité: "finance",
  tva: "finance",
  bilan: "finance",
  financement: "finance",
  subventions: "finance",
  "levée-fonds": "finance",

  conseil: "strategie",
  coaching: "strategie",
  stratégie: "strategie",
  accompagnement: "strategie",
  "business-plan": "strategie",

  communication: "marketing",
  marketing: "marketing",
  branding: "marketing",

  digital: "digital",
  transformation: "digital",
  saas: "digital",
  automatisation: "digital",

  rachat: "acquisition",
  acquisition: "acquisition",
  "due diligence": "acquisition",

  international: "international",
  export: "international",
  implantation: "international"
}

async function main() {
  console.log("🔄 Migration des tags pour la catégorie ID = 62")

  // 👉 UNIQUEMENT categoryId = 62
  const services = await prisma.service.findMany({
    where: {
      categoryId: 62
    }
  })

  if (!services.length) {
    console.log("⚠️ Aucun service trouvé pour la catégorie 62")
    return
  }

  let updated = 0
  let skipped = 0

  for (const service of services) {
    const oldTags = service.tags || []

    // Trouver le tag principal
    const mainTag = oldTags
      .map(tag => TAG_MAPPING[tag])
      .find(Boolean)

    if (!mainTag) {
      skipped++
      console.warn(`⏭️ Aucun mapping pour : ${service.libelle}`, oldTags)
      continue
    }

    await prisma.service.update({
      where: { id: service.id },
      data: {
        tags: [mainTag]
      }
    })

    updated++
    console.log(`✅ ${service.libelle} → ${mainTag}`)
  }

  console.log("\n📊 Résumé migration")
  console.log(`✅ Mis à jour : ${updated}`)
  console.log(`⏭️ Ignorés : ${skipped}`)
  console.log(`📦 Total traités : ${services.length}`)
}

main()
  .catch(err => {
    console.error("❌ Erreur migration :", err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
