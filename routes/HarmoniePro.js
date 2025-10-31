const express = require("express");
const router = express.Router();
const multer = require("multer");
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const { createClient } = require("@supabase/supabase-js");

router.post("/new", authenticateToken, async (req, res) => {
  try {
    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierId,
      userId,
      images,
    } = req.body;

    price = price ? parseFloat(price) : null;
    duration = duration ? parseInt(duration) : null;
    images = Array.isArray(images) ? images : [];

    const data = {
      libelle,
      description,
      price,
      duration,
      images,
    };

    // Connexion à la catégorie
    if (categoryId) {
      data.category = { connect: { id: parseInt(categoryId) } };
    }

    // Connexion au métier
    if (metierId) {
      data.metiers = { create: [{ metierId: parseInt(metierId) }] };
    }

    // Si tu as une relation vers les utilisateurs, adapte le nom exact
    if (userId) {
      data.users = { connect: { id: parseInt(userId) } }; // ← ici "users" selon ton schéma
    }

    const newService = await prisma.service.create({
      data,
      include: {
        category: true,
        metiers: { include: { metier: true } },
        users: true, // ← pas "user"
      },
    });

    res.status(201).json(newService);
  } catch (error) {
    console.error("Erreur lors de la création du service:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔍 POST /api/harmonie/filtre - Charger catégories en fonction du métiers
router.post("/filtre", authenticateToken, async (req, res) => {
  try {
    // 🔹 Catégories Formateur (physiques)
    const Formateur = await prisma.category.findMany({
      where: {
        name: {
          in: ["Yoga", "Pilates", "Cuisine", "Sport"],
        },
      },
    });

    // 🔹 Catégories Podcasteur (mentales)
    const Podcasteur = await prisma.category.findMany({
      where: {
        name: {
          in: ["Motivation", "Guérison", "Spiritualité", "Méditation"],
        },
      },
    });

    res.json({ Formateur, Podcasteur });
  } catch (err) {
    console.error("Erreur récupération données formulaire :", err);
    res.status(500).json({ error: "Erreur lors du chargement des données" });
  }
});

// Récupération des métiers principaux
router.get("/metiers", authenticateToken, async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      where: {
        libelle: {
          in: ["Thérapeute", "Masseur", "Formateur", "Podcasteur"],
        },
      },
    });

    console.log("Métiers trouvés :", metiers); // ✅ Vérifie dans la console serveur

    res.json(metiers);
  } catch (error) {
    console.error("Erreur lors de la récupération des métiers :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des métiers" });
  }
});

// GET /api/harmonie/services
router.get("/services", authenticateToken, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        metiers: { include: { metier: true } },
        category: true,
      },
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



module.exports = router;
