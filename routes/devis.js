const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db')

// Créer une nouvelle demande de devis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      message,
      dateSouhaitee,
      budget,
      serviceId,
      userId
    } = req.body

    const nouveauDevis = await prisma.demande.create({
      data: {
        contactNom: nom,
        contactPrenom: prenom,
        contactEmail: email,
        contactTel: telephone,
        contactAdresse: adresse,
        description: message,
        serviceId: parseInt(serviceId),
        createdById: userId,
        nombreArtisans: 'MULTIPLE'
      }
    })

    res.status(201).json({
      message: 'Demande de devis créée avec succès',
      devis: nouveauDevis
    })
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Récupérer les devis d'un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    const devis = await prisma.demande.findMany({
      where: { 
        createdById: userId,
      },
      include: {
        service: true,
        artisans: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(devis)
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Mettre à jour le statut d'un devis
router.patch('/:devisId', authenticateToken, async (req, res) => {
  try {
    const { devisId } = req.params
    const { status } = req.body

    const devisUpdated = await prisma.demande.update({
      where: { id: parseInt(devisId) },
      data: { demandeAcceptee: status === 'accepted' }
    })

    res.json({
      message: 'Statut du devis mis à jour',
      devis: devisUpdated
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
