const { PrismaClient } = require('@prisma/client');
const { sendInvestmentConfirmationEmail } = require('../services/emailService.js');

const prisma = new PrismaClient();

const investmentController = {
  // Soumettre une demande d'investissement
  async createDemande(req, res) {
    try {
      const {
        nom,
        email,
        telephone,
        paysInteret,
        typeInvestissement,
        budget,
        message,
        userId // Optionnel - si utilisateur connecté
      } = req.body;

      // Validation des champs requis
      if (!nom || !email || !paysInteret || !typeInvestissement) {
        return res.status(400).json({
          success: false,
          error: 'Les champs nom, email, pays d\'intérêt et type d\'investissement sont obligatoires'
        });
      }

      // Validation des pays autorisés
      const paysAutorises = ['maurice', 'madagascar', 'dubai', 'portugal'];
      if (!paysAutorises.includes(paysInteret)) {
        return res.status(400).json({
          success: false,
          error: 'Pays d\'intérêt non valide'
        });
      }

      // Créer la demande
      const nouvelleDemande = await prisma.investmentRequest.create({
        data: {
          nom,
          email,
          telephone: telephone || '',
          pays_interet: paysInteret,
          type_investissement: typeInvestissement,
          budget: budget || '',
          message: message || '',
          userId: userId || null
        }
      });

      // Envoyer email de confirmation
      try {
        await sendInvestmentConfirmationEmail({
          to: email,
          nom,
          paysInteret,
          typeInvestissement,
          budget,
          message
        });
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }

      // Envoyer notification en temps réel si WebSocket disponible
      if (req.io) {
        req.io.emit('new-investment-request', {
          id: nouvelleDemande.id,
          nom,
          paysInteret,
          typeInvestissement,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Votre demande a été envoyée avec succès. Notre équipe vous contactera dans les 24h.',
        data: nouvelleDemande
      });

    } catch (error) {
      console.error('Erreur soumission demande:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi de votre demande'
      });
    }
  },

  // Récupérer toutes les demandes (Admin seulement)
  async getAllDemandes(req, res) {
    try {
      const { page = 1, limit = 10, status, pays } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construction du filtre
      const where = {};
      if (status) where.status = status;
      if (pays) where.pays_interet = pays;

      const [demandes, total] = await Promise.all([
        prisma.investmentRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.investmentRequest.count({ where })
      ]);
      
      res.json({
        success: true,
        data: demandes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Erreur récupération demandes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des demandes'
      });
    }
  },

  // Récupérer une demande spécifique
  async getDemandeById(req, res) {
    try {
      const { id } = req.params;
      const demande = await prisma.investmentRequest.findUnique({
        where: { id },
        include: {
          user: {
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
      
      if (!demande) {
        return res.status(404).json({
          success: false,
          error: 'Demande non trouvée'
        });
      }

      res.json({
        success: true,
        data: demande
      });
    } catch (error) {
      console.error('Erreur récupération demande:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la demande'
      });
    }
  },

  // Mettre à jour le statut d'une demande (Admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const statutsValides = ['en_attente', 'en_cours', 'traite', 'annule'];
      if (!statutsValides.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Statut invalide. Valeurs acceptées: ' + statutsValides.join(', ')
        });
      }

      const demande = await prisma.investmentRequest.update({
        where: { id },
        data: { 
          status,
          ...(notes && { notes })
        }
      });

      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: demande
      });
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut'
      });
    }
  },

  // Statistiques des demandes (Admin)
  async getStats(req, res) {
    try {
      const statsByStatus = await prisma.investmentRequest.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      });

      const statsByPays = await prisma.investmentRequest.groupBy({
        by: ['pays_interet'],
        _count: {
          _all: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      const statsByType = await prisma.investmentRequest.groupBy({
        by: ['type_investissement'],
        _count: {
          _all: true
        }
      });

      const totalDemandes = await prisma.investmentRequest.count();
      const demandesCeMois = await prisma.investmentRequest.count({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      // Dernières demandes
      const recentDemandes = await prisma.investmentRequest.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: {
          total: totalDemandes,
          ceMois: demandesCeMois,
          parStatut: statsByStatus,
          parPays: statsByPays,
          parType: statsByType,
          recentes: recentDemandes
        }
      });
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  },

  // Supprimer une demande (Admin)
  async deleteDemande(req, res) {
    try {
      const { id } = req.params;

      const demande = await prisma.investmentRequest.findUnique({
        where: { id }
      });

      if (!demande) {
        return res.status(404).json({
          success: false,
          error: 'Demande non trouvée'
        });
      }

      await prisma.investmentRequest.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Demande supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression demande:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la demande'
      });
    }
  },

  // Récupérer les demandes d'un utilisateur spécifique
  async getMyDemandes(req, res) {
    try {
      const userId = req.user.id; // Supposant que l'utilisateur est authentifié
      
      const demandes = await prisma.investmentRequest.findMany({
        where: { userId },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        data: demandes
      });
    } catch (error) {
      console.error('Erreur récupération demandes utilisateur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de vos demandes'
      });
    }
  },

  // Rechercher des demandes (Admin)
  async searchDemandes(req, res) {
    try {
      const { q, pays, type, status, dateFrom, dateTo } = req.query;
      
      const where = {};
      
      if (q) {
        where.OR = [
          { nom: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { message: { contains: q, mode: 'insensitive' } }
        ];
      }
      
      if (pays) where.pays_interet = pays;
      if (type) where.type_investissement = type;
      if (status) where.status = status;
      
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at.gte = new Date(dateFrom);
        if (dateTo) where.created_at.lte = new Date(dateTo);
      }

      const demandes = await prisma.investmentRequest.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        data: demandes,
        count: demandes.length
      });
    } catch (error) {
      console.error('Erreur recherche demandes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche des demandes'
      });
    }
  }
};

module.exports = { investmentController };