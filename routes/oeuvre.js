const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");

// === Dossier upload ===
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// === Configuration multer ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// === POST /api/oeuvre ===
router.post('/new', authenticateToken, async (req, res) => {
  try {
    const { libelle, description, price, duration, categoryId, images } = req.body;

    if (!libelle || !categoryId) {
      return res.status(400).json({ error: "Libellé et catégorie requis." });
    }

    const newOeuvre = await prisma.oeuvre.create({
      data: {
        libelle,
        description: description || "",
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        categoryId: parseInt(categoryId),
        images: images || [],
      },
    });

    res.status(201).json({
      id: newOeuvre.id.toString(),
      libelle: newOeuvre.libelle,
      description: newOeuvre.description,
      price: newOeuvre.price,
      duration: newOeuvre.duration,
      categoryId: newOeuvre.categoryId,
      images: newOeuvre.images,
      status: "active",
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'œuvre :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// === GET /api/oeuvre ===
// Liste des œuvres
router.get("/", authenticateToken, async (req, res) => {
  try {
    const oeuvres = await prisma.oeuvre.findMany({
      include: { category: true },
    });
    res.json(oeuvres);
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
