const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/locations-saisonnieres/client/:userId - Réservations d'un client
router.get("/client/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.query;

    console.log(`🔄 Recherche réservations pour client: ${userId}`);

    // Vérifier si userId est un UUID ou un nombre
    let clientId;
    
    // Vérifier si c'est un UUID (format avec tirets)
    if (userId.includes('-')) {
      // C'est un UUID, on doit trouver l'utilisateur par son UUID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ Utilisateur non trouvé avec UUID: ${userId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      clientId = user.id;
      console.log(`✅ UUID ${userId} correspond à l'utilisateur ID: ${clientId}`);
    } else {
      // C'est un ID numérique
      clientId = parseInt(userId);
      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ Utilisateur non trouvé avec ID numérique: ${clientId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      console.log(`✅ Utilisateur trouvé avec ID: ${clientId}`);
    }

    let whereClause = {
      clientId: clientId,
    };

    // Filtre par statut si fourni
    if (statut) {
      whereClause.statut = statut;
    }

    console.log(`🔍 Recherche réservations avec clause:`, whereClause);

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

    console.log(`✅ ${reservations.length} réservations trouvées pour le client`);

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
    console.error("❌ Erreur lors de la récupération des réservations client:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /api/locations-saisonnieres/proprietaire/:userId - Réservations d'un propriétaire
router.get("/proprietaire/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.query;

    console.log(`🔄 Recherche réservations pour propriétaire: ${userId}`);

    // Vérifier si userId est un UUID ou un nombre
    let ownerId;
    
    if (userId.includes('-')) {
      // C'est un UUID, on doit trouver l'utilisateur par son UUID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ Utilisateur non trouvé avec UUID: ${userId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      ownerId = user.id;
      console.log(`✅ UUID ${userId} correspond à l'utilisateur ID: ${ownerId}`);
    } else {
      // C'est un ID numérique
      ownerId = parseInt(userId);
      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
      });
      
      if (!user) {
        console.log(`❌ Utilisateur non trouvé avec ID numérique: ${ownerId}`);
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      console.log(`✅ Utilisateur trouvé avec ID: ${ownerId}`);
    }

    // Récupérer les propriétés du propriétaire
    console.log(`🔍 Recherche propriétés pour ownerId: ${ownerId}`);
    const properties = await prisma.property.findMany({
      where: {
        ownerId: ownerId,
        locationType: "saisonnier",
        listingType: { in: ["rent", "both"] },
      },
      select: { id: true },
    });

    console.log(`✅ ${properties.length} propriétés trouvées pour le propriétaire`);

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      console.log(`ℹ️  Aucune propriété en location saisonnière pour ce propriétaire`);
      return res.json([]);
    }

    let whereClause = {
      propertyId: { in: propertyIds },
    };

    // Filtre par statut si fourni
    if (statut) {
      whereClause.statut = statut;
    }

    console.log(`🔍 Recherche réservations pour propriétés:`, propertyIds);

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

    console.log(`✅ ${reservations.length} réservations trouvées pour le propriétaire`);

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
    console.error("❌ Erreur lors de la récupération des réservations propriétaire:", error);
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

    console.log(`🔄 Création réservation pour client: ${clientId}, propriété: ${propertyId}`);

    // Validation
    if (!propertyId || !dateDebut || !dateFin || !prixTotal || !clientId) {
      return res.status(400).json({
        error: "Les champs propertyId, dateDebut, dateFin, prixTotal et clientId sont requis",
      });
    }

    // Vérifier si la propriété existe et est en location saisonnière
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
    });

    if (!property) {
      return res.status(404).json({ error: "Propriété non trouvée" });
    }

    if (property.locationType !== "saisonnier") {
      return res.status(400).json({ error: "Cette propriété n'est pas en location saisonnière" });
    }

    // Vérifier si clientId est un UUID ou un nombre
    let clientIdNum;
    if (clientId.includes('-')) {
      // C'est un UUID
      const user = await prisma.user.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Client non trouvé" });
      }
      
      clientIdNum = user.id;
    } else {
      // C'est un ID numérique
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
        propertyId: parseInt(propertyId),
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
        propertyId: parseInt(propertyId),
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

    console.log(`✅ Réservation créée avec ID: ${reservation.id}`);

    // Créer un paiement initial (acompte)
    const paiement = await prisma.paiementLocation.create({
      data: {
        locationId: reservation.id,
        montant: parseFloat(prixTotal) * 0.3, // 30% d'acompte
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
    console.error("❌ Erreur lors de la création de la réservation:", error);
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

    console.log(`🔄 Mise à jour statut réservation ${id} -> ${statut}`);

    // Vérifier si la réservation existe
    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Mettre à jour le statut
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

    console.log(`✅ Statut mis à jour pour réservation ${id}`);

    res.json({
      message: "Statut mis à jour avec succès",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// DELETE /api/locations-saisonnieres/:id - Supprimer une réservation
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Suppression réservation ${id}`);

    // Vérifier si la réservation existe
    const reservation = await prisma.locationSaisonniere.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Seul le client peut supprimer une réservation en attente
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

    console.log(`✅ Réservation ${id} supprimée`);

    res.json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la réservation:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /api/locations-saisonnieres/:id - Obtenir les détails d'une réservation
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Détails réservation ${id}`);

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

    console.log(`✅ Détails réservation ${id} trouvés`);

    res.json(reservation);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la réservation:", error);
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

    console.log(`💰 Ajout paiement pour réservation ${id}`);

    // Vérifier si la réservation existe
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

    console.log(`✅ Paiement ajouté avec référence: ${paiement.reference}`);

    res.status(201).json({
      message: "Paiement ajouté avec succès",
      paiement,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du paiement:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// GET /api/locations-saisonnieres/proprietaire/:userId/stats - Statistiques pour propriétaire
router.get("/proprietaire/:userId/stats", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 Statistiques pour propriétaire: ${userId}`);

    // Vérifier si userId est un UUID ou un nombre
    let ownerId;
    
    if (userId.includes('-')) {
      // C'est un UUID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      ownerId = user.id;
    } else {
      // C'est un ID numérique
      ownerId = parseInt(userId);
      const user = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
    }

    // Récupérer les propriétés du propriétaire
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

    // Récupérer toutes les réservations
    const reservations = await prisma.locationSaisonniere.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      include: {
        paiements: true,
      },
    });

    // Calculer les statistiques
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

    // Calculer le taux d'occupation (pour les 30 derniers jours)
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

    console.log(`✅ Statistiques calculées pour ${propertyIds.length} propriétés`);

    res.json({
      ...stats,
      occupationRate,
      propertiesCount: propertyIds.length,
    });
  } catch (error) {
    console.error("❌ Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

module.exports = router;