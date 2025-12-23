// prisma/seeders/seedTherapeutesMasseurs.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID utilisateur spécifique
const TARGET_USER_ID = 'b14f8e76-667b-4c13-9eb5-d24a0f012071';

async function main() {
  console.log('🌱 Début du seeding des thérapeutes et masseurs...');

  // Vérifier l'existence de l'utilisateur spécifique
  console.log(`👤 Recherche de l'utilisateur avec ID: ${TARGET_USER_ID}...`);
  
  let testUser = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID }
  });

  if (!testUser) {
    console.log('⚠️ Utilisateur spécifique non trouvé, recherche d\'un autre utilisateur...');
    testUser = await prisma.user.findFirst();
    
    if (!testUser) {
      console.error('❌ Aucun utilisateur trouvé dans la base de données.');
      console.log('💡 Conseil: Créez d\'abord un utilisateur via l\'interface ou exécutez un seed utilisateur.');
      return;
    }
  }

  console.log(`✅ Utilisateur trouvé: ${testUser.email} (${testUser.firstName} ${testUser.lastName})`);

  // Créer ou récupérer les métiers spécifiques
  console.log('📝 Création/recupération des métiers pour thérapeutes/masseurs...');
  
  const therapeuteMetiers = ["Thérapeute", "Masseur"];
  const createdMetiers = [];
  
  for (const metierLibelle of therapeuteMetiers) {
    let metier = await prisma.metier.findFirst({
      where: { libelle: metierLibelle }
    });
    
    if (!metier) {
      metier = await prisma.metier.create({
        data: { libelle: metierLibelle }
      });
      console.log(`✅ Métier créé: ${metierLibelle}`);
    } else {
      console.log(`✓ Métier existant: ${metierLibelle}`);
    }
    createdMetiers.push(metier);
  }
  
  console.log(`✅ ${createdMetiers.length} métiers prêts`);

  // Créer la catégorie "Thérapeute" et "Masseur"
  console.log('🏷️ Création/recupération des catégories...');
  
  const categoriesToCreate = [
    { name: 'Thérapeute' },
    { name: 'Masseur' },
    { name: 'Psychologie' },
    { name: 'Massothérapie' }
  ];
  
  const categoriesMap = new Map();
  
  for (const catData of categoriesToCreate) {
    let category = await prisma.category.findFirst({
      where: { 
        name: {
          equals: catData.name,
          mode: 'insensitive'
        }
      }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: { name: catData.name }
      });
      console.log(`✅ Catégorie créée: ${catData.name}`);
    } else {
      console.log(`✓ Catégorie existante: ${catData.name}`);
    }
    categoriesMap.set(catData.name, category);
  }

  // Données des services de thérapeutes et masseurs
  const servicesData = [
    // Thérapeutes
    {
      libelle: "Consultation Psychologie en ligne",
      description: "Séance de psychothérapie en ligne avec un psychologue clinicien pour travailler sur le bien-être mental et émotionnel. Approche intégrative adaptée à vos besoins.",
      price: 75,
      duration: 60,
      categoryName: 'Thérapeute',
      images: [
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["psychologie", "en ligne", "thérapie", "bien-être mental"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Consultation sécurisée en ligne",
        "Support entre séances",
        "Exercices personnalisés",
        "Confidentialité assurée"
      ]
    },
    {
      libelle: "Thérapie Cognitive Comportementale (TCC)",
      description: "Approche TCC pour modifier les schémas de pensée négatifs et améliorer la gestion des émotions. Méthode structurée avec résultats mesurables.",
      price: 85,
      duration: 60,
      categoryName: 'Thérapeute',
      images: [
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["TCC", "thérapie", "émotions", "comportement"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Feuilles de travail personnalisées",
        "Suivi des progrès détaillé",
        "Accès aux ressources en ligne",
        "Techniques concrètes"
      ]
    },
    {
      libelle: "Accompagnement Gestion du Stress",
      description: "Programme personnalisé pour apprendre à gérer le stress et l'anxiété au quotidien. Techniques de relaxation et stratégies adaptatives.",
      price: 65,
      duration: 45,
      categoryName: 'Thérapeute',
      images: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["stress", "anxiété", "relaxation", "gestion émotionnelle"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Évaluation du niveau de stress",
        "Techniques de respiration",
        "Exercices de pleine conscience",
        "Plan d'action personnalisé"
      ]
    },
    {
      libelle: "Thérapie de Couple en ligne",
      description: "Accompagnement pour les couples souhaitant améliorer leur communication et résoudre les conflits. Séances conjointes ou individuelles.",
      price: 95,
      duration: 75,
      categoryName: 'Thérapeute',
      images: [
        "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["couple", "relation", "communication", "thérapie"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Séances adaptées aux deux partenaires",
        "Outils de communication",
        "Résolution de conflits",
        "Suivi progressif"
      ]
    },
    // Masseurs
    {
      libelle: "Massage Thérapeutique Professionnel",
      description: "Massage profond pour soulager les douleurs musculaires, les tensions chroniques et améliorer la mobilité articulaire.",
      price: 90,
      duration: 75,
      categoryName: 'Masseur',
      images: [
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "thérapeutique", "douleurs", "relaxation"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur'],
      features: [
        "Évaluation pré-massage approfondie",
        "Techniques adaptées à vos besoins",
        "Huiles essentielles thérapeutiques",
        "Conseils post-massage personnalisés"
      ]
    },
    {
      libelle: "Massage Relaxant aux Huiles Essentielles",
      description: "Massage doux et enveloppant pour une relaxation profonde. Utilisation d'huiles essentielles bio sélectionnées pour leurs propriétés apaisantes.",
      price: 75,
      duration: 60,
      categoryName: 'Masseur',
      images: [
        "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "relaxant", "huiles essentielles", "détente"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur'],
      features: [
        "Ambiance relaxante avec musique douce",
        "Huiles essentielles bio de qualité",
        "Techniques de massage suédois",
        "Temps de repos après massage"
      ]
    },
    {
      libelle: "Massage Sportif et Récupération",
      description: "Massage spécifique pour les sportifs visant à améliorer la récupération, prévenir les blessures et optimiser les performances.",
      price: 85,
      duration: 60,
      categoryName: 'Masseur',
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549060279-7e168fce7090?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "sportif", "récupération", "performance"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur'],
      features: [
        "Évaluation des besoins sportifs",
        "Techniques de drainage lymphatique",
        "Travail sur les points trigger",
        "Conseils d'étirements"
      ]
    },
    {
      libelle: "Massage Prénatal spécialisé",
      description: "Massage adapté aux femmes enceintes pour soulager les tensions, améliorer la circulation et favoriser la détente pendant la grossesse.",
      price: 80,
      duration: 60,
      categoryName: 'Masseur',
      images: [
        "https://images.unsplash.com/photo-1527613426441-4da17471b66d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508009603885-50cf7c579365?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "prénatal", "grossesse", "détente"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur'],
      features: [
        "Positionnement adapté et confortable",
        "Huiles spécifiques pour femmes enceintes",
        "Travail en douceur des zones tendues",
        "Conseils pour le confort quotidien"
      ]
    }
  ];

  console.log('💆‍♂️ Création des services thérapeutes/masseurs...');
  let servicesCreated = 0;

  for (const serviceData of servicesData) {
    // Vérifier si le service existe déjà
    const existingService = await prisma.service.findFirst({
      where: {
        libelle: serviceData.libelle,
        createdById: testUser.id
      }
    });

    if (!existingService) {
      // Chercher la catégorie correspondante
      let category = await prisma.category.findFirst({
        where: { 
          name: {
            equals: serviceData.categoryName,
            mode: 'insensitive'
          }
        }
      });

      // Si la catégorie n'existe pas, utiliser la catégorie correspondant au métier
      if (!category) {
        category = categoriesMap.get(serviceData.categoryName);
      }

      // Créer le service
      const service = await prisma.service.create({
        data: {
          libelle: serviceData.libelle,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          categoryId: category.id,
          images: serviceData.images,
          type: serviceData.type,
          tags: serviceData.tags,
          isCustom: serviceData.isCustom,
          isActive: serviceData.isActive,
          createdById: testUser.id
        }
      });

      console.log(`✅ Service créé: ${service.libelle} (${service.price}€ - ${service.duration}min)`);
      servicesCreated++;

      // Associer le service aux métiers
      for (const metierName of serviceData.metiers) {
        const metier = createdMetiers.find(m => m.libelle === metierName);
        if (metier) {
          try {
            await prisma.metierService.create({
              data: {
                metierId: metier.id,
                serviceId: service.id
              }
            });
            console.log(`   → Associé au métier: ${metierName}`);
          } catch (error) {
            if (!error.message.includes('Unique constraint')) {
              console.error(`❌ Erreur association métier: ${error.message}`);
            }
          }
        }
      }

      // Créer la relation UtilisateurService
      try {
        await prisma.utilisateurService.create({
          data: {
            userId: testUser.id,
            serviceId: service.id,
            customPrice: serviceData.price,
            customDuration: serviceData.duration,
            isAvailable: true,
            description: serviceData.description
          }
        });
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`❌ Erreur relation utilisateur: ${error.message}`);
        }
      }

    } else {
      console.log(`⚠️ Service déjà existant: ${serviceData.libelle}`);
    }
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DU SEEDING:');
  console.log(`✅ ${servicesCreated} services créés`);
  
  // Statistiques par catégorie
  const stats = await prisma.service.groupBy({
    by: ['categoryId'],
    where: {
      type: 'bien_etre',
      createdById: testUser.id
    },
    _count: true
  });

  console.log('\n📈 RÉPARTITION PAR CATÉGORIE:');
  for (const stat of stats) {
    const category = await prisma.category.findUnique({
      where: { id: stat.categoryId }
    });
    console.log(`   ${category?.name || 'Inconnu'}: ${stat._count} service(s)`);
  }

  console.log('\n🎉 Seeding des thérapeutes/masseurs terminé avec succès !');
  console.log('🔗 Test API: http://localhost:3001/api/therapeutes-bienetre');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding thérapeutes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });