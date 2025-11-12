require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestCategories() {
  console.log('📝 Création des catégories de test...');

  const categories = [
    { name: 'Développement Personnel', type: 'podcast', color: 'blue' },
    { name: 'Santé & Bien-être', type: 'podcast', color: 'green' },
    { name: 'Tutoriels', type: 'video', color: 'red' },
    { name: 'Séances Guidées', type: 'video', color: 'purple' }
  ];

  for (const catData of categories) {
    try {
      const category = await prisma.mediaCategory.upsert({
        where: { name: catData.name },
        update: {},
        create: catData
      });
      console.log(`✅ ${category.name} (${category.type})`);
    } catch (error) {
      console.log(`❌ ${catData.name}: ${error.message}`);
    }
  }

  await prisma.$disconnect();
}

createTestCategories();