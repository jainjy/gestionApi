// prisma/seeders/seedNutritionBienetre.js - VERSION COMPATIBLE
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID utilisateur spécifique
const TARGET_USER_ID = 'b14f8e76-667b-4c13-9eb5-d24a0f012071';

async function main() {
  console.log('🌱 Début du seeding des services nutrition compatibles...');

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

  // Créer ou récupérer les métiers EXACTEMENT comme dans votre formulaire
  console.log('📝 Création/recupération des métiers cibles...');
  
  const metiersCibles = ["Thérapeute", "Masseur", "Formateur", "Podcasteur"]; // ✅ Même que votre formulaire
  const createdMetiers = [];
  
  for (const metierLibelle of metiersCibles) {
    // Vérifier si le métier existe déjà
    let metier = await prisma.metier.findFirst({
      where: { libelle: metierLibelle }
    });
    
    if (!metier) {
      metier = await prisma.metier.create({
        data: {
          libelle: metierLibelle,
        },
      });
      console.log(`✅ Métier créé: ${metierLibelle}`);
    } else {
      console.log(`✓ Métier existant: ${metierLibelle}`);
    }
    createdMetiers.push(metier);
  }
  
  console.log(`✅ ${createdMetiers.length} métiers cibles prêts`);

  // Vérifier/Créer la catégorie "Nutrition" (pas "Bien-être" car votre formulaire montre "Nutrition")
  let nutritionCategory = await prisma.category.findFirst({
    where: { name: 'Nutrition' }
  });

  if (!nutritionCategory) {
    nutritionCategory = await prisma.category.create({
      data: { name: 'Nutrition' }
    });
    console.log('✅ Catégorie "Nutrition" créée');
  } else {
    console.log(`✓ Catégorie existante: ${nutritionCategory.name}`);
  }

  // Vérifier/Créer la catégorie "Bien-être" aussi, pour la compatibilité
  let bienEtreCategory = await prisma.category.findFirst({
    where: { name: 'Bien-être' }
  });

  if (!bienEtreCategory) {
    bienEtreCategory = await prisma.category.create({
      data: { name: 'Bien-être' }
    });
    console.log('✅ Catégorie "Bien-être" créée');
  } else {
    console.log(`✓ Catégorie existante: ${bienEtreCategory.name}`);
  }

  // Données des services nutrition - VERSION COMPATIBLE AVEC LE FORMULAIRE
  const nutritionServices = [
    {
      libelle: "Consultation Nutrition Initiale Complète",
      description: "Bilan approfondi de vos habitudes alimentaires, analyse de composition corporelle, évaluation des besoins nutritionnels et définition d'un plan alimentaire personnalisé. Inclut une analyse détaillée de votre mode de vie et de vos objectifs santé.",
      price: 95,
      duration: 90,
      categoryId: nutritionCategory.id, // ✅ Catégorie "Nutrition"
      images: [
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre", // ✅ Important pour l'API nutrition-bienetre
      tags: ["consultation", "bilan complet", "plan personnalisé", "nutrition", "santé"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute', 'Formateur'] // ✅ Utilise les métiers du formulaire
    },
    {
      libelle: "Suivi Nutritionnel Mensuel Personnalisé",
      description: "Séance de suivi régulier pour ajuster votre programme nutritionnel, répondre à vos questions, analyser vos progrès et maintenir votre motivation. Inclut des conseils pratiques et des ajustements en fonction de vos résultats.",
      price: 65,
      duration: 45,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["suivi", "accompagnement", "motivation", "ajustement", "progrès"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute', 'Formateur']
    },
    {
      libelle: "Programme Perte de Poids Intelligent (12 semaines)",
      description: "Accompagnement intensif sur 12 semaines avec plan alimentaire évolutif, recettes saines, exercices adaptés et suivi hebdomadaire. Programme complet incluant éducation nutritionnelle, gestion des émotions alimentaires et stratégies pour des résultats durables.",
      price: 420,
      duration: null,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514995669114-6081e934b693?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["programme", "perte de poids", "accompagnement intensif", "12 semaines", "durable"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Thérapeute', 'Formateur', 'Podcasteur']
    },
    {
      libelle: "Massage Nutrition Détente",
      description: "Combinaison unique de techniques de massage relaxant avec conseils nutritionnels pour une approche holistique du bien-être. Détente musculaire et équilibre alimentaire pour une santé optimale.",
      price: 85,
      duration: 60,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["massage", "détente", "nutrition", "holistique", "bien-être"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Masseur', 'Thérapeute'] // ✅ Utilise "Masseur"
    },
    {
      libelle: "Atelier Cuisine Santé & Nutrition",
      description: "Atelier pratique de cuisine saine avec un formateur nutritionniste. Apprenez à préparer des repas équilibrés, découvrez les super-aliments et maîtrisez les techniques de cuisson préservant les nutriments.",
      price: 75,
      duration: 120,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["atelier", "cuisine", "santé", "pratique", "éducation"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Formateur', 'Podcasteur'] // ✅ Utilise "Formateur" et "Podcasteur"
    },
    {
      libelle: "Podcast Nutrition & Bien-être",
      description: "Série de podcasts éducatifs sur la nutrition, le bien-être et la santé. Abonnements mensuels avec accès à du contenu exclusif, interviews d'experts et conseils pratiques.",
      price: 25,
      duration: null,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["podcast", "éducation", "audio", "abonnement", "conseils"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Podcasteur', 'Formateur'] // ✅ Utilise "Podcasteur"
    }
  ];

  console.log('📦 Création des services nutrition compatibles...');
  let servicesCreated = 0;
  let servicesUpdated = 0;

  for (const serviceData of nutritionServices) {
    // Vérifier si le service existe déjà
    const existingService = await prisma.service.findFirst({
      where: {
        libelle: serviceData.libelle,
        createdById: serviceData.createdById
      }
    });

    if (!existingService) {
      // Créer le service
      const service = await prisma.service.create({
        data: {
          libelle: serviceData.libelle,
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          categoryId: serviceData.categoryId,
          images: serviceData.images,
          type: serviceData.type,
          tags: serviceData.tags,
          isCustom: serviceData.isCustom,
          isActive: serviceData.isActive,
          createdById: serviceData.createdById
        }
      });

      console.log(`✅ Service créé: ${service.libelle} (${service.price}€)`);
      servicesCreated++;

      // Associer le service aux métiers spécifiés (uniquement ceux qui existent)
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
            console.log(`  🔗 Associé à: ${metier.libelle}`);
          } catch (error) {
            if (!error.message.includes('Unique constraint')) {
              console.error(`❌ Erreur association métier: ${error.message}`);
            }
          }
        } else {
          console.log(`⚠️ Métier "${metierName}" non trouvé pour l'association`);
        }
      }

      // Créer aussi la relation UtilisateurService (comme le fait votre formulaire)
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
        console.log(`  👤 Relation utilisateur-service créée`);
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.error(`❌ Erreur relation utilisateur: ${error.message}`);
        }
      }

    } else {
      console.log(`🔄 Mise à jour du service existant: ${existingService.libelle}`);
      servicesUpdated++;
      
      // Mettre à jour le service
      await prisma.service.update({
        where: { id: existingService.id },
        data: {
          description: serviceData.description,
          price: serviceData.price,
          duration: serviceData.duration,
          images: serviceData.images,
          tags: serviceData.tags,
          isActive: true,
          type: "bien_etre" // ✅ S'assurer que le type est bien_etre
        }
      });

      // Mettre à jour les associations de métiers
      for (const metierName of serviceData.metiers) {
        const metier = createdMetiers.find(m => m.libelle === metierName);
        if (metier) {
          const existingAssociation = await prisma.metierService.findFirst({
            where: {
              metierId: metier.id,
              serviceId: existingService.id
            }
          });
          
          if (!existingAssociation) {
            try {
              await prisma.metierService.create({
                data: {
                  metierId: metier.id,
                  serviceId: existingService.id
                }
              });
              console.log(`  🔗 Association ajoutée: ${metier.libelle}`);
            } catch (error) {
              if (!error.message.includes('Unique constraint')) {
                console.error(`❌ Erreur création association: ${error.message}`);
              }
            }
          }
        }
      }
    }
  }

  // Afficher le résumé
  console.log('\n📊 RÉSUMÉ DU SEEDING COMPATIBLE:');
  console.log(`✅ ${servicesCreated} services créés`);
  console.log(`🔄 ${servicesUpdated} services mis à jour`);
  console.log(`🎯 ${createdMetiers.length} métiers disponibles: ${metiersCibles.join(', ')}`);
  console.log(`👤 Services associés à: ${testUser.email}`);
  
  // Vérifier le total des services créés
  const totalServices = await prisma.service.count({
    where: {
      type: 'bien_etre',
      isActive: true,
      createdById: testUser.id
    }
  });
  
  console.log(`📈 Total services nutrition/bien-être: ${totalServices}`);

  // Vérification des associations
  console.log('\n🔍 VÉRIFICATION DES ASSOCIATIONS:');
  const allServices = await prisma.service.findMany({
    where: {
      type: 'bien_etre',
      createdById: testUser.id
    },
    include: {
      metiers: {
        include: {
          metier: true
        }
      },
      category: true
    }
  });

  for (const service of allServices) {
    console.log(`\n📋 ${service.libelle}:`);
    console.log(`   Catégorie: ${service.category?.name || 'Aucune'}`);
    console.log(`   Type: ${service.type}`);
    console.log(`   Métiers: ${service.metiers.map(m => m.metier.libelle).join(', ') || 'Aucun'}`);
  }

  console.log('\n✅ Seeding terminé avec succès !');
  console.log('🔍 Pour tester votre formulaire:');
  console.log('   1. Allez dans HarmonieApp');
  console.log('   2. Les services créés devraient apparaître dans ServicesCard');
  console.log('   3. Vous pouvez les éditer avec le modal (mode "edit")');
  console.log('🔗 API test: http://localhost:3001/api/nutrition-bienetre?limit=20');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });