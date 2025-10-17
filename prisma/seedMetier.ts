import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // =======================
  // CATEGORIES (Prestations)
  // =======================
  const categoriesNames = [
    'Prestations intérieures',
    'Prestations extérieures',
    'Constructions'
  ]

  const categoriesMap = {}
  for (const name of categoriesNames) {
    let cat = await prisma.category.findFirst({ where: { name } })
    if (!cat) {
      cat = await prisma.category.create({ data: { name } })
      console.log(`➕ catégorie créée : ${name}`)
    } else {
      console.log(`🔁 catégorie existe déjà : ${name}`)
    }
    categoriesMap[name] = cat
  }

  // =======================
  // MÉTIERS
  // =======================
  const metiersData = [
    { libelle: 'Plombier' },
    { libelle: 'Électricien' },
    { libelle: 'Carreleur' },
    { libelle: 'Maçon' },
    { libelle: 'Constructeur' },
    { libelle: 'Avocat' },
    { libelle: 'Géomètre' },
    { libelle: 'Bureau d’étude' },
    { libelle: 'Menuisier' },
    { libelle: 'Peintre' },
    { libelle: 'Couvreur' },
    { libelle: 'Architecte' },
    { libelle: 'Décorateur d’intérieur' },
    { libelle: 'Paysagiste' },
    { libelle: 'Serrurier' },
    { libelle: 'Technicien climatisation' },
    { libelle: 'Plâtrier' },
    { libelle: 'Ingénieur civil' },
    { libelle: 'Charpentier' },
  ]

  await prisma.metier.createMany({
    data: metiersData,
    skipDuplicates: true,
  })
  console.log(`✅ ${metiersData.length} métiers créés (ou existants conservés).`)

  // =======================
  // SERVICES
  // =======================
  // Liste principale des services (identique à ton seed)
  const servicesData = [
    'Installation électrique complète',
    'Réparation de panne électrique',
    'Mise aux normes électriques',
    'Installation plomberie',
    'Réparation de fuite d’eau',
    'Pose de carrelage',
    'Rénovation de salle de bain',
    'Construction de maison individuelle',
    'Ravalement de façade',
    'Peinture intérieure et extérieure',
    'Conception architecturale',
    'Étude structurelle',
    'Mesure et bornage de terrain',
    'Étude géotechnique',
    'Conseil juridique en droit immobilier',
    'Installation de climatisation',
    'Entretien et maintenance chauffage',
    'Menuiserie aluminium et bois',
    'Installation de porte et fenêtre',
    'Travaux de toiture',
    'Charpente bois et métal',
    'Décoration intérieure',
    'Aménagement paysager',
    'Étude d’impact environnemental',
    'Dessin technique et plans d’exécution',
    'Gestion de chantier',
    'Installation de système de sécurité',
    'Pose de parquet et revêtement de sol',
    'Rénovation complète d’appartement',
    'Assainissement et drainage',
  ]

  // Map : pour associer chaque service à une catégorie si c'est un "travaux"
  const serviceToCategory = {
    // Prestations intérieures
    'Installation électrique complète': 'Prestations intérieures',
    'Réparation de panne électrique': 'Prestations intérieures',
    'Mise aux normes électriques': 'Prestations intérieures',
    'Installation plomberie': 'Prestations intérieures',
    'Réparation de fuite d’eau': 'Prestations intérieures',
    'Pose de carrelage': 'Prestations intérieures',
    'Rénovation de salle de bain': 'Prestations intérieures',
    'Peinture intérieure et extérieure': 'Prestations intérieures',
    'Installation de climatisation': 'Prestations intérieures',
    'Entretien et maintenance chauffage': 'Prestations intérieures',
    'Menuiserie aluminium et bois': 'Prestations intérieures',
    'Installation de porte et fenêtre': 'Prestations intérieures',
    'Décoration intérieure': 'Prestations intérieures',
    'Pose de parquet et revêtement de sol': 'Prestations intérieures',
    'Rénovation complète d’appartement': 'Prestations intérieures',

    // Prestations extérieures
    'Ravalement de façade': 'Prestations extérieures',
    'Travaux de toiture': 'Prestations extérieures',
    'Charpente bois et métal': 'Prestations extérieures',
    'Aménagement paysager': 'Prestations extérieures',
    'Assainissement et drainage': 'Prestations extérieures',
    'Mesure et bornage de terrain': 'Prestations extérieures', // souvent extérieur
    'Pose de parquet et revêtement de sol': 'Prestations intérieures', // double présence possible, kept interior

    // Constructions
    'Construction de maison individuelle': 'Constructions',
    'Conception architecturale': 'Constructions',
    'Étude structurelle': 'Constructions',
    'Étude géotechnique': 'Constructions',
    'Étude d’impact environnemental': 'Constructions',
    'Dessin technique et plans d’exécution': 'Constructions',
    'Gestion de chantier': 'Constructions',
    'Installation de système de sécurité': 'Constructions' // peut aussi être intérieur; ici rattaché à Constructions
  }

  let created = 0
  let updated = 0

  for (const libelle of servicesData) {
    // get target category id if mapped
    const catName = serviceToCategory[libelle]
    const category = catName ? categoriesMap[catName] : null

    // check if service exists already (by libelle)
    let existing = await prisma.service.findFirst({ where: { libelle } })

    if (existing) {
      // update categoryId if needed
      const newCategoryId = category ? category.id : null
      if (existing.categoryId !== newCategoryId) {
        await prisma.service.update({
          where: { id: existing.id },
          data: {
            categoryId: newCategoryId,
          },
        })
        updated++
        console.log(`♻️  Service mis à jour : ${libelle} -> ${catName ?? 'sans catégorie'}`)
      } else {
        console.log(`🔁 Service existe déjà (sans changement) : ${libelle}`)
      }
    } else {
      // create new service with categoryId (nullable)
      await prisma.service.create({
        data: {
          libelle,
          description: '', // tu peux compléter
          images: [],
          categoryId: category ? category.id : null,
        },
      })
      created++
      console.log(`➕ Service créé : ${libelle} -> ${catName ?? 'sans catégorie'}`)
    }
  }

  console.log(`✅ Services: créés=${created} ; mis à jour=${updated}`)

  console.log('🌿 Seeding terminé avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
