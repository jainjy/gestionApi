const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("../services/notificationService");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { upload, uploadToSupabase } = require("../middleware/upload");

// Middleware CORS
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

router.options("*", (req, res) => {
  res.sendStatus(200);
});

// GET /api/admin/tourisme - Récupérer tous les hébergements ET lieux touristiques
router.get("/", async (req, res) => {
  try {
    console.log("📦 Requête admin reçue pour /api/admin/tourisme", req.query);

    const {
      page = 1,
      limit = 12,
      search,
      type,
      category,
      city,
      available,
      featured,
      isTouristicPlace,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construction des filtres
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (available !== undefined) {
      where.available = available === "true";
    }

    if (featured !== undefined) {
      where.featured = featured === "true";
    }

    if (isTouristicPlace !== undefined) {
      where.isTouristicPlace = isTouristicPlace === "true";
    }

    // Récupération des données
    const [listings, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          bookings: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true,
            },
          },
        },
      }),
      prisma.tourisme.count({ where }),
    ]);

    console.log(`✅ ${listings.length} éléments trouvés pour l'admin`);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération admin tourisme:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des éléments",
      details: error.message,
    });
  }
});

// GET /api/admin/tourisme/accommodations - Récupérer uniquement les hébergements
router.get("/accommodations", authenticateToken, async (req, res) => {
  try {
    console.log("🏨 Requête hébergements reçue");

    const user = req.user; // Récupération de l'utilisateur connecté

    const {
      page = 1,
      limit = 12,
      search,
      type,
      city,
      available,
      featured,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filtre de base
    const where = {
      isTouristicPlace: false,
    };

    // Filtre par rôle : si professional, ne récupérer que ses hébergements
    if (user.role === "professional") {
      where.idPrestataire = user.id;
    }

    // Filtres additionnels
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (available !== undefined) {
      where.available = available === "true";
    }

    if (featured !== undefined) {
      where.featured = featured === "true";
    }

    const [accommodations, total] = await Promise.all([
      prisma.tourisme.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          bookings: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true,
            },
          },
        },
      }),
      prisma.tourisme.count({ where }),
    ]);

    console.log(`✅ ${accommodations.length} hébergements trouvés`);

    res.json({
      success: true,
      data: accommodations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération hébergements:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des hébergements",
      details: error.message,
    });
  }
});

// GET /api/admin/tourisme/places - Récupérer uniquement les lieux touristiques
router.get("/places", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let whereCondition = {
      isTouristicPlace: true,
    };

    if (user.role === "professional") {
      whereCondition.idPrestataire = user.id;
    }

    const lieux = await prisma.tourisme.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ success: true, data: lieux });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// GET /api/admin/tourisme/stats - Statistiques pour le dashboard admin
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    console.log("📊 Requête stats reçue pour /api/admin/tourisme/stats", req.query);

    const userId = req.user.id;
    const userRole = req.user.role;
    const { contentType } = req.query; // "accommodations" ou "touristic_places"

    // Condition pour filtrer par utilisateur si c'est un professionnel
    let whereCondition = {};
    if (userRole === "professional") {
      whereCondition.idPrestataire = userId;
    }

    // Condition spécifique selon le type de contenu
    if (contentType === "accommodations") {
      whereCondition.isTouristicPlace = false;
    } else if (contentType === "touristic_places") {
      whereCondition.isTouristicPlace = true;
    }
    // Si contentType n'est pas spécifié, on garde les deux types

    // Condition pour les réservations liées aux listings du professionnel
    let bookingWhereCondition = {};
    if (userRole === "professional") {
      // Récupérer les IDs des listings du professionnel avec le même filtre
      const professionalListings = await prisma.tourisme.findMany({
        where: whereCondition,
        select: { id: true },
      });
      const listingIds = professionalListings.map((listing) => listing.id);

      bookingWhereCondition.listingId = { in: listingIds };
    }

    const [
      totalListings,
      availableListings,
      featuredListings,
      totalBookings,
      averageRating,
    ] = await Promise.all([
      // Total des listings (avec filtres)
      prisma.tourisme.count({ where: whereCondition }),

      // Listings disponibles (avec filtres)
      prisma.tourisme.count({
        where: {
          ...whereCondition,
          available: true,
        },
      }),

      // Listings en vedette (avec filtres)
      prisma.tourisme.count({
        where: {
          ...whereCondition,
          featured: true,
        },
      }),

      // Réservations (filtrées par les listings)
      prisma.tourismeBooking.count({
        where: bookingWhereCondition,
      }),

      // Note moyenne (avec filtres)
      prisma.tourisme.aggregate({
        _avg: {
          rating: true,
        },
        where: whereCondition,
      }),
    ]);

    // Statistiques par type d'hébergement (uniquement pour accommodations)
    let accommodationsByType = [];
    if (!contentType || contentType === "accommodations") {
      accommodationsByType = await prisma.tourisme.groupBy({
        by: ["type"],
        _count: {
          id: true,
        },
        where: {
          ...whereCondition,
          isTouristicPlace: false,
        },
      });
    }

    // Statistiques par catégorie de lieu touristique (uniquement pour touristic_places)
    let placesByCategory = [];
    if (!contentType || contentType === "touristic_places") {
      placesByCategory = await prisma.tourisme.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
        where: {
          ...whereCondition,
          isTouristicPlace: true,
        },
      });
    }

    // Statistiques par ville (avec filtres)
    const listingsByCity = await prisma.tourisme.groupBy({
      by: ["city"],
      _count: {
        id: true,
      },
      where: whereCondition,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Statistiques des revenus (pour le professionnel)
    let revenueStats = {
      totalRevenue: 0,
      pendingRevenue: 0,
      confirmedRevenue: 0,
    };

    if (userRole === "professional") {
      // Récupérer les réservations avec leurs montants
      const bookings = await prisma.tourismeBooking.findMany({
        where: bookingWhereCondition,
        select: {
          totalAmount: true,
          status: true,
          paymentStatus: true,
        },
      });

      revenueStats = bookings.reduce(
        (acc, booking) => {
          acc.totalRevenue += booking.totalAmount || 0;

          if (
            booking.status === "confirmed" &&
            booking.paymentStatus === "paid"
          ) {
            acc.confirmedRevenue += booking.totalAmount || 0;
          } else if (
            booking.status === "pending" ||
            booking.paymentStatus === "pending"
          ) {
            acc.pendingRevenue += booking.totalAmount || 0;
          }

          return acc;
        },
        { totalRevenue: 0, pendingRevenue: 0, confirmedRevenue: 0 }
      );
    }

    const stats = {
      totalListings,
      availableListings,
      featuredListings,
      totalBookings,
      averageRating: averageRating._avg.rating || 0,
      accommodationsByType,
      placesByCategory,
      listingsByCity,
      revenue: revenueStats,
      userRole: userRole,
      contentType: contentType || "all", // Inclure le type de contenu pour le frontend
    };

    console.log(`✅ Statistiques calculées pour ${contentType || 'tous les types'}`);
    console.log(`📊 Résultats: ${totalListings} listings, ${totalBookings} réservations`);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Erreur récupération stats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
      details: error.message,
    });
  }
});

// =======================================
// CRÉATION HÉBERGEMENT/LIEU TOURISTIQUE AVEC IMAGES SUR SUPABASE
// =======================================
router.post(
  "/",
  authenticateToken,
  requireRole("professional"),
  upload.array("images", 10), // ✅ réception de plusieurs fichiers images
  async (req, res) => {
    try {
      const userId = req.user.id;

      let imageUrls = [];

      // ✅ Upload vers Supabase si images existent
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToSupabase(file, "tourisme-images")
        );
        const uploadedImages = await Promise.all(uploadPromises);
        imageUrls = uploadedImages.map((img) => img.url);
      }

      const {
        title,
        type,
        category,
        price,
        city,
        lat,
        lng,
        amenities,
        maxGuests,
        description,
        bedrooms,
        bathrooms,
        area,
        instantBook,
        cancellationPolicy,
        featured,
        available = true,
        rating = 0,
        reviewCount = 0,
        openingHours,
        entranceFee,
        website,
        contactInfo,
      } = req.body;
      const isTouristicPlace =
        req.body.isTouristicPlace === "true" ||
        req.body.isTouristicPlace === true;
      const idUnique = isTouristicPlace ? `PL${Date.now()}` : `T${Date.now()}`;

      const newListing = await prisma.tourisme.create({
        data: {
          idUnique,
          idPrestataire: userId,
          title,
          type: isTouristicPlace ? "touristic_place" : type,
          category: isTouristicPlace ? category : null,
          price: price ? parseFloat(price) : 0,
          city,
          lat: lat ? parseFloat(lat) : 0,
          lng: lng ? parseFloat(lng) : 0,
          images: imageUrls, // ✅ URLs Supabase
          amenities: Array.isArray(amenities)
            ? amenities
            : JSON.parse(amenities || "[]"),
          maxGuests: isTouristicPlace ? 1 : parseInt(maxGuests),
          description: description || "",
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          area: area ? parseInt(area) : null,
          instantBook: Boolean(instantBook),
          cancellationPolicy: cancellationPolicy || "moderate",
          featured: Boolean(featured),
          available: Boolean(available),
          rating: parseFloat(rating),
          reviewCount: parseInt(reviewCount),
          isTouristicPlace: Boolean(isTouristicPlace),
          openingHours,
          entranceFee,
          website,
          contactInfo,
        },
        include: {
          prestataire: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: newListing,
        message: `${isTouristicPlace ? "Lieu touristique" : "Hébergement"} créé avec succès ✅`,
      });
    } catch (error) {
      console.error("Erreur création tourisme:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création",
      });
    }
  }
);

// =======================================
// MISE À JOUR AVEC IMAGES SUR SUPABASE
// =======================================
router.put(
  "/:id",
  authenticateToken,
  requireRole("professional"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Vérifier que l'élément existe et appartient à l'utilisateur
      const existingListing = await prisma.tourisme.findFirst({
        where: {
          id,
          idPrestataire: userId,
        },
      });

      if (!existingListing) {
        return res.status(404).json({
          success: false,
          error: "Élément non trouvé",
        });
      }

      let imageUrls = existingListing.images || [];

      // ✅ Upload des nouvelles images vers Supabase
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToSupabase(file, "tourisme-images")
        );
        const uploadedImages = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...uploadedImages.map((img) => img.url)];
      }

      const {
        title,
        type,
        category,
        price,
        city,
        lat,
        lng,
        amenities,
        maxGuests,
        description,
        bedrooms,
        bathrooms,
        area,
        instantBook,
        cancellationPolicy,
        featured,
        available,
        rating,
        reviewCount,
        openingHours,
        entranceFee,
        website,
        contactInfo,
        // Pour gérer la suppression d'images
        removedImages,
      } = req.body;
      const isTouristicPlace =
        req.body.isTouristicPlace === "true" ||
        req.body.isTouristicPlace === true;
      // Filtrer les images supprimées
      if (removedImages) {
        const removedArray = Array.isArray(removedImages)
          ? removedImages
          : JSON.parse(removedImages);
        imageUrls = imageUrls.filter((img) => !removedArray.includes(img));
      }

      const updatedListing = await prisma.tourisme.update({
        where: { id },
        data: {
          title,
          type: isTouristicPlace ? "touristic_place" : type,
          category: isTouristicPlace ? category : null,
          price: price ? parseFloat(price) : 0,
          city,
          lat: lat ? parseFloat(lat) : 0,
          lng: lng ? parseFloat(lng) : 0,
          images: imageUrls, // ✅ URLs Supabase mises à jour
          amenities: Array.isArray(amenities)
            ? amenities
            : JSON.parse(amenities || "[]"),
          maxGuests: isTouristicPlace ? 1 : parseInt(maxGuests),
          description: description || "",
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          area: area ? parseInt(area) : null,
          instantBook: Boolean(instantBook),
          cancellationPolicy: cancellationPolicy || "moderate",
          featured: Boolean(featured),
          available: Boolean(available),
          rating: parseFloat(rating),
          reviewCount: parseInt(reviewCount),
          isTouristicPlace: Boolean(isTouristicPlace),
          openingHours,
          entranceFee,
          website,
          contactInfo,
        },
      });

      res.json({
        success: true,
        data: updatedListing,
        message: `${isTouristicPlace ? "Lieu touristique" : "Hébergement"} mis à jour avec succès ✅`,
      });
    } catch (error) {
      console.error("Erreur mise à jour tourisme:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour",
      });
    }
  }
);

// DELETE /api/admin/tourisme/:id - Supprimer un élément
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Requête DELETE admin reçue pour /api/admin/tourisme/${id}`);

    // Vérifier que l'élément existe
    const existingListing = await prisma.tourisme.findFirst({
      where: {
        OR: [{ id: id }, { idUnique: id }],
      },
      include: {
        bookings: true,
      },
    });

    if (!existingListing) {
      return res.status(404).json({
        success: false,
        error: "Élément non trouvé",
      });
    }

    // Vérifier s'il y a des réservations actives
    const activeBookings = existingListing.bookings.filter(
      (booking) =>
        booking.status === "pending" || booking.status === "confirmed"
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Impossible de supprimer cet élément : une ou plusieurs réservations actives sont associées.",
      });
    }

    // Supprimer via l'id interne
    await prisma.tourisme.delete({
      where: { id: existingListing.id },
    });

    console.log(`✅ Élément ${existingListing.id} supprimé`);

    res.json({
      success: true,
      message: `${existingListing.isTouristicPlace ? "Lieu touristique" : "Hébergement"} supprimé avec succès`,
    });
  } catch (error) {
    console.error("❌ Erreur suppression admin tourisme:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Élément non trouvé",
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression",
      details: error.message,
    });
  }
});

// PATCH /api/admin/tourisme/:id/toggle-availability - Basculer la disponibilité
router.patch("/:id/toggle-availability", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Basculer disponibilité pour /api/admin/tourisme/${id}`);

    const listing = await prisma.tourisme.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: "Élément non trouvé",
      });
    }

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: {
        available: !listing.available,
      },
    });

    console.log(
      `✅ Disponibilité basculée pour ${id}: ${updatedListing.available}`
    );

    res.json({
      success: true,
      data: updatedListing,
      message: `${listing.isTouristicPlace ? "Lieu touristique" : "Hébergement"} ${updatedListing.available ? "activé" : "désactivé"} avec succès`,
    });
  } catch (error) {
    console.error("❌ Erreur bascule disponibilité:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du changement de disponibilité",
      details: error.message,
    });
  }
});

// PATCH /api/admin/tourisme/:id/toggle-featured - Basculer le statut vedette
router.patch("/:id/toggle-featured", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`⭐ Basculer vedette pour /api/admin/tourisme/${id}`);

    const listing = await prisma.tourisme.findUnique({
      where: { id },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: "Élément non trouvé",
      });
    }

    const updatedListing = await prisma.tourisme.update({
      where: { id },
      data: {
        featured: !listing.featured,
      },
    });

    console.log(
      `✅ Statut vedette basculé pour ${id}: ${updatedListing.featured}`
    );

    res.json({
      success: true,
      data: updatedListing,
      message: `${listing.isTouristicPlace ? "Lieu touristique" : "Hébergement"} ${updatedListing.featured ? "mis en vedette" : "retiré des vedettes"} avec succès`,
    });
  } catch (error) {
    console.error("❌ Erreur bascule vedette:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du changement de statut vedette",
      details: error.message,
    });
  }
});

router.get("/mes-annonces", authenticateToken, async (req, res) => {
  const data = await prisma.tourisme.findMany({
    where: {
      idPrestataire: req.user.id,
    },
  });

  res.json({ success: true, data });
});

module.exports = router;
