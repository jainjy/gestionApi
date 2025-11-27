const express = require('express');
const router = express.Router();
const financementController = require('../controllers/financementController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Routes publiques
router.get('/partenaires', financementController.getPartenaires);
router.get('/partenaires/:id', financementController.getPartenairesDetails);
router.get('/assurances', financementController.getAssurances);
router.post('/demande', financementController.submitDemande);

// Routes protégées (utilisateur)
router.get('/demandes/:userId', authenticateToken, financementController.getUserDemandes);

// ============================================================================
// ROUTES ADMIN
// ============================================================================

// Récupérer toutes les demandes (admin)
router.get('/admin/demandes', authenticateToken, requireRole('admin'), financementController.getAllDemandes);

// Mettre à jour le statut d'une demande (admin)
router.put('/admin/demandes/:id/status', authenticateToken, requireRole('admin'), financementController.updateDemandeStatus);

// Supprimer une demande (admin)
router.delete('/admin/demandes/:id', authenticateToken, requireRole('admin'), financementController.deleteDemande);

module.exports = router;