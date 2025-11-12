// scripts/debug-controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugController() {
  console.log('🐛 DEBUG AVANCÉ DU CONTROLLER');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Connexion Prisma
    await prisma.$connect();
    console.log('✅ Prisma connecté');

    // Test 2: Requête directe comme dans le controller
    console.log('\n🔍 Test requête podcasts...');
    const podcasts = await prisma.podcast.findMany({ 
      where: { isActive: true },
      take: 2 
    });
    console.log(`✅ Podcasts trouvés: ${podcasts.length}`);

    // Test 3: Requête vidéos
    console.log('\n🔍 Test requête vidéos...');
    const videos = await prisma.video.findMany({ 
      where: { isActive: true },
      take: 2 
    });
    console.log(`✅ Vidéos trouvées: ${videos.length}`);

    // Test 4: Vérifier la structure des données
    if (podcasts.length > 0) {
      console.log('\n📊 Structure podcast:');
      console.log('ID:', podcasts[0].id);
      console.log('Titre:', podcasts[0].title);
      console.log('Audio URL:', podcasts[0].audioUrl ? '✅' : '❌');
    }

    console.log('\n🎉 Tous les tests Prisma passent!');

  } catch (error) {
    console.log('❌ Erreur debug:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugController();