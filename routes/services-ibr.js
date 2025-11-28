const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// GET /api/services-ibr - Récupérer uniquement les services IBR
router.get("/", async (req, res) => {
  try {
    console.log("🔍 Récupération des services IBR...");

    // Récupérer le métier IBR
    const metierIBR = await prisma.metier.findFirst({
      where: {
        libelle: "IBR",
      },
    });

    if (!metierIBR) {
      return res.status(404).json({
        error: "Métier IBR non trouvé",
        message: "Le métier IBR n'existe pas dans la base de données",
      });
    }

    console.log("✅ Métier IBR trouvé:", metierIBR.id);

    // Récupérer les services liés au métier IBR
    const services = await prisma.service.findMany({
      where: {
        metiers: {
          some: {
            metierId: metierIBR.id,
          },
        },
      },
      include: {
        category: true,
        metiers: {
          include: {
            metier: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`✅ ${services.length} services IBR trouvés`);

    // Transformer les données pour le frontend
    const transformedServices = services.map((service) => ({
      id: service.id,
      libelle: service.libelle,
      description: service.description,
      categoryId: service.categoryId,
      images: service.images,
      duration: service.duration,
      price: service.price,
      category: service.category,
      metiers: service.metiers.map((m) => ({
        metier: {
          id: m.metier.id,
          libelle: m.metier.libelle,
        },
      })),
    }));

    res.json(transformedServices);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des services IBR:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des services IBR",
      details: error.message,
    });
  }
});

// GET /api/services-ibr/categories - Récupérer les catégories des services IBR
router.get("/categories", async (req, res) => {
  try {
    // Récupérer le métier IBR
    const metierIBR = await prisma.metier.findFirst({
      where: {
        libelle: "IBR",
      },
    });

    if (!metierIBR) {
      return res.status(404).json({
        error: "Métier IBR non trouvé",
      });
    }

    // Liste des catégories IBR du seeder
    const ibrCategoryNames = [
      "Études préalables & faisabilité",
      "Études architecturales",
      "Études structurelles",
      "Économie de la construction",
      "Ingénierie environnementale & performance",
      "Suivi de chantier & direction de travaux",
      "Spécialités selon BET",
    ];

    // Récupérer UNIQUEMENT les catégories IBR définies
    const categories = await prisma.category.findMany({
      where: {
        name: {
          in: ibrCategoryNames,
        },
        services: {
          some: {
            metiers: {
              some: {
                metierId: metierIBR.id,
              },
            },
          },
        },
      },
      include: {
        services: {
          where: {
            metiers: {
              some: {
                metierId: metierIBR.id,
              },
            },
          },
          include: {
            metiers: {
              include: {
                metier: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(categories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories IBR:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/services-ibr/stats - Statistiques des services IBR
router.get("/stats", async (req, res) => {
  try {
    // Récupérer le métier IBR
    const metierIBR = await prisma.metier.findFirst({
      where: {
        libelle: "IBR",
      },
    });

    if (!metierIBR) {
      return res.status(404).json({ error: "Métier IBR non trouvé" });
    }

    const totalServices = await prisma.service.count({
      where: {
        metiers: {
          some: {
            metierId: metierIBR.id,
          },
        },
      },
    });

    const totalCategories = await prisma.category.count({
      where: {
        services: {
          some: {
            metiers: {
              some: {
                metierId: metierIBR.id,
              },
            },
          },
        },
      },
    });

    // Services par catégorie
    const servicesByCategory = await prisma.category.findMany({
      where: {
        services: {
          some: {
            metiers: {
              some: {
                metierId: metierIBR.id,
              },
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            services: {
              where: {
                metiers: {
                  some: {
                    metierId: metierIBR.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      totalServices,
      totalCategories,
      servicesByCategory: servicesByCategory.map((cat) => ({
        category: cat.name,
        count: cat._count.services,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats IBR:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
