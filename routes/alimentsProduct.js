const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

// GET /api/aliments - Récupérer tous les produits alimentaires avec filtres
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      foodCategory,
      status = "active",
      featured,
      isOrganic,
      isPerishable,
      minPrice,
      maxPrice,
      allergens,
      page = 1,
      limit = 20,
    } = req.query;

    // Construire les filtres pour produits alimentaires uniquement
    const where = {
      productType: "food",
    };

    if (status && status !== "Tous") {
      where.status = status;
    } else {
      where.status = "active"; // Par défaut, seulement les produits actifs
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { origin: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "Toutes") {
      where.category = category;
    }

    if (foodCategory) {
      where.foodCategory = foodCategory;
    }

    if (featured !== undefined) {
      where.featured = featured === "true";
    }

    if (isOrganic !== undefined) {
      where.isOrganic = isOrganic === "true";
    }

    if (isPerishable !== undefined) {
      where.isPerishable = isPerishable === "true";
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (allergens) {
      const allergenList = Array.isArray(allergens) ? allergens : [allergens];
      where.allergens = {
        hasSome: allergenList,
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    // Formater les données pour le frontend
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      comparePrice: product.comparePrice,
      cost: product.cost,
      sku: product.sku,
      barcode: product.barcode,
      trackQuantity: product.trackQuantity,
      quantity: product.quantity,
      lowStock: product.lowStock,
      weight: product.weight,
      dimensions: product.dimensions,
      images: product.images || [],
      status: product.status,
      featured: !!product.featured,
      visibility: product.visibility,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      // Champs spécifiques aux aliments
      productType: product.productType,
      foodCategory: product.foodCategory,
      isPerishable: product.isPerishable,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
      storageTips: product.storageTips,
      nutritionalInfo: product.nutritionalInfo,
      allergens: product.allergens || [],
      isOrganic: !!product.isOrganic,
      origin: product.origin,
      brand: product.brand,
      unit: product.unit,
      vendor: {
        id: product.User?.id || null,
        firstName: product.User?.firstName || null,
        lastName: product.User?.lastName || null,
        companyName: product.User?.companyName || null,
        phone: product.User?.phone || null,
        email: product.User?.email || null,
      },
      createdAt: product.createdAt ? product.createdAt.toISOString() : null,
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null,
      publishedAt: product.publishedAt
        ? product.publishedAt.toISOString()
        : null,
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des produits alimentaires:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/categories - Récupérer toutes les catégories alimentaires
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        productType: "food",
        status: "active",
      },
      _count: {
        id: true,
      },
      orderBy: {
        category: "asc",
      },
    });

    res.json(
      categories.map((cat) => ({
        name: cat.category,
        count: cat._count.id,
      }))
    );
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des catégories alimentaires:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/food-categories - Récupérer toutes les sous-catégories alimentaires
router.get("/food-categories", async (req, res) => {
  try {
    const foodCategories = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "food",
        status: "active",
        foodCategory: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        foodCategory: "asc",
      },
    });

    res.json(
      foodCategories.map((cat) => ({
        name: cat.foodCategory,
        count: cat._count.id,
      }))
    );
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sous-catégories alimentaires:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/allergens - Récupérer tous les allergènes disponibles
router.get("/allergens", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        productType: "food",
        status: "active",
      },
      select: {
        allergens: true,
      },
    });

    // Extraire tous les allergènes uniques
    const allAllergens = products.flatMap((product) => product.allergens || []);
    const uniqueAllergens = [...new Set(allAllergens)].filter(Boolean).sort();

    res.json(
      uniqueAllergens.map((allergen) => ({
        name: allergen,
        count: allAllergens.filter((a) => a === allergen).length,
      }))
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des allergènes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/origins - Récupérer toutes les origines
router.get("/origins", async (req, res) => {
  try {
    const origins = await prisma.product.groupBy({
      by: ["origin"],
      where: {
        productType: "food",
        status: "active",
        origin: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        origin: "asc",
      },
    });

    res.json(
      origins.map((origin) => ({
        name: origin.origin,
        count: origin._count.id,
      }))
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des origines:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/featured - Récupérer les produits alimentaires en vedette
router.get("/featured", async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        productType: "food",
        status: "active",
        featured: true,
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      comparePrice: product.comparePrice,
      images: product.images || [],
      isOrganic: !!product.isOrganic,
      origin: product.origin,
      unit: product.unit,
      vendor: {
        companyName: product.User?.companyName,
      },
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des produits en vedette:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/category/:categoryName - Récupérer les produits par catégorie
router.get("/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          productType: "food",
          status: "active",
          category: decodeURIComponent(categoryName),
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({
        where: {
          productType: "food",
          status: "active",
          category: decodeURIComponent(categoryName),
        },
      }),
    ]);

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      comparePrice: product.comparePrice,
      images: product.images || [],
      isOrganic: !!product.isOrganic,
      allergens: product.allergens || [],
      origin: product.origin,
      unit: product.unit,
      quantity:product.quantity,
      vendor: {
        companyName: product.User?.companyName,
      },
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      category: decodeURIComponent(categoryName),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des produits par catégorie:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/aliments/user/my-products - Récupérer les produits alimentaires de l'utilisateur connecté
router.get(
  "/user/my-products",
  authenticateToken,
  requireRole(["professional", "admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: {
            userId: req.user.id,
            productType: "food",
          },
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: parseInt(limit),
        }),
        prisma.product.count({
          where: {
            userId: req.user.id,
            productType: "food",
          },
        }),
      ]);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des produits alimentaires de l'utilisateur:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/aliments/:id - Récupérer un produit alimentaire spécifique
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
        productType: "food", // S'assurer que c'est un produit alimentaire
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produit alimentaire non trouvé" });
    }

    // Formater la réponse
    const formattedProduct = {
      ...product,
      expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
      createdAt: product.createdAt ? product.createdAt.toISOString() : null,
      updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null,
      publishedAt: product.publishedAt
        ? product.publishedAt.toISOString()
        : null,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du produit alimentaire:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/aliments - Créer un nouveau produit alimentaire
router.post(
  "/",
  authenticateToken,
  requireRole(["professional", "admin"]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        sku,
        barcode,
        quantity,
        lowStock,
        weight,
        dimensions,
        images,
        status,
        featured,
        visibility,
        seoTitle,
        seoDescription,
        // Champs spécifiques aux aliments
        foodCategory,
        isPerishable,
        expiryDate,
        storageTips,
        nutritionalInfo,
        allergens,
        isOrganic,
        origin,
        brand,
        unit,
      } = req.body;

      // Générer un slug à partir du nom
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const product = await prisma.product.create({
        data: {
          userId: req.user.id,
          name,
          slug,
          description,
          category,
          subcategory,
          price:
            price !== undefined && price !== null ? parseFloat(price) : null,
          comparePrice:
            comparePrice !== undefined && comparePrice !== null
              ? parseFloat(comparePrice)
              : null,
          cost: cost !== undefined && cost !== null ? parseFloat(cost) : null,
          sku: sku || null,
          barcode: barcode || null,
          trackQuantity: quantity !== undefined,
          quantity:
            quantity !== undefined && quantity !== null
              ? parseInt(quantity)
              : 0,
          lowStock:
            lowStock !== undefined && lowStock !== null
              ? parseInt(lowStock)
              : 5,
          weight:
            weight !== undefined && weight !== null ? parseFloat(weight) : null,
          dimensions: dimensions || null,
          images: Array.isArray(images) ? images : [],
          status: status || "draft",
          featured: !!featured,
          visibility: visibility || "public",
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          // Champs spécifiques aux aliments
          productType: "food",
          foodCategory: foodCategory || null,
          isPerishable: isPerishable !== undefined ? isPerishable : false,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          storageTips: storageTips || null,
          nutritionalInfo: nutritionalInfo || null,
          allergens: Array.isArray(allergens) ? allergens : [],
          isOrganic: isOrganic !== undefined ? isOrganic : false,
          origin: origin || null,
          brand: brand || null,
          unit: unit || null,
          publishedAt: status === "active" ? new Date() : null,
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
      });

      res.json(product);
    } catch (error) {
      console.error(
        "Erreur lors de la création du produit alimentaire:",
        error
      );

      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ error: "Un produit avec ce nom ou slug existe déjà" });
      }

      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT /api/aliments/:id - Mettre à jour un produit alimentaire
router.put(
  "/:id",
  authenticateToken,
  requireRole(["professional", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        sku,
        barcode,
        quantity,
        lowStock,
        weight,
        dimensions,
        images,
        status,
        featured,
        visibility,
        seoTitle,
        seoDescription,
        // Champs spécifiques aux aliments
        foodCategory,
        isPerishable,
        expiryDate,
        storageTips,
        nutritionalInfo,
        allergens,
        isOrganic,
        origin,
        brand,
        unit,
      } = req.body;

      // Vérifier que le produit existe et que l'utilisateur a les droits
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res
          .status(404)
          .json({ error: "Produit alimentaire non trouvé" });
      }

      // Vérifier les permissions (utilisateur ne peut modifier que ses produits)
      if (
        req.user.role === "professional" &&
        existingProduct.userId !== req.user.id
      ) {
        return res
          .status(403)
          .json({ error: "Accès non autorisé à ce produit" });
      }

      // S'assurer que c'est un produit alimentaire
      if (existingProduct.productType !== "food") {
        return res
          .status(400)
          .json({ error: "Ce produit n'est pas un produit alimentaire" });
      }

      // Générer un nouveau slug si le nom change
      let slug = existingProduct.slug;
      if (name && name !== existingProduct.name) {
        slug = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: name || existingProduct.name,
          slug,
          description:
            description !== undefined
              ? description
              : existingProduct.description,
          category: category || existingProduct.category,
          subcategory:
            subcategory !== undefined
              ? subcategory
              : existingProduct.subcategory,
          price:
            price !== undefined ? parseFloat(price) : existingProduct.price,
          comparePrice:
            comparePrice !== undefined
              ? parseFloat(comparePrice)
              : existingProduct.comparePrice,
          cost: cost !== undefined ? parseFloat(cost) : existingProduct.cost,
          sku: sku !== undefined ? sku : existingProduct.sku,
          barcode: barcode !== undefined ? barcode : existingProduct.barcode,
          quantity:
            quantity !== undefined
              ? parseInt(quantity)
              : existingProduct.quantity,
          lowStock:
            lowStock !== undefined
              ? parseInt(lowStock)
              : existingProduct.lowStock,
          weight:
            weight !== undefined ? parseFloat(weight) : existingProduct.weight,
          dimensions:
            dimensions !== undefined ? dimensions : existingProduct.dimensions,
          images: Array.isArray(images) ? images : existingProduct.images,
          status: status || existingProduct.status,
          featured:
            featured !== undefined ? !!featured : existingProduct.featured,
          visibility: visibility || existingProduct.visibility,
          seoTitle:
            seoTitle !== undefined ? seoTitle : existingProduct.seoTitle,
          seoDescription:
            seoDescription !== undefined
              ? seoDescription
              : existingProduct.seoDescription,
          // Champs spécifiques aux aliments
          foodCategory:
            foodCategory !== undefined
              ? foodCategory
              : existingProduct.foodCategory,
          isPerishable:
            isPerishable !== undefined
              ? isPerishable
              : existingProduct.isPerishable,
          expiryDate:
            expiryDate !== undefined
              ? new Date(expiryDate)
              : existingProduct.expiryDate,
          storageTips:
            storageTips !== undefined
              ? storageTips
              : existingProduct.storageTips,
          nutritionalInfo:
            nutritionalInfo !== undefined
              ? nutritionalInfo
              : existingProduct.nutritionalInfo,
          allergens:
            allergens !== undefined
              ? Array.isArray(allergens)
                ? allergens
                : []
              : existingProduct.allergens,
          isOrganic:
            isOrganic !== undefined ? isOrganic : existingProduct.isOrganic,
          origin: origin !== undefined ? origin : existingProduct.origin,
          brand: brand !== undefined ? brand : existingProduct.brand,
          unit: unit !== undefined ? unit : existingProduct.unit,
          publishedAt:
            status === "active" && existingProduct.status !== "active"
              ? new Date()
              : existingProduct.publishedAt,
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
      });

      res.json(product);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du produit alimentaire:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// DELETE /api/aliments/:id - Supprimer un produit alimentaire
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["professional", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que le produit existe et que l'utilisateur a les droits
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res
          .status(404)
          .json({ error: "Produit alimentaire non trouvé" });
      }

      // Vérifier les permissions
      if (
        req.user.role === "professional" &&
        existingProduct.userId !== req.user.id
      ) {
        return res
          .status(403)
          .json({ error: "Accès non autorisé à ce produit" });
      }

      await prisma.product.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Produit alimentaire supprimé avec succès",
      });
    } catch (error) {
      console.error(
        "Erreur lors de la suppression du produit alimentaire:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

module.exports = router;
