// lib/report-service.js
const { prisma } = require("./db");

class ReportService {
  // Ajouter ou mettre à jour un email de destination
  async addDestinationEmail(email) {
    try {
      const destination = await prisma.reportDestination.upsert({
        where: { email },
        update: { 
          isActive: true,
          updatedAt: new Date()
        },
        create: { 
          email, 
          isActive: true 
        }
      });
      return destination;
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout de l'email: ${error.message}`);
    }
  }

  // Récupérer tous les emails actifs
  async getActiveDestinations() {
    try {
      return await prisma.reportDestination.findMany({
        where: { isActive: true },
        select: { 
          id: true,
          email: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des emails: ${error.message}`);
    }
  }

  // Récupérer tous les emails (actifs et inactifs)
  async getAllDestinations() {
    try {
      return await prisma.reportDestination.findMany({
        select: { 
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des emails: ${error.message}`);
    }
  }

  // Désactiver un email
  async deactivateEmail(email) {
    try {
      return await prisma.reportDestination.update({
        where: { email },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la désactivation: ${error.message}`);
    }
  }

  // Réactiver un email
  async activateEmail(email) {
    try {
      return await prisma.reportDestination.update({
        where: { email },
        data: { 
          isActive: true,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la réactivation: ${error.message}`);
    }
  }

  // Supprimer définitivement un email
  async deleteEmail(email) {
    try {
      return await prisma.reportDestination.delete({
        where: { email }
      });
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }
          
  // Vérifier si un email existe et est actif
  async isEmailActive(email) {
    try {
      const destination = await prisma.reportDestination.findUnique({
        where: { email }
      });
      return destination !== null && destination.isActive;
    } catch (error) {
      throw new Error(`Erreur lors de la vérification: ${error.message}`);
    }
  }
}

module.exports = new ReportService();