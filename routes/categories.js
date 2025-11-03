const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// GET /api/categories - Récupérer toutes les catégories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
  }
});

// GET /api/categories/:id - Récupérer une catégorie par ID avec ses services
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        services: {
          include: {
            metiers: {
              include: {
                metier: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la catégorie" });
  }
});

// GET /api/categories/:id/services - Récupérer les services d'une catégorie
router.get("/:id/services", async (req, res) => {
  try {
    const { id } = req.params;
    const services = await prisma.service.findMany({
      where: { categoryId: parseInt(id) },
      include: {
        metiers: {
          include: {
            metier: true
          }
        },
        Review: true
      }
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des services" });
  }
});

// POST /api/categories - Créer une nouvelle catégorie
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom de la catégorie est requis" });
    }

    const category = await prisma.category.create({
      data: { name }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    res.status(500).json({ error: "Erreur lors de la création de la catégorie" });
  }
});

// PUT /api/categories/:id - Mettre à jour une catégorie
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Le nom de la catégorie est requis" });
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json(category);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la catégorie" });
  }
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Catégorie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de la catégorie" });
  }
});

// GET /api/categories/name/:name/services - Récupérer les services par nom de catégorie
router.get("/name/:name/services", async (req, res) => {
  try {
    const { name } = req.params;
    
    const category = await prisma.category.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive' // Recherche insensible à la casse
        }
      },
      include: {
        services: {
          include: {
            metiers: {
              include: {
                metier: true
              }
            },
            Review: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!category) {  
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json({
      category: category.name,
      services: category.services
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des services par catégorie" 
    });
  }
});


module.exports = router;
