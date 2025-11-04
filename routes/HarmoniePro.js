const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// POST /api/harmonie/new Ajout de nouveau service
router.post("/new", authenticateToken, async (req, res) => {
  try {
    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierId,
      userId,
      images,
    } = req.body;

    console.log("Données reçues du frontend:", req.body); // 🔹 log initial

    // Nettoyage et typage des données
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    // Si un seul metierId est envoyé, on le convertit en tableau
    const metierIds = Array.isArray(metierId)
      ? metierId.map((id) => parseInt(id))
      : metierId
        ? [parseInt(metierId)]
        : [];

    // Construction dynamique du data pour Prisma
    const data = {
      libelle,
      description,
      price: parsedPrice,
      duration: parsedDuration,
      images: parsedImages,
    };

    // Relation : catégorie
    if (categoryId) {
      data.category = { connect: { id: parseInt(categoryId) } };
    }

    // Relation : métiers (plusieurs possibles)
    if (metierIds.length > 0) {
      data.metiers = {
        create: metierIds.map((id) => ({ metierId: id })),
      };
    }

    // Relation : utilisateur
    if (userId) {
      data.users = { connect: { id: parseInt(userId) } };
    }

    console.log("Payload final envoyé à Prisma:", data); // 🔹 log pour debug

    // Création du service
    const newService = await prisma.service.create({
      data,
      include: {
        category: true,
        metiers: { include: { metier: true } },
        users: true,
      },
    });

    console.log("Service créé avec succès:", newService); // 🔹 log résultat Prisma

    res.status(201).json({
      id: newService.id,
      libelle: newService.libelle,
      description: newService.description,
      price: newService.price,
      duration: newService.duration,
      images: newService.images,
      category: newService.category,
      metiers: newService.metiers.map((m) => m.metier),
      users: newService.users,
      status: "active",
    });
  } catch (error) {
    console.error("Erreur lors de la création du service:", error);

    // Si c'est une erreur Prisma, afficher meta si dispo
    if (error.meta) {
      console.error("Détails de l'erreur Prisma:", error.meta);
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/harmonie/:id Modification d'un service
/*router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierIds, // ✅ on attend metierIds du front
      userId,
      images,
    } = req.body;

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: "ID de service invalide." });
    }

    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    // Nettoyage des IDs
    const metiersToUpdate = Array.isArray(metierIds)
      ? metierIds.map((id) => parseInt(id))
      : [];

    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { metiers: true },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service introuvable." });
    }

    const data = {
      libelle,
      description,
      price: parsedPrice,
      duration: parsedDuration,
      images: parsedImages,
    };

    // ✅ Ne pas déconnecter la catégorie si elle n’est pas envoyée
    if (categoryId !== undefined) {
      if (categoryId) {
        data.category = { connect: { id: parseInt(categoryId) } };
      } else {
        data.category = { disconnect: true };
      }
    }

    // ✅ Mettre à jour les métiers uniquement si un tableau est fourni
    if (metiersToUpdate.length > 0) {
      await prisma.metierService.deleteMany({ where: { serviceId } });
      data.metiers = {
        create: metiersToUpdate.map((id) => ({ metierId: id })),
      };
    }

    // ✅ Ne pas déconnecter l’utilisateur si rien n’est envoyé
    if (userId !== undefined) {
      data.users = { connect: { id: parseInt(userId) } };
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data,
      include: {
        category: true,
        metiers: { include: { metier: true } },
        users: true,
      },
    });

    res.json({
      id: updatedService.id,
      libelle: updatedService.libelle,
      description: updatedService.description,
      price: updatedService.price,
      duration: updatedService.duration,
      category: updatedService.category,
      images: updatedService.images,
      metiers: updatedService.metiers.map((m) => m.metier),
      users: updatedService.users,
      status: "active",
    });
  } catch (error) {
    console.error("Erreur lors de la modification du service:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id);
    let {
      libelle,
      description,
      price,
      duration,
      categoryId,
      metierIds, // ✅ tableau de métiers
      userId,
      images,
    } = req.body;

    console.log("📥 Données reçues pour modification:", req.body);

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: "ID de service invalide." });
    }

    // Validation basique
    if (!libelle || libelle.trim() === "") {
      return res.status(400).json({ error: "Le libellé est obligatoire." });
    }

    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    // Nettoyage des IDs de métiers
    const metiersToUpdate = Array.isArray(metierIds)
      ? metierIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
      : [];

    console.log("🔄 Métiers à mettre à jour:", metiersToUpdate);

    // Vérifier si le service existe
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        metiers: true,
        category: true,
        users: true,
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service introuvable." });
    }

    console.log(
      "📋 Service existant:",
      existingService.metiers.map((m) => m.metierId)
    );

    // Construction des données de mise à jour
    const data = {
      libelle: libelle.trim(),
      description: description ? description.trim() : null,
      price: parsedPrice,
      duration: parsedDuration,
      images: parsedImages,
    };

    // ✅ Gestion de la catégorie (conditionnelle)
    if (categoryId !== undefined) {
      if (categoryId && !isNaN(parseInt(categoryId))) {
        // Vérifier que la catégorie existe
        const categoryExists = await prisma.category.findUnique({
          where: { id: parseInt(categoryId) },
        });
        if (categoryExists) {
          data.category = { connect: { id: parseInt(categoryId) } };
        }
      } else {
        data.category = { disconnect: true };
      }
    }

    // ✅ Gestion des métiers (AMÉLIORÉE)
    if (Array.isArray(metierIds)) {
      if (metiersToUpdate.length > 0) {
        console.log("🔄 Mise à jour des métiers...");

        // Supprimer les anciennes relations
        await prisma.metierService.deleteMany({
          where: { serviceId },
        });

        // Créer les nouvelles relations
        data.metiers = {
          create: metiersToUpdate.map((id) => ({ metierId: id })),
        };
      } else {
        // Si tableau vide explicite, supprimer tous les métiers
        console.log("🗑️ Suppression de tous les métiers (tableau vide)");
        await prisma.metierService.deleteMany({
          where: { serviceId },
        });
      }
    }
    // Si metierIds n'est pas fourni, on ne touche pas aux métiers existants

    // ✅ Gestion de l'utilisateur
    if (userId !== undefined && userId && !isNaN(parseInt(userId))) {
      // Vérifier que l'utilisateur existe
      const userExists = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });
      if (userExists) {
        data.users = { connect: { id: parseInt(userId) } };
      }
    }

    console.log("📤 Données envoyées à Prisma:", data);

    // Mise à jour du service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data,
      include: {
        category: true,
        metiers: {
          include: {
            metier: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Formatage de la réponse
    const response = {
      id: updatedService.id,
      libelle: updatedService.libelle,
      description: updatedService.description,
      price: updatedService.price,
      duration: updatedService.duration,
      category: updatedService.category,
      images: updatedService.images,
      metiers: updatedService.metiers.map((m) => m.metier),
      users: updatedService.users,
      status: "active",
    };

    console.log("✅ Service modifié avec succès:", response);
    res.json(response);
  } catch (error) {
    console.error("❌ Erreur lors de la modification du service:", error);

    // Gestion spécifique des erreurs Prisma
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Enregistrement introuvable." });
    }
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Référence étrangère invalide." });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Violation de contrainte unique." });
    }

    res.status(500).json({
      error: "Erreur serveur lors de la modification",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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

// GET /api/harmonie/views
/*router.get("/views", authenticateToken, async (req, res) => {
  try {
    const métiersCibles = ["Thérapeute", "Masseur", "Formateur", "Podcasteur"];
    const result = {};

    // Boucle sur chaque métier cible
    for (const libelle of métiersCibles) {
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

      result[libelle] = services;
    }

    res.json(result);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/
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