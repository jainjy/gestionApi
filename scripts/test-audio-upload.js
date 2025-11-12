require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAudioUpload() {
  console.log('🎵 Test upload audio sur bucket podcasts...');
  
  try {
    // Créer un petit fichier audio simulé (fichier texte avec en-tête audio)
    const audioHeader = 'RIFFxxxxWAVEfmt ';
    const testFileName = `test-audio-${Date.now()}.mp3`;
    
    console.log(`📁 Fichier: ${testFileName}`);
    console.log(`📦 Bucket: podcasts`);
    console.log(`📄 Type MIME: audio/mpeg`);
    
    const { data, error } = await supabase.storage
      .from('podcasts')
      .upload(testFileName, audioHeader, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      });

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      
      if (error.message.includes('mime type')) {
        console.log('\n🔧 SOLUTION REQUISE:');
        console.log('Demander à votre collègue de configurer les types MIME audio:');
        console.log('1. Supabase Dashboard → Storage → podcasts');
        console.log('2. Settings → Allowed MIME Types');
        console.log('3. Ajouter: audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac');
        console.log('4. Sauvegarder');
      }
    } else {
      console.log(`✅ Upload réussi!`);
      
      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('podcasts')
        .getPublicUrl(testFileName);
      
      console.log(`🔗 URL publique: ${urlData.publicUrl}`);
      
      // Nettoyer
      const { error: deleteError } = await supabase.storage
        .from('podcasts')
        .remove([testFileName]);
        
      if (!deleteError) {
        console.log('🧹 Fichier nettoyé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

// Test aussi les autres nouveaux buckets
async function testAllNewBuckets() {
  console.log('\n🎯 TEST COMPLET DES NOUVEAUX BUCKETS');
  console.log('='.repeat(50));
  
  const buckets = [
    { name: 'podcasts', type: 'audio/mpeg', testContent: 'audio test' },
    { name: 'videos', type: 'video/mp4', testContent: 'video test' },
    { name: 'thumbnails', type: 'image/jpeg', testContent: 'image test' }
  ];

  for (const bucket of buckets) {
    console.log(`\n📦 Test: ${bucket.name}`);
    
    const testFileName = `test-${bucket.name}-${Date.now()}.txt`;
    
    const { data, error } = await supabase.storage
      .from(bucket.name)
      .upload(testFileName, bucket.testContent, {
        contentType: bucket.type
      });

    if (error) {
      console.log(`❌ ${bucket.name}: ${error.message}`);
    } else {
      console.log(`✅ ${bucket.name}: Upload réussi!`);
      
      // Obtenir l'URL
      const { data: urlData } = supabase.storage
        .from(bucket.name)
        .getPublicUrl(testFileName);
      
      console.log(`🔗 URL: ${urlData.publicUrl}`);
      
      // Nettoyer
      await supabase.storage.from(bucket.name).remove([testFileName]);
    }
  }
}

// Exécuter
testAudioUpload().then(() => {
  console.log('\n' + '='.repeat(60));
  testAllNewBuckets();
});