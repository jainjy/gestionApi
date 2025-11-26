// lib/report-service.js - VERSION AVEC TOUJOURS NOUVEL ENREGISTREMENT
const { prisma } = require("./db");

class ReportService {
  // Ajouter TOUJOURS un nouvel enregistrement même si l'email existe
  async addDestinationEmail(email) {
    try {
      console.log("📧 Création NOUVEL enregistrement pour:", email);
      
      // TOUJOURS créer un nouvel enregistrement, même si l'email existe déjà
      const destination = await prisma.reportDestination.create({
        data: { 
          email: email,
          isActive: true
        }
      });
      
      console.log("✅ NOUVEL email créé:", destination.id);
      return destination;
    } catch (error) {
      console.error("❌ Erreur création email:", error);
      
      // En cas de contrainte d'unicité, on crée quand même avec un identifiant unique
      if (error.code === 'P2002') {
        console.log("🔄 Email existe déjà, création avec timestamp...");
        
        // Créer un email unique avec timestamp
        const uniqueEmail = `${email.split('@')[0]}+${Date.now()}@${email.split('@')[1]}`;
        
        const destination = await prisma.reportDestination.create({
          data: { 
            email: uniqueEmail,
            isActive: true
          }
        });
        
        console.log("✅ Email alternatif créé:", destination.email);
        return destination;
      }
      
      throw new Error(`Erreur lors de l'ajout de l'email: ${error.message}`);
    }
  }

  // Récupérer tous les emails actifs (pour le dropdown)
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

  // Récupérer tous les emails (pour le tableau)
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
  async deactivateEmail(id) {
    try {
      return await prisma.reportDestination.update({
        where: { id },
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
  async activateEmail(id) {
    try {
      return await prisma.reportDestination.update({
        where: { id },
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
  async deleteEmail(id) {
    try {
      return await prisma.reportDestination.delete({
        where: { id }
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