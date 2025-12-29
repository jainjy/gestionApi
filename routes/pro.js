// routes/pro.js - VERSION AMÉLIORÉE AVEC NOTES ET TRI
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");

// ROUTE PRINCIPALE - AVEC NOTES ET TRI
router.get("/", async (req, res) => {
  console.log("Requête /api/pro reçue avec query:", req.query);

  try {
    const {
      page = 1,
      limit = 1000,
      search = "",
      metierId,
      city,
      sort = "newest",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire les filtres
    const where = {
      OR: [{ role: "professional" }, { userType: "PRESTATAIRE" }],
    };

    // Filtre par recherche
    if (search && search.trim() !== "") {
      const searchConditions = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { commercialName: { contains: search, mode: "insensitive" } },
      ];

      where.AND = [{ OR: where.OR }, { OR: searchConditions }];

      delete where.OR;
    }

    // Filtre par métier
    if (metierId && !isNaN(parseInt(metierId))) {
      where.metiers = {
        some: {
          metierId: parseInt(metierId),
        },
      };
    }

    // Filtre par ville
    if (city && city.trim() !== "") {
      where.city = {
        contains: city.trim(),
        mode: "insensitive",
      };
    }

    // Déterminer l'ordre de tri
    const orderBy = {};
    switch (sort) {
      case "rating":
        // Note: vous devrez ajuster selon votre structure de données
        // Pour l'instant, on trie par date
        orderBy.createdAt = "desc";
        break;
      case "name":
        orderBy.firstName = "asc";
        orderBy.lastName = "asc";
        break;
      case "newest":
      default:
        orderBy.createdAt = "desc";
        break;
    }

    // Récupérer les professionnels AVEC LES NOTES (si elles existent)
    const professionals = await prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        companyName: true,
        commercialName: true,
        userType: true,
        role: true,
        address: true,
        city: true,
        zipCode: true,
        createdAt: true,

        // Note: Vous devrez ajouter une relation Review pour calculer les notes
        // Pour l'instant, nous simulons les notes

        metiers: {
          include: {
            metier: {
              select: {
                id: true,
                libelle: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    // Simuler des données de rating pour la démo
    // À remplacer par vos vraies données Review
    const professionalsWithRating = professionals.map((pro) => ({
      ...pro,
      rating: Math.random() * 2 + 3, // 3-5 étoiles
      reviewCount: Math.floor(Math.random() * 50),
    }));

    // Compter le total
    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: professionalsWithRating,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    console.error("Erreur globale:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des professionnels",
      message: error.message,
    });
  }
});

// ROUTE POUR LES MÉTIERS DISPONIBLES
router.get("/metiers/disponibles", async (req, res) => {
  try {
    // Récupérer tous les métiers ayant au moins un professionnel
    const metiersAvecPros = await prisma.metier.findMany({
      where: {
        users: {
          some: {
            user: {
              OR: [{ role: "professional" }, { userType: "PRESTATAIRE" }],
            },
          },
        },
      },
      select: {
        id: true,
        libelle: true,
        _count: {
          select: {
            users: {
              where: {
                user: {
                  OR: [{ role: "professional" }, { userType: "PRESTATAIRE" }],
                },
              },
            },
          },
        },
      },
      orderBy: [{ libelle: "asc" }],
    });

    res.json({
      success: true,
      data: metiersAvecPros.map((metier) => ({
        id: metier.id,
        libelle: metier.libelle,
        count: metier._count.users,
      })),
    });
  } catch (error) {
    console.error("Erreur route metiers/disponibles:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des métiers",
    });
  }
});

// ROUTES SPÉCIFIQUES PAR CATÉGORIE
async function getProfessionalsByMetiers(res, req, metierFilters, category) {
  try {
    const { page = 1, limit = 1000, city, sort = "newest" } = req.query;
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Chercher les métiers correspondants
    const metiers = await prisma.metier.findMany({
      where: {
        OR: metierFilters.map((word) => ({
          libelle: { contains: word, mode: "insensitive" },
        })),
      },
      select: { id: true, libelle: true },
    });

    const metierIds = metiers.map((m) => m.id);

    // Construire la condition WHERE
    const where = {
      OR: [{ role: "professional" }, { userType: "PRESTATAIRE" }],
      ...(city && {
        city: { contains: city, mode: "insensitive" },
      }),
      ...(metierIds.length > 0 && {
        metiers: { some: { metierId: { in: metierIds } } },
      }),
    };

    // Déterminer l'ordre de tri
    const orderBy = {};
    switch (sort) {
      case "rating":
        orderBy.createdAt = "desc";
        break;
      case "name":
        orderBy.firstName = "asc";
        orderBy.lastName = "asc";
        break;
      case "newest":
      default:
        orderBy.createdAt = "desc";
        break;
    }

    // Récupérer les professionnels
    const professionals = await prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        companyName: true,
        commercialName: true,
        city: true,
        zipCode: true,
        address: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        metiers: {
          include: { metier: { select: { id: true, libelle: true } } },
        },
      },
      orderBy,
    });

    const total = await prisma.user.count({ where });

    return res.json({
      success: true,
      data: professionals,
      category,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error(`Erreur route ${category}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erreur lors de la récupération des ${category}`,
      error: error.message,
    });
  }
}

// Routes spécifiques
router.get("/agences", (req, res) =>
  getProfessionalsByMetiers(res, req, ["agenc", "agence"], "agences")
);

router.get("/constructeurs", (req, res) =>
  getProfessionalsByMetiers(
    res,
    req,
    ["construct", "maçon", "charpent", "batiment"],
    "constructeurs"
  )
);

router.get("/plombiers", (req, res) =>
  getProfessionalsByMetiers(
    res,
    req,
    ["plomb", "plomber", "sanitaire"],
    "plombiers"
  )
);

// NOUVELLE ROUTE: Récupérer les notes d'un professionnel
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;

    // Exemple de récupération des notes
    // À adapter selon votre modèle Review
    const reviews = await prisma.review.findMany({
      where: {
        // Relation à définir selon votre schéma
        // Par exemple: service: { user: { id } }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer la note moyenne
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error("Erreur route reviews:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des notes",
    });
  }
});

module.exports = router;
