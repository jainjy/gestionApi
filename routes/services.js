const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/db')
const { createNotification } = require("../services/notificationService");

// ✅ Routes spécifiques (AVANT les routes paramétrées)

// GET /api/services/stats - Statistiques des services
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalServices = await prisma.service.count({where:{type:{not:"art"}}})
    const totalCategories = await prisma.category.count()
    const totalMetiers = await prisma.metier.count()
    
    // Services par catégorie
    const servicesByCategory = await prisma.category.findMany({
      include: {
        _count: {
          select: { services: true }
        }
      }
    })

    res.json({
      totalServices,
      totalCategories,
      totalMetiers,
      servicesByCategory: servicesByCategory.map(cat => ({
        category: cat.name,
        count: cat._count.services
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/services/categories - Récupérer toutes les catégories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        services: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(categories)
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/services/metiers - Récupérer tous les métiers
router.get('/metiers', authenticateToken, async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      include: {
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    })

    res.json(metiers)
  } catch (error) {
    console.error('Erreur lors de la récupération des métiers:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get("/without-category", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        categoryId: null,
      },
      include: {
        _count: {
          select: {
            metiers: true,
            users: true,
          },
        },
      },
      orderBy: {
        libelle: "asc",
      },
    });
    res.json(services);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des services sans catégorie:",
      error
    );
    res
      .status(500)
      .json({
        error: "Erreur lors de la récupération des services sans catégorie",
      });
  }
});

// POST /api/services/bulk-assign-category - Assigner une catégorie à plusieurs services
router.post("/bulk-assign-category", async (req, res) => {
  try {
    const { categoryId, serviceIds } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: "L'ID de la catégorie est requis" });
    }

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res
        .status(400)
        .json({ error: "La liste des services est requise" });
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });

    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    // Mettre à jour les services
    const result = await prisma.service.updateMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      data: {
        categoryId: parseInt(categoryId),
      },
    });

    res.json({
      message: `${result.count} service(s) mis à jour avec succès`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Erreur lors de l'assignation en masse:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'assignation en masse des catégories" });
  }
});


/**
 * 🔐 PARAMÈTRES DE SÉCURITÉ PAGINATION
 */
const MAX_LIMIT = 100;      // plafond serveur
const DEFAULT_LIMIT = 20;   // valeur par défaut

/**
 * 📌 GET /services
 * Pagination sécurisée (anti dump BDD)
 */
router.get('/', async (req, res) => {
  try {
    // ---------- VALIDATION LIMIT ----------
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT;
    }
    limit = Math.min(limit, MAX_LIMIT);

    // ---------- VALIDATION PAGE ----------
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page <= 0) {
      page = 1;
    }

    const offset = (page - 1) * limit;

    // ---------- REQUÊTES DB ----------
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: {
          type: { not: 'art' },
        },
        skip: offset,
        take: limit,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          libelle: true,
          description: true,
          price: true,
          duration: true,
          images: true,
          categoryId: true,
          category: {
            select: { name: true },
          },
          metiers: {
            select: {
              metier: {
                select: {
                  id: true,
                  libelle: true,
                },
              },
            },
          },
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                },
              },
            },
          },
        },
      }),
      prisma.service.count({
        where: {
          type: { not: 'art' },
        },
      }),
    ]);

    // ---------- FORMAT FRONT ----------
    const data = services.map(service => ({
      id: service.id,
      name: service.libelle,
      description: service.description,
      price: service.price,
      duration: service.duration,
      images: service.images,
      categoryId: service.categoryId,
      category: service.category?.name || 'non-categorise',
      metiers: service.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle,
      })),
      vendors: service.users.map(u => ({
        id: u.user.id,
        name:
          u.user.companyName ||
          `${u.user.firstName} ${u.user.lastName}`,
        rating: 4.5,
        bookings: 0,
      })),
      status: 'active',
    }));

    // ---------- RÉPONSE ----------
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('[GET /services]', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});


// ✅ GET service select par ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  console.log("=== DEBUG API CALL ===");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("ID reçu:", id, "Type:", typeof id);
  
  const serviceId = parseInt(id, 10);
  console.log("ID converti:", serviceId);
  
  if (isNaN(serviceId)) {
    console.log("❌ ID invalide");
    return res.status(400).json({ message: "ID invalide" });
  }
  
  try {
    console.log("🔍 Recherche du service en base...");
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      },
    });
    
    console.log("📦 Résultat Prisma:", service);
    
    if (!service) {
      console.log("❌ Service non trouvé en base");
      return res.status(404).json({ message: "Service introuvable" });
    }
    
    console.log("✅ Service trouvé, envoi réponse");
    res.json(service);
  } catch (error) {
    console.error("💥 Erreur Prisma:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/services - Créer un nouveau service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, categoryId, metierIds, images } = req.body;
    const io = req.app.get("io");

    // ➕ Création du service
    const newService = await prisma.service.create({
      data: {
        libelle: name,
        description: description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: images || [],
        price: null,
        duration: null,
        metiers: {
          create: metierIds?.map(metierId => ({
            metierId: parseInt(metierId)
          })) || []
        }
      },
      select: {
        id: true,
        libelle: true,
        description: true,
        category: true,
        images: true,
        metiers: {
          include: {
            metier: true
          }
        }
      }
    });

    // 🔔 Notification automatique lors de la création du service
    await createNotification({
      userId: req.user.id,
      type: "success",
      title: "Nouveau service créé",
      message: `Le service "${name}" a été créé avec succès.`,
      relatedEntity: "service",
      relatedEntityId: String(newService.id),
      io
    });

    // Réponse
    res.status(201).json({
      id: newService.id.toString(),
      name: newService.libelle,
      description: newService.description,
      category: newService.category?.name,
      images: newService.images,
      metiers: newService.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      status: 'active'
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/services/:id - Modifier un service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id)
    const { name, description, categoryId, metierIds, images } = req.body

    // Supprimer les liaisons métiers existantes
    await prisma.metierService.deleteMany({
      where: {
        serviceId: serviceId
      }
    })

    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        libelle: name,
        description: description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: images || [],
        metiers: {
          create: metierIds?.map(metierId => ({
            metierId: parseInt(metierId)
          })) || []
        }
      },
      select: {
        id: true,
        libelle: true,
        description: true,
        category: true,
        images: true,
        metiers: {
          include: {
            metier: true
          }
        }
      }
    })

    res.json({
      id: updatedService.id.toString(),
      name: updatedService.libelle,
      description: updatedService.description,
      category: updatedService.category?.name,
      images: updatedService.images,
      metiers: updatedService.metiers.map(m => ({
        id: m.metier.id,
        libelle: m.metier.libelle
      })),
      status: 'active'
    })
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/services/:id - Supprimer un service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id)

    // Vérifier si le service est utilisé dans des demandes
    const demandes = await prisma.demande.findMany({
      where: { serviceId: serviceId }
    })

    if (demandes.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer ce service car il est utilisé dans des demandes' 
      })
    }

    // Supprimer les liaisons métiers
    await prisma.metierService.deleteMany({
      where: { serviceId: serviceId }
    })

    // Supprimer les liaisons utilisateurs
    await prisma.utilisateurService.deleteMany({
      where: { serviceId: serviceId }
    })

    // Supprimer le service
    await prisma.service.delete({
      where: { id: serviceId }
    })

    res.json({ success: true, message: 'Service supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router;