const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMediaCategories() {
  console.log('🎯 Création des catégories de médias...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connexion DB réussie');

    // Catégories par défaut
    const defaultCategories = [
      // Catégories pour podcasts
      { name: 'Développement personnel', type: 'podcast', description: 'Podcasts sur le développement personnel', color: 'blue' },
      { name: 'Méditation', type: 'podcast', description: 'Séances de méditation guidée', color: 'green' },
      { name: 'Nutrition', type: 'podcast', description: 'Conseils en nutrition', color: 'orange' },
      { name: 'Sommeil', type: 'podcast', description: 'Techniques pour améliorer le sommeil', color: 'indigo' },
      { name: 'Bien-être mental', type: 'podcast', description: 'Conseils pour la santé mentale', color: 'purple' },
      { name: 'Relations', type: 'podcast', description: 'Podcasts sur les relations humaines', color: 'pink' },
      
      // Catégories pour vidéos
      { name: 'Fitness', type: 'video', description: 'Vidéos d exercices physiques', color: 'red' },
      { name: 'Yoga', type: 'video', description: 'Séances de yoga', color: 'teal' },
      { name: 'Cardio', type: 'video', description: 'Exercices cardiovasculaires', color: 'yellow' },
      { name: 'Musculation', type: 'video', description: 'Exercices de musculation', color: 'orange' },
      { name: 'Étirements', type: 'video', description: 'Séances d étirement', color: 'green' },
      { name: 'Danse', type: 'video', description: 'Cours de danse fitness', color: 'pink' }
    ];

    let createdCount = 0;

    for (const categoryData of defaultCategories) {
      // Vérifier si la catégorie existe déjà
      const existingCategory = await prisma.mediaCategory.findFirst({
        where: {
          name: categoryData.name,
          type: categoryData.type
        }
      });

      if (!existingCategory) {
        await prisma.mediaCategory.create({
          data: categoryData
        });
        console.log(`✅ Créée: ${categoryData.name} (${categoryData.type})`);
        createdCount++;
      } else {
        console.log(`ℹ️  Existe déjà: ${categoryData.name} (${categoryData.type})`);
      }
    }

    console.log(`\n🎉 ${createdCount} nouvelles catégories créées !`);
    
    // Afficher toutes les catégories
    const allCategories = await prisma.mediaCategory.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });
    
    console.log('\n📋 Toutes les catégories disponibles :');
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type}) - ${cat.color}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction
createMediaCategories();