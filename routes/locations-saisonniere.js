const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/locations-saisonnieres/client/:userId - Réservations d'un client
router.get("/client/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.query;

    console.log(`🔄 [BACKEND] Recherche réservations pour client: ${userId}`);
    console.log(`🔑 [BACKEND] Headers auth:`, req.headers.authorization);
    console.log(`👤 [BACKEND] User from token:`, req.user);

    // Vérifier si userId est un UUID ou un nombre
    let clientId;
    
    // Vérifier si c'est un UUID (format avec tirets)
    if (userId.includes('-')) {
      console.log(`🔍 [BACKEND] UUID détecté: ${userId}`);
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      
      if (!user) {
        console.log(`❌ [BACKEND] Utilisateur non trouvé avec UUID: ${userId}`);
        return res.status(404).json({ 
          error: "Utilisateur non trouvé"
        });
      }
      
      clientId = user.id;
      console.log(`✅ [BACKEND] UUID ${userId} correspond à l'utilisateur:`, {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      });
    } else {
      console.log(`🔍 [BACKEND] ID numérique détecté: ${userId}`);
      clientId = parseInt(userId);
      
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      
      if (!user) {
        console.log(`❌ [BACKEND] Utilisateur non trouvé avec ID numérique: ${clientId}`);
        return res.status(404).json({ 
          error: "Utilisateur non trouvé"
        });
      }
      
      console.log(`✅ [BACKEND] Utilisateur trouvé:`, {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      });
    }

    let whereClause = {
      clientId: clientId,
    };

    // Filtre par statut si fourni
    if (statut) {
      whereClause.statut = statut;
    }

    console.log(`🔍 [BACKEND] Clause de recherche:`, JSON.stringify(whereClause));

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
    
    if (reservations.length > 0) {
      reservations.forEach((res, index) => {
        console.log(`📋 [BACKEND] Réservation ${index + 1}:`, {
          id: res.id,
          clientId: res.clientId,
          propertyId: res.propertyId,
          statut: res.statut,
          prixTotal: res.prixTotal,
          client: res.client ? `${res.client.firstName} ${res.client.lastName}` : 'N/A',
          property: res.property?.title
        });
      });
    } else {
      console.log(`⚠️ [BACKEND] Aucune réservation trouvée pour clientId: ${clientId}`);
    }

    // Calculer le nombre de nuits pour chaque réservation
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
    console.error("📝 [BACKEND] Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Erreur serveur", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/locations-saisonnieres/proprietaire/:userId - Réservations d'un propriétaire
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
        locationType: "saisonnier",
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
        property: true,
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

// POST /api/locations-saisonnieres - Créer une réservation
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

    // Validation
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

// PATCH /api/locations-saisonnieres/:id/statut - Mettre à jour le statut
router.patch("/:id/statut", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut) {
      return res.status(400).json({ error: "Le statut est requis" });
    }

    console.log(`🔄 [BACKEND] Mise à jour statut réservation ${id} -> ${statut}`);

    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const updatedReservation = await prisma.locationSaisonniere.update({
      where: { id: parseInt(id) },
      data: { statut },
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
        paiements: true,
      },
    });

    console.log(`✅ [BACKEND] Statut mis à jour pour réservation ${id}`);

    res.json({
      message: "Statut mis à jour avec succès",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
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

// GET /api/locations-saisonnieres/proprietaire/:userId/stats - Statistiques pour propriétaire
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
        locationType: "saisonnier",
        listingType: { in: ["rent", "both"] },
      },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
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
      });
    }

    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      include: {
        paiements: true,
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
        .reduce((sum, r) => sum + r.prixTotal, 0),
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

    const occupationRate = Math.round((joursOccupes / (propertyIds.length * 30)) * 100);

    console.log(`✅ [BACKEND] Statistiques calculées pour ${propertyIds.length} propriétés`);

    res.json({
      ...stats,
      occupationRate,
      propertiesCount: propertyIds.length,
    });
  } catch (error) {
    console.error("❌ [BACKEND] Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// POST /api/locations-saisonnieres/from-demande - Créer réservation automatique depuis demande
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
        user: true
      }
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    if (!demande.propertyId) {
      return res.status(400).json({ error: "Cette demande n'est pas liée à une propriété" });
    }

    // Vérifier si la propriété est en location saisonnière
    if (demande.property.locationType !== "saisonnier") {
      return res.status(400).json({ 
        error: "Cette propriété n'est pas en location saisonnière",
        propertyType: demande.property.locationType
      });
    }

    // Vérifier si une réservation existe déjà
    const existingReservation = await prisma.locationSaisonniere.findFirst({
      where: {
        propertyId: demande.propertyId,
        clientId: demande.userId,
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
        clientId: demande.userId,
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
        client: true
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
        userId: demande.userId,
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

module.exports = router;