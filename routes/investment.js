const express = require('express');
const { investmentController } = require('../controllers/investmentController.js');

const router = express.Router();

// Routes publiques
router.post('/demande', investmentController.createDemande);

// Routes admin (TEMPORAIREMENT SANS AUTH pour les tests)
router.get('/admin/demandes', investmentController.getAllDemandes);
router.get('/admin/demandes/:id', investmentController.getDemandeById);
router.patch('/admin/demandes/:id/status', investmentController.updateStatus);
router.get('/admin/statistiques', investmentController.getStats);
router.delete('/admin/demandes/:id', investmentController.deleteDemande);
router.get('/admin/search', investmentController.searchDemandes);

// Routes utilisateur (à protéger plus tard)
router.get('/mes-demandes', investmentController.getMyDemandes);

module.exports = router;