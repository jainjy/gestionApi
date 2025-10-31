// server/controllers/servicesController.js (new file, basic implementation)
const { prisma } = require("../lib/db");

class ServicesController {
  async getAllServices(req, res) {
    try {
      const services = await prisma.service.findMany({
        orderBy: { libelle: "asc" },
      });
      res.json(services);
    } catch (error) {
      console.error("Erreur lors de la récupération des services:", error);
      res.status(500).json({
        message: "Erreur serveur lors de la récupération des services",
        error: error.message,
      });
    }
  }
}

module.exports = new ServicesController();
