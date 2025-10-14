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

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['auth', 'users', 'upload', 'articles', 'properties']
  })
})

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Global error handler:', error)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})