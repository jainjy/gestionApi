require('dotenv').config()
const express = require('express')
const cors = require('./middleware/cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors)
app.use(express.json({ limit: '10mb' }))
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
app.use('/api/demandes', require('./routes/demandes'))
app.use('/api/admin', require('./routes/admin-demandes'))
app.use('/api/categories', require('./routes/categories'))


// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['auth', 'users', 'upload', 'articles', 'properties','products','services','metiers','professional-services','demandes','admin-demandes','payments']
  })
})

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur Globales :', error)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

app.listen(PORT, () => {
  console.log(`Le serveur tourne sur le port: ${PORT}`)
  console.log(`voir la sante sur : http://localhost:${PORT}/health`)
})