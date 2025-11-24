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
    fileSize: 10 * 1024 * 1024, // 10MB max (augmenté pour les images d'hébergements)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Le fichier doit être une image'), false)
    }
  }
})

// Fonction utilitaire pour uploader vers Supabase
async function uploadToSupabase(file, folder, fileName = null) {
  const fileExt = file.originalname.split('.').pop()
  const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${folder}/${uniqueFileName}`

  // Upload vers Supabase
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    })

  if (error) {
    throw new Error(`Erreur upload Supabase: ${error.message}`)
  }

  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
    fileName: uniqueFileName
  }
}

// POST /api/upload/image - Upload d'image générique (blog, etc.)
router.post('/image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    const result = await uploadToSupabase(req.file, 'blog-images')

    res.json({ 
      success: true, 
      url: result.url,
      path: result.path,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'upload'
    })
  }
})

// POST /api/upload/property-image - Upload d'image pour propriété
router.post('/property-image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    const result = await uploadToSupabase(req.file, 'property-images')

    res.json({ 
      success: true, 
      url: result.url,
      path: result.path,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload propriété:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'upload'
    })
  }
})

// POST /api/upload/tourism-image - Upload d'image pour le tourisme
router.post('/tourism-image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    const result = await uploadToSupabase(req.file, 'tourism-images')

    res.json({ 
      success: true, 
      url: result.url,
      path: result.path,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload tourisme:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'upload'
    })
  }
})

// POST /api/upload/tourism-multiple - Upload multiple images for tourism
router.post('/tourism-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    console.log('📨 Upload multiple reçu');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const results = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        const uploadResult = await uploadToSupabase(file, 'tourism-images');
        results.push({
          success: true,
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          originalName: file.originalname,
          size: file.size
        });
      } catch (fileError) {
        console.error(`Erreur upload fichier ${i}:`, fileError);
        results.push({
          success: false,
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: successCount === results.length,
      results: results,
      message: `${successCount}/${req.files.length} fichiers uploadés avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur: ' + error.message
    });
  }
});

// POST /api/upload/user-avatar - Upload d'avatar utilisateur
router.post('/user-avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    // Générer un nom de fichier basé sur l'ID utilisateur
    const userId = req.user.id
    const fileName = `avatar-${userId}-${Date.now()}.${req.file.originalname.split('.').pop()}`
    
    const result = await uploadToSupabase(req.file, 'user-avatars', fileName)

    res.json({ 
      success: true, 
      url: result.url,
      path: result.path,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload avatar:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'upload'
    })
  }
})

// POST /api/upload/product-image - Upload d'image pour produits
router.post('/product-image', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      })
    }

    const result = await uploadToSupabase(req.file, 'product-images')

    res.json({ 
      success: true, 
      url: result.url,
      path: result.path,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload produit:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de l\'upload'
    })
  }
})

// DELETE /api/upload/image - Supprimer une image
router.delete('/image', authenticateToken, async (req, res) => {
  try {
    const { path } = req.body

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Chemin du fichier requis'
      })
    }

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([path])

    if (error) {
      console.error('Erreur suppression Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du fichier'
      })
    }

    res.json({ 
      success: true, 
      message: 'Fichier supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    })
  }
})

// DELETE /api/upload/batch - Supprimer plusieurs images
router.delete('/batch', authenticateToken, async (req, res) => {
  try {
    const { paths } = req.body

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste des chemins de fichiers requise'
      })
    }

    if (paths.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 fichiers peuvent être supprimés en une fois'
      })
    }

    const { data, error } = await supabase.storage
      .from('blog-images')
      .remove(paths)

    if (error) {
      console.error('Erreur suppression batch Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression des fichiers',
        details: error.message
      })
    }

    res.json({ 
      success: true, 
      message: `${paths.length} fichiers supprimés avec succès`,
      deleted: paths
    })
  } catch (error) {
    console.error('Erreur lors de la suppression batch:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression batch'
    })
  }
})

// GET /api/upload/buckets - Lister les buckets disponibles (admin seulement)
router.get('/buckets', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      })
    }

    const { data, error } = await supabase.storage
      .listBuckets()

    if (error) {
      console.error('Erreur liste buckets Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des buckets'
      })
    }

    res.json({ 
      success: true, 
      buckets: data 
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des buckets:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    })
  }
})

// Gestion des erreurs Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 10MB)'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Trop de fichiers uploadés'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Champ de fichier inattendu'
      })
    }
  }
  
  if (error.message === 'Le fichier doit être une image') {
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
  
  console.error('Erreur upload:', error)
  res.status(500).json({
    success: false,
    error: 'Erreur lors du traitement du fichier'
  })
})

module.exports = router