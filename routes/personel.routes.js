const express = require("express");
const { 
  setPersonel, 
  getAllPersonel, 
  updatePersonel, 
  deletePersonel, 
  getOnePersonel,
  getPersonelByUser,
  loginPersonel,
  createSupportForUser // Nouvelle importation
} = require("../models/personel.models");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Route publique pour le login
router.post("/login", loginPersonel);

// Route pour créer automatiquement un support pour un utilisateur
router.post("/auto-create-support/:userId", authenticateToken, createSupportForUser);

// Routes protégées pour la gestion du personnel
router.get("/", authenticateToken, getAllPersonel);
router.post("/", authenticateToken, setPersonel);
router.put("/:id", authenticateToken, updatePersonel);
router.delete("/:id", authenticateToken, deletePersonel);
router.get("/:id", authenticateToken, getOnePersonel);

// Route pour récupérer les personnels d'un utilisateur spécifique
router.get("/user/:userId", authenticateToken, getPersonelByUser);

module.exports = router;