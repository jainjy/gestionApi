const express = require('express')
const router = express.Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { prisma } = require('../lib/db')

// GET /api/admin/demandes - Récupérer toutes les demandes pour l'admin
router.get('/demandes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query

    let whereClause = {}

    // Filtre par statut
    if (status && status !== 'Toutes') {
      switch (status) {
        case 'En attente':
          whereClause.demandeAcceptee = false
          whereClause.artisans = { none: {} }
          break
        case 'En cours':
          whereClause.demandeAcceptee = false
          whereClause.artisans = { some: {} }
          break
        case 'Validée':
          whereClause.demandeAcceptee = true
          break
        case 'Refusée':
          // Vous pouvez ajouter une logique pour les demandes refusées
          whereClause.demandeAcceptee = false
          break
      }
    }

    // Recherche
    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { contactNom: { contains: search, mode: 'insensitive' } },
        { contactPrenom: { contains: search, mode: 'insensitive' } },
        { lieuAdresseVille: { contains: search, mode: 'insensitive' } },
        { service: { libelle: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [demandes, total] = await Promise.all([
      prisma.demande.findMany({
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
                  companyName: true,
                  email: true,
                  phone: true
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
              phone: true,
              companyName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.demande.count({ where: whereClause })
    ])

    // Transformer les données pour le frontend admin
    const transformedDemandes = demandes.map(demande => {
      const artisansAcceptes = demande.artisans.filter(a => a.accepte)
      const artisansEnAttente = demande.artisans.filter(a => a.accepte === null || a.accepte === false)
      
      // Déterminer le statut
      let statut = 'En attente'
      let urgence = 'Moyen'
      
      if (demande.demandeAcceptee) {
        statut = 'Terminée'
      } else if (artisansAcceptes.length > 0) {
        statut = 'Validée'
      } else if (demande.artisans.length > 0) {
        statut = 'En cours'
      }

      // Déterminer l'urgence basée sur la date de création et d'autres facteurs
      const now = new Date()
      const daysSinceCreation = Math.floor((now - demande.createdAt) / (1000 * 60 * 60 * 24))
      
      if (daysSinceCreation <= 1) {
        urgence = 'Urgent'
      } else if (daysSinceCreation <= 3) {
        urgence = 'Moyen'
      } else {
        urgence = 'Faible'
      }

      // Vérifier si c'est une nouvelle demande (moins de 24h)
      const isNouvelle = daysSinceCreation <= 1

      return {
        id: demande.id,
        titre: `Demande ${demande.service.libelle}`,
        metier: demande.service.metiers[0]?.metier.libelle || 'Non spécifié',
        lieu: `${demande.lieuAdresseCp || ''} ${demande.lieuAdresseVille || ''}`.trim(),
        statut: statut,
        urgence: urgence,
        description: demande.description || 'Aucune description fournie',
        date: demande.createdAt.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }),
        client: `${demande.contactPrenom || ''} ${demande.contactNom || ''}`.trim() || 
                `${demande.createdBy.firstName || ''} ${demande.createdBy.lastName || ''}`.trim(),
        budget: 'Non estimé',
        nouvelle: isNouvelle,
        urgent: urgence === 'Urgent',
        // Données détaillées
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
        createdAt: demande.createdAt,
        artisans: demande.artisans,
        createdBy: demande.createdBy,
        service: demande.service
      }
    })

    res.json({
      demandes: transformedDemandes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/demandes/stats - Statistiques pour l'admin
router.get('/demandes/stats', authenticateToken,requireRole(['admin']) , async (req, res) => {
  try {
    const totalDemandes = await prisma.demande.count()
    
    const demandesEnAttente = await prisma.demande.count({
      where: {
        demandeAcceptee: false,
        artisans: { none: {} }
      }
    })

    const demandesEnCours = await prisma.demande.count({
      where: {
        demandeAcceptee: false,
        artisans: { some: {} }
      }
    })

    const demandesValidees = await prisma.demande.count({
      where: {
        demandeAcceptee: true
      }
    })

    const demandesUrgentes = await prisma.demande.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Moins de 24h
        }
      }
    })

    const demandesNouvelles = await prisma.demande.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Moins de 24h
        }
      }
    })

    res.json({
      total: totalDemandes,
      enAttente: demandesEnAttente,
      enCours: demandesEnCours,
      validees: demandesValidees,
      urgentes: demandesUrgentes,
      nouvelles: demandesNouvelles
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats admin:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/demandes/:id/validate - Valider une demande
router.put('/demandes/:id/validate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params

    const demande = await prisma.demande.update({
      where: { id: parseInt(id) },
      data: {
        demandeAcceptee: true
      },
      include: {
        service: true,
        createdBy: true,
        artisans: {
          include: {
            user: true
          }
        }
      }
    })

    res.json({
      message: 'Demande validée avec succès',
      demande
    })
  } catch (error) {
    console.error('Erreur lors de la validation de la demande:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/admin/demandes/:id/assign - Assigner à un artisan
router.put('/demandes/:id/assign', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { artisanId } = req.body

    // Vérifier si l'artisan existe et a les compétences nécessaires
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id) },
      include: { service: true }
    })

    const artisan = await prisma.user.findUnique({
      where: { id: artisanId },
      include: {
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

    if (!artisan) {
      return res.status(404).json({ error: 'Artisan non trouvé' })
    }

    // Assigner l'artisan à la demande
    const demandeArtisan = await prisma.demandeArtisan.create({
      data: {
        userId: artisanId,
        demandeId: parseInt(id),
        accepte: null // En attente de réponse de l'artisan
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true
          }
        }
      }
    })

    res.json({
      message: 'Artisan assigné avec succès',
      assignment: demandeArtisan
    })
  } catch (error) {
    console.error('Erreur lors de l\'assignation de l\'artisan:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/artisans - Récupérer les artisans pour l'assignation
router.get('/artisans', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { metierId, serviceId } = req.query

    let whereClause = {
      role: 'artisan' // ou le rôle que vous utilisez pour les artisans
    }

    if (metierId) {
      whereClause.metiers = {
        some: {
          metierId: parseInt(metierId)
        }
      }
    }

    if (serviceId) {
      whereClause.services = {
        some: {
          serviceId: parseInt(serviceId)
        }
      }
    }

    const artisans = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        city: true,
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
      },
      orderBy: {
        companyName: 'asc'
      }
    })

    res.json(artisans)
  } catch (error) {
    console.error('Erreur lors de la récupération des artisans:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router