require('dotenv').config()
const express = require('express')
const cors = require('./middleware/cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')


const app = express()
const PORT = process.env.PORT || 3001

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
})

// Middleware
app.use(helmet())
app.use(cors)
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/articles', require('./routes/articles'))
app.use('/api/properties', require('./routes/properties'))
app.use('/api/products', require('./routes/products'))
app.use('/api/services', require('./routes/services'))
app.use('/api/metiers', require('./routes/metiersRoutes'))
app.use('/api/professional/services', require('./routes/professional-services'))
app.use('/api/demandes/immobilier', require('./routes/demandes'))
app.use('/api/demandes', require('./routes/user-demandes'))
app.use('/api/devis', require('./routes/devis'))
app.use('/api/admin', require('./routes/admin-demandes'))
// routes pour le panier et les commandes
app.use('/api/cart', require('./routes/cart'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/cookies', require('./routes/cookies'))



// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: [
      'auth', 
      'users', 
      'upload', 
      'articles', 
      'properties',
      'products',
      'services',
      'metiers',
      'professional-services',
      'demandes',
      'admin-demandes',
      'cart',           
      'orders'          
    ]
  })
})

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée' 
  })
})

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur Globales :', error)
  res.status(500).json({ 
    success: false,
    error: 'Erreur interne du serveur' 
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Le serveur tourne sur le port: ${PORT}`)
  console.log(`🏥 Voir la santé sur : http://localhost:${PORT}/health`)
  console.log(`🛒 Panier: http://localhost:${PORT}/api/cart/validate`)
  console.log(`📦 Commandes: http://localhost:${PORT}/api/orders`)
})