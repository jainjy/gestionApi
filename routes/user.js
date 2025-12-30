const { authenticateToken } = require("../middleware/auth");

router.get('/me',authenticateToken, (req, res) => {
  // Supposons que tu as un token JWT dans les headers
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: decoded.email }); // récupère email depuis token
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});
