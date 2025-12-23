// prisma/seeders/seedMedecinesNaturelles.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID utilisateur spécifique
const TARGET_USER_ID = 'b14f8e76-667b-4c13-9eb5-d24a0f012071';

async function main() {
  console.log('🌱 Début du seeding des médecines naturelles...');

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
  console.log('📝 Création/recupération des métiers pour médecines naturelles...');
  
  const medecineMetiers = ["Thérapeute", "Formateur"];
  const createdMetiers = [];
  
  for (const metierLibelle of medecineMetiers) {
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

  // Créer les catégories pour médecines naturelles
  console.log('🏷️ Création/recupération des catégories...');
  
  const categoriesToCreate = [
    { name: 'Consultation' },
    { name: 'Atelier' },
    { name: 'Programme' },
    { name: 'Thérapie' },
    { name: 'Phytothérapie' },
    { name: 'Naturopathie' },
    { name: 'Aromathérapie' }
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

  // Données des services de médecines naturelles
  const servicesData = [
    // Consultations
    {
      libelle: "Consultation Phytothérapie Complète",
      description: "Bilan personnalisé et conseils en plantes médicinales pour traiter vos troubles de santé naturellement. Évaluation complète et prescription de plantes adaptées.",
      price: 75,
      duration: 60,
      categoryName: 'Consultation',
      images: [
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["phytothérapie", "plantes", "consultation", "naturel", "santé"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Bilan de santé complet",
        "Prescription de plantes adaptées",
        "Préparation de tisanes personnalisées",
        "Suivi mensuel inclus"
      ]
    },
    {
      libelle: "Bilan Naturopathique Intégral",
      description: "Évaluation complète de votre vitalité avec analyse des habitudes de vie, nutrition, gestion du stress et conseils pour retrouver équilibre et santé.",
      price: 90,
      duration: 90,
      categoryName: 'Consultation',
      images: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["naturopathie", "bilan", "santé globale", "prévention"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Analyse complète de vos habitudes",
        "Plan d'action personnalisé",
        "Conseils nutritionnels",
        "Techniques de gestion du stress"
      ]
    },
    // Ateliers
    {
      libelle: "Atelier Plantes Médicinales & Tisanes",
      description: "Apprenez à reconnaître et utiliser les plantes médicinales locales pour votre santé au quotidien. Initiation à la préparation de tisanes thérapeutiques.",
      price: 60,
      duration: 120,
      categoryName: 'Atelier',
      images: [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["atelier", "plantes", "tisanes", "pratique", "éducatif"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Formateur'],
      features: [
        "Reconnaissance des plantes médicinales",
        "Techniques de préparation",
        "Démonstrations pratiques",
        "Support pédagogique fourni"
      ]
    },
    {
      libelle: "Atelier Aromathérapie Familiale",
      description: "Découverte des huiles essentielles pour soigner les petits maux du quotidien en toute sécurité. Apprentissage des bases de l'aromathérapie.",
      price: 55,
      duration: 90,
      categoryName: 'Atelier',
      images: [
        "https://images.unsplash.com/photo-1566251055657-ebb7c7f3875e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1570196919745-0e6801f3109c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["atelier", "aromathérapie", "huiles essentielles", "famille", "pratique"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Formateur'],
      features: [
        "Découverte des huiles essentielles",
        "Recettes maison pour toute la famille",
        "Guide d'utilisation sécuritaire",
        "Échantillons offerts"
      ]
    },
    // Programmes
    {
      libelle: "Programme Dépuration Naturelle 21 jours",
      description: "Cure complète pour détoxifier l'organisme avec des plantes spécifiques et une alimentation adaptée. Accompagnement quotidien pendant 3 semaines.",
      price: 150,
      duration: null,
      categoryName: 'Programme',
      images: [
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["programme", "détox", "21 jours", "cure", "naturel"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Plan détaillé jour par jour",
        "Tisanes dépuratives préparées",
        "Conseils alimentaires personnalisés",
        "Support quotidien par email"
      ]
    },
    {
      libelle: "Programme Gestion Naturelle du Stress",
      description: "Accompagnement sur 1 mois pour apprendre à gérer le stress et l'anxiété grâce aux plantes et techniques naturelles. Approche holistique.",
      price: 120,
      duration: null,
      categoryName: 'Programme',
      images: [
        "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["programme", "stress", "anxiété", "1 mois", "plantes"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Évaluation du niveau de stress",
        "Plan d'action personnalisé",
        "Exercices de relaxation",
        "Support hebdomadaire"
      ]
    },
    // Thérapies
    {
      libelle: "Thérapie par les Fleurs de Bach",
      description: "Accompagnement personnalisé avec les élixirs floraux pour équilibrer les émotions et retrouver harmonie intérieure. Approche douce et naturelle.",
      price: 65,
      duration: 45,
      categoryName: 'Thérapie',
      images: [
        "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["thérapie", "fleurs de bach", "émotions", "naturel", "douce"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Évaluation émotionnelle",
        "Sélection des élixirs appropriés",
        "Explications détaillées",
        "Suivi des progrès"
      ]
    },
    {
      libelle: "Accompagnement Nutrition Naturelle",
      description: "Rééquilibrage alimentaire personnalisé basé sur les principes de la nutrition naturelle. Approche adaptée à votre constitution.",
      price: 80,
      duration: 60,
      categoryName: 'Thérapie',
      images: [
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["nutrition", "naturelle", "rééquilibrage", "personnalisé", "santé"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'],
      features: [
        "Analyse de vos habitudes alimentaires",
        "Plan nutritionnel adapté",
        "Recettes simples et saines",
        "Suivi des améliorations"
      ]
    }
  ];

  console.log('🌿 Création des services médecines naturelles...');
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

      // Si la catégorie n'existe pas, utiliser une catégorie par défaut
      if (!category) {
        category = categoriesMap.get('Consultation');
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

      console.log(`✅ Service créé: ${service.libelle} (${service.price}€ - ${service.duration || 'variable'}min)`);
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
      createdById: testUser.id,
      OR: [
        { libelle: { contains: 'phyto', mode: 'insensitive' } },
        { libelle: { contains: 'naturo', mode: 'insensitive' } },
        { libelle: { contains: 'aromathérapie', mode: 'insensitive' } },
        { libelle: { contains: 'plantes', mode: 'insensitive' } },
        { libelle: { contains: 'naturelle', mode: 'insensitive' } }
      ]
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

  console.log('\n🎉 Seeding des médecines naturelles terminé avec succès !');
  console.log('🔗 Test API: http://localhost:3001/api/medecines-bienetre');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding médecines:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });