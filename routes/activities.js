const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { uploadMixed, uploadToSupabase } = require("../middleware/upload");

const prisma = new PrismaClient();

// GET toutes les activités avec filtres
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      level,
      minPrice,
      maxPrice,
      location,
      featured,
      userId,
      limit = 12,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      status: "active",
    };

    // Filtre par catégorie
    if (category && category !== "all") {
      const categoryRecord = await prisma.activityCategory.findFirst({
        where: { name: category },
      });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // Filtre par utilisateur pro
    if (userId) where.userId = userId;

    // Filtre par recherche
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (level) where.level = level;
    if (featured === "true") where.featured = true;

    // Filtre par prix
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: false,
            phone: false,
          },
        },
        category: true,
        // REMOVED: availabilities relation since it doesn't exist in new schema
        // Les disponibilités sont maintenant gérées directement dans ActivityBooking
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            bookings: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.activity.count({ where });

    // Formater les données
    const formattedActivities = activities.map((activity) => {
      const { reviews, _count, ...activityData } = activity;

      // Calculer la note moyenne
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...activityData,
        rating: averageRating,
        reviewCount: _count.reviews,
        favoriteCount: _count.favorites,
        bookingCount: _count.bookings,
      };
    });

    res.json({
      success: true,
      data: formattedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des activités",
    });
  }
});

// GET activité par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            email: true,
            professionalCategory: true,
            companyName: true,
          },
        },
        category: true,
        // REMOVED: availabilities relation
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            favorites: true,
            bookings: {
              where: { status: "completed" },
            },
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activité non trouvée",
      });
    }

    // Vérifier si l'utilisateur a mis en favori
    let isFavorite = false;
    if (userId) {
      const favorite = await prisma.activityFavorite.findUnique({
        where: {
          userId_activityId: {
            userId,
            activityId: id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    // Incrémenter le compteur de vues
    await prisma.activity.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({
      success: true,
      data: {
        ...activity,
        isFavorite,
      },
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'activité",
    });
  }
});

// GET catégories
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await prisma.activityCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            activities: {
              where: { status: "active" },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
    });
  }
});

// POST nouvelle activité (pour les professionnels)
router.post(
  "/",
  authenticateToken,
  uploadMixed,
  async (req, res) => {
    try {
      const {
        title,
        description,
        categoryId,
        shortDescription,
        price,
        priceType,
        duration,
        durationType,
        level,
        maxParticipants,
        minParticipants,
        location,
        address,
        latitude,
        longitude,
        meetingPoint,
        includedItems,
        requirements,
        highlights,
        featured,
      } = req.body;

      // Vérifier que l'utilisateur est un professionnel
      if (req.user.role !== "professional" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Vous devez être un professionnel pour créer des activités",
        });
      }

      // Validation des données
      if (!title || !description || !categoryId) {
        return res.status(400).json({
          success: false,
          error: "Titre, description et catégorie sont obligatoires",
        });
      }

      // ✅ Gérer les fichiers uploadés
      let mainImage = req.body.mainImage || null;
      let images = [];

      // Si fichier mainImage uploadé
      if (req.files?.mainImage?.[0]) {
        const mainImageFile = req.files.mainImage[0];
        try {
          const uploadResult = await uploadToSupabase(mainImageFile, "activities");
          mainImage = uploadResult.url;
        } catch (error) {
          console.error("Erreur upload mainImage:", error);
        }
      }

      // Si fichiers images supplémentaires uploadés
      if (req.files?.images && req.files.images.length > 0) {
        for (const imageFile of req.files.images) {
          try {
            const uploadResult = await uploadToSupabase(imageFile, "activities");
            images.push(uploadResult.url);
          } catch (error) {
            console.error("Erreur upload image supplémentaire:", error);
          }
        }
      }

      // Créer l'activité
      const activity = await prisma.activity.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          shortDescription: shortDescription?.trim() || null,
          categoryId,
          userId: req.user.id,

          // Informations pratiques
          price: price ? parseFloat(price) : null,
          priceType: priceType || null,
          duration: duration ? parseInt(duration) : null,
          durationType: durationType || null,
          level: level || null,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
          minParticipants: parseInt(minParticipants) || 1,

          // Localisation
          location: location || null,
          address: address || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          meetingPoint: meetingPoint || null,

          // Images
          mainImage,
          images,

          // Informations supplémentaires
          includedItems: includedItems ? JSON.parse(includedItems) : [],
          requirements: requirements ? JSON.parse(requirements) : [],
          highlights: highlights ? JSON.parse(highlights) : [],

          // Statut
          featured: featured === "true",
          status: "draft",
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              professionalCategory: true,
              companyName: true,
            },
          },
          category: true,
        },
      });

      res.status(201).json({
        success: true,
        data: activity,
        message: "Activité créée avec succès",
      });
    } catch (error) {
      console.error("Error creating activity:", error);

      let errorMessage = "Erreur lors de la création de l'activité";
      if (error.code === "P2002") {
        errorMessage = "Une activité avec ce titre existe déjà";
      } else if (error.code === "P2003") {
        errorMessage = "Catégorie invalide";
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// PUT mettre à jour une activité
router.put(
  "/:id",
  authenticateToken,
  uploadMixed,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Vérifier que l'utilisateur est le propriétaire
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          error: "Activité non trouvée",
        });
      }

      if (activity.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Non autorisé à modifier cette activité",
        });
      }

      // ✅ Gérer les fichiers uploadés
      if (req.files?.mainImage?.[0]) {
        const mainImageFile = req.files.mainImage[0];
        try {
          const uploadResult = await uploadToSupabase(mainImageFile, "activities");
          updateData.mainImage = uploadResult.url;
        } catch (error) {
          console.error("Erreur upload mainImage:", error);
        }
      }

      if (req.files?.images && req.files.images.length > 0) {
        const newImages = [];
        for (const imageFile of req.files.images) {
          try {
            const uploadResult = await uploadToSupabase(imageFile, "activities");
            newImages.push(uploadResult.url);
          } catch (error) {
            console.error("Erreur upload image:", error);
          }
        }
        // Ajouter aux images existantes
        updateData.images = [
          ...(activity.images || []),
          ...newImages,
        ];
      }

      // Parser les tableaux JSON
      const arrayFields = ["includedItems", "requirements", "highlights"];
      arrayFields.forEach((field) => {
        if (updateData[field] && typeof updateData[field] === "string") {
          try {
            updateData[field] = JSON.parse(updateData[field]);
          } catch (e) {
            console.warn(`Failed to parse ${field}:`, e);
          }
        }
      });

      const updatedActivity = await prisma.activity.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          category: true,
        },
      });

      res.json({
        success: true,
        data: updatedActivity,
        message: "Activité mise à jour avec succès",
      });
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la mise à jour de l'activité",
      });
    }
  },
);

