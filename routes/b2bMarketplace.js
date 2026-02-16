import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// GÉNÉRATEURS DE NUMÉROS UNIQUES
// ============================================
const generateNumeroAO = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AO-${year}-${random}`;
};

const generateNumeroRAO = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RAO-${year}-${random}`;
};

// ============================================
// 1. APPELS D'OFFRES (Acheteur Pro)
// ============================================

// Créer un appel d'offres
router.post('/appels-offre', authenticateToken, async (req, res) => {
  try {
    const {
      titre,
      description,
      dateLimite,
      budgetMin,
      budgetMax,
      typePrestation,
      dureeEstimee,
      lieuIntervention,
      estUrgent,
      visibilite,
      piecesJointes,
      metierId,
      serviceId
    } = req.body;

    // 1. Créer la Demande de base
    const demande = await prisma.demande.create({
      data: {
        description: description || titre,
        createdById: req.user.id,
        metierId: metierId ? parseInt(metierId) : null,
        serviceId: serviceId ? parseInt(serviceId) : null,
        statut: 'appel_offre',
        createdAt: new Date()
      }
    });

    // 2. Créer l'Appel d'Offre
    const appelOffre = await prisma.appelOffre.create({
      data: {
        numero: generateNumeroAO(),
        demandeId: demande.id,
        titre,
        description,
        dateLimite: new Date(dateLimite),
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        typePrestation,
        dureeEstimee,
        lieuIntervention,
        estUrgent: estUrgent || false,
        visibilite: visibilite || 'tous',
        piecesJointes: piecesJointes || [],
        metierId: metierId ? parseInt(metierId) : null,
        serviceId: serviceId ? parseInt(serviceId) : null,
        statut: 'ouvert'
      },
      include: {
        demande: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                commercialName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // 3. Créer une notification pour les pros concernés
    await prisma.notification.create({
      data: {
        type: 'APPEL_OFFRE_NOUVEAU',
        title: 'Nouvel appel d\'offres',
        message: `${appelOffre.titre} - ${appelOffre.budgetMax ? `Budget: ${appelOffre.budgetMax}€` : ''}`,
        relatedEntity: 'AppelOffre',
        relatedEntityId: appelOffre.id,
        userProprietaireId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: appelOffre,
      message: 'Appel d\'offres créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création appel offre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'appel d\'offres',
      details: error.message
    });
  }
});

// Récupérer les appels d'offres (avec filtres)
router.get('/appels-offre', authenticateToken, async (req, res) => {
  try {
    const {
      statut,
      type,
      urgent,
      metier,
      search,
      limit = 20,
      offset = 0,
      sort = 'dateLimite',
      order = 'asc'
    } = req.query;

    const where = {};

    if (statut && statut !== 'all') where.statut = statut;
    if (type && type !== 'all') where.typePrestation = type;
    if (urgent === 'true') where.estUrgent = true;
    if (metier) where.metierId = parseInt(metier);
    
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Si c'est un pro, on montre les appels ouverts
    // Si c'est un acheteur, on montre SES appels
    if (req.user.role === 'professional' || req.user.userType === 'professional') {
      if (req.query.mesAppels === 'true') {
        where.demande = { createdById: req.user.id };
      } else {
        where.statut = 'ouvert';
        where.dateLimite = { gt: new Date() };
      }
    }

    const [appelsOffre, total] = await Promise.all([
      prisma.appelOffre.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          demande: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  commercialName: true,
                  email: true,
                  phone: true,
                  avatar: true,
                  siret: true,
                  ville: true
                }
              }
            }
          },
          metier: true,
          service: true,
          reponses: req.user.role === 'professional' ? {
            where: { prestataireId: req.user.id },
            select: { id: true, statut: true, montantPropose: true }
          } : false,
          _count: {
            select: {
              reponses: true,
              vues: true,
              favoris: true
            }
          }
        }
      }),
      prisma.appelOffre.count({ where })
    ]);

    // Enregistrer la vue si c'est un pro qui consulte
    if (req.user.role === 'professional' && req.query.mesAppels !== 'true') {
      for (const appel of appelsOffre) {
        await prisma.appelOffreVue.upsert({
          where: {
            appelOffreId_professionnelId: {
              appelOffreId: appel.id,
              professionnelId: req.user.id
            }
          },
          update: { vuLe: new Date() },
          create: {
            appelOffreId: appel.id,
            professionnelId: req.user.id
          }
        });
      }
    }

    res.json({
      success: true,
      data: appelsOffre,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération appels offre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des appels d\'offres',
      details: error.message
    });
  }
});

