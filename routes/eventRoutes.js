const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventController');
const { eventValidationRules, toggleFeaturedRules } = require('../middleware/validationRules');
const validationMiddleware = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Routes GET (publiques ou semi-publiques)
router.get('/', eventsController.getAllEvents);
// eventRoutes.js - MODIFIEZ CETTE LIGNE
router.get('/stats', authenticateToken, eventsController.getEventStats);
router.get('/export', eventsController.exportEvents);
router.get('/:id', eventsController.getEventById);

// Routes POST/PUT avec authentification et validation
router.post('/',
  authenticateToken,
  eventValidationRules,      // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  eventsController.createEvent // Contrôleur
);

router.post('/search',
  authenticateToken,
  eventsController.searchEvents
);

router.put('/:id',
  authenticateToken,
  eventValidationRules,      // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  eventsController.updateEvent
);

// Routes DELETE/PATCH avec authentification
router.delete('/:id',
  authenticateToken,
  eventsController.deleteEvent
);

router.patch('/:id/featured',
  authenticateToken,
  toggleFeaturedRules,       // Règles de validation
  validationMiddleware,      // Middleware qui vérifie les erreurs
  eventsController.toggleFeatured
);

router.patch('/:id/status',
  authenticateToken,
  eventsController.updateEventStatus
);

router.patch('/:id/participants',
  eventsController.incrementParticipants
);

module.exports = router;