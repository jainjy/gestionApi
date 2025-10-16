const express = require('express')
const router = express.Router()
const { prisma } = require('../lib/db')
const { authenticateToken, requireRole } = require('../middleware/auth')
const bcrypt = require('bcrypt')

// GET /api/users - Récupérer tous les utilisateurs
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })
    res.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// POST /api/users - Créer un nouvel utilisateur
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      email, 
      password,
      firstName, 
      lastName, 
      phone, 
      role, 
      status,
      metiers,
      demandType,
      companyName 
    } = req.body

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        status,
        demandType: role === 'user' ? demandType : null,
        companyName: role === 'professional' ? companyName : null,
        metiers: role === 'professional' ? {
          create: metiers.map((metierId) => ({
            metier: {
              connect: { id: metierId }
            }
          }))
        } : undefined
      },
    })
    
    res.json(newUser)
  } catch (error) {
    console.error('Failed to create user:', error)
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà" })
    }
    
    res.status(500).json({ error: "Failed to create user" })
  }
})

// GET /api/users/stats - Récupérer les statistiques des utilisateurs
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const total = await prisma.user.count()
    const active = await prisma.user.count({ where: { status: "active" } })
    const inactive = await prisma.user.count({ where: { status: "inactive" } })
    const pro = await prisma.user.count({ where: { role: "professional" } })
    
    res.json({ total, active, inactive, pro })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
})

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        companyName: true,
        metiers: {
          include: {
            metier: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    res.json(user)
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    res.status(500).json({ error: "Failed to fetch user profile" })
  }
})

// PUT /api/users/profile - Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })
    
    res.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user profile:', error)
    res.status(500).json({ error: "Failed to update user profile" })
  }
})

// GET /api/users/:id - Récupérer un utilisateur spécifique
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        companyName: true,
        metiers: {
          include: {
            metier: true
          }
        },
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    res.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })
    
    res.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user:', error)
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà" })
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }
    
    res.status(500).json({ error: "Failed to update user" })
  }
})

// PATCH /api/users/:id - Mettre à jour le statut d'un utilisateur
router.patch('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: data.status,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })
    
    res.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user status:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }
    
    res.status(500).json({ error: "Failed to update user status" })
  }
})

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.user.delete({
      where: { id }
    })
    
    res.json({ success: true, message: "Utilisateur supprimé avec succès" })
  } catch (error) {
    console.error('Failed to delete user:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }
    
    res.status(500).json({ error: "Failed to delete user" })
  }
})

// GET /api/users/metiers - Récupérer tous les métiers
router.get('/metiers/all', async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      select: {
        id: true,
        libelle: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })
    res.json(metiers)
  } catch (error) {
    console.error('Failed to fetch metiers:', error)
    res.status(500).json({ error: "Failed to fetch metiers" })
  }
})

module.exports = router