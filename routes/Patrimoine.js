const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const crypto = require("crypto");

/**
 * POST /patrimoine
 * Création d'un patrimoine lié à l'utilisateur connecté
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      category,
      city,
      description,
      lat,
      lng,
      images,
      year,
      rating,
      featured,
    } = req.body;

    /* =========================
       VALIDATION DES CHAMPS
    ========================== */
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        field: "title",
        message: "Le titre est requis (min 3 caractères)",
      });
    }

    if (!category) {
      return res.status(400).json({
        field: "category",
        message: "La catégorie est requise",
      });
    }

    if (!city) {
      return res.status(400).json({
        field: "city",
        message: "La localisation est requise",
      });
    }

    if (!description || description.trim().length < 20) {
      return res.status(400).json({
        field: "description",
        message: "La description doit contenir au moins 20 caractères",
      });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        field: "coordinates",
        message: "Les coordonnées GPS sont requises",
      });
    }

    /* =========================
       NORMALISATION
    ========================== */
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({
        field: "coordinates",
        message: "Coordonnées GPS invalides",
      });
    }

    /* =========================
       CRÉATION PATRIMOINE
    ========================== */
    const patrimoine = await prisma.patrimoine.create({
      data: {
        idUnique: crypto.randomUUID(),
        title: title.trim(),
        category,
        city: city.trim(),
        description: description.trim(),
        lat: latitude,
        lng: longitude,
        images: Array.isArray(images) ? images : [],
        year: year ? Number(year) : null,
        rating: rating ? Number(rating) : 4.5,
        featured: featured === true,
        userId: req.user.id, // 🔗 relation User
      },
    });

    /* =========================
       SUCCÈS
    ========================== */
    return res.status(201).json({
      success: true,
      message: "Patrimoine créé avec succès",
      data: patrimoine,
    });
  } catch (error) {
    console.error("❌ Erreur POST /patrimoine :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du patrimoine",
    });
  }
});

module.exports = router;
