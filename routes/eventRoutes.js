const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventController');
const { eventValidationRules, toggleFeaturedRules } = require('../middleware/validationRules');
const validationMiddleware = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// ==================== ROUTES PUBLIQUES ====================

// Récupérer tous les événements
router.get('/', eventsController.getAllEvents);

// ==================== ROUTES PROTÉGÉES ====================

// Récupérer les statistiques - DOIT ÊTRE AVANT /:id
router.get('/stats',
  authenticateToken,
  eventsController.getEventStats
);

// Exporter les événements - DOIT ÊTRE AVANT /:id
router.get('/export',
  authenticateToken,
  eventsController.exportEvents
);

// Récupérer les événements de l'utilisateur connecté
router.get('/user/my-events',
  authenticateToken,
  eventsController.getMyEvents
);

// Statistiques d'un utilisateur spécifique
router.get('/user/:userId/stats',
  authenticateToken,
  eventsController.getUserEventStats
);

// ==================== ROUTES PUBLIQUES (suite) ====================

// Récupérer un événement par ID - DOIT ÊTRE EN DERNIER
router.get('/:id', eventsController.getEventById);

// ==================== ROUTES CRÉATION/RECHERCHE ====================

// Créer un événement
router.post('/',
  authenticateToken,
  eventValidationRules,
  validationMiddleware,
  eventsController.createEvent
);

// Recherche avancée
router.post('/search',
  authenticateToken,
  eventsController.searchEvents
);

// ==================== ROUTES AVEC VÉRIFICATION DE PROPRIÉTÉ ====================

// Mettre à jour un événement
router.put('/:id',
  authenticateToken,
  eventsController.checkEventOwnership,
  eventValidationRules,
  validationMiddleware,
  eventsController.updateEvent
);

// Supprimer un événement
router.delete('/:id',
  authenticateToken,
  eventsController.checkEventOwnership,
  eventsController.deleteEvent
);

// Mettre en avant un événement
router.patch('/:id/featured',
  authenticateToken,
  eventsController.checkEventOwnership,
  toggleFeaturedRules,
  validationMiddleware,
  eventsController.toggleFeatured
);

// Mettre à jour le statut
router.patch('/:id/status',
  authenticateToken,
  eventsController.checkEventOwnership,
  eventsController.updateEventStatus
);

// Augmenter les participants
router.patch('/:id/participants',
  authenticateToken,
  eventsController.checkEventOwnership,
  eventsController.incrementParticipants
);

module.exports = router;