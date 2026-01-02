// src/routes/discoveries.routes.js
const express = require('express');
const router = express.Router();
const discoveriesController = require('../controllers/discoveriesController');
const { authenticateToken } = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// Importer vos règles de validation existantes
const { 
  discoveryValidationRules, 
  toggleFeaturedRules 
} = require('../middleware/validationRules');

// Routes GET (publiques)
router.get('/', discoveriesController.getAllDiscoveries);
router.get('/search/tags', discoveriesController.searchByTags);
router.get('/nearby', discoveriesController.getNearbyDiscoveries);
router.get('/:id', discoveriesController.getDiscoveryById);

// Routes GET avec authentification
router.get('/my/discoveries', 
  authenticateToken, 
  discoveriesController.getMyDiscoveries
);

router.get('/user/:userId/stats', 
  authenticateToken, 
  discoveriesController.getUserDiscoveryStats
);

router.get('/stats/global',
  authenticateToken,
  discoveriesController.getDiscoveryStats
);

router.get('/export/csv',
  authenticateToken,
  discoveriesController.exportDiscoveries
);

// Routes POST avec authentification et validation
router.post('/',
  authenticateToken,
  discoveryValidationRules,  // Vos règles existantes
  validationMiddleware,      // Middleware de validation
  discoveriesController.createDiscovery
);

router.post('/search',
  authenticateToken,
  discoveriesController.searchDiscoveries
);

// Routes PUT avec authentification et validation
router.put('/:id',
  authenticateToken,
  discoveryValidationRules,  // Vos règles existantes
  validationMiddleware,      // Middleware de validation
  discoveriesController.updateDiscovery
);

// Routes DELETE avec authentification
router.delete('/:id',
  authenticateToken,
  discoveriesController.deleteDiscovery
);

// Routes PATCH avec authentification et validation
router.patch('/:id/featured',
  authenticateToken,
  toggleFeaturedRules,       // Vos règles existantes
  validationMiddleware,      // Middleware de validation
  discoveriesController.toggleFeatured
);

// Routes PATCH avec authentification (sans validation spécifique)
router.patch('/:id/status',
  authenticateToken,
  discoveriesController.updateDiscoveryStatus
);

// Routes PATCH pour rating (avec ou sans auth selon vos besoins)
router.patch('/:id/rating',
  authenticateToken,  // À commenter si vous voulez que ce soit public
  discoveriesController.updateDiscoveryRating
);

module.exports = router;