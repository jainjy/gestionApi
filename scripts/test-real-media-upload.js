require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api/media';

async function testRealUpload() {
  console.log('🎯 TEST UPLOAD FICHIERS RÉELS');
  console.log('='.repeat(50));

  // 1. Préparer les données de test
  const testUser = {
    token: 'real-jwt-token-b14f8e76-667b-4c13-9eb5-d24a0f012071', // Remplacer par un vrai token professional
    userId: 'b14f8e76-667b-4c13-9eb5-d24a0f012071' // Remplacer par un vrai ID
  };

  // 2. Test upload podcast
  console.log('\n🎙️  TEST UPLOAD PODCAST');
  await testPodcastUpload(testUser);

  // 3. Test upload vidéo
  console.log('\n🎥 TEST UPLOAD VIDÉO');
  await testVideoUpload(testUser);

  console.log('\n✅ TESTS TERMINÉS');
}

async function testPodcastUpload(user) {
  try {
    const formData = new FormData();
    
    // Données du podcast
    formData.append('title', 'Podcast Test Supabase');
    formData.append('description', 'Description du podcast test avec Supabase');
    formData.append('duration', '15:30');
    formData.append('categoryId', '1'); // ID d'une catégorie existante

    // Fichier audio (créer un petit fichier test)
    const audioContent = 'fake audio content for testing';
    const audioPath = './test-audio.mp3';
    fs.writeFileSync(audioPath, audioContent);
    
    formData.append('audio', fs.createReadStream(audioPath));

    const response = await axios.post(`${API_BASE}/podcasts/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Podcast uploadé avec succès!');
    console.log('📊 Données:', {
      id: response.data.data.id,
      title: response.data.data.title,
      audioUrl: response.data.data.audioUrl,
      fileSize: response.data.data.fileSize
    });

    // Nettoyer
    fs.unlinkSync(audioPath);

  } catch (error) {
    console.log('❌ Erreur upload podcast:', error.response?.data || error.message);
  }
}

async function testVideoUpload(user) {
  try {
    const formData = new FormData();
    
    // Données de la vidéo
    formData.append('title', 'Vidéo Test Supabase');
    formData.append('description', 'Description de la vidéo test avec Supabase');
    formData.append('duration', '05:45');
    formData.append('categoryId', '2'); // ID d'une catégorie existante

    // Fichier vidéo (créer un petit fichier test)
    const videoContent = 'fake video content for testing';
    const videoPath = './test-video.mp4';
    fs.writeFileSync(videoPath, videoContent);
    
    formData.append('video', fs.createReadStream(videoPath));

    const response = await axios.post(`${API_BASE}/videos/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Vidéo uploadée avec succès!');
    console.log('📊 Données:', {
      id: response.data.data.id,
      title: response.data.data.title,
      videoUrl: response.data.data.videoUrl,
      thumbnailUrl: response.data.data.thumbnailUrl
    });

    // Nettoyer
    fs.unlinkSync(videoPath);

  } catch (error) {
    console.log('❌ Erreur upload vidéo:', error.response?.data || error.message);
  }
}

// Exécuter
testRealUpload();