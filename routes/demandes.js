const express = require('express')
const router = express.Router()

const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db')


// GET /api/demandes - Récupérer les demandes de l'utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { status, metier, service } = req.query

    let whereClause = { createdById: userId,NOT :{propertyId:null}}
    
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map(demande => {
      const artisansAcceptes = demande.artisans.filter(a => a.accepte)
        // Correction : on utilise TOUJOURS la valeur du champ statut si c'est une string non null/undefined
        const statut = (typeof demande.statut === 'string' && demande.statut.trim() !== '')
          ? demande.statut
          : (demande.demandeAcceptee ? 'Terminé'
              : artisansAcceptes.length > 0 ? 'Devis reçus'
              : demande.artisans.length > 0 ? 'En cours'
              : 'En attente');

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
        createdAt: demande.createdAt,
        propertyId: demande.propertyId,
        dateSouhaitee: demande.dateSouhaitee,
        heureSouhaitee: demande.heureSouhaitee
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
      devis, // <-- NOUVEAU CHAMP
      propertyId,
    } = req.body

    // serviceId is an Int (autoincrement), createdById is a String (UUID) in Prisma schema.
    // Do NOT parseInt the createdById. Instead prefer the authenticated user id from middleware.
    const serviceIdInt = serviceId !== undefined && serviceId !== null ? parseInt(serviceId, 10) : null

    // Prefer server-side authenticated user id (safer) but fall back to body.createdById if provided.
    const authUserId = req.user && req.user.id ? req.user.id : null
    const createdByIdStr = authUserId || createdById || null

    // Validation étendue
    if (!serviceIdInt || Number.isNaN(serviceIdInt)) {
      return res.status(400).json({ 
        error: 'Le service est obligatoire et doit être un identifiant numérique valide' 
      })
    }

    if (!createdByIdStr) {
      return res.status(400).json({ error: 'L\'utilisateur (createdById) est requis' })
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res.status(400).json({
        error: 'Les informations de contact sont obligatoires'
      })
    }
    // Vérifier que le service existe (select minimal fields to avoid DB column mismatch)
    const serviceExists = await prisma.service.findUnique({
      where: { id: serviceIdInt },
      select: { id: true }
    })

    if (!serviceExists) {
      return res.status(404).json({ error: 'Service non trouvé' })
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
        serviceId: serviceIdInt,
        // Assurer que la nouvelle demande est marquée en attente par défaut
        statut: 'en attente',
        nombreArtisans: nombreArtisans || 'UNIQUE',
        createdById: createdByIdStr,
        propertyId:propertyId
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