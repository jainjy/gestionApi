// prisma/seeders/seedNutritionBienetre.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ID utilisateur spécifique que vous avez mentionné
const TARGET_USER_ID = 'b14f8e76-667b-4c13-9eb5-d24a0f012071';

async function main() {
  console.log('🌱 Début du seeding des services nutrition...');

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

  // Créer ou récupérer les métiers spécifiques à la nutrition
  console.log('📝 Création/recupération des métiers de nutrition...');
  
  const nutritionMetiers = ['Nutritionniste', 'Diététicien', 'Coach Nutrition', 'Naturopathe', 'Médecin Nutritionniste'];
  const createdMetiers = [];
  
  for (const metierLibelle of nutritionMetiers) {
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
  
  console.log(`✅ ${createdMetiers.length} métiers de nutrition prêts`);

  // Vérifier/Créer la catégorie "Bien-être"
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

  // Vérifier/Créer la catégorie "Nutrition"
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

  // Filtrer les métiers pour n'associer que ceux pertinents
  const metiersToAssociate = createdMetiers;

  // Données des services nutrition - Version enrichie
  const nutritionServices = [
    {
      libelle: "Consultation Nutrition Initiale Complète",
      description: "Bilan approfondi de vos habitudes alimentaires, analyse de composition corporelle, évaluation des besoins nutritionnels et définition d'un plan alimentaire personnalisé. Inclut une analyse détaillée de votre mode de vie et de vos objectifs santé.",
      price: 95,
      duration: 90,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["consultation", "bilan complet", "plan personnalisé", "nutrition", "santé"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Nutritionniste', 'Diététicien', 'Médecin Nutritionniste']
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
      metiers: ['Nutritionniste', 'Diététicien', 'Coach Nutrition']
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
      metiers: ['Nutritionniste', 'Coach Nutrition', 'Diététicien']
    },
    {
      libelle: "Coaching Nutrition Sportive",
      description: "Programme nutritionnel spécialisé pour sportifs et athlètes. Optimisation des performances, planification des repas pré/post entraînement, gestion de l'hydratation et supplémentation adaptée. Pour amateurs et professionnels.",
      price: 120,
      duration: 60,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["sport", "performance", "athlète", "supplémentation", "énergie"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Nutritionniste', 'Coach Nutrition']
    },
    {
      libelle: "Atelier Nutrition Familiale",
      description: "Atelier pratique pour apprendre à composer des repas équilibrés pour toute la famille. Conseils pour les enfants, astuces pour cuisiner sainement, lecture des étiquettes alimentaires et éducation nutritionnelle ludique.",
      price: 75,
      duration: 120,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["atelier", "famille", "éducation", "pratique", "enfants"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Diététicien', 'Nutritionniste']
    },
    {
      libelle: "Consultation Nutrition Végétarienne/Végétalienne",
      description: "Accompagnement spécialisé pour les régimes végétariens et végétaliens. Équilibrage des apports en protéines végétales, gestion des carences potentielles (B12, fer, calcium), planification de repas complets et variés.",
      price: 85,
      duration: 75,
      categoryId: nutritionCategory.id,
      images: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      type: "bien_etre",
      tags: ["végétarien", "végétalien", "protéines végétales", "spécialisé", "équilibre"],
      isCustom: false,
      isActive: true,
      createdById: testUser.id,
      metiers: ['Nutritionniste', 'Diététicien', 'Naturopathe']
    }
  ];

  console.log('📦 Création des services nutrition...');
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

      // Associer le service aux métiers spécifiés
      const specifiedMetiers = createdMetiers.filter(m => 
        serviceData.metiers.includes(m.libelle)
      );

      for (const metier of specifiedMetiers) {
        try {
          await prisma.metierService.create({
            data: {
              metierId: metier.id,
              serviceId: service.id
            }
          });
        } catch (error) {
          // Ignorer les erreurs de contrainte d'unicité
          if (!error.message.includes('Unique constraint')) {
            console.error(`❌ Erreur association métier: ${error.message}`);
          }
        }
      }

      // Créer aussi la relation UtilisateurService
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
          isActive: true
        }
      });

      // Mettre à jour les associations de métiers
      const specifiedMetiers = createdMetiers.filter(m => 
        serviceData.metiers.includes(m.libelle)
      );

      for (const metier of specifiedMetiers) {
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
          } catch (error) {
            if (!error.message.includes('Unique constraint')) {
              console.error(`❌ Erreur création association: ${error.message}`);
            }
          }
        }
      }
    }
  }

  // Afficher le résumé
  console.log('\n📊 RÉSUMÉ DU SEEDING:');
  console.log(`✅ ${servicesCreated} services créés`);
  console.log(`🔄 ${servicesUpdated} services mis à jour`);
  console.log(`🎯 ${createdMetiers.length} métiers de nutrition disponibles`);
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

  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('🔍 Pour tester: http://localhost:3001/api/nutrition-bienetre?limit=20');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });