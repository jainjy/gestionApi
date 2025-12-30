const express = require("express");
const router = express.Router();
const experiencesController = require("../controllers/experiences.controller");
const { authenticateToken } = require("../middleware/auth");

// Routes publiques
router.get("/", experiencesController.getAllExperiences);
router.get("/categories", experiencesController.getCategories);
router.get("/:id", experiencesController.getExperienceById);
router.get("/:id/similar", experiencesController.getSimilarExperiences);

// Routes protégées
router.post("/", authenticateToken, experiencesController.createExperience);
router.put("/:id", authenticateToken, experiencesController.updateExperience);
router.post("/:id/book", authenticateToken, experiencesController.bookExperience);

module.exports = router;