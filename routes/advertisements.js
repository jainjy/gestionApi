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

// Configuration Multer
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

// Fonction pour uploader vers Supabase
async function uploadAdvertisementImage(file) {
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
    const { page = 1, limit = 10, status, position } = req.query
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
    const { position } = req.query
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
 */
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Admin requis."
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image requise"
      })
    }

    const { title, description, targetUrl, position, type, status, startDate, endDate, priority } = req.body

    // Upload de l'image
    const imageResult = await uploadAdvertisementImage(req.file)

    // Créer la publicité
    const advertisement = await prisma.advertisement.create({
      data: {
        title,
        description,
        imageUrl: imageResult.url,
        targetUrl: targetUrl || null,
        position: position || 'header',
        type: type || 'banner',
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
 */
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
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

    // Si nouvelle image fournie
    if (req.file) {
      const imageResult = await uploadAdvertisementImage(req.file)
      updateData.imageUrl = imageResult.url

      // Optionnel: Supprimer l'ancienne image de Supabase
      try {
        await supabase.storage
          .from('blog-images')
          .remove([existingAd.imageUrl.split('/').pop()])
      } catch (deleteError) {
        console.warn('⚠️ Impossible de supprimer ancienne image:', deleteError)
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

    // Supprimer l'image de Supabase
    try {
      const imagePath = advertisement.imageUrl.split('/').pop()
      await supabase.storage
        .from('blog-images')
        .remove([`advertisements/${imagePath}`])
    } catch (deleteError) {
      console.warn('⚠️ Impossible de supprimer image:', deleteError)
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
          position: true
        }
      })
    ])

    const stats = {
      total: totalAds,
      active: activeAds,
      totalClicks: totalClicks._sum.clicks || 0,
      totalImpressions: totalImpressions._sum.impressions || 0,
      clickThroughRate: totalImpressions._sum.impressions > 0 
        ? ((totalClicks._sum.clicks / totalImpressions._sum.impressions) * 100).toFixed(2)
        : 0,
      byPosition: adsByPosition,
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