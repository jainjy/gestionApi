const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Récupérer toutes les expériences avec filtres
 * GET /api/experiences
 */
exports.getAllExperiences = async (req, res) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      difficulty,
      season,
      search,
      limit = 20,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const where = {
      isActive: true,
    };

    // Filtre par catégorie
    if (category && category !== "tous") {
      where.category = category;
    }

    // Filtre par localisation
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    // Filtre par prix
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Filtre par difficulté
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Filtre par saison
    if (season) {
      where.season = {
        contains: season,
        mode: "insensitive",
      };
    }

    // Recherche par texte
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          guide: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { notIn: ["cancelled", "expired"] },
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.experience.count({ where }),
    ]);

    // Calculer la note moyenne
    const experiencesWithAvgRating = experiences.map((exp) => {
      const avgRating =
        exp.reviews.length > 0
          ? exp.reviews.reduce((sum, review) => sum + review.rating, 0) /
            exp.reviews.length
          : 0;

      const { reviews, ...rest } = exp;
      return {
        ...rest,
        rating: avgRating.toFixed(1),
        reviewCount: exp.reviews.length,
      };
    });

    res.json({
      success: true,
      data: experiencesWithAvgRating,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting experiences:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des expériences",
    });
  }
};

/**
 * Récupérer une expérience par ID
 * GET /api/experiences/:id
 */
exports.getExperienceById = async (req, res) => {
  try {
    const { id } = req.params;

    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
        guide: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        faqs: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
        bookings: {
          where: {
            status: { notIn: ["cancelled", "expired"] },
            checkOut: { gte: new Date() },
          },
          select: {
            checkIn: true,
            checkOut: true,
            guests: true,
            status: true,
          },
        },
      },
    });

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: "Expérience non trouvée",
      });
    }

    // Incrémenter le compteur de vues
    await prisma.experience.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Calculer la disponibilité des prochaines dates
    const bookings = experience.bookings;
    
    // Calculer la note moyenne
    const avgRating = experience.reviews.length > 0
      ? (experience.reviews.reduce((sum, review) => sum + review.rating, 0) / experience.reviews.length).toFixed(1)
      : 0;

    // Format simplifié pour l'affichage dans le frontend
    const formattedExperience = {
      ...experience,
      rating: avgRating,
      stats: {
        totalBookings: bookings.length,
        upcomingBookings: bookings.filter(b => b.checkIn > new Date()).length,
        bookedDates: bookings.map((b) => ({
          start: b.checkIn,
          end: b.checkOut,
          guests: b.guests,
          status: b.status,
        })),
      },
    };

    res.json({
      success: true,
      data: formattedExperience,
    });
  } catch (error) {
    console.error("Error getting experience:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'expérience",
    });
  }
};

/**
 * Récupérer les catégories d'expériences
 * GET /api/experiences/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.experience.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      _avg: {
        price: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Transformer les données pour le frontend
    const formattedCategories = categories.map((cat) => ({
      id: cat.category,
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      count: cat._count.id,
      avgPrice: cat._avg.price ? Math.round(cat._avg.price) : 0,
    }));

    // Ajouter la catégorie "tous"
    const totalCount = categories.reduce((sum, cat) => sum + cat._count.id, 0);
    formattedCategories.unshift({
      id: "tous",
      label: "Toutes les expériences",
      count: totalCount,
    });

    res.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
    });
  }
};

/**
 * Créer une nouvelle expérience
 * POST /api/experiences
 */
exports.createExperience = async (req, res) => {
  try {
    const userId = req.userId; // Depuis le middleware d'authentification
    const {
      title,
      category,
      description,
      duration,
      location,
      price,
      highlights,
      images,
      difficulty,
      groupSize,
      season,
      included,
      requirements,
      guideId,
    } = req.body;

    // Générer un slug à partir du titre
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const experience = await prisma.experience.create({
      data: {
        title,
        slug,
        category,
        description,
        duration: duration || "Non spécifié",
        location,
        price: parseFloat(price) || 0,
        highlights: highlights || [],
        images: images || [],
        difficulty: difficulty || "Moyenne",
        groupSize: groupSize || "Non spécifié",
        season: season || "Toute l'année",
        included: included || [],
        requirements: requirements || [],
        createdById: userId,
        guideId: guideId || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        guide: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error("Error creating experience:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'expérience",
    });
  }
};

/**
 * Mettre à jour une expérience
 * PUT /api/experiences/:id
 */
exports.updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Vérifier que l'expérience existe
    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: "Expérience non trouvée",
      });
    }

    // Vérifier les permissions (créateur ou admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (experience.createdById !== userId && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à modifier cette expérience",
      });
    }

    // Si on met à jour le titre, régénérer le slug
    if (updateData.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        guide: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedExperience,
    });
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de l'expérience",
    });
  }
};

