const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { upload, uploadToSupabase } = require("../middleware/upload");


//
// =======================================
// AJOUT VOL AVEC IMAGE SUR SUPABASE
// =======================================
router.post(
  "/flights",
  authenticateToken,
  requireRole("professional"),
  upload.single("image"), // ✅ réception du fichier image
    async (req, res) => {
      try {
        const userId = req.user.id;

        let imageUrl = null;

        // ✅ Upload vers Supabase si image existe
        if (req.file) {
          const uploaded = await uploadToSupabase(req.file, "flights");
          imageUrl = uploaded.url;
        }

        const {
          compagnie,
          numeroVol,
          departVille,
          departDateHeure,
          arriveeVille,
          arriveeDateHeure,
          duree,
          escales,
          prix,
          classe,
          services
        } = req.body;

        const flight = await prisma.flight.create({
          data: {
            compagnie,
            numeroVol,
            departVille,
            departDateHeure: new Date(departDateHeure),
            arriveeVille,
            arriveeDateHeure: new Date(arriveeDateHeure),
            duree,
            escales: parseInt(escales),
            prix: parseFloat(prix),
            classe,
            services: Array.isArray(services) ? services : JSON.parse(services),

            // ✅ lien image Supabase
            image: imageUrl,

            // ✅ relation avec le professionnel
            idPrestataire: userId
          }
        });

        res.status(201).json({
          success: true,
          message: "Vol ajouté avec succès ✅",
          data: flight
        });

      } catch (error) {
        console.error("Erreur ajout vol:", error);
        res.status(500).json({
          success: false,
          message: "Erreur lors de l'ajout du vol"
        });
      }
    }
);

//recuperation de vols avec condition selon le role 
router.get('/flights', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    let whereCondition = {};

    if (user.role === 'professional') {
      whereCondition.idPrestataire = user.id;
    }

    const flights = await prisma.flight.findMany({
      where: whereCondition,
      include: {
        prestataire: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: flights
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

//recuperation de tous les vols avec les infos des prestataires et des utilisateurs ayant reservé
router.get("/", async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        prestataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        userReservation: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Optionnel : créer un nom complet propre
    const formattedFlights = flights.map(flight => ({
      ...flight,
      prestataire: flight.prestataire ? {
        ...flight.prestataire,
        nomComplet: `${flight.prestataire.firstName || ""} ${flight.prestataire.lastName || ""}`.trim()
      } : null,
      userReservation: flight.userReservation ? {
        ...flight.userReservation,
        nomComplet: `${flight.userReservation.firstName || ""} ${flight.userReservation.lastName || ""}`.trim()
      } : null
    }));

    res.status(200).json({
      success: true,
      count: formattedFlights.length,
      data: formattedFlights
    });

  } catch (error) {
    console.error("Erreur récupération vols :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des vols"
    });
  }
});


// ================================
// CRÉER UNE RÉSERVATION DE VOL
// ================================
router.post('/reservation/:flightId/reserver', authenticateToken, async (req, res) => {
  try {
    console.log("✈️ Nouvelle réservation de vol");

    const flightId = req.params.flightId;

    // ✅ Utilisateur connecté (celui qui réserve)
    const idUser = req.user.id;

    const { nbrPersonne, place } = req.body;

    if (!nbrPersonne || !place) {
      return res.status(400).json({
        success: false,
        message: "nbrPersonne et place sont obligatoires"
      });
    }

    const flight = await prisma.flight.findUnique({
      where: { id: flightId }
    });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Vol introuvable"
      });
    }

    // ✅ Prestataire (propriétaire du vol)
    const idPrestataire = flight.idPrestataire;

    // ✅ Insertion réservation
    const reservation = await prisma.reservationFlight.create({
      data: {
        flightId,
        idUser,
        idPrestataire,
        nbrPersonne: Number(nbrPersonne),
        place
      },
      include: {
        flight: true,
        userReservation: true,
        prestataire: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Réservation de vol créée avec succès",
      data: reservation
    });

  } catch (error) {
    console.error("❌ Erreur réservation vol :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

module.exports = router;