// Récupérer un appel d'offres spécifique
router.get('/appels-offre/:id', authenticateToken, async (req, res) => {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { id: req.params.id },
      include: {
        demande: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                commercialName: true,
                email: true,
                phone: true,
                avatar: true,
                siret: true,
                address: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        metier: true,
        service: true,
        reponses: {
          include: {
            prestataire: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                commercialName: true,
                avatar: true,
                siret: true,
                city: true
              }
            }
          }
        },
        _count: {
          select: {
            reponses: true,
            vues: true,
            favoris: true
          }
        }
      }
    });

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        error: 'Appel d\'offres non trouvé'
      });
    }

    // Vérifier les permissions
    const isOwner = appelOffre.demande.createdById === req.user.id;
    const isProfessional = req.user.role === 'professional' || req.user.userType === 'professional';

    if (!isOwner && !isProfessional) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    // Enregistrer la vue
    if (isProfessional && !isOwner) {
      await prisma.appelOffreVue.upsert({
        where: {
          appelOffreId_professionnelId: {
            appelOffreId: appelOffre.id,
            professionnelId: req.user.id
          }
        },
        update: { vuLe: new Date() },
        create: {
          appelOffreId: appelOffre.id,
          professionnelId: req.user.id
        }
      });
    }

    res.json({
      success: true,
      data: appelOffre
    });
  } catch (error) {
    console.error('Erreur récupération appel offre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'appel d\'offres',
      details: error.message
    });
  }
});

// Mettre à jour un appel d'offres
router.put('/appels-offre/:id', authenticateToken, async (req, res) => {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { id: req.params.id },
      include: { demande: true }
    });

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        error: 'Appel d\'offres non trouvé'
      });
    }

    if (appelOffre.demande.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à modifier cet appel d\'offres'
      });
    }

    if (appelOffre.statut !== 'ouvert') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de modifier un appel d\'offres qui n\'est plus ouvert'
      });
    }

    const updated = await prisma.appelOffre.update({
      where: { id: req.params.id },
      data: {
        titre: req.body.titre,
        description: req.body.description,
        dateLimite: req.body.dateLimite ? new Date(req.body.dateLimite) : undefined,
        budgetMin: req.body.budgetMin ? parseFloat(req.body.budgetMin) : null,
        budgetMax: req.body.budgetMax ? parseFloat(req.body.budgetMax) : null,
        typePrestation: req.body.typePrestation,
        dureeEstimee: req.body.dureeEstimee,
        lieuIntervention: req.body.lieuIntervention,
        estUrgent: req.body.estUrgent,
        visibilite: req.body.visibilite,
        piecesJointes: req.body.piecesJointes,
        statut: req.body.statut
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Appel d\'offres mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour appel offre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'appel d\'offres',
      details: error.message
    });
  }
});

// ============================================
// 2. RÉPONSES AUX APPELS D'OFFRES (Prestataire)
// ============================================

// Répondre à un appel d'offres
router.post('/appels-offre/:id/repondre', authenticateToken, async (req, res) => {
  try {
    const {
      montantPropose,
      tva = 20,
      delaiPropose,
      validiteOffre = 30,
      message,
      piecesJointes
    } = req.body;

    const appelOffre = await prisma.appelOffre.findUnique({
      where: { id: req.params.id },
      include: { demande: true }
    });

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        error: 'Appel d\'offres non trouvé'
      });
    }

    if (appelOffre.statut !== 'ouvert') {
      return res.status(400).json({
        success: false,
        error: 'Cet appel d\'offres n\'est plus ouvert aux réponses'
      });
    }

    if (appelOffre.dateLimite < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'La date limite de réponse est dépassée'
      });
    }

    if (appelOffre.demande.createdById === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas répondre à votre propre appel d\'offres'
      });
    }

    // Vérifier si déjà répondu
    const existingResponse = await prisma.reponseAppelOffre.findUnique({
      where: {
        appelOffreId_prestataireId: {
          appelOffreId: appelOffre.id,
          prestataireId: req.user.id
        }
      }
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà répondu à cet appel d\'offres'
      });
    }

    // Créer un devis
    const montantTTC = parseFloat(montantPropose) * (1 + parseFloat(tva) / 100);
    
    const devis = await prisma.devis.create({
      data: {
        numero: `DEV-${Date.now()}`,
        clientId: appelOffre.demande.createdById,
        prestataireId: req.user.id,
        demandeId: appelOffre.demandeId,
        montantHT: parseFloat(montantPropose),
        montantTTC,
        tva: parseFloat(tva),
        description: `Réponse à l'appel d'offres: ${appelOffre.titre}`,
        status: 'envoye',
        dateValidite: new Date(Date.now() + validiteOffre * 24 * 60 * 60 * 1000)
      }
    });

    // Créer la réponse
    const reponse = await prisma.reponseAppelOffre.create({
      data: {
        numero: generateNumeroRAO(),
        appelOffreId: appelOffre.id,
        prestataireId: req.user.id,
        devisId: devis.id,
        montantPropose: parseFloat(montantPropose),
        tva: parseFloat(tva),
        montantTTC,
        delaiPropose,
        validiteOffre: parseInt(validiteOffre),
        message,
        piecesJointes: piecesJointes || [],
        statut: 'en_attente'
      },
      include: {
        prestataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true,
            avatar: true
          }
        }
      }
    });

    // Notification à l'acheteur
    await prisma.notification.create({
      data: {
        type: 'APPEL_OFFRE_REPONSE',
        title: 'Nouvelle réponse à votre appel d\'offres',
        message: `${reponse.prestataire.companyName || reponse.prestataire.commercialName || 'Un professionnel'} a répondu à "${appelOffre.titre}"`,
        relatedEntity: 'ReponseAppelOffre',
        relatedEntityId: reponse.id,
        userId: appelOffre.demande.createdById
      }
    });

    res.status(201).json({
      success: true,
      data: reponse,
      devis,
      message: 'Votre réponse a été envoyée avec succès'
    });
  } catch (error) {
    console.error('Erreur réponse appel offre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de la réponse',
      details: error.message
    });
  }
});

// Obtenir les réponses de l'utilisateur
router.get('/mes-reponses', authenticateToken, async (req, res) => {
  try {
    const reponses = await prisma.reponseAppelOffre.findMany({
      where: { prestataireId: req.user.id },
      include: {
        appelOffre: {
          include: {
            demande: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    companyName: true,
                    commercialName: true,
                    email: true
                  }
                }
              }
            },
            metier: true
          }
        },
        devis: true
      },
      orderBy: { dateReponse: 'desc' }
    });

    res.json({
      success: true,
      data: reponses
    });
  } catch (error) {
    console.error('Erreur récupération réponses:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de vos réponses',
      details: error.message
    });
  }
});

