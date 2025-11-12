const express = require('express');
const multer = require('multer');
const MediaController = require('../controllers/mediaController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorizeRoles');

const router = express.Router();

// Configuration Multer pour la mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  }
});

// ==================== ROUTES PUBLIQUES ====================

// Récupérer tous les podcasts
router.get('/podcasts', MediaController.getAllPodcasts);

// Récupérer tous les vidéos
router.get('/videos', MediaController.getAllVideos);

// Récupérer un podcast par ID
router.get('/podcasts/:id', MediaController.getPodcastById);

// Récupérer une vidéo par ID
router.get('/videos/:id', MediaController.getVideoById);

// Récupérer les catégories
router.get('/categories', MediaController.getCategories);

// Récupérer les médias populaires
router.get('/popular', MediaController.getPopularMedia);

// Incrémenter les écoutes d'un podcast
router.patch('/podcasts/:id/listen', MediaController.incrementPodcastListens);

// Incrémenter les vues d'une vidéo
router.patch('/videos/:id/view', MediaController.incrementVideoViews);

// ==================== ROUTES AUTHENTIFIÉES ====================

// Ajouter un média aux favoris
router.post('/favorites', authenticateToken, MediaController.addToFavorites);

// Retirer un média des favoris
router.delete('/favorites', authenticateToken, MediaController.removeFromFavorites);

// Récupérer les favoris de l'utilisateur
router.get('/favorites', authenticateToken, MediaController.getUserFavorites);

// Mettre à jour les statistiques de bien-être
router.post('/wellbeing-stats', authenticateToken, MediaController.updateWellBeingStats);

// Récupérer les statistiques de bien-être
router.get('/wellbeing-stats', authenticateToken, MediaController.getWellBeingStats);

// ==================== ROUTES PROFESSIONNELS ====================

// Créer un podcast (PROFESSIONNELS seulement)
router.post(
  '/pro/podcasts',
  authenticateToken,
  authorizeRoles(['professional']),
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  MediaController.createPodcast
);

// Créer une vidéo (PROFESSIONNELS seulement)
router.post(
  '/pro/videos',
  authenticateToken,
  authorizeRoles(['professional']),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  MediaController.createVideo
);

// Créer une catégorie (PROFESSIONNELS seulement)
router.post(
  '/pro/categories',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.createCategory
);

// Mettre à jour un podcast (PROFESSIONNELS seulement)
router.put(
  '/pro/podcasts/:id',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.updatePodcast
);

// Mettre à jour une vidéo (PROFESSIONNELS seulement)
router.put(
  '/pro/videos/:id',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.updateVideo
);

// Supprimer un podcast (PROFESSIONNELS seulement)
router.delete(
  '/pro/podcasts/:id',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.deletePodcast
);

// Supprimer une vidéo (PROFESSIONNELS seulement)
router.delete(
  '/pro/videos/:id',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.deleteVideo
);

// Récupérer les médias d'un professionnel
router.get(
  '/pro/my-media',
  authenticateToken,
  authorizeRoles(['professional']),
  MediaController.getMyMedia
);

module.exports = router;