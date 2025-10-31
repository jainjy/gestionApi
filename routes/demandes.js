const express = require('express')
const router = express.Router()

const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db')

// GET /api/demandes/immobilier/owner/:userId - Récupérer les demandes de visite pour les propriétés d'un utilisateur
router.get('/owner/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Récupérer d'abord toutes les propriétés de l'utilisateur
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId }
    });

    const propertyIds = userProperties.map(p => p.id);

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
      heureSouhaitee: demande.heureSouhaitee
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes - Récupérer les demandes de l'utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { status, metier, service } = req.query

    let whereClause = { 
      createdById: userId,
      propertyId: { not: null }  // Seulement les demandes avec une propriété
    }
    
    // Aucun filtrage de status car il est géré côté client

    if (service) {
      whereClause.serviceId = parseInt(service)
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        service: {
          // Select explicit fields to avoid selecting a non-existent `devis` column in the DB
          select: {
            id: true,
            libelle: true,
            description: true,
            images: true,
            price: true,
            duration: true,
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
        },
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map(demande => {
      // Détermination du statut
      const status = String(demande.statut || '').toLowerCase();
      const statut = status || 'en attente';

      // Formatage de l'heure souhaitée
      const formatHeure = (heure) => {
        if (!heure || heure.trim() === '') return 'Non précisée';
        // Vérifie si l'heure est au format HH:MM
        if (heure.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
          return heure;
        }
        return 'Non précisée';
      };

      // Construction de l'objet transformé
      return {
        id: demande.id,
        titre: demande.property?.title 
          ? `Demande de visite: ${demande.property.title}`
          : 'Demande de visite',
        metier: 'Visite immobilière',
        lieu: demande.lieuAdresse 
          ? `${demande.lieuAdresse}${demande.lieuAdresseCp ? `, ${demande.lieuAdresseCp}` : ''}${demande.lieuAdresseVille ? ` ${demande.lieuAdresseVille}` : ''}`
          : '—',
        statut,
        description: demande.description,
        createdAt: demande.createdAt,
        date: new Date(demande.createdAt).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }),
        property: demande.property,
        propertyId: demande.propertyId,
        contactNom: demande.contactNom || '',
        contactPrenom: demande.contactPrenom || '',
        contactEmail: demande.contactEmail || '',
        contactTel: demande.contactTel || '',
        lieuAdresse: demande.lieuAdresse || '',
        lieuAdresseCp: demande.lieuAdresseCp || '',
        lieuAdresseVille: demande.lieuAdresseVille || '',
        dateSouhaitee: demande.dateSouhaitee 
          ? new Date(demande.dateSouhaitee).toLocaleDateString('fr-FR', { 
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
          : null,
        heureSouhaitee: formatHeure(demande.heureSouhaitee)
      }
    })

    res.json(transformedDemandes)
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error)
    res.status(500).json({ error: 'Erreurserveur ' })
  }
})

// PATCH /api/demandes/immobilier/:id/statut - Mettre à jour le statut d'une demande
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    if (!statut) {
      return res.status(400).json({ error: 'Le champ statut est requis.' });
    }
    // Si on annule la demande, on veut la sauvegarder en historique puis la supprimer
    const lower = String(statut || '').toLowerCase();
    if (lower === 'annulée' || lower === 'annulee' || lower === 'annulé' || lower === 'annule') {
      // récupère la demande courante
      const existing = await prisma.demande.findUnique({ where: { id: parseInt(id, 10) } });
      if (!existing) return res.status(404).json({ error: 'Demande introuvable' });

      // créer un snapshot historique
      try {
        await prisma.demandeHistory.create({
          data: {
            demandeId: existing.id,
            title: 'Demande annulée',
            message: 'La demande a été annulée et archivées.',
            snapshot: existing
          }
        });
      } catch (e) {
        console.error('Impossible de créer historique', e);
        // continue quand même
      }

      // supprimer la demande
      await prisma.demande.delete({ where: { id: existing.id } });
      return res.json({ message: 'Demande annulée et archivée' });
    }

    // Met à jour le champ "statut" de la demande dans les autres cas
    const updated = await prisma.demande.update({
      where: { id: parseInt(id, 10) },
      data: { statut },
    });
    res.json({ message: 'Statut mis à jour', demande: updated });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/demandes/immobilier/:id - Retourne une demande brute (utilitaire pour debug)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        service: true,
        artisans: true,
        createdBy: true,
        property: true
      }
    });
    if (!demande) return res.status(404).json({ error: 'Demande introuvable' });
    res.json(demande);
  } catch (err) {
    console.error('Erreur fetching demande by id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/demandes/immobilier - Créer une nouvelle demande
router.post('/', authenticateToken, async (req, res) => {
  try {
    // DEBUG: log incoming payload to help diagnose 400 responses (temporary)
    console.log('Incoming POST /api/demandes/immobilier payload:', JSON.stringify(req.body));
    let {
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
      devis,
      propertyId,
      dateSouhaitee,
      heureSouhaitee
    } = req.body
    
    // Format de l'heure (facultatif mais doit être valide si fourni)
    if (heureSouhaitee && !heureSouhaitee.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
      return res.status(400).json({ error: 'Le format de l\'heure doit être HH:MM' });
    }

    // serviceId is an Int (autoincrement), createdById is a String (UUID) in Prisma schema.
    // Do NOT parseInt the createdById. Instead prefer the authenticated user id from middleware.
    const serviceIdInt = serviceId !== undefined && serviceId !== null ? parseInt(serviceId, 10) : null

    // Prefer server-side authenticated user id (safer) but fall back to body.createdById if provided.
    const authUserId = req.user && req.user.id ? req.user.id : null
    const createdByIdStr = authUserId || createdById || null

    // Validation étendue
    if (!createdByIdStr) {
      return res.status(400).json({ error: 'L\'utilisateur (createdById) est requis' })
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res.status(400).json({
        error: 'Les informations de contact sont obligatoires'
      })
    }

    // Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: createdByIdStr }
    })

    if (!userExists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
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
        // Assurer que la nouvelle demande est marquée en attente par défaut
        statut: 'en attente',
        nombreArtisans: nombreArtisans || 'UNIQUE',
        createdById: createdByIdStr,
        propertyId: propertyId,
        dateSouhaitee: req.body.dateSouhaitee ? new Date(req.body.dateSouhaitee + 'T00:00:00.000Z') : null,
        heureSouhaitee: req.body.heureSouhaitee || null
      },
      include: {
        service: {
          // Select explicit fields to avoid selecting a non-existent `devis` column in the DB
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
        }
      }
    })

    res.status(201).json({
      message: 'Demande créée avec succès',
      demande: nouvelleDemande
    })
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error)
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Référence invalide' })
    }
    
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/demandes/immobilier/:id/history - Ajouter une entrée d'historique pour une demande
router.post('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { entry } = req.body;
    if (!entry) return res.status(400).json({ error: 'entry required' });

    // For now, we do a lightweight implementation: return the given entry as the server history.
    // TODO: persist to DB (add DemandeHistory model) for real persistence.
    const serverHistory = [entry];
    res.status(201).json({ history: serverHistory });
  } catch (err) {
    console.error('Erreur saving history', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router