const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// GET /api/categories - Récupérer toutes les catégories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des catégories" });
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
                metier: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    res.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la catégorie" });
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
            metier: true,
          },
        },
        Review: true,
      },
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des services" });
  }
});

// POST /api/categories - Créer une nouvelle catégorie
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ error: "Le nom de la catégorie est requis" });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la catégorie" });
  }
});

// PUT /api/categories/:id - Mettre à jour une catégorie
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ error: "Le nom de la catégorie est requis" });
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.json(category);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la catégorie" });
  }
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Catégorie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la catégorie" });
  }
});
// GET /api/categories/name/:name/services - Récupérer les services par nom de catégorie
router.get("/name/:name/services", async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`Recherche de catégories pour: ${name}`);

    let whereCondition = {};
    let categoryLabel = "";
    let categoriesToSearch = [];

    // Normaliser le nom pour la comparaison
    const normalizedName = name.toLowerCase().trim();

    // Définir les catégories à rechercher selon le nom
    switch (normalizedName) {
      case "prestations intérieures":
      case "prestations interieures":
      case "intérieures":
      case "interieures":
      case "interieur":
      case "intérieur":
        categoriesToSearch = [
          "Prestations intérieures",
          "Rénovation intérieure",
          "Aménagement intérieur",
          "Décoration intérieure",
          "Intérieur",
          "Interieur"
        ];
        categoryLabel = "Prestations intérieures";
        break;

      case "prestations extérieures":
      case "prestations exterieures":
      case "extérieures":
      case "exterieures":
      case "exterieur":
      case "extérieur":
        categoriesToSearch = [
          "Prestations extérieures",
          "Aménagement extérieur",
          "Jardinage",
          "Terrassement",
          "Extérieur",
          "Exterieur"
        ];
        categoryLabel = "Prestations extérieures";
        break;

      case "constructions":
      case "construction":
        categoriesToSearch = [
          "Constructions",
          "Gros œuvre",
          "Maçonnerie",
          "Charpente",
          "Couverture",
          "Construction"
        ];
        categoryLabel = "Constructions";
        break;

      case "matériaux":
      case "materiaux":
      case "matériau":
      case "materiau":
        categoriesToSearch = [
          "Matériaux",
          "Matériaux de construction",
          "Matériaux intérieurs",
          "Matériaux extérieurs",
          "Fournitures",
          "Matériel"
        ];
        categoryLabel = "Matériaux";
        break;

      case "autres services travaux":
      case "autres services":
      case "services travaux":
      case "services techniques":
      case "services annexes":
        categoriesToSearch = [
          "Autres services travaux",
          "Services annexes",
          "Prestations complémentaires",
          "Maintenance",
          "Devis & expertise",
          "Diagnostic bâtiment",
          "Services techniques",
          "Expertise"
        ];
        categoryLabel = "Autres services travaux";
        break;

      default:
        // Recherche normale par nom (avec LIKE pour plus de flexibilité)
        categoriesToSearch = [name];
        categoryLabel = name;
    }

    console.log("Catégories à rechercher:", categoriesToSearch);

    // Rechercher les catégories avec OR pour plus de flexibilité
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          // Recherche exacte (insensitive)
          { name: { in: categoriesToSearch, mode: 'insensitive' } },
          // Recherche partielle pour catégories similaires
          ...categoriesToSearch.map(catName => ({
            name: { contains: catName, mode: 'insensitive' }
          }))
        ]
      },
      include: {
        services: {
          include: {
            metiers: {
              include: {
                metier: true,
              },
            },
            Review: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log("Catégories trouvées:", categories.length);

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        error: "Catégorie(s) non trouvée(s)",
        searchedFor: name,
        categoriesToSearch: categoriesToSearch,
        suggestion: "Vérifiez que les catégories existent dans la base de données"
      });
    }

    // Fusionner tous les services de toutes les catégories trouvées
    const allServices = categories.flatMap((cat) =>
      cat.services.map((service) => ({
        ...service,
        sourceCategory: cat.name, // Optionnel: pour savoir de quelle catégorie vient le service
      }))
    );

    // Dédupliquer les services par ID
    const uniqueServices = Array.from(
      new Map(allServices.map((service) => [service.id, service])).values()
    );

    console.log("Services uniques trouvés:", uniqueServices.length);

    res.json({
      category: categoryLabel,
      services: uniqueServices,
      categoriesFound: categories.map((cat) => cat.name),
      totalServices: uniqueServices.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des services par catégorie",
      details: error.message,
    });
  }
});

