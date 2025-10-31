const express = require('express')
const router = express.Router()

// ✅ Réception de la géolocalisation
router.post('/location', (req, res) => {
  const { latitude, longitude } = req.body

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'Coordonnées manquantes' })
  }

  // ✅ On peut ici enregistrer les données dans une base de données si besoin
  console.log('📍 Localisation reçue :', latitude, longitude)

  // ✅ Création d’un cookie côté serveur
  res.cookie('user_location', JSON.stringify({ latitude, longitude }), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  })

  return res.json({ success: true, message: 'Localisation sauvegardée' })
})

// ✅ Lecture des cookies envoyés par le navigateur
router.get('/check', (req, res) => {
  const cookie_preferences = req.cookies.cookie_preferences || null
  const user_location = req.cookies.user_location || null

  res.json({ cookie_preferences, user_location })
})

module.exports = router
