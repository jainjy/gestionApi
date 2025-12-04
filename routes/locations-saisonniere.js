const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// Dans routes/locations-saisonniere.js - POST /
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


// GET /api/locations-saisonnieres/proprietaire/:userId - Réservations d'un propriétaire - CORRIGÉ
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

    // CORRECTION: Utiliser rentType au lieu de locationType
    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        rentType: "saisonniere",  // ✅ CORRIGÉ
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
            rentType: true,  // ✅ Ajouter pour debug
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

    if (property.locationType !== "saisonnier") {
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

// PATCH /api/locations-saisonnieres/:id/statut - Changer le statut d'une réservation
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    console.log(`🔄 [BACKEND] Changement statut réservation ${id} -> ${statut}`);
    
    // Vérifier que la réservation existe
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
    
    // Vérifier les permissions
    const isOwner = reservation.property.ownerId === req.user.id;
    const isClient = reservation.clientId === req.user.id;
    
    if (!isOwner && !isClient) {
      return res.status(403).json({ error: 'Non autorisé à modifier cette réservation' });
    }
    
    // Logique de validation des transitions de statut
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
    
    // Mettre à jour le statut
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
    
    // Si la réservation est confirmée et que la propriété n'est pas encore marquée comme louée
    if (statut === 'confirmee' && reservation.property.status !== 'rented') {
      await prisma.property.update({
        where: { id: reservation.propertyId },
        data: { status: 'rented' }
      });
    }
    
    // Émettre un événement pour le frontend
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

// DELETE /api/locations-saisonnieres/:id - Supprimer une réservation
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

    // Supprimer les paiements associés
    await prisma.paiementLocation.deleteMany({
      where: { locationId: parseInt(id) },
    });

    // Supprimer la réservation
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

// GET /api/locations-saisonnieres/:id - Obtenir les détails d'une réservation
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

// POST /api/locations-saisonnieres/:id/paiement - Ajouter un paiement
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

// GET /api/locations-saisonnieres/proprietaire/:userId/stats - Statistiques pour propriétaire - CORRIGÉ
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

    // CORRECTION: Utiliser rentType au lieu de locationType
    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        rentType: "saisonniere",  // ✅ CORRIGÉ
        listingType: { in: ["rent", "both"] },
      },
      select: { id: true, price: true, title: true },  // Ajouter price pour debug
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
    console.log(`📈 Détails:`, {
      propertiesCount: propertyIds.length,
      reservationsCount: reservations.length,
      revenueTotal: stats.revenueTotal,
      occupationRate,
      sampleProperties: properties.slice(0, 3)
    });

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
// GET /api/locations-saisonnieres/client/:userId/dashboard - Dashboard complet client
router.get("/client/:userId/dashboard", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    console.log(`📊 [BACKEND] Dashboard client pour: ${userId}`);

    let clientId;
    if (userId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true }
      });
      if (!user) return res.status(404).json({ error: "Client non trouvé" });
      clientId = user.id;
    } else {
      clientId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, firstName: true, lastName: true }
      });
      if (!user) return res.status(404).json({ error: "Client non trouvé" });
    }

    // 1. Récupérer toutes les réservations du client
    const reservations = await prisma.locationSaisonniere.findMany({
      where: { clientId: clientId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: true
          }
        },
        paiements: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { dateDebut: "desc" }
    });

    // 2. Statistiques générales
    const totalReservations = reservations.length;
    const reservationsActives = reservations.filter(r => 
      ['en_attente', 'confirmee', 'en_cours'].includes(r.statut)
    ).length;
    
    const montantTotalDepense = reservations.reduce((sum, r) => sum + (r.prixTotal || 0), 0);
    const montantTotalPaye = reservations.reduce((sum, r) => {
      const paiementsPayes = r.paiements.filter(p => p.statut === 'paye');
      return sum + paiementsPayes.reduce((pSum, p) => pSum + (p.montant || 0), 0);
    }, 0);
    
    const montantRestantAPayer = montantTotalDepense - montantTotalPaye;

    // 3. Statistiques mensuelles
    const currentDate = new Date();
    const currentMonth = month || currentDate.getMonth() + 1;
    const currentYear = year || currentDate.getFullYear();

    const reservationsMois = reservations.filter(r => {
      const dateDebut = new Date(r.dateDebut);
      return dateDebut.getMonth() + 1 === parseInt(currentMonth) && 
             dateDebut.getFullYear() === parseInt(currentYear);
    });

    const depenseMois = reservationsMois.reduce((sum, r) => sum + (r.prixTotal || 0), 0);

    // 4. Prochaines réservations (7 jours)
    const septJours = new Date();
    septJours.setDate(septJours.getDate() + 7);
    
    const prochainesReservations = reservations
      .filter(r => {
        const dateDebut = new Date(r.dateDebut);
        return dateDebut >= new Date() && dateDebut <= septJours && 
               ['confirmee', 'en_attente'].includes(r.statut);
      })
      .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))
      .slice(0, 5);

    // 5. Répartition par statut
    const repartitionStatut = {
      en_attente: reservations.filter(r => r.statut === 'en_attente').length,
      confirmee: reservations.filter(r => r.statut === 'confirmee').length,
      en_cours: reservations.filter(r => r.statut === 'en_cours').length,
      terminee: reservations.filter(r => r.statut === 'terminee').length,
      annulee: reservations.filter(r => r.statut === 'annulee').length
    };

    // 6. Évolution des dépenses (6 derniers mois)
    const sixMois = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const reservationsMois = reservations.filter(r => {
        const dateResa = new Date(r.dateDebut);
        return dateResa.getMonth() + 1 === mois && 
               dateResa.getFullYear() === annee;
      });
      
      const depense = reservationsMois.reduce((sum, r) => sum + (r.prixTotal || 0), 0);
      
      sixMois.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
        annee: annee,
        depense: depense,
        count: reservationsMois.length
      });
    }

    // 7. Top destinations
    const destinations = {};
    reservations.forEach(r => {
      const ville = r.property?.city || 'Inconnu';
      if (!destinations[ville]) {
        destinations[ville] = { count: 0, montant: 0 };
      }
      destinations[ville].count++;
      destinations[ville].montant += r.prixTotal || 0;
    });

    const topDestinations = Object.entries(destinations)
      .map(([ville, data]) => ({ ville, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 8. Paiements en attente
    const paiementsEnAttente = reservations
      .filter(r => ['en_attente', 'confirmee'].includes(r.statut))
      .flatMap(r => r.paiements.filter(p => p.statut === 'en_attente'))
      .sort((a, b) => new Date(a.datePaiement || a.createdAt) - new Date(b.datePaiement || b.createdAt));

    res.json({
      success: true,
      dashboard: {
        // Résumé
        resume: {
          totalReservations,
          reservationsActives,
          montantTotalDepense,
          montantTotalPaye,
          montantRestantAPayer,
          depenseMois,
          reservationsMois: reservationsMois.length
        },
        
        // Prochaines réservations
        prochainesReservations: prochainesReservations.map(r => ({
          id: r.id,
          titre: r.property?.title,
          ville: r.property?.city,
          dateDebut: r.dateDebut,
          dateFin: r.dateFin,
          statut: r.statut,
          prixTotal: r.prixTotal,
          image: r.property?.images?.[0]
        })),
        
        // Statistiques
        statistiques: {
          repartitionStatut,
          evolutionDepenses: sixMois,
          topDestinations
        },
        
        // Paiements
        paiements: {
          enAttente: paiementsEnAttente.map(p => ({
            id: p.id,
            montant: p.montant,
            methode: p.methode,
            reference: p.reference,
            dateEcheance: p.datePaiement || p.createdAt
          })),
          totalEnAttente: paiementsEnAttente.reduce((sum, p) => sum + p.montant, 0)
        },
        
        // Détails complets
        reservations: reservations.map(r => ({
          id: r.id,
          propertyId: r.propertyId,
          titre: r.property?.title,
          ville: r.property?.city,
          dateDebut: r.dateDebut,
          dateFin: r.dateFin,
          nuits: Math.ceil((new Date(r.dateFin) - new Date(r.dateDebut)) / (1000 * 60 * 60 * 24)),
          prixTotal: r.prixTotal,
          statut: r.statut,
          paiements: r.paiements.map(p => ({
            id: p.id,
            montant: p.montant,
            methode: p.methode,
            statut: p.statut,
            datePaiement: p.datePaiement,
            reference: p.reference
          })),
          montantPaye: r.paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0),
          montantRestant: r.prixTotal - r.paiements.filter(p => p.statut === 'paye').reduce((sum, p) => sum + p.montant, 0),
          image: r.property?.images?.[0]
        }))
      }
    });

  } catch (error) {
    console.error("❌ [BACKEND] Erreur dashboard client:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST /api/locations-saisonnieres/:id/simuler-paiement - Simuler un paiement
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

      // Vérifier si la réservation est entièrement payée
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

// GET /api/locations-saisonnieres/client/:userId/rapport-financier - Rapport financier client
router.get("/client/:userId/rapport-financier", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    console.log(`📈 [BACKEND] Rapport financier client: ${userId}`);

    let clientId;
    if (userId.includes('-')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true }
      });
      if (!user) return res.status(404).json({ error: "Client non trouvé" });
      clientId = user.id;
    } else {
      clientId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, firstName: true, lastName: true, email: true }
      });
      if (!user) return res.status(404).json({ error: "Client non trouvé" });
    }

    const dateDebut = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const dateFin = endDate ? new Date(endDate) : new Date();

    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        clientId: clientId,
        dateDebut: {
          gte: dateDebut,
          lte: dateFin
        }
      },
      include: {
        property: {
          select: {
            title: true,
            city: true,
            type: true
          }
        },
        paiements: {
          where: {
            statut: 'paye'
          }
        }
      },
      orderBy: { dateDebut: 'asc' }
    });

    // Calcul des statistiques financières
    const totalDepenses = reservations.reduce((sum, r) => sum + (r.prixTotal || 0), 0);
    const totalPaye = reservations.reduce((sum, r) => 
      sum + r.paiements.reduce((pSum, p) => pSum + p.montant, 0), 0
    );
    const totalRestant = totalDepenses - totalPaye;

    // Par mois
    const depensesParMois = {};
    const paiementsParMois = {};

    reservations.forEach(r => {
      const mois = new Date(r.dateDebut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      if (!depensesParMois[mois]) depensesParMois[mois] = 0;
      depensesParMois[mois] += r.prixTotal || 0;
      
      r.paiements.forEach(p => {
        if (!paiementsParMois[mois]) paiementsParMois[mois] = 0;
        paiementsParMois[mois] += p.montant || 0;
      });
    });

    // Par type de bien
    const depensesParType = {};
    reservations.forEach(r => {
      const type = r.property?.type || 'Autre';
      if (!depensesParType[type]) depensesParType[type] = 0;
      depensesParType[type] += r.prixTotal || 0;
    });

    // Par destination
    const depensesParDestination = {};
    reservations.forEach(r => {
      const destination = r.property?.city || 'Inconnu';
      if (!depensesParDestination[destination]) depensesParDestination[destination] = 0;
      depensesParDestination[destination] += r.prixTotal || 0;
    });

    const rapport = {
      periode: {
        debut: dateDebut.toISOString().split('T')[0],
        fin: dateFin.toISOString().split('T')[0]
      },
      resume: {
        totalReservations: reservations.length,
        totalDepenses,
        totalPaye,
        totalRestant,
        tauxPaiement: totalDepenses > 0 ? Math.round((totalPaye / totalDepenses) * 100) : 0
      },
      details: {
        parMois: Object.entries(depensesParMois).map(([mois, depense]) => ({
          mois,
          depense,
          paiement: paiementsParMois[mois] || 0,
          solde: depense - (paiementsParMois[mois] || 0)
        })),
        parType: Object.entries(depensesParType).map(([type, depense]) => ({
          type,
          depense,
          pourcentage: Math.round((depense / totalDepenses) * 100)
        })),
        parDestination: Object.entries(depensesParDestination)
          .map(([destination, depense]) => ({
            destination,
            depense,
            pourcentage: Math.round((depense / totalDepenses) * 100)
          }))
          .sort((a, b) => b.depense - a.depense)
      },
      reservations: reservations.map(r => ({
        id: r.id,
        titre: r.property?.title,
        destination: r.property?.city,
        dateDebut: r.dateDebut,
        dateFin: r.dateFin,
        prixTotal: r.prixTotal,
        montantPaye: r.paiements.reduce((sum, p) => sum + p.montant, 0),
        montantRestant: r.prixTotal - r.paiements.reduce((sum, p) => sum + p.montant, 0),
        statut: r.statut
      }))
    };

    if (format === 'csv') {
      // Générer CSV
      const csvRows = [
        ['ID', 'Titre', 'Destination', 'Date Début', 'Date Fin', 'Prix Total', 'Payé', 'Restant', 'Statut'],
        ...rapport.reservations.map(r => [
          r.id,
          r.titre,
          r.destination,
          r.dateDebut.split('T')[0],
          r.dateFin.split('T')[0],
          r.prixTotal,
          r.montantPaye,
          r.montantRestant,
          r.statut
        ])
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename=rapport-financier-${userId}-${dateDebut.toISOString().split('T')[0]}-${dateFin.toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        client: {
          id: clientId,
          nom: `${res.user?.firstName || ''} ${res.user?.lastName || ''}`.trim(),
          email: res.user?.email
        },
        rapport
      });
    }

  } catch (error) {
    console.error("❌ [BACKEND] Erreur rapport financier:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST /api/locations-saisonnieres/from-demande - Créer réservation automatique depuis demande - CORRIGÉ
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
        createdBy: true  // CORRIGÉ: utilisez createdBy au lieu de user
      }
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    if (!demande.propertyId) {
      return res.status(400).json({ error: "Cette demande n'est pas liée à une propriété" });
    }

    // CORRECTION: Utiliser rentType au lieu de locationType
    if (demande.property.rentType !== "saisonniere") {
      return res.status(400).json({ 
        error: "Cette propriété n'est pas en location saisonnière",
        propertyType: demande.property.rentType
      });
    }

    // Vérifier si une réservation existe déjà
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

    // Calculer les dates (début dans 7 jours, durée 7 nuits par défaut)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() + 7);
    
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 7);

    // Calculer le prix
    const nuits = 7; // par défaut
    const prixTotal = (demande.property?.price || 0) * nuits;

    // Créer la réservation
    const reservation = await prisma.locationSaisonniere.create({
      data: {
        propertyId: demande.propertyId,
        clientId: demande.createdById,  // CORRIGÉ: utiliser createdById
        dateDebut,
        dateFin,
        prixTotal,
        nombreAdultes: 2,
        nombreEnfants: 0,
        statut: 'confirmee', // Directement confirmée car la visite a eu lieu
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

    // Créer un paiement associé
    await prisma.paiementLocation.create({
      data: {
        locationId: reservation.id,
        montant: prixTotal * 0.3, // 30% d'acompte
        methode: 'virement',
        reference: `AUTO-RES-${reservation.id}-${Date.now()}`,
        statut: 'en_attente',
        datePaiement: new Date()
      }
    });

    // Créer une notification pour le client
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

// POST /api/locations-saisonnieres/auto-from-property/:propertyId - Création automatique
router.post('/auto-from-property/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { clientId } = req.body;
    
    console.log(`🏠 [BACKEND] Création réservation automatique depuis propriété: ${propertyId}`);
    
    // propertyId est déjà un UUID string, ne pas utiliser parseInt()
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
    
    // Vérifier que c'est une location saisonnière
    if (property.rentType !== 'saisonniere') {
      return res.status(400).json({ 
        error: 'Cette propriété n\'est pas en location saisonnière' 
      });
    }
    
    // Vérifier que le bien est à louer
    if (!['rent', 'both'].includes(property.listingType)) {
      return res.status(400).json({ 
        error: 'Cette propriété n\'est pas disponible à la location' 
      });
    }
    
    // Vérifier que le bien n'est pas déjà loué
    if (property.status === 'rented') {
      return res.status(400).json({ 
        error: 'Cette propriété est déjà marquée comme louée' 
      });
    }
    
    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    // Calculer les dates (par défaut 7 jours après aujourd'hui, durée 7 nuits)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() + 7);
    
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 7);
    
    // Calculer le prix
    const prixNuit = property.price || 0;
    const prixTotal = prixNuit * 7;
    
    // Créer la réservation
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
    
    // Mettre à jour le statut de la propriété
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

// GET /api/locations-saisonnieres/client/:clientId - Réservations d'un client
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

// GET /api/locations-saisonnieres/owner/:ownerId - Réservations des biens d'un propriétaire
router.get('/owner/:ownerId', authenticateToken, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    console.log(`🏠 [BACKEND] Récupération réservations propriétaire: ${ownerId}`);
    
    // 1. Récupérer toutes les propriétés du propriétaire
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
    
    // 2. Récupérer les réservations pour ces propriétés
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
// GET /api/locations-saisonnieres/property/:propertyId/client/:clientId - Vérifier si réservation existe
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