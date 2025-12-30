const { authenticateToken } = require("../middleware/auth");
const express = require("express");
const router = express.Router();
router.get('/me',authenticateToken, (req, res) => {
  // Supposons que tu as un token JWT dans les headers
  try {
    const user=req.user
    res.json({ email: user.email }); // récupère email depuis token
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});
module.exports = router;
