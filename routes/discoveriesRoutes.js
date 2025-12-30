// src/routes/discoveries.routes.js
const express = require('express');
const router = express.Router();
const discoveriesController = require('../controllers/discoveriesController');
const { discoveryValidationRules, toggleFeaturedRules } = require('../middleware/validationRules');
const validationMiddleware = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Routes GET (publiques)
router.get('/', discoveriesController.getAllDiscoveries);
router.get('/stats', discoveriesController.getDiscoveryStats);
router.get('/search/tags', discoveriesController.searchByTags);
router.get('/nearby', discoveriesController.getNearbyDiscoveries);
router.get('/export', discoveriesController.exportDiscoveries);
router.get('/:id', discoveriesController.getDiscoveryById);

// Routes POST avec authentification et validation
router.post('/',
  authenticateToken,
  discoveryValidationRules,  // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  discoveriesController.createDiscovery
);

// Routes POST pour recherche
router.post('/search',
  authenticateToken,
  discoveriesController.searchDiscoveries
);

// Routes PUT avec authentification et validation
router.put('/:id',
  authenticateToken,
  discoveryValidationRules,  // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  discoveriesController.updateDiscovery
);

// Routes DELETE avec authentification
router.delete('/:id',
  authenticateToken,
  discoveriesController.deleteDiscovery
);

// Routes PATCH pour featured avec validation
router.patch('/:id/featured',
  authenticateToken,
  toggleFeaturedRules,       // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  discoveriesController.toggleFeatured
);

// Routes PATCH pour status
router.patch('/:id/status',
  authenticateToken,
  discoveriesController.updateDiscoveryStatus
);

// Routes PATCH pour rating (publique)
router.patch('/:id/rating',
  discoveriesController.updateDiscoveryRating
);

module.exports = router;