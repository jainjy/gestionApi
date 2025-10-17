const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticateToken } = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/demandes - Récupérer les demandes de l'utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { status, metier, service } = req.query

    let whereClause = { createdById: userId }

    // Filtres optionnels
    if (status && status !== 'Toutes') {
      whereClause.demandeAcceptee = status === 'Terminé' ? true : 
                                   status === 'En attente' ? false : null
    }

    if (service) {
      whereClause.serviceId = parseInt(service)
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        service: {
          include: {
            category: true,
            metiers: {
              include: {
                metier: true
              }
            }
          }
        },
        artisans: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map(demande => {
      const artisansAcceptes = demande.artisans.filter(a => a.accepte)
      const statut = demande.demandeAcceptee ? 'Terminé' : 
                    artisansAcceptes.length > 0 ? 'Devis reçus' :
                    demande.artisans.length > 0 ? 'En cours' : 'En attente'

      return {
        id: demande.id,
        titre: `Demande ${demande.service.libelle}`,
        metier: demande.service.metiers[0]?.metier.libelle || 'Non spécifié',
        lieu: `${demande.lieuAdresseCp} ${demande.lieuAdresseVille}`,
        statut: statut,
        urgence: 'Moyen', // À adapter selon vos besoins
        description: demande.description,
        date: demande.createdAt.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }),
        devisCount: artisansAcceptes.length,
        budget: 'Non estimé',
        contactNom: demande.contactNom,
        contactPrenom: demande.contactPrenom,
        contactEmail: demande.contactEmail,
        contactTel: demande.contactTel,
        lieuAdresse: demande.lieuAdresse,
        lieuAdresseCp: demande.lieuAdresseCp,
        lieuAdresseVille: demande.lieuAdresseVille,
        optionAssurance: demande.optionAssurance,
        nombreArtisans: demande.nombreArtisans,
        serviceId: demande.serviceId,
        createdAt: demande.createdAt
      }
    })

    res.json(transformedDemandes)
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/demandes - Créer une nouvelle demande
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      contactNom,
      contactPrenom,
      contactEmail,
      contactTel,
      contactAdresse,
      contactAdresseCp,
      contactAdresseVille,
      lieuAdresse,
      lieuAdresseCp,
      lieuAdresseVille,
      optionAssurance,
      description,
      serviceId,
      nombreArtisans,
      createdById
    } = req.body

    // Validation des données requises
    if (!serviceId || !createdById) {
      return res.status(400).json({ 
        error: 'Le service et l\'utilisateur sont obligatoires' 
      })
    }

    const nouvelleDemande = await prisma.demande.create({
      data: {
        contactNom,
        contactPrenom,
        contactEmail,
        contactTel,
        contactAdresse,
        contactAdresseCp,
        contactAdresseVille,
        lieuAdresse,
        lieuAdresseCp,
        lieuAdresseVille,
        optionAssurance: optionAssurance || false,
        description,
        serviceId: parseInt(serviceId),
        nombreArtisans: nombreArtisans || 'UNIQUE',
        createdById
      },
      include: {
        service: {
          include: {
            metiers: {
              include: {
                metier: true
              }
            }
          }
        }
      }
    })

    res.status(201).json({
      message: 'Demande créée avec succès',
      demande: nouvelleDemande
    })
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/demandes/stats - Statistiques des demandes
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    const totalDemandes = await prisma.demande.count({
      where: { createdById: userId }
    })

    const demandesEnCours = await prisma.demande.count({
      where: { 
        createdById: userId,
        demandeAcceptee: false,
        artisans: {
          some: {}
        }
      }
    })

    const demandesAvecDevis = await prisma.demande.count({
      where: { 
        createdById: userId,
        artisans: {
          some: {
            accepte: true
          }
        }
      }
    })

    const demandesTerminees = await prisma.demande.count({
      where: { 
        createdById: userId,
        demandeAcceptee: true
      }
    })

    res.json({
      total: totalDemandes,
      enCours: demandesEnCours,
      avecDevis: demandesAvecDevis,
      terminees: demandesTerminees
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router