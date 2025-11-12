require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkBuckets() {
  console.log('🔍 Vérification des buckets Supabase...');
  console.log('Projet:', process.env.SUPABASE_URL);
  
  try {
    // 1. Lister tous les buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erreur liste buckets:', error.message);
      return;
    }

    console.log('\n📦 BUCKETS EXISTANTS:');
    console.log('='.repeat(50));
    
    const mediaBuckets = ['podcasts', 'videos', 'thumbnails'];
    let foundCount = 0;

    buckets.forEach(bucket => {
      const isMediaBucket = mediaBuckets.includes(bucket.name);
      const status = isMediaBucket ? '✅ MÉDIA' : '📁 AUTRE';
      
      console.log(`${status} ${bucket.name}`);
      console.log(`   → Public: ${bucket.public}`);
      console.log(`   → Créé: ${new Date(bucket.created_at).toLocaleString()}`);
      console.log(`   → ID: ${bucket.id}`);
      console.log('');
      
      if (isMediaBucket) foundCount++;
    });

    // 2. Vérifier spécifiquement les buckets médias
    console.log('🎯 BUCKETS MÉDIAS RECHERCHÉS:');
    console.log('='.repeat(50));
    
    mediaBuckets.forEach(bucketName => {
      const exists = buckets.some(b => b.name === bucketName);
      console.log(`${exists ? '✅' : '❌'} ${bucketName}: ${exists ? 'PRÉSENT' : 'MANQUANT'}`);
    });

    // 3. Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log('='.repeat(50));
    console.log(`Buckets totaux: ${buckets.length}`);
    console.log(`Buckets médias trouvés: ${foundCount}/3`);
    
    if (foundCount === 3) {
      console.log('🎉 TOUS LES BUCKETS MÉDIAS SONT PRÉSENTS!');
      console.log('🚀 Prêt pour l\'étape suivante!');
    } else {
      console.log('⚠️  Buckets manquants, vérifiez avec votre collègue');
    }

    // 4. Test rapide d'upload si tous présents
    if (foundCount === 3) {
      console.log('\n🧪 Test rapide d\'upload...');
      await testUpload();
    }

  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

async function testUpload() {
  try {
    // Test sur thumbnails (le plus simple)
    const testContent = 'test file';
    const testFileName = `verify-${Date.now()}.txt`;
    
    console.log(`\n📤 Test upload sur: thumbnails`);
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(testFileName, testContent);

    if (error) {
      console.log(`❌ Upload échoué: ${error.message}`);
      console.log('💡 Les politiques peuvent nécessiter une configuration');
    } else {
      console.log('✅ Upload réussi!');
      
      // Nettoyer
      await supabase.storage.from('thumbnails').remove([testFileName]);
      console.log('🧹 Fichier test nettoyé');
    }
  } catch (error) {
    console.log('❌ Erreur test upload:', error.message);
  }
}

// Exécuter
checkBuckets();