// Sélectionner une réponse (acheteur)
router.put('/reponses/:id/selectionner', authenticateToken, async (req, res) => {
  try {
    const reponse = await prisma.reponseAppelOffre.findUnique({
      where: { id: req.params.id },
      include: {
        appelOffre: {
          include: { demande: true }
        }
      }
    });

    if (!reponse) {
      return res.status(404).json({
        success: false,
        error: 'Réponse non trouvée'
      });
    }

    if (reponse.appelOffre.demande.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'êtes pas autorisé à sélectionner cette réponse'
      });
    }

    if (reponse.appelOffre.statut !== 'ouvert') {
      return res.status(400).json({
        success: false,
        error: 'Cet appel d\'offres n\'est plus ouvert'
      });
    }

    // Mettre à jour le statut de la réponse
    await prisma.reponseAppelOffre.update({
      where: { id: req.params.id },
      data: {
        statut: 'selectionne',
        dateSelection: new Date()
      }
    });

    // Mettre à jour l'appel d'offres
    await prisma.appelOffre.update({
      where: { id: reponse.appelOffreId },
      data: { statut: 'en_cours' }
    });

    // Rejeter les autres réponses
    await prisma.reponseAppelOffre.updateMany({
      where: {
        appelOffreId: reponse.appelOffreId,
        id: { not: req.params.id }
      },
      data: { statut: 'refuse' }
    });

    // Notification au prestataire
    await prisma.notification.create({
      data: {
        type: 'APPEL_OFFRE_SELECTIONNE',
        title: 'Votre offre a été sélectionnée !',
        message: `Votre réponse à "${reponse.appelOffre.titre}" a été sélectionnée.`,
        relatedEntity: 'ReponseAppelOffre',
        relatedEntityId: reponse.id,
        userId: reponse.prestataireId
      }
    });

    res.json({
      success: true,
      message: 'Offre sélectionnée avec succès'
    });
  } catch (error) {
    console.error('Erreur sélection réponse:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sélection de l\'offre',
      details: error.message
    });
  }
});

// ============================================
// 3. CATALOGUE B2B (Services pros)
// ============================================

// Publier une offre dans le catalogue B2B
router.post('/catalogue', authenticateToken, async (req, res) => {
  try {
    const {
      serviceId,
      titre,
      description,
      prixHT,
      tva = 20,
      unite,
      delaiMoyen,
      zoneIntervention,
      competences,
      images,
      garantie,
      certification
    } = req.body;

    // Vérifier si le service existe
    let service;
    if (serviceId) {
      service = await prisma.service.findUnique({
        where: { id: parseInt(serviceId) }
      });
    }

    // Si pas de serviceId, créer un service personnalisé
    if (!service) {
      service = await prisma.service.create({
        data: {
          libelle: titre,
          description: description || '',
          type: 'b2b',
          isCustom: true,
          isActive: true,
          createdById: req.user.id,
          price: prixHT || 0,
          categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : null,
          tags: competences || []
        }
      });
    }

    const prixTTC = parseFloat(prixHT) * (1 + parseFloat(tva) / 100);

    const catalogue = await prisma.catalogueB2B.upsert({
      where: { serviceId: service.id },
      update: {
        titre,
        description: description || service.description,
        prixHT: parseFloat(prixHT),
        prixTTC,
        tva: parseFloat(tva),
        unite,
        delaiMoyen,
        zoneIntervention,
        competences,
        images,
        garantie,
        certification,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        serviceId: service.id,
        professionnelId: req.user.id,
        titre,
        description: description || service.description,
        prixHT: parseFloat(prixHT),
        prixTTC,
        tva: parseFloat(tva),
        unite,
        delaiMoyen,
        zoneIntervention,
        competences,
        images,
        garantie,
        certification
      },
      include: {
        service: true,
        professionnel: {
          select: {
            id: true,
            companyName: true,
            commercialName: true,
            avatar: true,
            siret: true,
            city: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: catalogue,
      message: serviceId ? 'Offre mise à jour avec succès' : 'Offre publiée avec succès'
    });
  } catch (error) {
    console.error('Erreur publication catalogue:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la publication de l\'offre',
      details: error.message
    });
  }
});

// Récupérer le catalogue B2B
router.get('/catalogue', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      zone,
      prixMin,
      prixMax,
      limit = 20,
      offset = 0
    } = req.query;

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { competences: { has: search } }
      ];
    }

    if (zone) {
      where.zoneIntervention = { has: zone };
    }

    if (prixMin || prixMax) {
      where.prixTTC = {};
      if (prixMin) where.prixTTC.gte = parseFloat(prixMin);
      if (prixMax) where.prixTTC.lte = parseFloat(prixMax);
    }

    // Filtrer par professionnel si demandé
    if (req.query.professionnelId) {
      where.professionnelId = req.query.professionnelId;
    }

    const [catalogue, total] = await Promise.all([
      prisma.catalogueB2B.findMany({
        where,
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: [
          { misEnAvant: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          service: {
            include: {
              category: true
            }
          },
          professionnel: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              commercialName: true,
              avatar: true,
              siret: true,
              city: true,
              phone: true,
              email: true
            }
          }
        }
      }),
      prisma.catalogueB2B.count({ where })
    ]);

    res.json({
      success: true,
      data: catalogue,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération catalogue:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du catalogue',
      details: error.message
    });
  }
});

