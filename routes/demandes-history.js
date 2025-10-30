const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getHistoryForDemande, getHistoryForUser, addHistoryEntry } = require('../controllers/demandeHistoryController');

// Routes pour l'historique
router.get('/immobilier/:demandeId/history', authenticateToken, getHistoryForDemande);
router.get('/immobilier/user/:userId/history', authenticateToken, getHistoryForUser);
router.post('/immobilier/:demandeId/history', authenticateToken, addHistoryEntry);

module.exports = router;