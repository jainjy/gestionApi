const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");
const { createNotification } = require("../services/notificationService");

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
router.post("/new", authenticateToken, async (req, res) => {
  try {
    const { libelle, description, price, duration, categoryId, images } = req.body;
    const io = req.app.get("io"); // WebSocket

    if (!libelle || !categoryId) {
      return res.status(400).json({ error: "Libellé et catégorie requis." });
    }

    // ➕ Création de l'œuvre (service)
    const newOeuvre = await prisma.service.create({
      data: {
        createdById: req.user.id,
        libelle,
        type:"art",
        description: description || "",
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        categoryId: parseInt(categoryId),
        images: images || [],
      },
    });

    // 🔔 Création automatique d’une notification
    await createNotification({
      userId: req.user.id,
      type: "success",
      title: "Nouvelle œuvre ajoutée",
      message: `L’œuvre "${libelle}" a été ajoutée avec succès.`,
      relatedEntity: "service",
      relatedEntityId: String(newOeuvre.id),
      io
    });

    // Réponse API
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
// Liste des œuvres du professionnel connecté
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // ID de l'utilisateur connecté

    // Récupérer les services liés à l'utilisateur connecté
    const userServices = await prisma.utilisateurService.findMany({
      where: {
        userId: userId
      },
      include: {
        service: {
          include: {
            category: true,
            metiers: true,
            users: true
          }
        }
      }
    });

    // Filtrer les catégories artistiques
    const oeuvres = userServices
      .map(us => us.service)
      .filter(service => {
        const categoryName = service.category?.name?.toLowerCase() || '';
        return [
          'art', 'commerce', 'peinture', 'sculptures', 
          'artisanat', 'boutique'
        ].some(artCategory => categoryName.includes(artCategory));
      })
      .map(service => ({
        ...service,
        category: service.category ? { 
          id: service.category.id, 
          name: service.category.name 
        } : null
      }));

    res.json(oeuvres);
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// === GET /api/oeuvre/categories ===
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: "art", mode: "insensitive" } },
          { name: { contains: "commerce", mode: "insensitive" } },
          { name: { contains: "peinture", mode: "insensitive" } },
          { name: { contains: "sculptures", mode: "insensitive" } },
          { name: { contains: "artisanat", mode: "insensitive" } },
          { name: { contains: "boutique", mode: "insensitive" } },
        ],
      },
      distinct: ["name"], // éviter doublons
      orderBy: { name: "asc" }, // trier par ordre alphabétique
    });

    res.status(200).json(categories || []);
  } catch (err) {
    console.error("Erreur GET /categories :", err);
    res
      .status(500)
      .json({ message: "Erreur serveur lors du chargement des catégories" });
  }
});
// GET /api/oeuvre/stats - Statistiques des oeuvres pour le professionnel connecté
 router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const categoriesCibles = ["Art", "Commerce", "Artisanat", "Peinture", "Sculpture"];

    const totalStats = await prisma.service.aggregate({
      _count: { id: true },
      _sum: { price: true },
      where: {
        category: {
          name: {
            in: categoriesCibles
          }
        }
      }
    });

    const totalPrix = totalStats._sum.price ?? 0;

    // Même structure que tu voulais
    const response = res.json({
      totalGlobal: {
        totalOeuvres: totalStats._count.id,
        totalPrix
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//modification
// === PUT /api/oeuvre/:id ===
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, description, price, duration, categoryId, images } = req.body;
    const io = req.app.get("io"); // WebSocket

    if (!libelle || !categoryId) {
      return res.status(400).json({ error: "Libellé et catégorie requis." });
    }

    // ➕ Modification de l'œuvre
    const updatedOeuvre = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        libelle,
        description: description || "",
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        categoryId: parseInt(categoryId),
        images: images || [],
      },
    });

    // 🔔 Notification automatique de modification
    await createNotification({
      userId: req.user.id,
      type: "info",
      title: "Modification d’une œuvre",
      message: `L’œuvre "${libelle}" a été modifiée avec succès.`,
      relatedEntity: "service",
      relatedEntityId: String(updatedOeuvre.id),
      io
    });

    res.json(updatedOeuvre);

  } catch (error) {
    console.error("Erreur lors de la modification :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
//suppresion
// === DELETE /api/oeuvre/:id ===
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Œuvre supprimée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// GET /services?search=terme
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query; // récupère le terme de recherche

    let services;
    if (search) {
      service = await prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
           
          ]
        },
        include: { vendor: true } // inclure les infos du vendeur si nécessaire
      });
    } else {
      // si pas de recherche, renvoyer tous les services
      services = await prisma.service.findMany({
        include: { vendor: true }
      });
    }

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



// === GET /api/oeuvre ===
// Liste des œuvres
router.get("/all", async (req, res) => {
  try {
    const oeuvres = await prisma.service.findMany({
      include: {
        category: true,
        metiers: true,
        users: true
      },
      where: {
        category: {
          OR: [
            { name: { contains: "art", mode: "insensitive" } },
            { name: { contains: "commerce", mode: "insensitive" } },
            { name: { contains: "peinture", mode: "insensitive" } },
            { name: { contains: "sculptures", mode: "insensitive" } },
            { name: { contains: "artisanat", mode: "insensitive" } },
            { name: { contains: "boutique", mode: "insensitive" } }
          ]
        }
      }
    });
    res.json(oeuvres);
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




//effectif

module.exports = router;
