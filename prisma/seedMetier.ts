import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

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
  console.log(`✅ ${metiersData.length} métiers créés.`)

  // =======================
  // SERVICES
  // =======================
  const servicesData = [
    { libelle: 'Installation électrique complète' },
    { libelle: 'Réparation de panne électrique' },
    { libelle: 'Mise aux normes électriques' },
    { libelle: 'Installation plomberie' },
    { libelle: 'Réparation de fuite d’eau' },
    { libelle: 'Pose de carrelage' },
    { libelle: 'Rénovation de salle de bain' },
    { libelle: 'Construction de maison individuelle' },
    { libelle: 'Ravalement de façade' },
    { libelle: 'Peinture intérieure et extérieure' },
    { libelle: 'Conception architecturale' },
    { libelle: 'Étude structurelle' },
    { libelle: 'Mesure et bornage de terrain' },
    { libelle: 'Étude géotechnique' },
    { libelle: 'Conseil juridique en droit immobilier' },
    { libelle: 'Installation de climatisation' },
    { libelle: 'Entretien et maintenance chauffage' },
    { libelle: 'Menuiserie aluminium et bois' },
    { libelle: 'Installation de porte et fenêtre' },
    { libelle: 'Travaux de toiture' },
    { libelle: 'Charpente bois et métal' },
    { libelle: 'Décoration intérieure' },
    { libelle: 'Aménagement paysager' },
    { libelle: 'Étude d’impact environnemental' },
    { libelle: 'Dessin technique et plans d’exécution' },
    { libelle: 'Gestion de chantier' },
    { libelle: 'Installation de système de sécurité' },
    { libelle: 'Pose de parquet et revêtement de sol' },
    { libelle: 'Rénovation complète d’appartement' },
    { libelle: 'Assainissement et drainage' },
  ]

  await prisma.service.createMany({
    data: servicesData,
    skipDuplicates: true,
  })

  console.log(`✅ ${servicesData.length} services créés.`)

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
