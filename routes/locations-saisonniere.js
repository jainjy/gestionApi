const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// POST / - Créer une réservation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      propertyId,
      clientId,
      dateDebut,
      dateFin,
      prixTotal,
      nombreAdultes = 2,
      nombreEnfants = 0,
      remarques,
      statut = "confirmee"
    } = req.body;
    
    // Validation de base
    if (!propertyId || !clientId || !dateDebut || !dateFin || !prixTotal) {
      return res.status(400).json({ 
        error: 'Les champs propertyId, clientId, dateDebut, dateFin et prixTotal sont requis' 
      });
    }
    
    // Vérifier que la propriété existe et est une location saisonnière
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }
    
    if (property.rentType !== 'saisonniere') {
      return res.status(400).json({ 
        error: 'Cette propriété n\'est pas en location saisonnière' 
      });
    }
    
    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    // Vérifier les conflits de dates
    const conflits = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: propertyId,
        statut: { in: ['confirmee', 'en_cours'] },
        OR: [
          {
            dateDebut: { lte: new Date(dateFin) },
            dateFin: { gte: new Date(dateDebut) }
          }
        ]
      }
    });
    
    if (conflits.length > 0) {
      return res.status(400).json({ 
        error: 'Ces dates sont déjà réservées pour cette propriété' 
      });
    }
    
    // Créer la réservation
    const reservation = await prisma.locationSaisonniere.create({
      data: {
        propertyId,
        clientId,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        prixTotal: parseFloat(prixTotal),
        nombreAdultes: parseInt(nombreAdultes),
        nombreEnfants: parseInt(nombreEnfants),
        remarques,
        statut
      },
      include: {
        property: true,
        client: {
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
    
    res.status(201).json({
      message: 'Réservation créée avec succès',
      reservation
    });
    
  } catch (error) {
    console.error('❌ Erreur création réservation:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la réservation',
      details: error.message 
    });
  }
});

// GET /client/:userId - Réservations d'un client
router.get("/client/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.query;

    console.log(`🔄 [BACKEND] Recherche réservations pour client: ${userId}`);

    let clientId;
    
    if (userId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      
      if (!user) {
        return res.status(404).json({ 
          error: "Utilisateur non trouvé"
        });
      }
      
      clientId = user.id;
    } else {
      clientId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      
      if (!user) {
        return res.status(404).json({ 
          error: "Utilisateur non trouvé"
        });
      }
    }

    let whereClause = {
      clientId: clientId,
    };

    if (statut) {
      whereClause.statut = statut;
    }

    const reservations = await prisma.locationSaisonniere.findMany({
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
                companyName: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        paiements: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        dateDebut: "desc",
      },
    });

    console.log(`✅ [BACKEND] ${reservations.length} réservations trouvées pour le client`);

    const reservationsAvecDetails = reservations.map((reservation) => {
      const dateDebut = new Date(reservation.dateDebut);
      const dateFin = new Date(reservation.dateFin);
      const nuits = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
      
      return {
        ...reservation,
        nuits,
      };
    });

    res.json(reservationsAvecDetails);
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la récupération des réservations client:", error);
    res.status(500).json({ 
      error: "Erreur serveur", 
      details: error.message
    });
  }
});

