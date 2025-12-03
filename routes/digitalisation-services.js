// routes/digitalisation-services.js
const express = require("express");
const router = express.Router();
const {prisma} = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// GET /api/digitalisation-services - Récupérer tous les services
router.get("/", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        category:{name:"Digitalisation"},
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            email: true,
            role: true,
            userType: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// GET /api/digitalisation-services/professionals - Route AVANT :userId pour éviter conflit
router.get("/professionals", async (req, res) => {
  try {
    const professionals = await prisma.user.findMany({
      where: {
        role: "professional",
        servicesCrees: {
          some: {
            category: {
              name: "Digitalisation"
            },
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        avatar: true,
        city: true,
        zipCode: true,
        address: true,
        websiteUrl: true,
        createdAt: true,
        servicesCrees: {
          where: {
            category: {
              name: "Digitalisation"
            },
            isActive: true,
          },
          include: {
            Review: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enrichedProfessionals = professionals.map((pro) => {
      const allReviews = pro.servicesCrees.flatMap((s) => s.Review);
      const averageRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0;

      return {
        ...pro,
        averageRating: parseFloat(averageRating),
        totalProjects: allReviews.length,
        serviceCount: pro.servicesCrees.length,
        satisfactionRate: allReviews.length > 0 
          ? Math.round(((allReviews.filter(r => r.rating >= 4).length / allReviews.length) * 100))
          : 0,
      };
    });

    res.json({
      success: true,
      data: enrichedProfessionals,
      count: enrichedProfessionals.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des professionnels:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// GET /api/digitalisation-services/professional/:userId - Services d'un professionnel
router.get("/professional/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer d'abord le professionnel
    const professional = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        avatar: true,
        city: true,
        zipCode: true,
        address: true,
        websiteUrl: true,
      },
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: "Professionnel non trouvé",
      });
    }

    // Récupérer les services du professionnel
    const services = await prisma.service.findMany({
      where: {
        createdById: userId,
        category: {
          name: "Digitalisation"
        },
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        Review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
                websiteUrl: true,
                email: true,
                phone: true,
                companyName: true,
                city: true,
                zipCode: true,
                address: true,
                userType: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    // Calculer les statistiques
    const allReviews = services.flatMap((s) => s.Review);
    const averageRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : 0;

    const enrichedServices = services.map((service) => {
      const serviceRatings = service.Review.map((r) => r.rating);
      const serviceAvg = serviceRatings.length > 0
        ? (serviceRatings.reduce((a, b) => a + b, 0) / serviceRatings.length).toFixed(1)
        : 0;

      return {
        ...service,
        averageRating: parseFloat(serviceAvg),
        reviewCount: service.Review.length,
      };
    });

    res.json({
      success: true,
      data: {
        professional,
        services: enrichedServices,
        statistics: {
          totalServices: services.length,
          totalReviews: allReviews.length,
          averageRating: parseFloat(averageRating),
        },
      },
      count: services.length,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des services du professionnel:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// GET /api/digitalisation-services/:id - Route APRÈS professional/:userId
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: {
        id: parseInt(id),
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            address: true,
            city: true,
            zipCode: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
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
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service non trouvé",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// POST /api/digitalisation-services - Créer un nouveau service (professionnel seulement)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { libelle, description, price, duration, images, tags } = req.body;

    // Vérifier que l'utilisateur est un professionnel
    if (!["professional", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Accès réservé aux professionnels",
      });
    }
    const category=await prisma.category.findFirst({
      where: {
        name: "Digitalisation",
      },
    });

    const service = await prisma.service.create({
      data: {
        libelle,
        description,
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        images: images || [],
        tags: tags || [],
        type: "digital",
        isCustom: true,
        isActive: true,
        createdById: req.user.id,
        categoryId: category.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: service,
      message: "Service créé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la création du service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// PUT /api/digitalisation-services/:id - Mettre à jour un service
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, description, price, duration, images, tags, isActive } =
      req.body;

    // Vérifier si le service existe et appartient à l'utilisateur
    const existingService = await prisma.service.findFirst({
      where: {
        id: parseInt(id),
        createdById: req.user.id,
      },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: "Service non trouvé ou non autorisé",
      });
    }

    const service = await prisma.service.update({
      where: {
        id: parseInt(id),
      },
      data: {
        libelle: libelle || existingService.libelle,
        description: description || existingService.description,
        price: price !== undefined ? parseFloat(price) : existingService.price,
        duration:
          duration !== undefined
            ? parseInt(duration)
            : existingService.duration,
        images: images || existingService.images,
        tags: tags || existingService.tags,
        isActive: isActive !== undefined ? isActive : existingService.isActive,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: service,
      message: "Service mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// DELETE /api/digitalisation-services/:id - Supprimer un service
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le service existe et appartient à l'utilisateur
    const existingService = await prisma.service.findFirst({
      where: {
        id: parseInt(id),
        createdById: req.user.id,
      },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: "Service non trouvé ou non autorisé",
      });
    }

    // Soft delete - désactiver le service
    await prisma.service.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      },
    });

    res.json({
      success: true,
      message: "Service supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du service:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

module.exports = router;
