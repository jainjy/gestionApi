// prisma/seeders/seedSoinsBienetre.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID utilisateur spécifique
const TARGET_USER_ID = 'b14f8e76-667b-4c13-9eb5-d24a0f012071';

async function main() {
  console.log('🌱 Début du seeding des soins bien-être...');

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

  // Créer ou récupérer les métiers compatibles avec le formulaire
  console.log('📝 Création/recupération des métiers compatibles formulaire...');
  
  // Métiers filtrés dans votre formulaire : ["Thérapeute", "Masseur", "Formateur", "Podcasteur"]
  const metiersFormulaire = ["Thérapeute", "Masseur", "Formateur", "Podcasteur"];
  const createdMetiers = [];
  
  for (const metierLibelle of metiersFormulaire) {
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
  
  console.log(`✅ ${createdMetiers.length} métiers compatibles prêts`);

  // Vérifier/Créer la catégorie "soin" (avec nom exact "soin" comme dans votre demande)
  console.log('🏷️ Création/recupération de la catégorie "soin"...');
  
  let soinCategory = await prisma.category.findFirst({
    where: { 
      name: {
        equals: 'soin',
        mode: 'insensitive' // Recherche insensible à la casse
      }
    }
  });
  
  if (!soinCategory) {
    soinCategory = await prisma.category.create({
      data: { 
        name: 'soin' // Nom exact "soin" en minuscule pour correspondre à votre besoin
      }
    });
    console.log('✅ Catégorie "soin" créée');
  } else {
    console.log('✓ Catégorie "soin" existante');
  }

  // Créer également d'autres catégories pour variété
  const autresCategories = [
    { name: 'Massage' },
    { name: 'Relaxation' },
    { name: 'Thérapie' }
  ];
  
  for (const catData of autresCategories) {
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
  }

  // Données des soins bien-être modifiées pour être compatibles avec le formulaire
  const soinsServices = [
    {
      libelle: "Soin Visage Complet",
      description: "Soin complet du visage avec produits naturels pour nettoyer, hydrater et revitaliser la peau. Inclut massage facial et conseils personnalisés.",
      price: 120,
      duration: 90,
      categoryName: 'soin', // Utilisation du nom exact
      images: [
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1545235617-9465d2a55698?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["visage", "soin", "peau", "naturel", "esthétique"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      // Métiers compatibles avec ceux du formulaire
      metiers: ['Thérapeute'], // Changé de 'Esthéticienne' à 'Thérapeute'
      features: [
        "Diagnostic peau personnalisé",
        "Produits bio et naturels",
        "Conseils après-soin"
      ]
    },
    {
      libelle: "Massage Thérapeutique",
      description: "Massage profond pour soulager les tensions musculaires et améliorer la mobilité. Techniques adaptées à vos besoins spécifiques.",
      price: 95,
      duration: 75,
      categoryName: 'soin',
      images: [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "thérapeutique", "détente", "muscles", "santé"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur', 'Thérapeute'], // Compatible avec formulaire
      features: [
        "Évaluation pré-massage",
        "Techniques adaptées",
        "Conseils postural"
      ]
    },
    {
      libelle: "Séance de Relaxation Guidée",
      description: "Séance de relaxation et méditation guidée pour réduire le stress et améliorer le bien-être mental. Techniques de respiration et visualisation.",
      price: 70,
      duration: 60,
      categoryName: 'soin',
      images: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["relaxation", "méditation", "stress", "bien-être", "mental"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'], // Compatible avec formulaire
      features: [
        "Guidance professionnelle",
        "Environnement calme",
        "Techniques adaptables"
      ]
    },
    {
      libelle: "Thérapie Énergétique",
      description: "Séance de rééquilibrage énergétique pour harmoniser le corps et l'esprit. Techniques douces pour libérer les blocages énergétiques.",
      price: 85,
      duration: 60,
      categoryName: 'soin',
      images: [
        "https://images.unsplash.com/photo-1591343395082-e120aa9b6c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["énergie", "équilibre", "thérapie", "bien-être", "harmonie"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute'], // Compatible avec formulaire
      features: [
        "Diagnostic énergétique",
        "Techniques ancestrales",
        "Bilan personnalisé"
      ]
    },
    {
      libelle: "Massage Décontractant",
      description: "Massage doux pour détendre les muscles et apaiser l'esprit. Parfait pour une pause bien-être et une évasion quotidienne.",
      price: 65,
      duration: 50,
      categoryName: 'soin',
      images: [
        "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "détente", "relaxation", "bien-être", "décontractant"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur', 'Thérapeute'], // Compatible avec formulaire
      features: [
        "Huiles essentielles bio",
        "Ambiance relaxante",
        "Musique douce"
      ]
    },
    {
      libelle: "Soin du Dos et Nuque",
      description: "Soin spécifique pour les tensions dorsales et cervicales. Combinaison de massage et d'étirements doux pour un soulagement durable.",
      price: 80,
      duration: 60,
      categoryName: 'soin',
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["dos", "nuque", "tension", "soulagement", "posture"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur', 'Thérapeute'], // Compatible avec formulaire
      features: [
        "Focus zones spécifiques",
        "Conseils posturaux",
        "Exercices de prévention"
      ]
    }
  ];

  console.log('💆‍♀️ Création des services de soins compatibles...');
  let servicesCreated = 0;

  for (const serviceData of soinsServices) {
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

      // Si la catégorie n'existe pas, utiliser la catégorie "soin" par défaut
      if (!category) {
        category = soinCategory;
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

      console.log(`✅ Soin créé: ${service.libelle} (${service.price}€ - ${service.duration}min)`);
      servicesCreated++;

      // Associer le service aux métiers (uniquement ceux compatibles avec le formulaire)
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
        } else {
          console.log(`   ⚠️ Métier "${metierName}" non trouvé dans la liste des métiers compatibles`);
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

  // Vérification finale
  console.log('\n🔍 VÉRIFICATION DE COMPATIBILITÉ AVEC LE FORMULAIRE:');
  console.log('📋 Métiers disponibles dans le formulaire:');
  for (const metier of createdMetiers) {
    console.log(`   - ${metier.libelle}`);
  }

  console.log('\n📊 RÉSUMÉ DU SEEDING:');
  console.log(`✅ ${servicesCreated} services de soins créés`);
  console.log(`👤 Tous les services associés à: ${testUser.email}`);
  console.log(`🏷️ Catégorie principale: "soin"`);
  console.log(`🔗 Services compatibles avec les métiers du formulaire`);
  
  // Statistiques par métier
  console.log('\n📈 RÉPARTITION PAR MÉTIER:');
  const metierStats = {};
  
  const allServices = await prisma.service.findMany({
    where: {
      createdById: testUser.id
    },
    include: {
      metiers: {
        include: {
          metier: true
        }
      }
    }
  });

  for (const service of allServices) {
    for (const metierService of service.metiers) {
      const metierName = metierService.metier.libelle;
      metierStats[metierName] = (metierStats[metierName] || 0) + 1;
    }
  }

  // Afficher seulement les métiers compatibles avec le formulaire
  for (const metierName of metiersFormulaire) {
    const count = metierStats[metierName] || 0;
    console.log(`   ${metierName}: ${count} service(s)`);
  }

  console.log('\n🎉 Seeding des soins compatibles terminé avec succès !');
  console.log('✅ PRÊT POUR LE FORMULAIRE:');
  console.log('   1. Tous les services sont dans la catégorie "soin"');
  console.log('   2. Métiers compatibles: Thérapeute, Masseur, Formateur, Podcasteur');
  console.log('   3. Utilisez l\'API /harmonie pour récupérer ces services');
  console.log('🔗 Test API: http://localhost:3001/api/harmonie');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding soins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });