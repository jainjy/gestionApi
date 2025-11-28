const express = require("express");
const router = express.Router();
const financementController = require("../controllers/financementController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Routes publiques
router.get("/partenaires", financementController.getPartenaires);
router.get("/partenaires/:id", financementController.getPartenairesDetails);
router.get("/assurances", financementController.getAssurances);
router.post("/demande", financementController.submitDemande);
router.get("/services", financementController.getServicesFinanciers);
router.get("/services/:id", financementController.getServiceFinancierById);

// Routes protégées (utilisateur)
router.get(
  "/demandes/:userId",
  authenticateToken,
  financementController.getUserDemandes
);

// ============================================================================
// ROUTES ADMIN
// ============================================================================

// Récupérer toutes les demandes (admin)
router.get(
  "/admin/demandes",
  authenticateToken,
  requireRole(["admin","professional"]),
  financementController.getAllDemandes
);

// Mettre à jour le statut d'une demande (admin)
router.put(
  "/admin/demandes/:id/status",
  authenticateToken,
  requireRole(["admin"]),
  financementController.updateDemandeStatus
);

// Supprimer une demande (admin)
router.delete(
  "/admin/demandes/:id",
  authenticateToken,
  requireRole(["admin"]),
  financementController.deleteDemande
);

router.get(
  "/admin/services",
  authenticateToken,
  requireRole(["admin"]),
  financementController.getAllServicesFinanciers
);
router.put(
  "/admin/services/:id/status",
  authenticateToken,
  requireRole(["admin"]),
  financementController.toggleServiceStatus
);

// ============================================================================
// ROUTES PRO
// ============================================================================
router.get(
  "/pro/partenaires",
  authenticateToken,
  requireRole(["professional"]),
  financementController.getPartenairesPro
);
router.get(
  "/pro/services",
  authenticateToken,
  requireRole(["professional"]),
  financementController.getServicesFinanciersPro
);
router.post(
  "/services",
  authenticateToken,
  requireRole(["professional", "admin"]),
  financementController.createServiceFinancier
);
router.put(
  "/services/:id",
  authenticateToken,
  requireRole(["professional", "admin"]),
  financementController.updateServiceFinancier
);
router.delete(
  "/services/:id",
  authenticateToken,
  requireRole(["professional", "admin"]),
  financementController.deleteServiceFinancier
);

module.exports = router;
