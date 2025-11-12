require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

console.log('🧪 Test de connexion Supabase...');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✅ PRÉSENTE' : '❌ MANQUANTE');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables Supabase manquantes dans .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    console.log('\n🔗 Test de connexion...');
    
    // Test simple - lister les buckets existants
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase réussie!');
    console.log(`📦 Buckets existants: ${buckets.length}`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (public: ${bucket.public})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return false;
  }
}

testConnection();
