const express = require('express')
const router = express.Router()
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')
const { authenticateToken } = require('../middleware/auth')

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Configuration Multer pour le traitement des fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Le fichier doit être une image'), false)
    }
  }
})

// POST /api/upload/image - Upload d'image
router.post('/image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      })
    }

    // Générer un nom de fichier unique
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `blog-images/${fileName}`

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype
      })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return res.status(500).json({
        error: 'Erreur lors de l\'upload'
      })
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath)

    res.json({ 
      success: true, 
      url: publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    res.status(500).json({
      error: 'Erreur serveur'
    })
  }
})

// POST /api/upload/property-image - Upload d'image pour propriété
router.post('/property-image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      })
    }

    // Générer un nom de fichier unique
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `property-images/${fileName}`

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype
      })

    if (error) {
      console.error('Erreur upload Supabase:', error)
      return res.status(500).json({
        error: 'Erreur lors de l\'upload'
      })
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    res.json({ 
      success: true, 
      url: publicUrl,
      path: filePath
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    res.status(500).json({
      error: 'Erreur serveur'
    })
  }
})

// DELETE /api/upload/image - Supprimer une image
router.delete('/image', authenticateToken, async (req, res) => {
  try {
    const { path } = req.body

    if (!path) {
      return res.status(400).json({
        error: 'Chemin du fichier requis'
      })
    }

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([path])

    if (error) {
      console.error('Erreur suppression Supabase:', error)
      return res.status(500).json({
        error: 'Erreur lors de la suppression'
      })
    }

    res.json({ 
      success: true, 
      message: 'Image supprimée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    res.status(500).json({
      error: 'Erreur serveur'
    })
  }
})

// Gestion des erreurs Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux (max 5MB)'
      })
    }
  }
  
  if (error.message === 'Le fichier doit être une image') {
    return res.status(400).json({
      error: error.message
    })
  }
  
  res.status(500).json({
    error: 'Erreur lors du traitement du fichier'
  })
})

module.exports = router