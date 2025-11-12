const express = require('express');
const router = express.Router();
const { uploadAudio, uploadVideo, cleanupTempFiles } = require('../middleware/uploadMedia');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Import des contrôleurs refondus
const {
  // Routes publiques
  getAllPodcasts,
  getAllVideos,
  getPodcastById,
  getVideoById,
  getCategories,
  getPopularMedia,
  incrementPodcastListens,
  incrementVideoViews,
  
  // Routes protégées - Professionnels
  createPodcast,
  createVideo,
  createCategory,
  deletePodcast,
  deleteVideo,
  updatePodcast,
  updateVideo,
  getMyMedia,
  
  // Routes utilisateur
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  updateWellBeingStats,
  getWellBeingStats
} = require('../controllers/mediaController');

// ======================
// ROUTES PUBLIQUES
// ======================

// Récupérer tous les podcasts
router.get('/podcasts', getAllPodcasts);

// Récupérer tous les vidéos
router.get('/videos', getAllVideos);

// Récupérer un podcast spécifique
router.get('/podcasts/:id', getPodcastById);

// Récupérer une vidéo spécifique
router.get('/videos/:id', getVideoById);

// Récupérer les catégories
router.get('/categories', getCategories);

// Récupérer les médias populaires
router.get('/popular', getPopularMedia);

// Incrémenter les écoutes d'un podcast
router.post('/podcasts/:id/listen', incrementPodcastListens);

// Incrémenter les vues d'une vidéo
router.post('/videos/:id/view', incrementVideoViews);

// ======================
// ROUTES PROFESSIONNELS
// ======================

// Créer un podcast (upload vers Supabase)
router.post('/podcasts/upload', 
  authenticateToken, 
  requireRole(['professional', 'admin']),
  uploadAudio,
  cleanupTempFiles,
  createPodcast
);

// Créer une vidéo (upload vers Supabase)
router.post('/videos/upload', 
  authenticateToken, 
  requireRole(['professional', 'admin']),
  uploadVideo,
  cleanupTempFiles,
  createVideo
);

// Créer une catégorie
router.post('/categories',
  authenticateToken,
  requireRole(['professional', 'admin']),
  createCategory
);

// Récupérer les médias du professionnel connecté
router.get('/my-media',
  authenticateToken,
  requireRole(['professional', 'admin']),
  getMyMedia
);

// Mettre à jour un podcast
router.put('/podcasts/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  updatePodcast
);

// Mettre à jour une vidéo
router.put('/videos/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  updateVideo
);

// Supprimer un podcast
router.delete('/podcasts/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  deletePodcast
);

// Supprimer une vidéo
router.delete('/videos/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  deleteVideo
);

// ======================
// ROUTES UTILISATEUR (FAVORIS & STATISTIQUES)
// ======================

// Ajouter un média aux favoris
router.post('/favorites',
  authenticateToken,
  addToFavorites
);

// Retirer un média des favoris
router.delete('/favorites',
  authenticateToken,
  removeFromFavorites
);

// Récupérer les favoris de l'utilisateur
router.get('/favorites',
  authenticateToken,
  getUserFavorites
);

// Mettre à jour les statistiques de bien-être
router.post('/wellbeing-stats',
  authenticateToken,
  updateWellBeingStats
);

// Récupérer les statistiques de bien-être
router.get('/wellbeing-stats',
  authenticateToken,
  getWellBeingStats
);

// ======================
// ROUTES DE SANTÉ ET DEBUG
// ======================

// Route de santé de l'API média
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Média opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;