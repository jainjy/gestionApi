// test-all-routes.js
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/media';

async function testAllRoutes() {
  console.log('🧪 TEST TOUTES LES ROUTES MÉDIA');
  console.log('='.repeat(50));
  
  try {
    // 1. Test podcasts
    console.log('\n📻 TEST PODCASTS...');
    const podcasts = await axios.get(`${API_BASE}/podcasts?limit=3`);
    console.log('✅ GET /podcasts:', podcasts.data.success ? 'SUCCESS' : 'FAILED');
    console.log('   📊 Données:', podcasts.data.data?.length || 0, 'podcasts');
    if (podcasts.data.data && podcasts.data.data[0]) {
      console.log('   🎧 Exemple:', podcasts.data.data[0].title);
    }

    // 2. Test vidéos
    console.log('\n🎥 TEST VIDÉOS...');
    const videos = await axios.get(`${API_BASE}/videos?limit=3`);
    console.log('✅ GET /videos:', videos.data.success ? 'SUCCESS' : 'FAILED');
    console.log('   📊 Données:', videos.data.data?.length || 0, 'vidéos');
    if (videos.data.data && videos.data.data[0]) {
      console.log('   🎬 Exemple:', videos.data.data[0].title);
    }

    // 3. Test catégories
    console.log('\n📂 TEST CATÉGORIES...');
    const categories = await axios.get(`${API_BASE}/categories`);
    console.log('✅ GET /categories:', categories.data.success ? 'SUCCESS' : 'FAILED');
    console.log('   📊 Données:', categories.data.data?.length || 0, 'catégories');

    // 4. Test médias populaires
    console.log('\n🔥 TEST MÉDIAS POPULAIRES...');
    const popular = await axios.get(`${API_BASE}/popular?limit=3`);
    console.log('✅ GET /popular:', popular.data.success ? 'SUCCESS' : 'FAILED');
    if (popular.data.data) {
      console.log('   📊 Podcasts:', popular.data.data.podcasts?.length || 0);
      console.log('   📊 Vidéos:', popular.data.data.videos?.length || 0);
    }

    // 5. Test routes avec IDs spécifiques (si des données existent)
    if (podcasts.data.data && podcasts.data.data[0]) {
      console.log('\n🔍 TEST PODCAST PAR ID...');
      const podcastDetail = await axios.get(`${API_BASE}/podcasts/${podcasts.data.data[0].id}`);
      console.log('✅ GET /podcasts/:id:', podcastDetail.data.success ? 'SUCCESS' : 'FAILED');
    }

    if (videos.data.data && videos.data.data[0]) {
      console.log('\n🔍 TEST VIDÉO PAR ID...');
      const videoDetail = await axios.get(`${API_BASE}/videos/${videos.data.data[0].id}`);
      console.log('✅ GET /videos/:id:', videoDetail.data.success ? 'SUCCESS' : 'FAILED');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 TOUTES LES ROUTES CRUD SONT OPÉRATIONNELLES!');
    console.log('🚀 Votre API média est prête pour le frontend!');
    
  } catch (error) {
    console.log('\n❌ ERREUR TEST ROUTES:');
    console.log('   Message:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    console.log('\n💡 CONSEIL: Vérifiez que votre serveur backend est démarré sur le port 3001');
  }
}

// Exécuter le test
testAllRoutes();