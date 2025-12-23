// server/controllers/userMetiersController.js
const { prisma } = require("../lib/db");

class UserMetiersController {
  // GET '/user/metiers/'
  async getAllUserMetiers(req, res) {
    try {
      const metiers = await prisma.metier.findMany({
        select: {
          id: true,
          libelle: true,
          // embedding: true, // Si vous voulez inclure l'embedding
          // Vous pouvez aussi inclure le nombre de relations si besoin
        },
        orderBy: {
          libelle: "asc",
        },
      });
      
      // Optionnel : Ajouter des statistiques basiques
      const metiersWithStats = metiers.map(metier => ({
        ...metier,
        // Vous pouvez ajouter des valeurs par défaut ou calculées
        _count: {
          // Ces valeurs seraient calculées si vous faites des requêtes séparées
          services: 0,
          users: 0,
          demandes: 0,
        }
      }));
      
      res.json(metiersWithStats);
    } catch (error) {
      console.error("Erreur lors de la récupération des métiers:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération des métiers",
        error: error.message,
      });
    }
  }

  // GET '/user/metiers/search?q=terme'
  async searchUserMetiers(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({ 
          message: "Le terme de recherche doit contenir au moins 2 caractères" 
        });
      }
      
      const searchTerm = q.trim();
      
      const metiers = await prisma.metier.findMany({
        where: {
          libelle: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          libelle: true,
          // embedding: true, // Optionnel
        },
        orderBy: {
          libelle: "asc",
        },
        take: 50,
      });
      
      res.json(metiers);
    } catch (error) {
      console.error("Erreur lors de la recherche des métiers:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la recherche des métiers",
        error: error.message,
      });
    }
  }

  // GET '/user/metiers/:id'
  async getUserMetierById(req, res) {
    try {
      const { id } = req.params;
      const metier = await prisma.metier.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          libelle: true,
          // embedding: true, // Optionnel
          // Vous pouvez inclure des relations si nécessaire
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  libelle: true,
                  description: true,
                }
              }
            }
          }
        },
      });
      
      if (!metier) {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      
      // Formater la réponse
      const formattedMetier = {
        ...metier,
        services: metier.services.map(ms => ms.service),
        // Calculer les counts si nécessaire
        _count: {
          services: metier.services.length,
          // Pour users et demandes, vous devrez faire des requêtes séparées
        }
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

  // Version alternative sans relations (plus simple)
  async getUserMetierByIdSimple(req, res) {
    try {
      const { id } = req.params;
      const metier = await prisma.metier.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          libelle: true,
          // embedding: true, // Optionnel
        },
      });
      
      if (!metier) {
        return res.status(404).json({ message: "Métier non trouvé" });
      }
      
      res.json(metier);
    } catch (error) {
      console.error("Erreur lors de la récupération du métier:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération du métier",
        error: error.message,
      });
    }
  }
}

module.exports = new UserMetiersController();