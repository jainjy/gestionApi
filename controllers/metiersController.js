// server/controllers/metiersController.js (updated)
const { prisma } = require("../lib/db");

class MetiersController {
  // Récupérer tous les métiers avec leurs relations
  async getAllMetiers(req, res) {
    try {
      const metiers = await prisma.metier.findMany({
        include: {
          services: {
            include: {
              service: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          libelle: "asc",
        },
      });
      // Formater la réponse pour inclure les counts
      const formattedMetiers = metiers.map((metier) => ({
        id: metier.id,
        libelle: metier.libelle,
        services: metier.services.map((ms) => ms.service),
        users: metier.users.map((um) => um.user),
        _count: {
          services: metier.services.length,
          users: metier.users.length,
        },
      }));
      res.json(formattedMetiers);
    } catch (error) {
      console.error("Erreur lors de la récupération des métiers:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération des métiers",
        error: error.message,
      });
    }
  }

  // Récupérer un métier par son ID
  async getMetierById(req, res) {
    try {
      const { id } = req.params;
      const metier = await prisma.metier.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: {
            include: {
              service: {
                include: {
                  category: true,
                },
              },
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });
      if (!metier) {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      // Formater la réponse
      const formattedMetier = {
        ...metier,
        services: metier.services.map((ms) => ms.service),
        users: metier.users.map((um) => um.user),
        _count: {
          services: metier.services.length,
          users: metier.users.length,
        },
      };
      res.json(formattedMetier);
    } catch (error) {
      console.error("Erreur lors de la récupération du métier:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération du métier",
        error: error.message,
      });
    }
  }

  // Créer un nouveau métier
  async createMetier(req, res) {
    try {
      const { libelle, serviceIds = [] } = req.body;
      // Validation
      if (!libelle || libelle.trim() === "") {
        return res
          .status(400)
          .json({ message: "Le libellé du métier est requis" });
      }
      // Vérifier si le métier existe déjà
      const existingMetier = await prisma.metier.findFirst({
        where: {
          libelle: {
            equals: libelle.trim(),
            mode: "insensitive",
          },
        },
      });
      if (existingMetier) {
        return res
          .status(409)
          .json({ message: "Un métier avec ce libellé existe déjà" });
      }
      // Créer le métier
      const newMetier = await prisma.metier.create({
        data: {
          libelle: libelle.trim(),
          services: {
            create: serviceIds.map((serviceId) => ({
              service: { connect: { id: serviceId } },
            })),
          },
        },
        include: {
          services: true,
        },
      });
      res.status(201).json({
        message: "Métier créé avec succès",
        metier: newMetier,
      });
    } catch (error) {
      console.error("Erreur lors de la création du métier:", error);
      // Gestion spécifique de l'erreur de contrainte unique
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Un métier avec cet ID existe déjà",
        });
      }
      res.status(500).json({
        message: "Erreur serveur lors de la création du métier",
        error: error.message,
      });
    }
  }

  // Mettre à jour un métier
  async updateMetier(req, res) {
    try {
      const { id } = req.params;
      const { libelle, serviceIds = [] } = req.body;
      // Validation
      if (!libelle || libelle.trim() === "") {
        return res
          .status(400)
          .json({ message: "Le libellé du métier est requis" });
      }
      // Vérifier si le métier existe
      const existingMetier = await prisma.metier.findUnique({
        where: { id: parseInt(id) },
        include: { services: true },
      });
      if (!existingMetier) {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      // Vérifier si un autre métier a déjà ce libellé
      const duplicateMetier = await prisma.metier.findFirst({
        where: {
          libelle: {
            equals: libelle.trim(),
            mode: "insensitive",
          },
          id: {
            not: parseInt(id),
          },
        },
      });
      if (duplicateMetier) {
        return res
          .status(409)
          .json({ message: "Un autre métier avec ce libellé existe déjà" });
      }
      // Mettre à jour le métier et gérer les services
      const updatedMetier = await prisma.metier.update({
        where: { id: parseInt(id) },
        data: {
          libelle: libelle.trim(),
          services: {
            deleteMany: {}, // Supprimer toutes les liaisons existantes
            create: serviceIds.map((serviceId) => ({
              service: { connect: { id: serviceId } },
            })),
          },
        },
        include: {
          services: true,
        },
      });
      res.json({
        message: "Métier mis à jour avec succès",
        metier: updatedMetier,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du métier:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la mise à jour du métier",
        error: error.message,
      });
    }
  }

  // Supprimer un métier
  async deleteMetier(req, res) {
    try {
      const { id } = req.params;
      // Vérifier si le métier existe
      const metier = await prisma.metier.findUnique({
        where: { id: parseInt(id) },
        include: {
          services: true,
          users: true,
        },
      });
      if (!metier) {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      // Vérifier les dépendances
      if (metier.services.length > 0) {
        return res.status(400).json({
          message:
            "Impossible de supprimer ce métier : des services y sont associés",
        });
      }
      if (metier.users.length > 0) {
        return res.status(400).json({
          message:
            "Impossible de supprimer ce métier : des utilisateurs y sont associés",
        });
      }
      await prisma.metier.delete({
        where: { id: parseInt(id) },
      });
      res.json({ message: "Métier supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression du métier:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      res.status(500).json({
        message: "Erreur serveur lors de la suppression du métier",
        error: error.message,
      });
    }
  }

  // Récupérer les statistiques des métiers
  async getMetiersStats(req, res) {
    try {
      const totalMetiers = await prisma.metier.count();
      const metiersWithServices = await prisma.metier.count({
        where: {
          services: {
            some: {},
          },
        },
      });
      const metiersWithUsers = await prisma.metier.count({
        where: {
          users: {
            some: {},
          },
        },
      });
      const topMetiers = await prisma.metier.findMany({
        include: {
          _count: {
            select: {
              services: true,
              users: true,
            },
          },
        },
        orderBy: {
          users: {
            _count: "desc",
          },
        },
        take: 5,
      });
      res.json({
        total: totalMetiers,
        withServices: metiersWithServices,
        withUsers: metiersWithUsers,
        topMetiers: topMetiers.map((metier) => ({
          id: metier.id,
          libelle: metier.libelle,
          servicesCount: metier._count.services,
          usersCount: metier._count.users,
        })),
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  }
}

module.exports = new MetiersController();
