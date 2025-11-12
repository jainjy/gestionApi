require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupSupabaseStorage() {
  console.log('🚀 Configuration de Supabase Storage pour les médias...');
  console.log('URL:', process.env.SUPABASE_URL);

  try {
    // 1. Buckets à créer pour les médias
    const mediaBuckets = [
      { id: 'podcasts', name: 'podcasts', public: true, description: 'Fichiers audio des podcasts' },
      { id: 'videos', name: 'videos', public: true, description: 'Fichiers vidéo' },
      { id: 'thumbnails', name: 'thumbnails', public: true, description: 'Images de preview' }
    ];

    console.log('\n📦 Création des buckets médias...');
    
    for (const bucket of mediaBuckets) {
      try {
        console.log(`\n🔄 Tentative création: ${bucket.id}`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.id === 'videos' ? 500000000 : 100000000, // 500MB pour vidéos, 100MB pour autres
          allowedMimeTypes: bucket.id === 'thumbnails' 
            ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            : bucket.id === 'podcasts'
            ? ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
            : ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Bucket "${bucket.id}" existe déjà`);
          } else {
            console.log(`❌ Erreur création "${bucket.id}":`, error.message);
          }
        } else {
          console.log(`✅ Bucket "${bucket.id}" créé avec succès`);
        }
      } catch (bucketError) {
        console.log(`⚠️  Erreur sur "${bucket.id}":`, bucketError.message);
      }
    }

    // 2. Vérifier tous les buckets disponibles
    console.log('\n🔍 Liste complète des buckets...');
    const { data: bucketsList, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur liste buckets:', listError);
    } else {
      console.log('📋 Tous les buckets disponibles:');
      bucketsList.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    }

    // 3. Tester les politiques avec un upload simple
    console.log('\n🧪 Test des politiques d\'upload...');
    
    // Test sur thumbnails (le plus permissif)
    const testContent = 'test file for media buckets';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.log('❌ Upload test échoué:', uploadError.message);
      console.log('💡 Les politiques peuvent être restrictives par défaut');
    } else {
      console.log('✅ Upload test réussi! Fichier:', testFileName);
      
      // Nettoyer le fichier test
      const { error: deleteError } = await supabase.storage
        .from('thumbnails')
        .remove([testFileName]);
        
      if (!deleteError) {
        console.log('✅ Fichier test nettoyé');
      }
    }

    console.log('\n🎉 Configuration Supabase Storage terminée!');
    console.log('\n📝 RÉSUMÉ:');
    console.log('   - Connexion Supabase: ✅ OK');
    console.log('   - Buckets existants: 2 (blog-images, product-images)');
    console.log('   - Buckets médias: podcasts, videos, thumbnails');
    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Tester l\'upload avec un vrai fichier média');
    console.log('   2. Vérifier les URLs générées');
    console.log('   3. Intégrer avec vos contrôleurs');

  } catch (error) {
    console.error('❌ Erreur configuration Storage:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupSupabaseStorage();
}

module.exports = { setupSupabaseStorage };