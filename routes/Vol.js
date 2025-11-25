const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { upload, uploadToSupabase } = require("../middleware/upload");

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
            nom: true,
            email: true
          }
        },
        userReservation: {
          select: {
            id: true,
            nom: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      count: flights.length,
      data: flights
    });

  } catch (error) {
    console.error("Erreur récupération vols :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des vols"
    });
  }
});
 

module.exports = router;
