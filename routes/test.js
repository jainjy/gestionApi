// test-api.js
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Test des endpoints API...');
    
    // Test tourisme
    const tourismResponse = await fetch('http://localhost:3001/api/tourisme');
    console.log('Tourisme - Status:', tourismResponse.status);
    const tourismText = await tourismResponse.text();
    console.log('Tourisme - Response:', tourismText.substring(0, 200));
    
    // Test destinations
    const destResponse = await fetch('http://localhost:3001/api/tourisme/destinations');
    console.log('Destinations - Status:', destResponse.status);
    const destText = await destResponse.text();
    console.log('Destinations - Response:', destText.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Erreur test API:', error);
  }
}

testAPI();