// GET /proprietaire/:userId - Réservations d'un propriétaire
router.get("/proprietaire/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.query;

    console.log(`🔄 [BACKEND] Recherche réservations pour propriétaire: ${userId}`);

    let ownerId;
    
    if (userId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ [BACKEND] Utilisateur non trouvé avec UUID: ${userId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      ownerId = user.id;
      console.log(`✅ [BACKEND] UUID ${userId} correspond à l'utilisateur ID: ${ownerId}`);
    } else {
      ownerId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ [BACKEND] Utilisateur non trouvé avec ID numérique: ${ownerId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      console.log(`✅ [BACKEND] Utilisateur trouvé avec ID: ${ownerId}`);
    }

    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        rentType: "saisonniere",
        listingType: { in: ["rent", "both"] },
      },
      select: { id: true },
    });

    console.log(`✅ [BACKEND] ${properties.length} propriétés trouvées pour le propriétaire`);

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      console.log(`ℹ️ [BACKEND] Aucune propriété en location saisonnière pour ce propriétaire`);
      return res.json([]);
    }

    let whereClause = {
      propertyId: { in: propertyIds },
    };

    if (statut) {
      whereClause.statut = statut;
    }

    console.log(`🔍 [BACKEND] Recherche réservations pour propriétés:`, propertyIds);

    const reservations = await prisma.locationSaisonniere.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            images: true,
            address: true,
            city: true,
            price: true,
            surface: true,
            rooms: true,
            bedrooms: true,
            bathrooms: true,
            features: true,
            ownerId: true,
            status: true,
            rentType: true,
            listingType: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        paiements: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        dateDebut: "desc",
      },
    });

    console.log(`✅ [BACKEND] ${reservations.length} réservations trouvées pour le propriétaire`);

    const reservationsAvecDetails = reservations.map((reservation) => {
      const dateDebut = new Date(reservation.dateDebut);
      const dateFin = new Date(reservation.dateFin);
      const nuits = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
      
      return {
        ...reservation,
        nuits,
      };
    });

    res.json(reservationsAvecDetails);
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la récupération des réservations propriétaire:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST / - Créer une réservation (route alternative)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      propertyId,
      dateDebut,
      dateFin,
      prixTotal,
      nombreAdultes,
      nombreEnfants,
      remarques,
      clientId,
    } = req.body;

    console.log(`🔄 [BACKEND] Création réservation pour client: ${clientId}, propriété: ${propertyId}`);

    if (!propertyId || !dateDebut || !dateFin || !prixTotal || !clientId) {
      return res.status(400).json({
        error: "Les champs propertyId, dateDebut, dateFin, prixTotal et clientId sont requis",
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ error: "Propriété non trouvée" });
    }

    if (property.rentType !== "saisonniere") {
      return res.status(400).json({ error: "Cette propriété n'est pas en location saisonnière" });
    }

    let clientIdNum;
    if (clientId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Client non trouvé" });
      }
      
      clientIdNum = user.id;
    } else {
      clientIdNum = parseInt(clientId);
      const user = await prisma.user.findUnique({
        where: { id: clientIdNum },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Client non trouvé" });
      }
    }

    // Vérifier les conflits de dates
    const conflits = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: propertyId,
        statut: { in: ["confirmee", "en_cours", "en_attente"] },
        OR: [
          {
            dateDebut: { lte: new Date(dateFin) },
            dateFin: { gte: new Date(dateDebut) },
          },
        ],
      },
    });

    if (conflits.length > 0) {
      return res.status(409).json({
        error: "Ces dates ne sont pas disponibles",
        conflits: conflits.map((c) => ({
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: c.statut,
        })),
      });
    }

    // Créer la réservation
    const reservation = await prisma.locationSaisonniere.create({
      data: {
        propertyId: propertyId,
        clientId: clientIdNum,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        prixTotal: parseFloat(prixTotal),
        nombreAdultes: parseInt(nombreAdultes) || 1,
        nombreEnfants: parseInt(nombreEnfants) || 0,
        remarques: remarques || "",
        statut: "en_attente",
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
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log(`✅ [BACKEND] Réservation créée avec ID: ${reservation.id}`);

    // Créer un paiement initial (acompte)
    const paiement = await prisma.paiementLocation.create({
      data: {
        locationId: reservation.id,
        montant: parseFloat(prixTotal) * 0.3,
        methode: "en_attente",
        reference: `RES-${reservation.id}-${Date.now()}`,
        statut: "en_attente",
      },
    });

    res.status(201).json({
      message: "Réservation créée avec succès",
      reservation: {
        ...reservation,
        paiements: [paiement],
      },
    });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la création de la réservation:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// PATCH /:id/statut - Changer le statut d'une réservation
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    console.log(`🔄 [BACKEND] Changement statut réservation ${id} -> ${statut}`);
    
    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
        client: true
      }
    });
    
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }
    
    const isOwner = reservation.property.ownerId === req.user.id;
    const isClient = reservation.clientId === req.user.id;
    
    if (!isOwner && !isClient) {
      return res.status(403).json({ error: 'Non autorisé à modifier cette réservation' });
    }
    
    const validTransitions = {
      'en_attente': ['confirmee', 'annulee'],
      'confirmee': ['en_cours', 'annulee'],
      'en_cours': ['terminee'],
      'terminee': [],
      'annulee': []
    };
    
    const currentStatut = reservation.statut;
    const allowedTransitions = validTransitions[currentStatut] || [];
    
    if (!allowedTransitions.includes(statut)) {
      return res.status(400).json({ 
        error: `Transition de statut invalide: ${currentStatut} -> ${statut}` 
      });
    }
    
    const updatedReservation = await prisma.locationSaisonniere.update({
      where: { id: parseInt(id) },
      data: { 
        statut,
        updatedAt: new Date()
      },
      include: {
        property: true,
        client: true
      }
    });
    
    console.log(`✅ [BACKEND] Réservation ${id} mise à jour: ${statut}`);
    
    if (statut === 'confirmee' && reservation.property.status !== 'rented') {
      await prisma.property.update({
        where: { id: reservation.propertyId },
        data: { status: 'rented' }
      });
    }
    
    res.json({
      message: 'Statut mis à jour avec succès',
      reservation: updatedReservation
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur mise à jour statut:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message 
    });
  }
});

