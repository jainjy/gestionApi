require('dotenv').config();
const SupabaseService = require('../services/supabaseService');

async function testFinalIntegration() {
  console.log('🎯 TEST FINAL INTÉGRATION COMPLÈTE');
  console.log('='.repeat(50));
  
  await SupabaseService.testFinalIntegration();
}

testFinalIntegration();