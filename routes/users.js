const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// GET /api/users - Récupérer tous les utilisateurs
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
        Product: true,
        properties: true,
        blogArticles: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formater les données pour le frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar:user.avatar,
      status: user.status,
      companyName: user.companyName,
      demandType: user.demandType,
      address: user.address,
      zipCode: user.zipCode,
      city: user.city,
      addressComplement: user.addressComplement,
      commercialName: user.commercialName,
      siret: user.siret,
      latitude: user.latitude,
      longitude: user.longitude,
      metiers: user.metiers.map((m) => m.metier),
      services: user.services.map((s) => s.service),
      productsCount: user.Product.length,
      propertiesCount: user.properties.length,
      articlesCount: user.blogArticles.length,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/users/stats - Statistiques des utilisateurs
router.get(
  "/stats",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const total = await prisma.user.count();
      const active = await prisma.user.count({ where: { status: "active" } });
      const inactive = await prisma.user.count({
        where: { status: "inactive" },
      });
      const pro = await prisma.user.count({ where: { role: "professional" } });

      res.json({
        total,
        active,
        inactive,
        pro,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/users/metiers/all - Récupérer tous les métiers
router.get(
  "/metiers/all",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const metiers = await prisma.metier.findMany({
        orderBy: {
          libelle: "asc",
        },
      });
      res.json(metiers);
    } catch (error) {
      console.error("Erreur lors de la récupération des métiers:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/users/services/all - Récupérer tous les services
router.get(
  "/services/all",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const services = await prisma.service.findMany({
        orderBy: {
          libelle: "asc",
        },
      });
      res.json(services);
    } catch (error) {
      console.error("Erreur lors de la récupération des services:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/users - Créer un nouvel utilisateur
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        status,
        companyName,
        demandType,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        metiers,
        services,
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Un utilisateur avec cet email existe déjà" });
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 12);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
          role,
          status,
          companyName: role === "professional" ? companyName : null,
          demandType: role === "user" ? demandType : null,
          address,
          zipCode,
          city,
          addressComplement,
          commercialName,
          siret,
          latitude,
          longitude,
        },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      // Ajouter les métiers si c'est un professionnel
      if (role === "professional" && metiers && metiers.length > 0) {
        await prisma.utilisateurMetier.createMany({
          data: metiers.map((metierId) => ({
            userId: user.id,
            metierId,
          })),
        });
      }

      // Ajouter les services si c'est un professionnel
      if (role === "professional" && services && services.length > 0) {
        await prisma.utilisateurService.createMany({
          data: services.map((serviceId) => ({
            userId: user.id,
            serviceId,
          })),
        });
      }

      // Récupérer l'utilisateur complet avec les relations
      const completeUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      res.json(completeUser);
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        status,
        companyName,
        demandType,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        metiers,
        services,
      } = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email !== existingUser.email) {
        const emailUser = await prisma.user.findUnique({
          where: { email },
        });
        if (emailUser) {
          return res
            .status(400)
            .json({ error: "Un utilisateur avec cet email existe déjà" });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {
        firstName,
        lastName,
        email,
        phone,
        role,
        status,
        companyName: role === "professional" ? companyName : null,
        demandType: role === "user" ? demandType : null,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        latitude,
        longitude,
        updatedAt: new Date(),
      };

      // Mettre à jour le mot de passe si fourni
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      // Mettre à jour l'utilisateur
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Gérer les métiers pour les professionnels
      if (role === "professional") {
        // Supprimer les métiers existants
        await prisma.utilisateurMetier.deleteMany({
          where: { userId: id },
        });

        // Ajouter les nouveaux métiers
        if (metiers && metiers.length > 0) {
          await prisma.utilisateurMetier.createMany({
            data: metiers.map((metierId) => ({
              userId: id,
              metierId,
            })),
          });
        }

        // Supprimer les services existants
        await prisma.utilisateurService.deleteMany({
          where: { userId: id },
        });

        // Ajouter les nouveaux services
        if (services && services.length > 0) {
          await prisma.utilisateurService.createMany({
            data: services.map((serviceId) => ({
              userId: id,
              serviceId,
            })),
          });
        }
      } else {
        // Supprimer les métiers et services si l'utilisateur n'est plus professionnel
        await prisma.utilisateurMetier.deleteMany({
          where: { userId: id },
        });
        await prisma.utilisateurService.deleteMany({
          where: { userId: id },
        });
      }

      // Récupérer l'utilisateur complet avec les relations
      const completeUser = await prisma.user.findUnique({
        where: { id },
        include: {
          metiers: {
            include: {
              metier: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          Product: true,
          properties: true,
          blogArticles: true,
        },
      });

      res.json(completeUser);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// PATCH /api/users/:id - Mettre à jour partiellement un utilisateur
router.patch(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Mettre à jour l'utilisateur
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      res.json(user);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour partielle de l'utilisateur:",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Supprimer l'utilisateur (les relations seront supprimées en cascade)
      await prisma.user.delete({
        where: { id },
      });

      res.json({ success: true, message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/users/update/change-password - Changer le mot de passe
router.put("/update/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/users/update/profile - Mettre à jour le profil de l'utilisateur connecté
router.put("/update/profile",authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      companyName,
      address,
      zipCode,
      city,
      addressComplement,
      commercialName,
      siret,
      avatar,
    } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone,
        companyName,
        address,
        zipCode,
        city,
        addressComplement,
        commercialName,
        siret,
        avatar,
        updatedAt: new Date(),
      },
      include: {
        metiers: {
          include: {
            metier: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
