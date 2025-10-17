// server/routes/metiersRoutes.js
const express = require('express');
const router = express.Router();
const metiersController = require('../controllers/metiersController');

// Routes pour les métiers
router.get('/', metiersController.getAllMetiers);
router.get('/stats', metiersController.getMetiersStats);
router.get('/:id', metiersController.getMetierById);
router.post('/', metiersController.createMetier);
router.put('/:id', metiersController.updateMetier);
router.delete('/:id', metiersController.deleteMetier);

module.exports = router;