// GET activités d'un utilisateur professionnel spécifique
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await prisma.activity.findMany({
      where: {
        userId: userId,
        status: "active",
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            professionalCategory: true,
          },
        },
        category: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            favorites: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Formater avec la note moyenne
    const formattedActivities = activities.map((activity) => {
      const { reviews, _count, ...activityData } = activity;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...activityData,
        rating: averageRating,
        reviewCount: _count.reviews,
        favoriteCount: _count.favorites,
        bookingCount: _count.bookings,
      };
    });

    res.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des activités",
    });
  }
});

// GET mes activités (pour le professionnel connecté)
router.get("/my/activities", authenticateToken, async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        category: true,
        // REMOVED: availabilities relation
        _count: {
          select: {
            bookings: {
              where: { status: { in: ["confirmed", "completed"] } },
            },
            reviews: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching my activities:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de vos activités",
    });
  }
});

// GET activités favorites d'un utilisateur
router.get("/favorites/my-favorites", authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.activityFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        activity: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            category: true,
            // REMOVED: availabilities relation
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedFavorites = favorites.map((fav) => {
      const activity = fav.activity;
      const reviews = activity.reviews || [];
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...activity,
        rating: averageRating,
        reviewCount: activity._count.reviews,
        isFavorite: true,
        favoritedAt: fav.createdAt,
      };
    });

    res.json({
      success: true,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des favoris",
    });
  }
});

// POST ajouter/supprimer des favoris
router.post("/:activityId/favorite", authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;

    const existingFavorite = await prisma.activityFavorite.findUnique({
      where: {
        userId_activityId: {
          userId: req.user.id,
          activityId,
        },
      },
    });

    if (existingFavorite) {
      // Supprimer des favoris
      await prisma.activityFavorite.delete({
        where: {
          userId_activityId: {
            userId: req.user.id,
            activityId,
          },
        },
      });

      res.json({
        success: true,
        action: "removed",
        message: "Activité retirée des favoris",
      });
    } else {
      // Ajouter aux favoris
      await prisma.activityFavorite.create({
        data: {
          userId: req.user.id,
          activityId,
        },
      });

      res.json({
        success: true,
        action: "added",
        message: "Activité ajoutée aux favoris",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification des favoris",
    });
  }
});

// POST ajouter un avis
router.post("/:activityId/review", authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { bookingId, rating, comment, images } = req.body;

    // Vérifier que l'utilisateur a bien réservé cette activité
    const booking = await prisma.activityBooking.findFirst({
      where: {
        id: bookingId,
        activityId,
        userId: req.user.id,
        status: "completed",
      },
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error:
          "Vous ne pouvez noter que les activités que vous avez réservées et terminées",
      });
    }

    // Vérifier si un avis existe déjà pour cette réservation
    const existingReview = await prisma.activityReview.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà noté cette réservation",
      });
    }

    const review = await prisma.activityReview.create({
      data: {
        activityId,
        bookingId,
        userId: req.user.id,
        rating: parseInt(rating),
        comment,
        images: images || [],
        verified: true,
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
    });

    // Mettre à jour la note moyenne de l'activité
    const activityReviews = await prisma.activityReview.findMany({
      where: { activityId },
    });

    const averageRating =
      activityReviews.reduce((sum, review) => sum + review.rating, 0) /
      activityReviews.length;

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        rating: averageRating,
        reviewCount: activityReviews.length,
      },
    });

    res.json({
      success: true,
      data: review,
      message: "Avis ajouté avec succès",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout de l'avis",
    });
  }
});

// PUT publier/dépublier une activité
router.put("/:id/publish", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: "Activité non trouvée",
      });
    }

    if (activity.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorisé",
      });
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        status: publish ? "active" : "draft",
        publishedAt: publish ? new Date() : null,
      },
    });

    res.json({
      success: true,
      data: updatedActivity,
      message: publish
        ? "Activité publiée avec succès"
        : "Activité mise en brouillon",
    });
  } catch (error) {
    console.error("Error publishing activity:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification du statut",
    });
  }
});

module.exports = router;
