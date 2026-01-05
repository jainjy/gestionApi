const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken } = require('../middleware/auth')
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Configuration Multer pour accepter images ET vidéos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max pour les vidéos
  },
  fileFilter: (req, file, cb) => {
    // Accepter images ET vidéos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Le fichier doit être une image ou une vidéo'), false)
    }
  }
})

// Fonction pour uploader vers Supabase (images ET vidéos)
async function uploadAdvertisementMedia(file) {
  const fileExt = file.originalname.split('.').pop()
  const uniqueFileName = `ad-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `advertisements/${uniqueFileName}`

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    })

  if (error) {
    throw new Error(`Erreur upload Supabase: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
    fileName: uniqueFileName
  }
}

/**
 * 📋 GET /api/advertisements - Récupérer toutes les publicités (Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, position, type } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Vérifier les permissions admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    const where = {}
    if (status && status !== 'all') where.status = status
    if (position && position !== 'all') where.position = position
    if (type && type !== 'all') where.type = type

    const [advertisements, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.advertisement.count({ where })
    ])

    res.json({
      success: true,
      advertisements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('💥 Erreur récupération publicités:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des publicités",
      error: error.message
    })
  }
})

/**
 * 📊 GET /api/advertisements/active - Récupérer les publicités actives (Publique)
 */
router.get('/active', async (req, res) => {
  try {
    const { position, type } = req.query
    const now = new Date()

    const where = {
      status: 'active',
      OR: [
        {
          startDate: null,
          endDate: null
        },
        {
          startDate: { lte: now },
          endDate: { gte: now }
        },
        {
          startDate: { lte: now },
          endDate: null
        },
        {
          startDate: null,
          endDate: { gte: now }
        }
      ]
    }

    if (position) {
      where.position = position
    }

    if (type) {
      where.type = type
    }

    const advertisements = await prisma.advertisement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    })

    // Mettre à jour les impressions
    if (advertisements.length > 0) {
      await Promise.all(
        advertisements.map(ad => 
          prisma.advertisement.update({
            where: { id: ad.id },
            data: { impressions: { increment: 1 } }
          })
        )
      )
    }

    res.json({
      success: true,
      advertisements
    })
  } catch (error) {
    console.error('💥 Erreur récupération publicités actives:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des publicités",
      error: error.message
    })
  }
})

/**
 * ➕ POST /api/advertisements - Créer une nouvelle publicité (Admin)
 * CORRECTION : upload.single('media') au lieu de upload.single('image')
 */
router.post('/', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    // Validation : fichier requis
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media requis (image ou vidéo selon le type)"
      })
    }

    const { title, description, targetUrl, position, type, status, startDate, endDate, priority } = req.body

    // Validation : champs requis
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Titre et type sont requis"
      })
    }

    // Validation cohérence type de fichier / type de publicité
    const fileType = req.file.mimetype.split('/')[0] // 'image' ou 'video'
    
    if (type === 'video' && fileType !== 'video') {
      return res.status(400).json({
        success: false,
        message: "Le type 'video' nécessite un fichier vidéo"
      })
    }

    if ((type === 'banner' || type === 'popup') && fileType !== 'image') {
      return res.status(400).json({
        success: false,
        message: `Le type '${type}' nécessite une image`
      })
    }

    // Validation des dates
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "La date de fin ne peut pas être avant la date de début"
        })
      }
    }

    // Upload du média
    const mediaResult = await uploadAdvertisementMedia(req.file)

    // Créer la publicité
    const advertisement = await prisma.advertisement.create({
      data: {
        title,
        description,
        imageUrl: mediaResult.url,
        targetUrl: targetUrl || null,
        position: position || 'header',
        type: type,
        status: status || 'active',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: parseInt(priority) || 1,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: "Publicité créée avec succès",
      advertisement
    })
  } catch (error) {
    console.error('💥 Erreur création publicité:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la publicité",
      error: error.message
    })
  }
})

/**
 * ✏️ PUT /api/advertisements/:id - Modifier une publicité (Admin)
 * CORRECTION : upload.single('media') au lieu de upload.single('image')
 */
