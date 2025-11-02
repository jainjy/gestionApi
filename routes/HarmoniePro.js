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
      metierIds, // Changé de metierId à metierIds
      userId,
      images,
    } = req.body;

    console.log("Données reçues du frontend:", req.body);

    // Nettoyage et typage des données
    const parsedPrice = price ? parseFloat(price) : null;
    const parsedDuration = duration ? parseInt(duration) : null;
    const parsedImages = Array.isArray(images) ? images : [];

    // Gestion des metierIds (déjà un tableau depuis le frontend)
    const parsedMetierIds = Array.isArray(metierIds) 
      ? metierIds.map((id) => parseInt(id)).filter(id => !isNaN(id))
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

    // Relation : métiers (table de liaison MetierService)
    if (parsedMetierIds.length > 0) {
      data.metiers = {
        create: parsedMetierIds.map((id) => ({ 
          metier: { connect: { id } } // Correction ici
        })),
      };
    }

    // Relation : utilisateur (table de liaison UtilisateurService)
    if (userId) {
      // Si userId est un UUID string (pas un number)
      if (typeof userId === 'string' && isNaN(parseInt(userId))) {
        data.users = {
          create: [
            {
              user: { connect: { id: userId } } // UUID string
            }
          ]
        };
      } else {
        // Si c'est un number (ancienne version)
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          data.users = {
            create: [
              {
                user: { connect: { id: parsedUserId } }
              }
            ]
          };
        }
      }
    }

    console.log("Payload final envoyé à Prisma:", data);

    // Création du service
    const newService = await prisma.service.create({
      data,
      include: {
        category: true,
        metiers: { 
          include: { 
            metier: true 
          } 
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
      },
    });

    console.log("Service créé avec succès:", newService);

    // Formater la réponse pour correspondre au frontend
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

    // Si c'est une erreur Prisma, afficher meta si dispo
    if (error.meta) {
      console.error("Détails de l'erreur Prisma:", error.meta);
    }

    res.status(500).json({ 
      error: "Erreur serveur lors de la création du service",
      details: error.message 
    });
  }
});

// PUT /api/harmonie/:id Modification d'un service
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
        metiers: {
          include: {
            metier: true
          }
        },
        category: true,
        users: {
          include: {
            user: true
          }
        },
      },
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service introuvable." });
    }

    console.log(
      "📋 Service existant - Métiers:",
      existingService.metiers.map((m) => m.metier.id)
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

    // ✅ Gestion des métiers (CORRIGÉE pour la structure du frontend)
    if (Array.isArray(metierIds)) {
      if (metiersToUpdate.length > 0) {
        console.log("🔄 Mise à jour des métiers...");

        // Supprimer les anciennes relations
        await prisma.metierService.deleteMany({
          where: { serviceId },
        });

        // Créer les nouvelles relations avec la structure correcte
        data.metiers = {
          create: metiersToUpdate.map((id) => ({ 
            metier: { connect: { id } } // Structure corrigée
          })),
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

    // ✅ Gestion de l'utilisateur (ADAPTÉE pour UUID string)
    if (userId !== undefined && userId) {
      // Si userId est un UUID string (pas un number)
      if (typeof userId === 'string' && isNaN(parseInt(userId))) {
        // Vérifier que l'utilisateur existe
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (userExists) {
          // Supprimer les anciennes relations utilisateur
          await prisma.utilisateurService.deleteMany({
            where: { serviceId },
          });
          
          // Créer la nouvelle relation
          data.users = {
            create: [
              {
                user: { connect: { id: userId } }
              }
            ]
          };
        }
      } else {
        // Si c'est un number (ancienne version)
        const parsedUserId = parseInt(userId);
        if (!isNaN(parsedUserId)) {
          const userExists = await prisma.user.findUnique({
            where: { id: parsedUserId },
          });
          if (userExists) {
            await prisma.utilisateurService.deleteMany({
              where: { serviceId },
            });
            
            data.users = {
              create: [
                {
                  user: { connect: { id: parsedUserId } }
                }
              ]
            };
          }
        }
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
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
      },
    });

    // Formatage de la réponse pour correspondre au frontend
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

    console.log("✅ Service modifié avec succès");
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