const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification } = require("../services/notificationService");

// POST /api/harmonie/new Ajout de nouveau service
router.post("/new", authenticateToken, async (req, res) => {
  try {
    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierIds,
      userId,
      images,
    } = req.body;

    const io = req.app.get("io"); // WebSocket
    
    // Nettoyage, parsing, et construction du payload (inchangé)
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    const parsedMetierIds = Array.isArray(metierIds)
      ? metierIds.map((id) => parseInt(id)).filter(id => !isNaN(id))
      : [];

    const data = {
      libelle,
      description,
      price: parsedPrice,
      duration: parsedDuration,
      images: parsedImages,
    };

    if (categoryId) {
      data.category = { connect: { id: parseInt(categoryId) } };
    }

    if (parsedMetierIds.length > 0) {
      data.metiers = {
        create: parsedMetierIds.map((id) => ({
          metier: { connect: { id } }
        })),
      };
    }

    if (userId) {
      if (typeof userId === "string" && isNaN(parseInt(userId))) {
        data.users = {
          create: [{ user: { connect: { id: userId } } }],
        };
      } else {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          data.users = {
            create: [{ user: { connect: { id: parsedUserId } } }],
          };
        }
      }
    }

    const newService = await prisma.service.create({
      data,
      include: {
        category: true,
        metiers: { include: { metier: true } },
        users: { include: { user: true } },
      },
    });

    // 🔔 NOTIFICATION CRÉATION
    await createNotification({
      userId: req.user.id,
      type: "success",
      title: "Nouveau service ajouté",
      message: `Le service "${libelle}" a été créé avec succès.`,
      relatedEntity: "service",
      relatedEntityId: String(newService.id),
      io
    });

    const formattedService = {
      id: newService.id,
      libelle: newService.libelle,
      description: newService.description,
      price: newService.price,
      duration: newService.duration,
      images: newService.images,
      category: newService.category,
      categoryId: newService.categoryId,
      metiers: newService.metiers.map((m) => ({
        metier: {
          id: m.metier.id,
          libelle: m.metier.libelle
        }
      })),
      users: newService.users.map((u) => ({
        id: u.user.id,
        name: `${u.user.firstName} ${u.user.lastName}`,
        email: u.user.email,
        rating: 0,
        bookings: 0
      })),
      status: "active",
    };

    res.status(201).json(formattedService);

  } catch (error) {
    console.error("Erreur lors de la création du service:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la création du service",
      details: error.message,
    });
  }
});


// PUT /api/harmonie/:id Modification d'un service
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    const io = req.app.get("io"); // WebSocket

    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierIds,
      userId,
      images,
    } = req.body;

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: "ID de service invalide." });
    }

    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    const metiersToUpdate = Array.isArray(metierIds)
      ? metierIds.map((id) => parseInt(id)).filter(id => !isNaN(id))
      : [];

    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        metiers: { include: { metier: true } },
        category: true,
        users: { include: { user: true } },
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service introuvable." });
    }

    const data = {
      libelle: libelle.trim(),
      description: description ? description.trim() : null,
      price: parsedPrice,
      duration: parsedDuration,
      images: parsedImages,
    };

    if (categoryId !== undefined) {
      if (categoryId && !isNaN(parseInt(categoryId))) {
        data.category = { connect: { id: parseInt(categoryId) } };
      } else {
        data.category = { disconnect: true };
      }
    }

    if (Array.isArray(metierIds)) {
      await prisma.metierService.deleteMany({ where: { serviceId } });

      if (metiersToUpdate.length > 0) {
        data.metiers = {
          create: metiersToUpdate.map((id) => ({
            metier: { connect: { id } }
          })),
        };
      }
    }

    if (userId !== undefined && userId) {
      await prisma.utilisateurService.deleteMany({ where: { serviceId } });

      if (typeof userId === "string" && isNaN(parseInt(userId))) {
        data.users = {
          create: [{ user: { connect: { id: userId } } }],
        };
      } else {
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          data.users = {
            create: [{ user: { connect: { id: parsedUserId } } }],
          };
        }
      }
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data,
      include: {
        category: true,
        metiers: { include: { metier: true } },
        users: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // 🔔 NOTIFICATION MODIFICATION
    await createNotification({
      userId: req.user.id,
      type: "info",
      title: "Service modifié",
      message: `Le service "${libelle}" a été modifié avec succès.`,
      relatedEntity: "service",
      relatedEntityId: String(updatedService.id),
      io
    });

    const response = {
      id: updatedService.id,
      libelle: updatedService.libelle,
      description: updatedService.description,
      price: updatedService.price,
      duration: updatedService.duration,
      category: updatedService.category,
      categoryId: updatedService.categoryId,
      images: updatedService.images,
      metiers: updatedService.metiers.map((m) => ({
        metier: {
          id: m.metier.id,
          libelle: m.metier.libelle
        }
      })),
      users: updatedService.users.map((u) => ({
        id: u.user.id,
        name: `${u.user.firstName} ${u.user.lastName}`,
        email: u.user.email,
        rating: 0,
        bookings: 0
      })),
      status: "active",
    };

    res.json(response);

  } catch (error) {
    console.error("❌ Erreur lors de la modification:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la modification",
      details: error.message
    });
  }
});


