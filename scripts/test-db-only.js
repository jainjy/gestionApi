// scripts/test-db-only.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 TEST BASE DE DONNÉES SEULEMENT');
  
  try {
    // Test connexion
    await prisma.$connect();
    console.log('✅ Connexion DB réussie');

    // Test table podcasts
    const podcastCount = await prisma.podcast.count();
    console.log(`📊 Podcasts en DB: ${podcastCount}`);

    // Test table videos
    const videoCount = await prisma.video.count();
    console.log(`📊 Vidéos en DB: ${videoCount}`);

    // Test table categories
    const categoryCount = await prisma.category.count();
    console.log(`📊 Catégories en DB: ${categoryCount}`);

    // Afficher quelques données
    if (podcastCount > 0) {
      const podcasts = await prisma.podcast.findMany({ take: 2 });
      console.log('🎧 Exemples podcasts:', podcasts.map(p => ({ id: p.id, title: p.title })));
    }

    if (videoCount > 0) {
      const videos = await prisma.video.findMany({ take: 2 });
      console.log('🎬 Exemples vidéos:', videos.map(v => ({ id: v.id, title: v.title })));
    }

  } catch (error) {
    console.log('❌ ERREUR DB:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();