/**
 * Supprimer une expérience (soft delete)
 * DELETE /api/experiences/:id
 */
exports.deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Vérifier que l'expérience existe
    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: "Expérience non trouvée",
      });
    }

    // Vérifier les permissions (créateur ou admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (experience.createdById !== userId && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorisé à supprimer cette expérience",
      });
    }

    // Soft delete: désactiver l'expérience
    await prisma.experience.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Expérience supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'expérience",
    });
  }
};

/**
 * Réserver une expérience
 * POST /api/experiences/:id/book
 */
exports.bookExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { checkIn, checkOut, guests, specialRequests } = req.body;

    // Vérifier que l'expérience existe et est active
    const experience = await prisma.experience.findUnique({
      where: { id, isActive: true },
    });

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: "Expérience non trouvée ou inactive",
      });
    }

    // Valider les dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        error: "La date de début doit être avant la date de fin",
      });
    }

    // Vérifier la disponibilité pour ces dates
    const existingBooking = await prisma.experienceBooking.findFirst({
      where: {
        experienceId: id,
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } },
        ],
        status: { notIn: ["cancelled", "expired"] },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: "Ces dates ne sont pas disponibles",
      });
    }

    // Calculer le montant total
    const totalAmount = experience.price * parseInt(guests || 1);

    // Générer un numéro de confirmation
    const confirmationNumber = `EXP-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const booking = await prisma.experienceBooking.create({
      data: {
        experienceId: id,
        userId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: parseInt(guests || 1),
        totalAmount,
        specialRequests: specialRequests || '',
        confirmationNumber,
        status: "pending",
      },
      include: {
        experience: {
          select: {
            title: true,
            location: true,
            duration: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Envoyer une notification au propriétaire de l'expérience
    if (req.io && experience.createdById) {
      req.io.to(`user:${experience.createdById}`).emit('new-notification', {
        type: 'experience_booking',
        title: 'Nouvelle réservation',
        message: `${booking.user.firstName} ${booking.user.lastName} a réservé votre expérience "${experience.title}"`,
        bookingId: booking.id,
        experienceId: id,
      });
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: "Réservation créée avec succès",
    });
  } catch (error) {
    console.error("Error booking experience:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la réservation",
    });
  }
};

/**
 * Récupérer les expériences similaires
 * GET /api/experiences/:id/similar
 */
exports.getSimilarExperiences = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Récupérer l'expérience actuelle pour connaître sa catégorie
    const currentExperience = await prisma.experience.findUnique({
      where: { id },
      select: { category: true, location: true },
    });

    if (!currentExperience) {
      return res.status(404).json({
        success: false,
        error: "Expérience non trouvée",
      });
    }

    const similarExperiences = await prisma.experience.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { isActive: true },
          {
            OR: [
              { category: currentExperience.category },
              { location: { contains: currentExperience.location.split(",")[0] } },
            ],
          },
        ],
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      take: parseInt(limit),
      orderBy: {
        rating: "desc",
      },
    });

    // Calculer les notes moyennes
    const experiencesWithAvgRating = similarExperiences.map((exp) => {
      const avgRating =
        exp.reviews.length > 0
          ? exp.reviews.reduce((sum, review) => sum + review.rating, 0) /
            exp.reviews.length
          : 0;

      const { reviews, ...rest } = exp;
      return {
        ...rest,
        rating: avgRating.toFixed(1),
      };
    });

    res.json({
      success: true,
      data: experiencesWithAvgRating,
    });
  } catch (error) {
    console.error("Error getting similar experiences:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des expériences similaires",
    });
  }
};

/**
 * Obtenir les statistiques des expériences
 * GET /api/experiences/stats
 */
exports.getExperienceStats = async (req, res) => {
  try {
    const userId = req.userId;

    const [totalExperiences, activeExperiences, totalBookings, totalRevenue] = await Promise.all([
      prisma.experience.count({
        where: { createdById: userId },
      }),
      prisma.experience.count({
        where: { 
          createdById: userId,
          isActive: true 
        },
      }),
      prisma.experienceBooking.count({
        where: {
          experience: {
            createdById: userId,
          },
          status: { notIn: ["cancelled"] },
        },
      }),
      prisma.experienceBooking.aggregate({
        where: {
          experience: {
            createdById: userId,
          },
          status: { notIn: ["cancelled"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalExperiences,
        activeExperiences,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error("Error getting experience stats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
};