// POST /api/harmonie/category - Charger catégories en fonction du métiers
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    // Catégories Formateur
    const Formateur = await prisma.category.findMany({
      where: {
        name: {
          in: ["Yoga", "Pilates", "Cuisine", "Sport"],
        },
      },
      include: {
        services: true, // Inclure les services liés
      },
      orderBy: {
        name: "asc",
      },
    });

    // Catégories Podcasteur
    const Podcasteur = await prisma.category.findMany({
      where: {
        name: {
          in: ["Motivation", "Guérison", "Spiritualité", "Méditation"],
        },
      },
      include: {
        services: true, // Inclure les services liés
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json([...Formateur, ...Podcasteur]);
  } catch (err) {
    console.error("Erreur récupération données formulaire :", err);
    res.status(500).json({ error: "Erreur lors du chargement des données" });
  }
});

// GET /api/harmonie/metiers - Récupérer tous les métiers
router.get("/metiers", authenticateToken, async (req, res) => {
  try {
    const metiers = await prisma.metier.findMany({
      where: {
        libelle: {
          in: ["Thérapeute", "Masseur", "Formateur", "Podcasteur"],
        },
      },
      include: {
        services: {
          include: {
            service: true, // Inclure les données complètes du service
          },
        },
      },
      orderBy: {
        libelle: "asc", // Trie les métiers par libellé
      },
    });

    res.json(metiers);
  } catch (error) {
    console.error("Erreur lors de la récupération des métiers:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/harmonie/services Selection de tous les services qui a ces métier ["Thérapeute", "Masseur", "Formateur", "Podcasteur"]
router.get("/services", authenticateToken, async (req, res) => {
  try {
    const métiersCibles = ["Thérapeute", "Masseur", "Formateur", "Podcasteur"];

    const services = await prisma.service.findMany({
      where: {
        metiers: {
          some: {
            metier: {
              libelle: { in: métiersCibles },
            },
          },
        },
      },
      include: {
        metiers: { include: { metier: true } },
        category: true,
        users: true, // si tu veux inclure les utilisateurs associés
      },
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


//front bienetre
router.get("/views", authenticateToken, async (req, res) => {
  try {
    const métiersCibles = ["Thérapeute", "Masseur", "Formateur", "Podcasteur"];

    const results = await Promise.all(
      métiersCibles.map(async (libelle) => {
        const services = await prisma.service.findMany({
          where: {
            metiers: {
              some: {
                metier: { libelle: libelle },
              },
            },
          },
          include: {
            metiers: { include: { metier: true } },
            category: true,
            users: true,
          },
        });

        return { [libelle]: services };
      })
    );

    // Fusionner le tableau de résultats en un seul objet
    const grouped = Object.assign({}, ...results);

    res.json(grouped);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/harmonie/:id Suppression d'un service
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);

    // Vérifier si le service est utilisé dans des demandes
    const demandes = await prisma.demande.findMany({
      where: { serviceId: serviceId },
    });

    if (demandes.length > 0) {
      return res.status(400).json({
        error:
          "Impossible de supprimer ce service car il est utilisé dans des demandes",
      });
    }

    // Supprimer les liaisons métiers
    await prisma.metierService.deleteMany({
      where: { serviceId: serviceId },
    });

    // Supprimer les liaisons utilisateurs
    await prisma.utilisateurService.deleteMany({
      where: { serviceId: serviceId },
    });

    // Supprimer le service
    await prisma.service.delete({
      where: { id: serviceId },
    });

    res.json({ success: true, message: "Service supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du service:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/harmonie/appointments
router.post("/appointments", authenticateToken, async (req, res) => {
  try {
    const { serviceId, date, time, message } = req.body;
    const userId = req.user.id; // Récupéré du token JWT

    // Validation des données
    if (!serviceId || !date || !time) {
      return res.status(400).json({ 
        error: "Les champs serviceId, date et time sont obligatoires" 
      });
    }

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        userId,
        serviceId: parseInt(serviceId),
        date: new Date(date),
        time,
        message: message || null,
        status: "pending"
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log("✅ Rendez-vous créé:", appointment);
    res.status(201).json({ 
      message: "Rendez-vous créé avec succès",
      appointment 
    });

  } catch (error) {
    console.error("❌ Erreur création rendez-vous:", error);
    res.status(500).json({ 
      error: "Erreur lors de la création du rendez-vous" 
    });
  }
});

module.exports = router;