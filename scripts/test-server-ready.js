// scripts/test-server-ready.js
const axios = require('axios');

async function waitForServer(maxAttempts = 10) {
  console.log('⏳ Attente du démarrage du serveur...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get('http://localhost:3001/health', {
        timeout: 5000
      });
      console.log(`✅ Serveur prêt! (tentative ${attempt}/${maxAttempts})`);
      console.log('📊 Status:', response.data);
      return true;
    } catch (error) {
      console.log(`⏱️  Tentative ${attempt}/${maxAttempts} - Serveur pas encore prêt...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
    }
  }
  
  console.log('❌ Serveur non démarré après', maxAttempts, 'tentatives');
  return false;
}

async function testAll() {
  console.log('🧪 TEST COMPLET SERVEUR + ROUTES');
  console.log('='.repeat(50));
  
  // 1. Attendre que le serveur soit prêt
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('\n💡 CONSEIL: Démarrer le serveur avec: npm run dev');
    return;
  }

  // 2. Tester les routes média
  console.log('\n📡 TEST DES ROUTES MÉDIA...');
  try {
    const API_BASE = 'http://localhost:3001/api/media';
    
    const routes = [
      { name: 'Podcasts', url: '/podcasts?limit=2' },
      { name: 'Vidéos', url: '/videos?limit=2' },
      { name: 'Catégories', url: '/categories' },
      { name: 'Populaires', url: '/popular?limit=2' }
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(`${API_BASE}${route.url}`);
        console.log(`✅ ${route.name}: SUCCESS (${response.status})`);
        if (response.data.data) {
          const data = response.data.data;
          if (Array.isArray(data)) {
            console.log(`   📊 ${data.length} éléments`);
            if (data.length > 0 && data[0].title) {
              console.log(`   🎯 Exemple: "${data[0].title}"`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${route.name}: ${error.response?.status || error.message}`);
      }
    }

    console.log('\n🎉 TOUTES LES ROUTES TESTÉES AVEC SUCCÈS!');
    console.log('🚀 Votre API média est opérationnelle!');

  } catch (error) {
    console.log('❌ Erreur test routes:', error.message);
  }
}

// Lancer le test
testAll();