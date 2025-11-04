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
router.post("/new", authenticateToken, async (req, res) => {
  try {
    const { libelle, description, price, duration, categoryId, images } =
      req.body;

    if (!libelle || !categoryId) {
      return res.status(400).json({ error: "Libellé et catégorie requis." });
    }

    const newOeuvre = await prisma.service.create({
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
      include: { services: true },
    });
    const oeuvres = [];
    for (const category of categories) {
      if(category.services.length > 0) {
        category.category={id: category.id, name: category.name};
        oeuvres.push(...category.services);
      }

    }
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
    const userId = req.user.id

    // Services associés
    const associatedServices = await prisma.utilisateurService.count({
      where: { userId }
    })

    // Métiers du professionnel
    const userMetiers = await prisma.utilisateurMetier.count({
      where: { userId }
    })

    // Services disponibles via métiers
    const userMetiersList = await prisma.utilisateurMetier.findMany({
      where: { userId },
      select: { metierId: true }
    })

    const metierIds = userMetiersList.map(um => um.metierId)

    const availableServicesCount = await prisma.service.count({
      where: {
        metiers: {
          some: {
            metierId: {
              in: metierIds
            }
          }
        },
        NOT: {
          users: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    // Demandes liées aux services du professionnel
    const demandesCount = await prisma.demandeArtisan.count({
      where: { userId }
    })

    res.json({
      associatedServices,
      userMetiers,
      availableServicesCount,
      demandesCount,
      totalPotentialServices: associatedServices + availableServicesCount
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})


//modification
// === PUT /api/oeuvre/:id ===
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, description, price, duration, categoryId, images } = req.body;

    if (!libelle || !categoryId) {
      return res.status(400).json({ error: "Libellé et catégorie requis." });
    }

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




// === GET /api/oeuvre ===
// Liste des œuvres
router.get("/all", authenticateToken, async (req, res) => {
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
