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

    // Générer un numéro unique pour le devis
    const date = new Date();
    const numero = `DEV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Si aucun prestataire n'est spécifié, on prend le premier administrateur comme prestataire par défaut
    const defaultPrestataire = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!prestataireId && !defaultPrestataire) {
      return res.status(400).json({ error: 'Aucun prestataire disponible pour traiter la demande' });
    }

    // Créer le devis directement
    const devis = await prisma.devis.create({
      data: {
        numero,
        description,
        dateValidite: dateSouhaitee ? new Date(dateSouhaitee) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Par défaut valide 30 jours
        status: 'en_attente',
        montantHT: 0, // Sera mis à jour par le prestataire
        montantTTC: 0, // Sera mis à jour par le prestataire
        tva: 20, // Taux par défaut
        conditions: "À définir par le prestataire",
        client: {
          connect: { id: req.user.id }
        },
        prestataire: {
          connect: { id: prestataireId || defaultPrestataire.id }
        }
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
        }
      }
    });

    res.status(201).json({
      message: 'Devis créé avec succès',
      devis: devis
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
    const { role } = req.query;

    // Vérifier que l'utilisateur demande ses propres devis
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // D'abord, récupérer toutes les demandes associées à l'utilisateur
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [
          // Si l'utilisateur est un professionnel, chercher les demandes qui lui sont assignées
          ...(role === 'professional' ? [{
            artisans: {
              some: {
                userId: userId
              }
            }
          }] : []),
          // Si l'utilisateur est un client, chercher ses demandes
          ...(role !== 'professional' ? [{
            createdById: userId
          }] : [])
        ]
      },
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

    // Ensuite, récupérer les devis associés
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

    // Combiner et transformer les données pour le frontend
    const transformedData = {
      demandes: demandes.map(demande => ({
        id: demande.id,
        type: 'demande',
        statut: demande.statut || 'en_attente',
        description: demande.description,
        date: demande.createdAt,
        serviceId: demande.serviceId,
        service: demande.service,
        contactNom: demande.contactNom,
        contactPrenom: demande.contactPrenom,
        contactEmail: demande.contactEmail,
        contactTel: demande.contactTel,
        lieuAdresse: demande.lieuAdresse,
        dateSouhaitee: demande.dateSouhaitee,
        typeBien: demande.typeBien
      })),
      devis: devis.map(d => ({
        id: d.id,
        type: 'devis',
        numero: d.numero,
        status: d.status,
        montantHT: d.montantHT,
        montantTTC: d.montantTTC,
        dateCreation: d.dateCreation,
        dateValidite: d.dateValidite,
        client: d.client,
        prestataire: d.prestataire,
        demande: d.demande
      }))
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des devis' });
  }
});

module.exports = router;