// GET /api/categories/grouped - Récupérer les catégories groupées par type
router.get("/grouped/main-categories", async (req, res) => {
  try {
    // Récupérer toutes les catégories
    const allCategories = await prisma.category.findMany({
      include: {
        services: {
          include: {
            metiers: {
              include: {
                metier: true,
              },
            },
          },
        },
      },
    });

    console.log("Toutes les catégories chargées:", allCategories.length);

    // Grouper les catégories par type principal - CORRIGÉ
    const groupedCategories = {
      interieurs: {
        id: "interieurs",
        label: "PRESTATIONS INTÉRIEURES",
        description: "Transformez votre intérieur avec nos experts",
        categories: allCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes("intérieur") ||
            cat.name.toLowerCase().includes("interieur") ||
            cat.name.toLowerCase().includes("rénovation") ||
            cat.services?.some(
              (service) =>
                service.libelle.toLowerCase().includes("peinture") || // CORRIGÉ: service.libelle au lieu de service.name
                service.libelle.toLowerCase().includes("électricité") ||
                service.libelle.toLowerCase().includes("électricite") ||
                service.libelle.toLowerCase().includes("plomberie")
            )
        ),
      },
      exterieurs: {
        id: "exterieurs",
        label: "PRESTATIONS EXTÉRIEURES",
        description: "Aménagez vos espaces extérieurs",
        categories: allCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes("extérieur") ||
            cat.name.toLowerCase().includes("exterieur") ||
            cat.name.toLowerCase().includes("jardin") ||
            cat.name.toLowerCase().includes("terrasse")
        ),
      },
      constructions: {
        id: "constructions",
        label: "CONSTRUCTIONS",
        description: "Bâtissez votre projet de A à Z",
        categories: allCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes("construction") ||
            cat.name.toLowerCase().includes("maçonnerie") ||
            cat.name.toLowerCase().includes("maconnerie") ||
            cat.name.toLowerCase().includes("gros œuvre") ||
            cat.name.toLowerCase().includes("gros oeuvre")
        ),
      },
      materiaux: {
        id: "materiaux",
        label: "MATÉRIAUX",
        description: "Matériaux de construction et fournitures",
        categories: allCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes("matériau") ||
            cat.name.toLowerCase().includes("materiau") ||
            cat.name.toLowerCase().includes("fourniture") ||
            cat.name.toLowerCase().includes("matériel")
        ),
      },
      autres: {
        id: "autres-services",
        label: "AUTRES SERVICES TRAVAUX",
        description: "Services complémentaires et expertise",
        categories: allCategories.filter(
          (cat) =>
            cat.name.toLowerCase().includes("service") ||
            cat.name.toLowerCase().includes("expertise") ||
            cat.name.toLowerCase().includes("maintenance") ||
            cat.name.toLowerCase().includes("diagnostic") ||
            cat.name.toLowerCase().includes("devis")
        ),
      },
    };

    // Ajouter des logs pour debug
    Object.keys(groupedCategories).forEach(key => {
      console.log(`${key}: ${groupedCategories[key].categories.length} catégories`);
    });

    res.json(groupedCategories);
  } catch (error) {
    console.error("Erreur lors du regroupement des catégories:", error);
    res.status(500).json({ 
      error: "Erreur lors du regroupement des catégories",
      details: error.message 
    });
  }
});

module.exports = router;