// DELETE /:id - Supprimer une réservation
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 [BACKEND] Suppression réservation ${id}`);

    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    if (reservation.statut !== "en_attente") {
      return res.status(403).json({
        error: "Seules les réservations en attente peuvent être supprimées",
      });
    }

    await prisma.paiementLocation.deleteMany({
      where: { locationId: parseInt(id) },
    });

    await prisma.locationSaisonniere.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ [BACKEND] Réservation ${id} supprimée`);

    res.json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la suppression de la réservation:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /:id - Obtenir les détails d'une réservation
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [BACKEND] Détails réservation ${id}`);

    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
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
                companyName: true,
              },
            },
            images: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        paiements: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    console.log(`✅ [BACKEND] Détails réservation ${id} trouvés`);

    res.json(reservation);
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la récupération de la réservation:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST /:id/paiement - Ajouter un paiement
router.post("/:id/paiement", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, methode, reference } = req.body;

    if (!montant || !methode) {
      return res.status(400).json({ error: "Montant et méthode sont requis" });
    }

    console.log(`💰 [BACKEND] Ajout paiement pour réservation ${id}`);

    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const paiement = await prisma.paiementLocation.create({
      data: {
        locationId: parseInt(id),
        montant: parseFloat(montant),
        methode,
        reference: reference || `PAY-${id}-${Date.now()}`,
        statut: "en_attente",
      },
    });

    console.log(`✅ [BACKEND] Paiement ajouté avec référence: ${paiement.reference}`);

    res.status(201).json({
      message: "Paiement ajouté avec succès",
      paiement,
    });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de l'ajout du paiement:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /proprietaire/:userId/stats - Statistiques pour propriétaire
router.get("/proprietaire/:userId/stats", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 [BACKEND] Statistiques pour propriétaire: ${userId}`);

    let ownerId;
    
    if (userId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      ownerId = user.id;
    } else {
      ownerId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
    }

    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        rentType: "saisonniere",
        listingType: { in: ["rent", "both"] },
      },
      select: { id: true, price: true, title: true },
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      console.log(`ℹ️ [BACKEND] Aucune propriété en location saisonnière pour le propriétaire ${ownerId}`);
      return res.json({
        total: 0,
        en_attente: 0,
        confirmee: 0,
        annulee: 0,
        terminee: 0,
        en_cours: 0,
        revenueTotal: 0,
        occupationRate: 0,
        propertiesCount: 0,
        properties: []
      });
    }

    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      include: {
        paiements: true,
        property: {
          select: {
            title: true,
            price: true
          }
        }
      },
    });

    const stats = {
      total: reservations.length,
      en_attente: reservations.filter(r => r.statut === "en_attente").length,
      confirmee: reservations.filter(r => r.statut === "confirmee").length,
      annulee: reservations.filter(r => r.statut === "annulee").length,
      terminee: reservations.filter(r => r.statut === "terminee").length,
      en_cours: reservations.filter(r => r.statut === "en_cours").length,
      revenueTotal: reservations
        .filter(r => ["confirmee", "terminee", "en_cours"].includes(r.statut))
        .reduce((sum, r) => sum + (r.prixTotal || 0), 0),
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reservationsRecent = reservations.filter(r => 
      new Date(r.dateDebut) >= thirtyDaysAgo
    );

    const joursOccupes = reservationsRecent.reduce((days, r) => {
      const start = new Date(r.dateDebut);
      const end = new Date(r.dateFin);
      const nuits = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return days + nuits;
    }, 0);

    const occupationRate = propertyIds.length > 0 
      ? Math.round((joursOccupes / (propertyIds.length * 30)) * 100)
      : 0;

    console.log(`✅ [BACKEND] Statistiques calculées pour ${propertyIds.length} propriétés`);

    res.json({
      ...stats,
      occupationRate,
      propertiesCount: propertyIds.length,
      properties: properties.map(p => ({ id: p.id, title: p.title, price: p.price }))
    });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /client/:userId/dashboard - Dashboard complet client (VERSION ULTIME CORRIGÉE)
router.get("/client/:userId/dashboard", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    console.log(`📊 [BACKEND] Dashboard client pour: ${userId}, mois: ${month}, année: ${year}`);

    // 1. Identifier le client
    const client = await prisma.user.findUnique({
      where: { 
        id: userId
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      }
    });

    if (!client) {
      return res.status(404).json({ 
        success: false,
        error: "Client non trouvé" 
      });
    }

    console.log(`✅ [BACKEND] Client trouvé: ${client.firstName} ${client.lastName}`);

    // 2. RÉCUPÉRATION SÉCURISÉE EN 2 ÉTAPES POUR ÉVITER LES ERREURS PRISMA
    // Étape 1: Récupérer les réservations SANS les relations
    const reservationsRaw = await prisma.locationSaisonniere.findMany({
      where: { 
        clientId: client.id 
      },
      // NE PAS inclure les relations ici
      orderBy: { dateDebut: "desc" }
    });

    console.log(`✅ [BACKEND] ${reservationsRaw.length} réservations trouvées (sans relations)`);

    // Étape 2: Récupérer les propriétés séparément
    const propertyIds = reservationsRaw.map(r => r.propertyId).filter(id => id && id !== '');
    let propertiesMap = {};
    
    if (propertyIds.length > 0) {
      try {
        const properties = await prisma.property.findMany({
          where: {
            id: { in: propertyIds }
          },
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: true
          }
        });
        
        // Créer une map pour un accès rapide
        properties.forEach(p => {
          propertiesMap[p.id] = p;
        });
      } catch (propertyError) {
        console.warn(`⚠️ [BACKEND] Erreur récupération propriétés:`, propertyError.message);
        // Continuer avec un map vide
      }
    }

    // Étape 3: Récupérer les paiements séparément
    const reservationIds = reservationsRaw.map(r => r.id);
    let paiementsMap = {};
    
    if (reservationIds.length > 0) {
      try {
        const paiements = await prisma.paiementLocation.findMany({
          where: {
            locationId: { in: reservationIds }
          },
          select: {
            id: true,
            locationId: true,
            montant: true,
            methode: true,
            statut: true,
            reference: true,
            datePaiement: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        });
        
        // Grouper les paiements par réservation
        paiements.forEach(p => {
          if (!paiementsMap[p.locationId]) {
            paiementsMap[p.locationId] = [];
          }
          paiementsMap[p.locationId].push(p);
        });
      } catch (paiementError) {
        console.warn(`⚠️ [BACKEND] Erreur récupération paiements:`, paiementError.message);
        // Continuer avec un map vide
      }
    }

    // Étape 4: Combiner tout dans des réservations sécurisées
    const safeReservations = reservationsRaw.map(reservation => {
      // Propriété sécurisée
      const property = propertiesMap[reservation.propertyId] || {
        id: null,
        title: "Propriété non disponible",
        city: "Ville inconnue",
        price: 0,
        images: []
      };
      
      // Paiements sécurisés
      const paiements = paiementsMap[reservation.id] || [];
      
      return {
        ...reservation,
        property,
        paiements
      };
    });

    // 3. Statistiques générales
    const totalReservations = safeReservations.length;
    const reservationsActives = safeReservations.filter(r => 
      r.statut && ['en_attente', 'confirmee', 'en_cours'].includes(r.statut)
    ).length;
    
    const montantTotalDepense = safeReservations.reduce((sum, r) => {
      return sum + (Number(r.prixTotal) || 0);
    }, 0);
    
    const montantTotalPaye = safeReservations.reduce((sum, r) => {
      const paiementsPayes = r.paiements?.filter(p => p.statut === 'paye') || [];
      return sum + paiementsPayes.reduce((pSum, p) => pSum + (Number(p.montant) || 0), 0);
    }, 0);
    
    const montantRestantAPayer = Math.max(0, montantTotalDepense - montantTotalPaye);

    // 4. Statistiques mensuelles
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const reservationsMois = safeReservations.filter(r => {
      if (!r.dateDebut) return false;
      const dateDebut = new Date(r.dateDebut);
      return dateDebut.getMonth() + 1 === currentMonth && 
             dateDebut.getFullYear() === currentYear;
    });

    const depenseMois = reservationsMois.reduce((sum, r) => {
      return sum + (Number(r.prixTotal) || 0);
    }, 0);

    // 5. Prochaines réservations (7 jours)
    const aujourdhui = new Date();
    const septJours = new Date();
    septJours.setDate(septJours.getDate() + 7);
    
    const prochainesReservations = safeReservations
      .filter(r => {
        if (!r.dateDebut || !r.statut) return false;
        const dateDebut = new Date(r.dateDebut);
        return dateDebut >= aujourdhui && 
               dateDebut <= septJours && 
               ['confirmee', 'en_attente'].includes(r.statut);
      })
      .sort((a, b) => {
        return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
      })
      .slice(0, 5)
      .map(r => {
        const image = r.property?.images?.[0];
        return {
          id: r.id,
          titre: r.property?.title || 'Propriété non disponible',
          ville: r.property?.city || 'Ville inconnue',
          dateDebut: r.dateDebut,
          dateFin: r.dateFin,
          statut: r.statut || 'inconnu',
          prixTotal: Number(r.prixTotal) || 0,
          image: image || null
        };
      });

    // 6. Répartition par statut
    const repartitionStatut = {
      en_attente: safeReservations.filter(r => r.statut === 'en_attente').length,
      confirmee: safeReservations.filter(r => r.statut === 'confirmee').length,
      en_cours: safeReservations.filter(r => r.statut === 'en_cours').length,
      terminee: safeReservations.filter(r => r.statut === 'terminee').length,
      annulee: safeReservations.filter(r => r.statut === 'annulee').length
    };

    // 7. Évolution des dépenses (6 derniers mois)
    const sixMois = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const reservationsDuMois = safeReservations.filter(r => {
        if (!r.dateDebut) return false;
        const dateResa = new Date(r.dateDebut);
        return dateResa.getMonth() + 1 === mois && 
               dateResa.getFullYear() === annee;
      });
      
      const depense = reservationsDuMois.reduce((sum, r) => {
        return sum + (Number(r.prixTotal) || 0);
      }, 0);
      
      sixMois.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
        annee: annee,
        depense: depense,
        count: reservationsDuMois.length
      });
    }

    // 8. Top destinations
    const destinations = {};
    safeReservations.forEach(r => {
      const ville = r.property?.city || 'Inconnu';
      if (!destinations[ville]) {
        destinations[ville] = { count: 0, montant: 0 };
      }
      destinations[ville].count++;
      destinations[ville].montant += Number(r.prixTotal) || 0;
    });

    const topDestinations = Object.entries(destinations)
      .map(([ville, data]) => ({ ville, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Paiements en attente
    const paiementsEnAttente = safeReservations
      .filter(r => r.statut && ['en_attente', 'confirmee'].includes(r.statut))
      .flatMap(r => {
        return (r.paiements || []).filter(p => p.statut === 'en_attente');
      })
      .sort((a, b) => {
        const dateA = a.datePaiement || a.createdAt;
        const dateB = b.datePaiement || b.createdAt;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

    // 10. Préparer les données de réservations
    const reservationsFormatted = safeReservations.map(r => {
      const dateDebut = r.dateDebut ? new Date(r.dateDebut) : new Date();
      const dateFin = r.dateFin ? new Date(r.dateFin) : new Date();
      const nuits = Math.max(1, Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)));
      
      const paiementsPayes = (r.paiements || []).filter(p => p.statut === 'paye');
      const montantPaye = paiementsPayes.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
      const prixTotal = Number(r.prixTotal) || 0;
      const montantRestant = Math.max(0, prixTotal - montantPaye);
      
      return {
        id: r.id,
        propertyId: r.propertyId,
        titre: r.property?.title || 'Propriété non disponible',
        ville: r.property?.city || 'Ville inconnue',
        dateDebut: r.dateDebut,
        dateFin: r.dateFin,
        nuits: nuits,
        prixTotal: prixTotal,
        statut: r.statut || 'inconnu',
        paiements: (r.paiements || []).map(p => ({
          id: p.id,
          montant: Number(p.montant) || 0,
          methode: p.methode || 'inconnue',
          statut: p.statut || 'inconnu',
          datePaiement: p.datePaiement,
          reference: p.reference || `PAY-${p.id}`
        })),
        montantPaye: montantPaye,
        montantRestant: montantRestant,
        image: r.property?.images?.[0] || null
      };
    });

    // 11. Créer la réponse finale
    const dashboardData = {
      resume: {
        totalReservations,
        reservationsActives,
        montantTotalDepense,
        montantTotalPaye,
        montantRestantAPayer,
        depenseMois,
        reservationsMois: reservationsMois.length
      },
      prochainesReservations,
      statistiques: {
        repartitionStatut,
        evolutionDepenses: sixMois,
        topDestinations
      },
      paiements: {
        enAttente: paiementsEnAttente.map(p => ({
          id: p.id,
          montant: Number(p.montant) || 0,
          methode: p.methode || 'inconnue',
          reference: p.reference || `REF-${p.id}`,
          dateEcheance: p.datePaiement || p.createdAt || new Date(),
          reservationId: p.locationId
        })),
        totalEnAttente: paiementsEnAttente.reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
      },
      reservations: reservationsFormatted
    };

    console.log(`✅ [BACKEND] Dashboard généré avec succès`);

    res.json({
      success: true,
      message: "Dashboard chargé avec succès",
      client: client,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error("❌ [BACKEND] Erreur dashboard client:", error);
    
    // Retourner une structure de dashboard minimale en cas d'erreur
    const emptyDashboard = {
      resume: {
        totalReservations: 0,
        reservationsActives: 0,
        montantTotalDepense: 0,
        montantTotalPaye: 0,
        montantRestantAPayer: 0,
        depenseMois: 0,
        reservationsMois: 0
      },
      prochainesReservations: [],
      statistiques: {
        repartitionStatut: {},
        evolutionDepenses: [],
        topDestinations: []
      },
      paiements: {
        enAttente: [],
        totalEnAttente: 0
      },
      reservations: []
    };
    
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur lors du chargement du dashboard",
      details: error.message,
      dashboard: emptyDashboard
    });
  }
});