router.put('/:id', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    const { id } = req.params
    const { title, description, targetUrl, position, type, status, startDate, endDate, priority } = req.body

    // Vérifier si la publicité existe
    const existingAd = await prisma.advertisement.findUnique({
      where: { id }
    })

    if (!existingAd) {
      return res.status(404).json({
        success: false,
        message: "Publicité non trouvée"
      })
    }

    // Validation : champs requis
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Titre et type sont requis"
      })
    }

    // Validation des dates
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: "La date de fin ne peut pas être avant la date de début"
        })
      }
    }

    const updateData = {
      title,
      description,
      targetUrl,
      position,
      type,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      priority: parseInt(priority) || 1
    }

    // Si nouveau média fourni
    if (req.file) {
      // Validation cohérence type de fichier / type de publicité
      const fileType = req.file.mimetype.split('/')[0]
      
      if (type === 'video' && fileType !== 'video') {
        return res.status(400).json({
          success: false,
          message: "Le type 'video' nécessite un fichier vidéo"
        })
      }

      if ((type === 'banner' || type === 'popup') && fileType !== 'image') {
        return res.status(400).json({
          success: false,
          message: `Le type '${type}' nécessite une image`
        })
      }

      const mediaResult = await uploadAdvertisementMedia(req.file)
      updateData.imageUrl = mediaResult.url

      // Supprimer l'ancien média de Supabase si ce n'est pas une URL par défaut
      try {
        if (existingAd.imageUrl && !existingAd.imageUrl.includes('placeholder')) {
          const oldFileName = existingAd.imageUrl.split('/').pop()
          await supabase.storage
            .from('blog-images')
            .remove([`advertisements/${oldFileName}`])
        }
      } catch (deleteError) {
        console.warn('⚠️ Impossible de supprimer ancien média:', deleteError)
      }
    }

    const advertisement = await prisma.advertisement.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: "Publicité modifiée avec succès",
      advertisement
    })
  } catch (error) {
    console.error('💥 Erreur modification publicité:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modification de la publicité",
      error: error.message
    })
  }
})

/**
 * 🗑️ DELETE /api/advertisements/:id - Supprimer une publicité (Admin)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    const { id } = req.params

    // Vérifier si la publicité existe
    const advertisement = await prisma.advertisement.findUnique({
      where: { id }
    })

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Publicité non trouvée"
      })
    }

    // Supprimer le média de Supabase si ce n'est pas une URL par défaut
    try {
      if (advertisement.imageUrl && !advertisement.imageUrl.includes('placeholder')) {
        const imagePath = advertisement.imageUrl.split('/').pop()
        await supabase.storage
          .from('blog-images')
          .remove([`advertisements/${imagePath}`])
      }
    } catch (deleteError) {
      console.warn('⚠️ Impossible de supprimer média:', deleteError)
    }

    // Supprimer la publicité
    await prisma.advertisement.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: "Publicité supprimée avec succès"
    })
  } catch (error) {
    console.error('💥 Erreur suppression publicité:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la publicité",
      error: error.message
    })
  }
})

/**
 * 📈 POST /api/advertisements/:id/click - Enregistrer un clic
 */
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.advertisement.update({
      where: { id },
      data: { clicks: { increment: 1 } }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('💥 Erreur enregistrement clic:', error)
    res.status(500).json({ success: false })
  }
})

/**
 * 📊 GET /api/advertisements/stats - Statistiques des publicités (Admin)
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    const [
      totalAds,
      activeAds,
      totalClicks,
      totalImpressions,
      adsByPosition,
      topPerformingAds
    ] = await Promise.all([
      prisma.advertisement.count(),
      prisma.advertisement.count({ where: { status: 'active' } }),
      prisma.advertisement.aggregate({ _sum: { clicks: true } }),
      prisma.advertisement.aggregate({ _sum: { impressions: true } }),
      prisma.advertisement.groupBy({
        by: ['position'],
        _count: { id: true },
        _sum: { clicks: true, impressions: true }
      }),
      prisma.advertisement.findMany({
        orderBy: { clicks: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          clicks: true,
          impressions: true,
          position: true,
          type: true
        }
      })
    ])

    // Statistiques par type (banner, popup, video)
    const adsByType = await prisma.advertisement.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { clicks: true, impressions: true }
    })

    const stats = {
      total: totalAds,
      active: activeAds,
      totalClicks: totalClicks._sum.clicks || 0,
      totalImpressions: totalImpressions._sum.impressions || 0,
      clickThroughRate: totalImpressions._sum.impressions > 0 
        ? ((totalClicks._sum.clicks / totalImpressions._sum.impressions) * 100).toFixed(2)
        : 0,
      byPosition: adsByPosition,
      byType: adsByType,
      topPerforming: topPerformingAds
    }

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('💥 Erreur récupération statistiques:', error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    })
  }
})

module.exports = router