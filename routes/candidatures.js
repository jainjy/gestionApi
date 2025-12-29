const express = require('express');
const router = express.Router();
const candidaturesController = require('../controllers/candidaturesController');
const { authenticate } = require('../middleware/auth');

// Routes protégées par authentification
router.post('/', authenticate, candidaturesController.createCandidature);
router.get('/', authenticate, candidaturesController.getUserCandidatures);

module.exports = router;