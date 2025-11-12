// scripts/test-diagnostic.js
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/media';

async function testDiagnostic() {
  console.log('🔍 DIAGNOSTIC COMPLET DES ROUTES MÉDIA');
  console.log('='.repeat(50));
  
  try {
    // 1. Test de base - Le serveur répond-il ?
    console.log('\n🌐 TEST CONNEXION SERVEUR...');
    try {
      await axios.get('http://localhost:3001');
      console.log('✅ Serveur backend actif sur port 3001');
    } catch (error) {
      console.log('❌ Serveur non accessible:', error.message);
      return;
    }

    // 2. Test route santé de l'API media
    console.log('\n🏥 TEST SANTÉ API MÉDIA...');
    try {
      const health = await axios.get(`${API_BASE}/health`);
      console.log('✅ API Media santé:', health.data);
    } catch (error) {
      console.log('⚠️  Pas de route /health, testons les routes principales...');
    }

    // 3. Test détaillé des routes avec plus d'infos d'erreur
    console.log('\n📊 TEST DÉTAILLÉ DES ROUTES...');
    
    const routes = [
      { name: 'Podcasts', url: '/podcasts?limit=1' },
      { name: 'Vidéos', url: '/videos?limit=1' },
      { name: 'Catégories', url: '/categories' }
    ];

    for (const route of routes) {
      console.log(`\n🔍 Testing ${route.name}...`);
      try {
        const response = await axios.get(`${API_BASE}${route.url}`);
        console.log(`✅ ${route.name}: SUCCESS`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        if (response.data.data) {
          console.log(`   Data count: ${Array.isArray(response.data.data) ? response.data.data.length : 'Object'}`);
        }
        if (response.data.error) {
          console.log(`   Error: ${response.data.error}`);
        }
      } catch (error) {
        console.log(`❌ ${route.name}: FAILED`);
        console.log(`   Status: ${error.response?.status || 'No response'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
        
        // Log détaillé pour debug
        if (error.response?.data) {
          console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
        }
        
        // Vérifier si c'est une erreur Prisma/DB
        if (error.response?.data?.message?.includes('prisma') || 
            error.response?.data?.error?.includes('prisma')) {
          console.log('💡 PROBLÈME: Erreur base de données Prisma détectée');
        }
      }
    }

  } catch (error) {
    console.log('\n💥 ERREUR CRITIQUE:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Exécuter le diagnostic
testDiagnostic();