// server/routes/userMetiersRoutes.js
const express = require('express');
const router = express.Router();
const userMetiersController = require('../controllers/userMetiersController');

// Routes pour l'interface utilisateur
router.get('/', userMetiersController.getAllUserMetiers);
router.get('/search', userMetiersController.searchUserMetiers);
router.get('/:id', userMetiersController.getUserMetierById);

module.exports = router;