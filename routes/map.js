const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// Middleware de logging
router.use((req, res, next) => {
  console.log(`🗺️  Route carte appelée: ${req.method} ${req.originalUrl}`);
  next();
});

// Routes pour la carte
router.get('/users', mapController.getUsersWithCoordinates);
router.get('/properties', mapController.getPropertiesWithCoordinates);
router.get('/all', mapController.getAllMapPoints);

// Route de santé
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Service carte opérationnel',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;