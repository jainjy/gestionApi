// routes/produits-naturels.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

// GET /api/produits-naturels - Récupérer tous les produits naturels avec filtres
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      foodCategory,
      status = "active",
      featured,
      isOrganic,
      benefits,
      minPrice,
      maxPrice,
      allergens,
      page = 1,
      limit = 20,
    } = req.query;

    // Construire les filtres pour produits naturels uniquement
    const where = {
      productType: "produitnaturel",
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

    if (benefits) {
      const benefitsList = Array.isArray(benefits) ? benefits : [benefits];
      where.nutritionalInfo = {
        path: ['benefits'],
        array_contains: benefitsList
      };
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
      // Champs spécifiques aux produits naturels
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
      "Erreur lors de la récupération des produits naturels:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/produits-naturels/categories - Récupérer toutes les catégories de produits naturels
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        productType: "produitnaturel",
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
      "Erreur lors de la récupération des catégories de produits naturels:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/produits-naturels/food-categories - Récupérer toutes les foodCategory
router.get("/food-categories", async (req, res) => {
  try {
    const foodCategories = await prisma.product.groupBy({
      by: ["foodCategory"],
      where: {
        productType: "produitnaturel",
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
      "Erreur lors de la récupération des food-categories:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/produits-naturels/food-category/:foodCategoryName
router.get("/food-category/:foodCategoryName", async (req, res) => {
  try {
    const { foodCategoryName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Débogage
    console.log("🔍 Food category recherchée:", foodCategoryName);
    const decodedCategoryName = decodeURIComponent(foodCategoryName);
    console.log("🔍 Food category décodée:", decodedCategoryName);

    // Recherche insensible à la casse
    const whereCondition = {
      productType: "produitnaturel",
      status: "active",
      foodCategory: {
        equals: decodedCategoryName,
        mode: 'insensitive'
      }
    };

    console.log("🔍 Condition de recherche:", whereCondition);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
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
        where: whereCondition,
      }),
    ]);

    console.log(`📦 Produits trouvés pour ${decodedCategoryName}:`, products.length);

    // Si aucun produit, vérifier les catégories disponibles
    if (products.length === 0) {
      const availableCategories = await prisma.product.groupBy({
        by: ['foodCategory'],
        where: {
          productType: "produitnaturel",
          status: "active",
          foodCategory: {
            not: null
          }
        },
        _count: {
          id: true
        }
      });
      
      console.log("📋 FoodCategory disponibles:", availableCategories);
    }

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
      quantity: product.quantity,
      featured: !!product.featured,
      nutritionalInfo: product.nutritionalInfo,
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
      foodCategory: decodedCategoryName,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des produits par food-category:",
      error
    );
    res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message 
    });
  }
});

// GET /api/produits-naturels/benefits - Récupérer tous les bénéfices disponibles
router.get("/benefits", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        productType: "produitnaturel",
        status: "active",
      },
      select: {
        nutritionalInfo: true,
      },
    });

    // Extraire tous les bénéfices uniques des produits naturels
    const allBenefits = products.flatMap((product) => {
      const nutritionalInfo = product.nutritionalInfo || {};
      return nutritionalInfo.benefits || [];
    }).filter(Boolean);

    const uniqueBenefits = [...new Set(allBenefits)].sort();

    res.json(
      uniqueBenefits.map((benefit) => ({
        name: benefit,
        count: allBenefits.filter((b) => b === benefit).length,
      }))
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des bénéfices:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/produits-naturels/allergens - Récupérer tous les allergènes disponibles
router.get("/allergens", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        productType: "produitnaturel",
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

// GET /api/produits-naturels/origins - Récupérer toutes les origines
router.get("/origins", async (req, res) => {
  try {
    const origins = await prisma.product.groupBy({
      by: ["origin"],
      where: {
        productType: "produitnaturel",
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

// GET /api/produits-naturels/featured - Récupérer les produits naturels en vedette
router.get("/featured", async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        productType: "produitnaturel",
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
      nutritionalInfo: product.nutritionalInfo,
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

// GET /api/produits-naturels/category/:categoryName - Récupérer les produits par catégorie
router.get("/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          productType: "produitnaturel",
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
          productType: "produitnaturel",
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
      quantity: product.quantity,
      nutritionalInfo: product.nutritionalInfo,
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

// GET /api/produits-naturels/user/my-products - Récupérer les produits naturels de l'utilisateur connecté
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
            productType: "produitnaturel",
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
            productType: "produitnaturel",
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
        "Erreur lors de la récupération des produits naturels de l'utilisateur:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/produits-naturels/:id - Récupérer un produit naturel spécifique
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
        productType: "produitnaturel", // S'assurer que c'est un produit naturel
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
      return res.status(404).json({ error: "Produit naturel non trouvé" });
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
      "Erreur lors de la récupération du produit naturel:",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/produits-naturels - Créer un nouveau produit naturel
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
        // Champs spécifiques aux produits naturels
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
          // Champs spécifiques aux produits naturels
          productType: "produitnaturel",
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
        "Erreur lors de la création du produit naturel:",
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

// PUT /api/produits-naturels/:id - Mettre à jour un produit naturel
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
        // Champs spécifiques aux produits naturels
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
          .json({ error: "Produit naturel non trouvé" });
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

      // S'assurer que c'est un produit naturel
      if (existingProduct.productType !== "produitnaturel") {
        return res
          .status(400)
          .json({ error: "Ce produit n'est pas un produit naturel" });
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
          // Champs spécifiques aux produits naturels
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
        "Erreur lors de la mise à jour du produit naturel:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// DELETE /api/produits-naturels/:id - Supprimer un produit naturel
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
          .json({ error: "Produit naturel non trouvé" });
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
        message: "Produit naturel supprimé avec succès",
      });
    } catch (error) {
      console.error(
        "Erreur lors de la suppression du produit naturel:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// NOUVELLE ROUTE: Debug des food categories
router.get("/debug/food-categories", async (req, res) => {
  try {
    const foodCategories = await prisma.product.groupBy({
      by: ['foodCategory'],
      where: {
        productType: "produitnaturel",
        status: "active",
        foodCategory: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        foodCategory: "asc"
      }
    });

    res.json({
      availableFoodCategories: foodCategories,
      message: "Liste des foodCategory disponibles avec le nombre de produits"
    });
  } catch (error) {
    console.error("Erreur debug food categories:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;