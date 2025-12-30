// routes/portraits.js
const express = require("express");
const router = express.Router();
const portraitController = require("../controllers/portraitController");
const { authenticateToken } = require("../middleware/auth");

// Routes publiques
router.get("/", portraitController.getAllPortraits);
router.get("/stats", portraitController.getPortraitStats);
router.get("/:id", portraitController.getPortraitById);
router.get("/:portraitId/comments", portraitController.getPortraitComments);

// Routes protégées (utilisateurs connectés)
router.post(
  "/:portraitId/comments",
  authenticateToken,
  portraitController.createPortraitComment
);
router.post(
  "/:portraitId/comments/:commentId/like",
  authenticateToken,
  portraitController.likePortraitComment
);
router.post(
  "/:portraitId/share",
  authenticateToken,
  portraitController.recordPortraitShare
);
router.post(
  "/:portraitId/listen",
  authenticateToken,
  portraitController.recordPortraitListen
);

// Routes admin
router.post("/", authenticateToken,  portraitController.createPortrait);
router.put(
  "/:id",
  authenticateToken,

  portraitController.updatePortrait
);
router.delete(
  "/:id",
  authenticateToken,

  portraitController.deletePortrait
);

module.exports = router;