// ============================================
// 4. COMMANDES B2B
// ============================================

// Créer une commande B2B directe
router.post('/commandes', authenticateToken, async (req, res) => {
  try {
    const {
      catalogueId,
      prestataireId,
      quantite = 1,
      montant,
      message
    } = req.body;

    // Récupérer l'offre du catalogue
    const offre = await prisma.catalogueB2B.findUnique({
      where: { id: catalogueId },
      include: { professionnel: true }
    });

    if (!offre || !offre.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Offre non disponible'
      });
    }

    if (offre.professionnelId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas commander votre propre service'
      });
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        orderNumber: `CMD-B2B-${Date.now()}`,
        userId: req.user.id,
        idPrestataire: offre.professionnelId,
        items: [{
          type: 'catalogue_b2b',
          id: offre.id,
          title: offre.titre,
          price: offre.prixTTC,
          quantity: quantite,
          unit: offre.unite
        }],
        totalAmount: offre.prixTTC * quantite,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'b2b',
        createdAt: new Date()
      }
    });

    // Lier à la table B2B
    await prisma.orderB2B.create({
      data: {
        orderId: order.id,
        type: 'direct',
        conditions: { message, catalogueId, quantite }
      }
    });

    // Créer une conversation
    const conversation = await prisma.conversation.create({
      data: {
        titre: `Commande B2B: ${offre.titre}`,
        createurId: req.user.id,
        participants: {
          create: [
            { userId: req.user.id },
            { userId: offre.professionnelId }
          ]
        }
      }
    });

    // Message initial
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: req.user.id,
        receiverId: offre.professionnelId,
        contenu: message || `Bonjour, je souhaite commander : ${offre.titre} (x${quantite})`,
        type: 'TEXT'
      }
    });

    res.status(201).json({
      success: true,
      data: { order, conversation },
      message: 'Commande créée avec succès'
    });
  } catch (error) {
    console.error('Erreur création commande B2B:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la commande',
      details: error.message
    });
  }
});

// ============================================
// 5. STATISTIQUES B2B
// ============================================

router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isBuyer = req.query.role === 'buyer';

    let stats = {};

    if (isBuyer) {
      // Stats pour acheteur
      const [appelsOffre, commandes] = await Promise.all([
        prisma.appelOffre.count({
          where: {
            demande: { createdById: userId }
          }
        }),
        prisma.order.count({
          where: {
            userId,
            status: { not: 'cancelled' }
          }
        })
      ]);

      stats = {
        appelsOffre: {
          total: appelsOffre,
          ouverts: await prisma.appelOffre.count({
            where: {
              demande: { createdById: userId },
              statut: 'ouvert'
            }
          })
        },
        commandes: {
          total: commandes,
          encours: await prisma.order.count({
            where: {
              userId,
              status: { in: ['pending', 'processing'] }
            }
          })
        }
      };
    } else {
      // Stats pour prestataire
      const [reponses, offresCatalogue, commandesRecues] = await Promise.all([
        prisma.reponseAppelOffre.count({
          where: { prestataireId: userId }
        }),
        prisma.catalogueB2B.count({
          where: { professionnelId: userId }
        }),
        prisma.order.count({
          where: {
            idPrestataire: userId,
            status: { not: 'cancelled' }
          }
        })
      ]);

      stats = {
        reponses: {
          total: reponses,
          enAttente: await prisma.reponseAppelOffre.count({
            where: {
              prestataireId: userId,
              statut: 'en_attente'
            }
          }),
          selectionnees: await prisma.reponseAppelOffre.count({
            where: {
              prestataireId: userId,
              statut: 'selectionne'
            }
          })
        },
        catalogue: {
          total: offresCatalogue,
          actives: await prisma.catalogueB2B.count({
            where: {
              professionnelId: userId,
              isActive: true
            }
          })
        },
        commandesRecues: commandesRecues
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur statistiques B2B:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

export default router;