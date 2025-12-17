// routes/rendez_vous.js - VERSION CORRIGÉE
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Créer un rendez-vous entreprise
router.post('/rendez-vous-entreprise', async (req, res) => {
  try {
    const {
      nomComplet,
      email,
      telephone,
      projetDetails,
      dateChoisie,
      heureChoisie,
      userId
    } = req.body;

    if (!nomComplet || !email || !telephone || !dateChoisie || !heureChoisie) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide"
      });
    }

    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }
    }

    const rendezvous = await prisma.rendezvousEntreprise.create({
      data: {
        nomComplet,
        email,
        telephone,
        projetDetails: projetDetails || null,
        dateChoisie,
        heureChoisie,
        userId: userId || null,
        etat: 'nouveau'
      }
    });

    res.status(201).json({
      success: true,
      message: "Rendez-vous enregistré avec succès",
      data: rendezvous
    });
  } catch (error) {
    console.error('Erreur création rendez-vous entreprise:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "Un rendez-vous similaire existe déjà"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement"
    });
  }
});

// Récupérer tous les rendez-vous entreprise
router.get('/rendez-vous-entreprise', async (req, res) => {
  try {
    const { 
      etat, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;
    
    const where = {};
    
    if (etat && etat !== 'tous') {
      where.etat = etat;
    }
    
    if (search) {
      where.OR = [
        { nomComplet: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [rendezvous, total] = await Promise.all([
      prisma.rendezvousEntreprise.findMany({
        where,
        orderBy: { creeLe: 'desc' },
        skip,
        take,
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.rendezvousEntreprise.count({ where })
    ]);
    
    res.json({ 
      success: true, 
      data: rendezvous,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération rendez-vous entreprise:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur'
    });
  }
});

// Récupérer un rendez-vous par ID
router.get('/rendez-vous-entreprise/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rendezvous = await prisma.rendezvousEntreprise.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!rendezvous) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    res.json({ 
      success: true, 
      data: rendezvous 
    });
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur'
    });
  }
});

// AJOUTER CES NOUVELLES ROUTES POUR CONFIRMER ET ANNULER

// Confirmer un rendez-vous
router.put('/rendez-vous-entreprise/:id/confirmer', async (req, res) => {
  try {
    const { id } = req.params;

    const existingRendezVous = await prisma.rendezvousEntreprise.findUnique({
      where: { id }
    });

    if (!existingRendezVous) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    const updatedRendezVous = await prisma.rendezvousEntreprise.update({
      where: { id },
      data: {
        etat: 'confirme'
      }
    });

    res.json({
      success: true,
      message: "Rendez-vous confirmé avec succès",
      data: updatedRendezVous
    });
  } catch (error) {
    console.error('Erreur confirmation rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation"
    });
  }
});

// Annuler un rendez-vous
router.put('/rendez-vous-entreprise/:id/annuler', async (req, res) => {
  try {
    const { id } = req.params;

    const existingRendezVous = await prisma.rendezvousEntreprise.findUnique({
      where: { id }
    });

    if (!existingRendezVous) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    const updatedRendezVous = await prisma.rendezvousEntreprise.update({
      where: { id },
      data: {
        etat: 'annule'
      }
    });

    res.json({
      success: true,
      message: "Rendez-vous annulé avec succès",
      data: updatedRendezVous
    });
  } catch (error) {
    console.error('Erreur annulation rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation"
    });
  }
});

// CORRIGER LA ROUTE DE MISE À JOUR GÉNÉRIQUE
router.put('/rendez-vous-entreprise/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { etat, projetDetails } = req.body;

    const existingRendezVous = await prisma.rendezvousEntreprise.findUnique({
      where: { id }
    });

    if (!existingRendezVous) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    // CORRECTION : Ajouter 'confirme' aux états valides
    const etatsValides = ['nouveau', 'confirme', 'annule'];
    if (etat && !etatsValides.includes(etat)) {
      return res.status(400).json({
        success: false,
        message: `État invalide. Choisissez parmi: ${etatsValides.join(', ')}`
      });
    }

    const updatedRendezVous = await prisma.rendezvousEntreprise.update({
      where: { id },
      data: {
        etat: etat || existingRendezVous.etat,
        projetDetails: projetDetails || existingRendezVous.projetDetails
      }
    });

    res.json({
      success: true,
      message: "Rendez-vous mis à jour avec succès",
      data: updatedRendezVous
    });
  } catch (error) {
    console.error('Erreur mise à jour rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour"
    });
  }
});

// Supprimer un rendez-vous
router.delete('/rendez-vous-entreprise/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingRendezVous = await prisma.rendezvousEntreprise.findUnique({
      where: { id }
    });

    if (!existingRendezVous) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    await prisma.rendezvousEntreprise.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès"
    });
  } catch (error) {
    console.error('Erreur suppression rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression"
    });
  }
});

// Récupérer les rendez-vous d'un utilisateur
router.get('/rendez-vous-entreprise/utilisateur/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const rendezvous = await prisma.rendezvousEntreprise.findMany({
      where: { userId },
      orderBy: { creeLe: 'desc' },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      data: rendezvous 
    });
  } catch (error) {
    console.error('Erreur récupération rendez-vous utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur'
    });
  }
});

// Statistiques - À CORRIGER AUSSI
router.get('/rendez-vous-entreprise/statistiques', async (req, res) => {
  try {
    const total = await prisma.rendezvousEntreprise.count();
    const nouveau = await prisma.rendezvousEntreprise.count({ where: { etat: 'nouveau' } });
    const confirme = await prisma.rendezvousEntreprise.count({ where: { etat: 'confirme' } });
    const annule = await prisma.rendezvousEntreprise.count({ where: { etat: 'annule' } });

    const septJours = new Date();
    septJours.setDate(septJours.getDate() - 7);
    
    const recent = await prisma.rendezvousEntreprise.count({
      where: {
        creeLe: {
          gte: septJours
        }
      }
    });

    res.json({
      success: true,
      data: {
        total,
        parEtat: {
          nouveau,
          confirme, // Changé de 'traite' à 'confirme'
          annule
        },
        recent7Jours: recent
      }
    });
  } catch (error) {
    console.error('Erreur statistiques rendez-vous:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;