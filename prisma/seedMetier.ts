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
    { libelle: 'Bureau d\'étude' },
    { libelle: 'Menuisier' },
    { libelle: 'Peintre' },
    { libelle: 'Couvreur' },
    { libelle: 'Architecte' },
    { libelle: 'Décorateur d\'intérieur' },
    { libelle: 'Paysagiste' },
    { libelle: 'Serrurier' },
    { libelle: 'Technicien climatisation' },
    { libelle: 'Plâtrier' },
    { libelle: 'Ingénieur civil' },
    { libelle: 'Charpentier' },
  ]

  const metiersMap = {}
  for (const metier of metiersData) {
    let existing = await prisma.metier.findFirst({ where: { libelle: metier.libelle } })
    if (!existing) {
      existing = await prisma.metier.create({ data: metier })
      console.log(`➕ métier créé : ${metier.libelle}`)
    } else {
      console.log(`🔁 métier existe déjà : ${metier.libelle}`)
    }
    metiersMap[metier.libelle] = existing
  }

  // =======================
  // SERVICES
  // =======================
  // Services étendus avec descriptions
  const servicesData = [
    {
      libelle: 'Installation électrique complète',
      description: 'Installation complète du réseau électrique pour maison neuve ou rénovation'
    },
    {
      libelle: 'Réparation de panne électrique',
      description: 'Diagnostic et réparation de pannes électriques diverses'
    },
    {
      libelle: 'Mise aux normes électriques',
      description: 'Mise en conformité de l\'installation électrique selon les normes en vigueur'
    },
    {
      libelle: 'Installation plomberie',
      description: 'Installation complète du réseau de plomberie'
    },
    {
      libelle: 'Réparation de fuite d\'eau',
      description: 'Recherche et réparation de fuites d\'eau'
    },
    {
      libelle: 'Pose de carrelage',
      description: 'Pose de carrelage pour sols et murs'
    },
    {
      libelle: 'Rénovation de salle de bain',
      description: 'Rénovation complète de salle de bain'
    },
    {
      libelle: 'Construction de maison individuelle',
      description: 'Construction de maison neuve clé en main'
    },
    {
      libelle: 'Ravalement de façade',
      description: 'Nettoyage et ravalement de façade'
    },
    {
      libelle: 'Peinture intérieure et extérieure',
      description: 'Travaux de peinture intérieure et extérieure'
    },
    {
      libelle: 'Conception architecturale',
      description: 'Conception et dessin de plans architecturaux'
    },
    {
      libelle: 'Étude structurelle',
      description: 'Étude de la structure du bâtiment'
    },
    {
      libelle: 'Mesure et bornage de terrain',
      description: 'Mesures précises et bornage de terrain'
    },
    {
      libelle: 'Étude géotechnique',
      description: 'Étude des sols pour construction'
    },
    {
      libelle: 'Conseil juridique en droit immobilier',
      description: 'Conseils juridiques spécialisés en immobilier'
    },
    {
      libelle: 'Installation de climatisation',
      description: 'Installation de systèmes de climatisation'
    },
    {
      libelle: 'Entretien et maintenance chauffage',
      description: 'Entretien et maintenance des systèmes de chauffage'
    },
    {
      libelle: 'Menuiserie aluminium et bois',
      description: 'Fabrication et pose de menuiseries aluminium et bois'
    },
    {
      libelle: 'Installation de porte et fenêtre',
      description: 'Pose de portes et fenêtres'
    },
    {
      libelle: 'Travaux de toiture',
      description: 'Réparation et entretien de toiture'
    },
    {
      libelle: 'Charpente bois et métal',
      description: 'Construction et réparation de charpentes'
    },
    {
      libelle: 'Décoration intérieure',
      description: 'Conseil et réalisation en décoration intérieure'
    },
    {
      libelle: 'Aménagement paysager',
      description: 'Création et entretien d\'espaces verts'
    },
    {
      libelle: 'Étude d\'impact environnemental',
      description: 'Étude des impacts environnementaux des projets'
    },
    {
      libelle: 'Dessin technique et plans d\'exécution',
      description: 'Réalisation de plans techniques détaillés'
    },
    {
      libelle: 'Gestion de chantier',
      description: 'Coordination et gestion complète de chantier'
    },
    {
      libelle: 'Installation de système de sécurité',
      description: 'Installation de systèmes d\'alarme et de sécurité'
    },
    {
      libelle: 'Pose de parquet et revêtement de sol',
      description: 'Pose de parquet et autres revêtements de sol'
    },
    {
      libelle: 'Rénovation complète d\'appartement',
      description: 'Rénovation complète d\'appartement'
    },
    {
      libelle: 'Assainissement et drainage',
      description: 'Travaux d\'assainissement et systèmes de drainage'
    },
    // Nouveaux services supplémentaires
    {
      libelle: 'Isolation thermique et phonique',
      description: 'Installation de systèmes d\'isolation thermique et acoustique'
    },
    {
      libelle: 'Démolition et désamiantage',
      description: 'Travaux de démolition et désamiantage sécurisés'
    },
    {
      libelle: 'Installation de panneaux solaires',
      description: 'Pose et installation de systèmes photovoltaïques'
    },
    {
      libelle: 'Rénovation de cuisine',
      description: 'Rénovation complète de cuisine'
    },
    {
      libelle: 'Installation de cheminée et poêle',
      description: 'Pose de cheminées et poêles à bois'
    },
    {
      libelle: 'Construction de piscine',
      description: 'Construction de piscines enterrées et hors-sol'
    },
    {
      libelle: 'Étanchéité de terrasse et toiture',
      description: 'Travaux d\'étanchéité pour terrasses et toitures'
    },
    {
      libelle: 'Installation de portail et clôture',
      description: 'Pose de portails et systèmes de clôture'
    },
    {
      libelle: 'Nettoyage après chantier',
      description: 'Nettoyage professionnel après travaux'
    },
    {
      libelle: 'Expertise immobilière',
      description: 'Expertise et évaluation de biens immobiliers'
    }
  ]

  // Map : pour associer chaque service à une catégorie
  const serviceToCategory = {
    // Prestations intérieures
    'Installation électrique complète': 'Prestations intérieures',
    'Réparation de panne électrique': 'Prestations intérieures',
    'Mise aux normes électriques': 'Prestations intérieures',
    'Installation plomberie': 'Prestations intérieures',
    'Réparation de fuite d\'eau': 'Prestations intérieures',
    'Pose de carrelage': 'Prestations intérieures',
    'Rénovation de salle de bain': 'Prestations intérieures',
    'Peinture intérieure et extérieure': 'Prestations intérieures',
    'Installation de climatisation': 'Prestations intérieures',
    'Entretien et maintenance chauffage': 'Prestations intérieures',
    'Menuiserie aluminium et bois': 'Prestations intérieures',
    'Installation de porte et fenêtre': 'Prestations intérieures',
    'Décoration intérieure': 'Prestations intérieures',
    'Pose de parquet et revêtement de sol': 'Prestations intérieures',
    'Rénovation complète d\'appartement': 'Prestations intérieures',
    'Isolation thermique et phonique': 'Prestations intérieures',
    'Rénovation de cuisine': 'Prestations intérieures',
    'Installation de cheminée et poêle': 'Prestations intérieures',
    'Nettoyage après chantier': 'Prestations intérieures',

    // Prestations extérieures
    'Ravalement de façade': 'Prestations extérieures',
    'Travaux de toiture': 'Prestations extérieures',
    'Charpente bois et métal': 'Prestations extérieures',
    'Aménagement paysager': 'Prestations extérieures',
    'Assainissement et drainage': 'Prestations extérieures',
    'Mesure et bornage de terrain': 'Prestations extérieures',
    'Démolition et désamiantage': 'Prestations extérieures',
    'Installation de panneaux solaires': 'Prestations extérieures',
    'Construction de piscine': 'Prestations extérieures',
    'Étanchéité de terrasse et toiture': 'Prestations extérieures',
    'Installation de portail et clôture': 'Prestations extérieures',

    // Constructions
    'Construction de maison individuelle': 'Constructions',
    'Conception architecturale': 'Constructions',
    'Étude structurelle': 'Constructions',
    'Étude géotechnique': 'Constructions',
    'Étude d\'impact environnemental': 'Constructions',
    'Dessin technique et plans d\'exécution': 'Constructions',
    'Gestion de chantier': 'Constructions',
    'Installation de système de sécurité': 'Constructions',
    'Expertise immobilière': 'Constructions'
  }

  // Map : pour associer chaque service aux métiers correspondants
  const serviceToMetiers = {
    'Installation électrique complète': ['Électricien'],
    'Réparation de panne électrique': ['Électricien'],
    'Mise aux normes électriques': ['Électricien'],
    'Installation plomberie': ['Plombier'],
    'Réparation de fuite d\'eau': ['Plombier'],
    'Pose de carrelage': ['Carreleur'],
    'Rénovation de salle de bain': ['Plombier', 'Carreleur'],
    'Construction de maison individuelle': ['Constructeur', 'Maçon'],
    'Ravalement de façade': ['Maçon', 'Peintre'],
    'Peinture intérieure et extérieure': ['Peintre'],
    'Conception architecturale': ['Architecte'],
    'Étude structurelle': ['Bureau d\'étude', 'Ingénieur civil'],
    'Mesure et bornage de terrain': ['Géomètre'],
    'Étude géotechnique': ['Bureau d\'étude', 'Géomètre'],
    'Conseil juridique en droit immobilier': ['Avocat'],
    'Installation de climatisation': ['Technicien climatisation'],
    'Entretien et maintenance chauffage': ['Technicien climatisation', 'Plombier'],
    'Menuiserie aluminium et bois': ['Menuisier'],
    'Installation de porte et fenêtre': ['Menuisier', 'Serrurier'],
    'Travaux de toiture': ['Couvreur'],
    'Charpente bois et métal': ['Charpentier'],
    'Décoration intérieure': ['Décorateur d\'intérieur'],
    'Aménagement paysager': ['Paysagiste'],
    'Étude d\'impact environnemental': ['Bureau d\'étude'],
    'Dessin technique et plans d\'exécution': ['Architecte', 'Bureau d\'étude'],
    'Gestion de chantier': ['Constructeur', 'Architecte'],
    'Installation de système de sécurité': ['Électricien', 'Serrurier'],
    'Pose de parquet et revêtement de sol': ['Menuisier', 'Carreleur'],
    'Rénovation complète d\'appartement': ['Constructeur', 'Maçon', 'Plombier', 'Électricien'],
    'Assainissement et drainage': ['Plombier', 'Maçon'],
    'Isolation thermique et phonique': ['Plâtrier', 'Menuisier'],
    'Démolition et désamiantage': ['Constructeur', 'Maçon'],
    'Installation de panneaux solaires': ['Électricien'],
    'Rénovation de cuisine': ['Menuisier', 'Carreleur', 'Plombier', 'Électricien'],
    'Installation de cheminée et poêle': ['Maçon', 'Plombier'],
    'Construction de piscine': ['Maçon', 'Constructeur'],
    'Étanchéité de terrasse et toiture': ['Couvreur', 'Maçon'],
    'Installation de portail et clôture': ['Serrurier', 'Menuisier'],
    'Nettoyage après chantier': [], // Service sans métier spécifique
    'Expertise immobilière': ['Avocat', 'Architecte']
  }

  let createdServices = 0
  let updatedServices = 0

  for (const serviceData of servicesData) {
    const { libelle, description } = serviceData
    
    // get target category id if mapped
    const catName = serviceToCategory[libelle]
    const category = catName ? categoriesMap[catName] : null

    // check if service exists already (by libelle)
    let existingService = await prisma.service.findFirst({ 
      where: { libelle },
      include: { metiers: true }
    })

    if (existingService) {
      // update categoryId if needed
      const newCategoryId = category ? category.id : null
      if (existingService.categoryId !== newCategoryId) {
        await prisma.service.update({
          where: { id: existingService.id },
          data: {
            categoryId: newCategoryId,
            description: description || existingService.description
          },
        })
        updatedServices++
        console.log(`♻️  Service mis à jour : ${libelle} -> ${catName ?? 'sans catégorie'}`)
      } else {
        console.log(`🔁 Service existe déjà (sans changement) : ${libelle}`)
      }
    } else {
      // create new service with categoryId (nullable)
      existingService = await prisma.service.create({
        data: {
          libelle,
          description: description || '',
          images: [],
          categoryId: category ? category.id : null,
        },
      })
      createdServices++
      console.log(`➕ Service créé : ${libelle} -> ${catName ?? 'sans catégorie'}`)
    }

    // Associer les métiers au service
    const metiersForService = serviceToMetiers[libelle] || []
    
    // Supprimer les associations existantes pour ce service
    await prisma.metierService.deleteMany({
      where: { serviceId: existingService.id }
    })

    // Créer les nouvelles associations
    for (const metierName of metiersForService) {
      const metier = metiersMap[metierName]
      if (metier) {
        await prisma.metierService.create({
          data: {
            metierId: metier.id,
            serviceId: existingService.id
          }
        })
        console.log(`   🔗 Association créée : ${libelle} -> ${metierName}`)
      }
    }

    if (metiersForService.length === 0) {
      console.log(`   ℹ️  Aucun métier associé pour : ${libelle}`)
    }
  }

  console.log(`✅ Services: créés=${createdServices} ; mis à jour=${updatedServices}`)

  // =======================
  // VÉRIFICATION DES ASSOCIATIONS
  // =======================
  console.log('\n🔍 Vérification des associations...')
  
  const servicesWithMetiers = await prisma.service.findMany({
    include: {
      metiers: {
        include: {
          metier: true
        }
      },
      category: true
    }
  })

  for (const service of servicesWithMetiers) {
    const metiersList = service.metiers.map(m => m.metier.libelle).join(', ')
    console.log(`📋 ${service.libelle} (${service.category?.name || 'sans catégorie'}) -> Métiers: ${metiersList || 'aucun'}`)
  }

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