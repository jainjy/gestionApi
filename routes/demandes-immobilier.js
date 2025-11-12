const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { prisma } = require('../lib/db');

// POST /api/demandes/immobilier - Créer une nouvelle demande
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      contactNom,
      contactPrenom,
      contactEmail,
      contactTel,
      lieuAdresse,
      lieuAdresseCp,
      lieuAdresseVille,
      optionAssurance,
      description,
      serviceId,
      nombreArtisans,
      createdById,
      propertyId,
      dateSouhaitee,
      heureSouhaitee,
      artisanId // NOUVEAU: Récupérer l'artisanId
    } = req.body;

    // Validation de base
    if (!serviceId || !createdById) {
      return res.status(400).json({ error: 'serviceId et createdById sont requis' });
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res.status(400).json({ error: 'Les informations de contact sont obligatoires' });
    }

    // Créer la demande
    const nouvelleDemande = await prisma.demande.create({
      data: {
        contactNom,
        contactPrenom,
        contactEmail,
        contactTel,
        lieuAdresse: lieuAdresse || '',
        lieuAdresseCp: lieuAdresseCp || '',
        lieuAdresseVille: lieuAdresseVille || '',
        optionAssurance: optionAssurance || false,
        description,
        serviceId: parseInt(serviceId),
        statut: 'en attente',
        nombreArtisans: nombreArtisans || 'UNIQUE',
        createdById,
        propertyId,
        artisanId, // NOUVEAU: Inclure l'artisanId
        dateSouhaitee: dateSouhaitee && heureSouhaitee 
          ? new Date(dateSouhaitee + 'T' + heureSouhaitee + ':00.000Z')
          : dateSouhaitee 
            ? new Date(dateSouhaitee + 'T00:00:00.000Z')
            : null,
        heureSouhaitee: heureSouhaitee || null
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                companyName: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            libelle: true,
            description: true,
            images: true,
            price: true,
            duration: true,
            metiers: {
              include: {
                metier: true
              }
            }
          }
        },
        artisan: { // NOUVEAU: Inclure l'artisan dans la réponse
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            commercialName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Demande créée avec succès',
      demande: nouvelleDemande
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes/immobilier/user/:userId - Récupérer les demandes de visite envoyées par un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let whereClause = {
      createdById: userId,
      NOT: { 
        propertyId: null,
        statut: 'archivée' // Ne pas montrer les demandes archivées pour l'utilisateur
      }
    };

    // Filtre par statut si fourni
    if (status) {
      whereClause.statut = status;
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
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
    });

    const transformedDemandes = demandes.map(demande => ({
      id: demande.id,
      statut: demande.statut || 'en attente',
      description: demande.description,
      date: demande.createdAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes/immobilier/owner/:userId - Récupérer les demandes de visite pour les propriétés d'un utilisateur
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // D'abord, récupérer toutes les propriétés de l'utilisateur avec leurs propriétaires
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        }
      }
    });

    const propertyIds = userProperties.map(p => p.id);
    
    // Créer un map des propriétés pour un accès facile plus tard
    const propertiesMap = new Map(userProperties.map(p => [p.id, p]));

    let whereClause = {
      propertyId: {
        in: propertyIds
      }
    };

    // Filtre par statut si fourni
    if (status) {
      whereClause.statut = status;
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: true,
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
    });

    // Enrichir les demandes avec les informations du propriétaire
    const enrichedDemandes = demandes.map(demande => {
      const property = propertiesMap.get(demande.propertyId);
      return {
        ...demande,
        property: property ? {
          ...demande.property,
          owner: property.owner
        } : demande.property
      };
    });

    const transformedDemandes = enrichedDemandes.map(demande => ({
      id: demande.id,
      statut: demande.statut || 'en attente',
      description: demande.description,
      date: demande.createdAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/demandes/immobilier/:id/statut - Mettre à jour le statut d'une demande
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    if (!statut) {
      return res.status(400).json({ error: 'Le champ statut est requis.' });
    }

    // D'abord récupérer la demande existante pour avoir le propertyId
    const existing = await prisma.demande.findUnique({ 
      where: { id: parseInt(id, 10) },
      include: {
        property: true
      }
    });

    if (!existing) return res.status(404).json({ error: 'Demande introuvable' });

    if (statut.toLowerCase() === 'annulée') {
      try {
        await prisma.demandeHistory.create({
          data: {
            demandeId: existing.id,
            title: 'Demande annulée',
            message: 'La demande a été annulée et archivée.',
            snapshot: existing
          }
        });
      } catch (e) {
        console.error('Impossible de créer historique', e);
      }

      await prisma.demande.update({
        where: { id: existing.id },
        data: { 
          statut: 'archivée',
          isRead: true 
        }
      });
      return res.json({ message: 'Demande annulée et archivée' });
    }

    // Récupérer la propriété avec son propriétaire
    const property = await prisma.property.findUnique({
      where: { id: existing.propertyId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        }
      }
    });

    const updated = await prisma.demande.update({
      where: { id: parseInt(id, 10) },
      data: { statut },
      include: {
        property: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Enrichir la demande avec les informations du propriétaire
    const enrichedDemande = {
      ...updated,
      property: {
        ...updated.property,
        owner: property?.owner
      }
    };

    res.json({ message: 'Statut mis à jour', demande: enrichedDemande });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/demandes/immobilier/:id - Supprimer ou archiver une demande selon le contexte
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // D'abord récupérer la demande avec toutes les informations nécessaires
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
      include: { 
        property: true,
        createdBy: true
      }
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // Vérifier si l'utilisateur est le propriétaire de la demande ou le propriétaire du bien
    const isRequestCreator = demande.createdById === req.user.id;
    const isPropertyOwner = demande.property?.ownerId === req.user.id;

    if (isRequestCreator) {
      // Si c'est l'utilisateur qui a créé la demande, vraie suppression
      await prisma.demande.delete({
        where: { id: parseInt(id, 10) }
      });
      res.json({ message: 'Demande supprimée définitivement' });
    } else if (isPropertyOwner) {
      // Pour le professionnel, juste marquer comme archivée
      await prisma.demandeHistory.create({
        data: {
          demandeId: demande.id,
          title: 'Demande archivée',
          message: `Demande archivée pour le bien: ${demande.property?.title || 'Non spécifié'}`,
          snapshot: demande
        }
      });

      // Mettre à jour le statut comme archivée
      await prisma.demande.update({
        where: { id: parseInt(id, 10) },
        data: {
          statut: 'archivée',
          archived: true,
          isRead: true
        }
      });
      res.json({ message: 'Demande archivée avec succès' });
    } else {
      // Si l'utilisateur n'est ni le créateur ni le propriétaire
      res.status(403).json({ error: 'Non autorisé à supprimer cette demande' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression/archivage de la demande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes/immobilier/:id/history - Obtenir l'historique d'une demande
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.demandeHistory.findMany({
      where: { demandeId: parseInt(id, 10) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes/immobilier/user/:userId/history - Obtenir l'historique de toutes les demandes d'un utilisateur
router.get('/user/:userId/history', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Récupérer toutes les demandes de l'utilisateur
    const demandes = await prisma.demande.findMany({
      where: { 
        createdById: userId,
        NOT: { propertyId: null }
      },
      select: { id: true }
    });

    const demandeIds = demandes.map(d => d.id);

    // Récupérer l'historique pour toutes ces demandes
    const history = await prisma.demandeHistory.findMany({
      where: { 
        demandeId: { in: demandeIds }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;