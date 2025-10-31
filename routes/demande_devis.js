const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { prisma } = require('../lib/db');

// Créer une nouvelle demande de devis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      serviceId,
      description,
      dateSouhaitee,
      lieuAdresse,
      lieuAdresseCp,
      lieuAdresseVille,
      contactNom,
      contactPrenom,
      contactEmail,
      contactTel,
      contactAdresse,
      contactAdresseCp,
      contactAdresseVille,
      prestataireId // ID du prestataire sélectionné
    } = req.body;

    // Créer d'abord la demande
    const demande = await prisma.demande.create({
      data: {
        description,
        dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : null,
        lieuAdresse,
        lieuAdresseCp,
        lieuAdresseVille,
        contactNom,
        contactPrenom,
        contactEmail,
        contactTel,
        contactAdresse,
        contactAdresseCp,
        contactAdresseVille,
        serviceId: serviceId ? parseInt(serviceId) : null,
        createdById: req.user.id,
        statut: 'en_attente',
        nombreArtisans: 'UNIQUE'
      }
    });

    // Si un prestataire est spécifié, créer l'association DemandeArtisan
    if (prestataireId) {
      await prisma.demandeArtisan.create({
        data: {
          userId: prestataireId,
          demandeId: demande.id,
          accepte: false
        }
      });
    }

    // Retourner la demande créée avec ses relations
    const demandeComplete = await prisma.demande.findUnique({
      where: { id: demande.id },
      include: {
        service: true,
        artisans: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Demande de devis créée avec succès',
      demande: demandeComplete
    });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de devis:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande de devis' });
  }
});

// Répondre à une demande de devis (pour les prestataires)
router.post('/:demandeId/reponse', authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const {
      montantHT,
      tva,
      description,
      conditions,
      dateValidite
    } = req.body;

    // Vérifier que le prestataire est bien associé à la demande
    const demandeArtisan = await prisma.demandeArtisan.findUnique({
      where: {
        userId_demandeId: {
          userId: req.user.id,
          demandeId: parseInt(demandeId)
        }
      }
    });

    if (!demandeArtisan) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à répondre à cette demande' });
    }

    // Calculer le montant TTC
    const montantTTC = montantHT * (1 + tva / 100);

    // Générer un numéro unique pour le devis
    const date = new Date();
    const numero = `DEV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Créer le devis
    const devis = await prisma.devis.create({
      data: {
        numero,
        montantHT,
        montantTTC,
        tva,
        description,
        conditions,
        dateValidite: new Date(dateValidite),
        clientId: req.user.id, // L'utilisateur qui a fait la demande
        prestataireId: req.user.id,
        demandeId: parseInt(demandeId),
        status: 'en_attente'
      }
    });

    // Mettre à jour le statut de la demande
    await prisma.demande.update({
      where: { id: parseInt(demandeId) },
      data: { statut: 'devis_envoye' }
    });

    res.status(201).json({
      message: 'Devis créé avec succès',
      devis
    });
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error);
    res.status(500).json({ error: 'Erreur lors de la création du devis' });
  }
});

// Accepter ou refuser un devis (pour le client)
router.patch('/:devisId/reponse', authenticateToken, async (req, res) => {
  try {
    const { devisId } = req.params;
    const { status } = req.body;

    if (!['accepte', 'refuse'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier que l'utilisateur est bien le client du devis
    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: { demande: true }
    });

    if (!devis) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    if (devis.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier ce devis' });
    }

    // Mettre à jour le devis
    const devisUpdated = await prisma.devis.update({
      where: { id: devisId },
      data: { status }
    });

    // Si le devis est accepté, mettre à jour la demande
    if (status === 'accepte') {
      await prisma.demande.update({
        where: { id: devis.demandeId },
        data: { 
          statut: 'devis_accepte',
          demandeAcceptee: true
        }
      });
    }

    res.json({
      message: 'Réponse au devis enregistrée avec succès',
      devis: devisUpdated
    });
  } catch (error) {
    console.error('Erreur lors de la réponse au devis:', error);
    res.status(500).json({ error: 'Erreur lors de la réponse au devis' });
  }
});

// Obtenir tous les devis pour un utilisateur (qu'il soit client ou prestataire)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur demande ses propres devis
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const devis = await prisma.devis.findMany({
      where: {
        OR: [
          { clientId: userId },
          { prestataireId: userId }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        prestataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true
          }
        },
        demande: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    res.json(devis);
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des devis' });
  }
});

module.exports = router;