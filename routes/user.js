router.get('/me', (req, res) => {
  // Supposons que tu as un token JWT dans les headers
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Non connecté" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: decoded.email }); // récupère email depuis token
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
});