// POST /:id/simuler-paiement - Simuler un paiement
router.post("/:id/simuler-paiement", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, methode, simulate = true } = req.body;

    console.log(`💰 [BACKEND] Simulation paiement réservation ${id}`);

    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
        client: true,
        paiements: true
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const montantTotalPaye = reservation.paiements
      .filter(p => p.statut === 'paye')
      .reduce((sum, p) => sum + p.montant, 0);

    const montantRestant = reservation.prixTotal - montantTotalPaye;
    const montantPropose = montant || montantRestant;

    if (montantPropose > montantRestant) {
      return res.status(400).json({ 
        error: "Montant supérieur au solde restant",
        montantRestant,
        montantPropose
      });
    }

    if (simulate) {
      // Simulation seulement
      return res.json({
        simulation: true,
        reservationId: reservation.id,
        montantTotal: reservation.prixTotal,
        montantDejaPaye: montantTotalPaye,
        montantRestant: montantRestant,
        montantPropose: montantPropose,
        nouveauSolde: montantRestant - montantPropose,
        details: {
          methode: methode || 'carte',
          frais: methode === 'carte' ? montantPropose * 0.015 : 0,
          totalAPayer: methode === 'carte' ? montantPropose + (montantPropose * 0.015) : montantPropose
        }
      });
    } else {
      // Réel paiement
      const paiement = await prisma.paiementLocation.create({
        data: {
          locationId: parseInt(id),
          montant: montantPropose,
          methode: methode || 'carte',
          reference: `PAY-${id}-${Date.now()}`,
          statut: 'paye',
          datePaiement: new Date(),
          details: JSON.stringify({
            type: 'paiement_client',
            simulate: false,
            timestamp: new Date().toISOString()
          })
        }
      });

      const nouveauMontantPaye = montantTotalPaye + montantPropose;
      const estEntierementPaye = nouveauMontantPaye >= reservation.prixTotal;

      if (estEntierementPaye && reservation.statut === 'en_attente') {
        await prisma.locationSaisonniere.update({
          where: { id: parseInt(id) },
          data: { statut: 'confirmee' }
        });
      }

      res.json({
        success: true,
        message: "Paiement effectué avec succès",
        paiement,
        reservation: {
          ...reservation,
          montantTotalPaye: nouveauMontantPaye,
          montantRestant: reservation.prixTotal - nouveauMontantPaye,
          estEntierementPaye
        }
      });
    }

  } catch (error) {
    console.error("❌ [BACKEND] Erreur simulation paiement:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST /from-demande/:demandeId - Créer réservation automatique depuis demande
router.post("/from-demande/:demandeId", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    
    console.log(`🏠 [BACKEND] Création réservation automatique depuis demande: ${demandeId}`);

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        createdBy: true
      }
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    if (!demande.propertyId) {
      return res.status(400).json({ error: "Cette demande n'est pas liée à une propriété" });
    }

    if (demande.property.rentType !== "saisonniere") {
      return res.status(400).json({ 
        error: "Cette propriété n'est pas en location saisonnière",
        propertyType: demande.property.rentType
      });
    }

    const existingReservation = await prisma.locationSaisonniere.findFirst({
      where: {
        propertyId: demande.propertyId,
        clientId: demande.createdById,
        statut: { in: ['en_attente', 'confirmee', 'en_cours'] }
      }
    });

    if (existingReservation) {
      console.log(`ℹ️ [BACKEND] Réservation existante déjà: ${existingReservation.id}`);
      return res.json({
        message: "Une réservation existe déjà pour cette demande",
        reservation: existingReservation
      });
    }

    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() + 7);
    
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 7);

    const nuits = 7;
    const prixTotal = (demande.property?.price || 0) * nuits;

    const reservation = await prisma.locationSaisonniere.create({
      data: {
        propertyId: demande.propertyId,
        clientId: demande.createdById,
        dateDebut,
        dateFin,
        prixTotal,
        nombreAdultes: 2,
        nombreEnfants: 0,
        statut: 'confirmee',
        remarques: `Réservation créée automatiquement suite à la visite (Demande #${demande.id})`
      },
      include: {
        property: true,
        client: {
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

    console.log(`✅ [BACKEND] Réservation créée: ${reservation.id}`);

    await prisma.paiementLocation.create({
      data: {
        locationId: reservation.id,
        montant: prixTotal * 0.3,
        methode: 'virement',
        reference: `AUTO-RES-${reservation.id}-${Date.now()}`,
        statut: 'en_attente',
        datePaiement: new Date()
      }
    });

    await prisma.notification.create({
      data: {
        type: 'reservation_created',
        title: 'Nouvelle réservation',
        message: `Votre réservation pour "${demande.property?.title}" a été créée`,
        relatedEntity: 'locationSaisonniere',
        relatedEntityId: String(reservation.id),
        userId: demande.createdById,
        read: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      reservation: reservation,
      notification: 'Le client a été notifié'
    });

  } catch (error) {
    console.error('❌ [BACKEND] Erreur création réservation depuis demande:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auto-from-property/:propertyId - Création automatique
router.post('/auto-from-property/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { clientId } = req.body;
    
    console.log(`🏠 [BACKEND] Création réservation automatique depuis propriété: ${propertyId}`);
    
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId
      },
      include: {
        owner: true
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }
    
    if (property.rentType !== 'saisonniere') {
      return res.status(400).json({ 
        error: 'Cette propriété n\'est pas en location saisonnière' 
      });
    }
    
    if (!['rent', 'both'].includes(property.listingType)) {
      return res.status(400).json({ 
        error: 'Cette propriété n\'est pas disponible à la location' 
      });
    }
    
    if (property.status === 'rented') {
      return res.status(400).json({ 
        error: 'Cette propriété est déjà marquée comme louée' 
      });
    }
    
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() + 7);
    
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 7);
    
    const prixNuit = property.price || 0;
    const prixTotal = prixNuit * 7;
    
    const reservation = await prisma.locationSaisonniere.create({
      data: {
        propertyId: propertyId,
        clientId: clientId,
        dateDebut: dateDebut,
        dateFin: dateFin,
        prixTotal: prixTotal,
        nombreAdultes: 2,
        nombreEnfants: 0,
        remarques: `Réservation créée automatiquement suite au marquage "loué" du ${new Date().toLocaleDateString('fr-FR')}`,
        statut: "confirmee"
      },
      include: {
        property: true,
        client: {
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
    
    await prisma.property.update({
      where: { id: propertyId },
      data: { 
        status: 'rented',
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ [BACKEND] Réservation créée: ${reservation.id}`);
    
    res.json({
      message: 'Réservation créée avec succès',
      reservation: reservation
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur création réservation automatique depuis propriété:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la réservation',
      details: error.message 
    });
  }
});

// GET /client/:clientId - Réservations d'un client (route alternative)
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log(`👤 [BACKEND] Récupération réservations client: ${clientId}`);
    
    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        clientId: clientId
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            images: true,
            address: true,
            city: true,
            price: true,
            surface: true,
            rooms: true,
            bedrooms: true,
            bathrooms: true,
            features: true,
            ownerId: true,
            status: true,
            rentType: true,
            listingType: true
          }
        },
        client: {
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
    
    console.log(`✅ [BACKEND] ${reservations.length} réservations trouvées`);
    
    res.json(reservations);
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur récupération réservations client:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /owner/:ownerId - Réservations des biens d'un propriétaire
router.get('/owner/:ownerId', authenticateToken, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    console.log(`🏠 [BACKEND] Récupération réservations propriétaire: ${ownerId}`);
    
    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        rentType: 'saisonniere',
        listingType: { in: ['rent', 'both'] }
      },
      select: {
        id: true
      }
    });
    
    const propertyIds = properties.map(p => p.id);
    
    if (propertyIds.length === 0) {
      return res.json([]);
    }
    
    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: { in: propertyIds }
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            images: true,
            address: true,
            city: true,
            price: true,
            surface: true,
            rooms: true,
            bedrooms: true,
            bathrooms: true,
            features: true,
            ownerId: true,
            status: true,
            rentType: true,
            listingType: true
          }
        },
        client: {
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
    
    console.log(`✅ [BACKEND] ${reservations.length} réservations trouvées`);
    
    res.json(reservations);
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur récupération réservations propriétaire:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /property/:propertyId/client/:clientId - Vérifier si réservation existe
router.get("/property/:propertyId/client/:clientId", authenticateToken, async (req, res) => {
  try {
    const { propertyId, clientId } = req.params;
    
    console.log(`🔍 [BACKEND] Vérification réservation pour propriété ${propertyId} et client ${clientId}`);

    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: parseInt(propertyId),
        clientId: clientId.includes('-') ? clientId : parseInt(clientId)
      },
      include: {
        property: true,
        paiements: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      exists: reservations.length > 0,
      count: reservations.length,
      reservations: reservations
    });

  } catch (error) {
    console.error('❌ [BACKEND] Erreur vérification réservation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;