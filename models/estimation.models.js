// models/estimation.models.js
const { prisma } = require("../lib/db");

class EstimationModel {
  /**
   * Créer une nouvelle demande d'estimation
   */
  static async createEstimation(data) {
    const {
      expediteurId,
      destinatairesIds,
      propertyType,
      surface,
      rooms,
      address,
      commune,
      postalCode,
      firstName,
      lastName,
      phone,
      email,
      description,
    } = data;

    const results = [];

    for (const destinataireId of destinatairesIds) {
      // 1. Créer UNE demande par professionnel
      const demande = await prisma.demande.create({
        data: {
          description:
            description ||
            `Demande d'estimation immobilière - ${propertyType} de ${surface}m² à ${commune}`,
          contactNom: lastName,
          contactPrenom: firstName,
          contactEmail: email,
          contactTel: phone,
          contactAdresse: address,
          contactAdresseCp: postalCode,
          contactAdresseVille: commune,
          createdById: expediteurId,
          aiClass: "estimation_immobiliere",
          aiSummary: JSON.stringify({
            type: "estimation_immobiliere",
            version: "1.0",
            propertyType,
            surface: parseInt(surface),
            rooms,
            address,
            commune,
            postalCode,
            destinataireId, // Un seul destinataire par demande
            createdAt: new Date().toISOString(),
          }),
          statut: "en_attente",
          createdAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              companyName: true,
            },
          },
        },
      });

      // 2. Créer le lien DemandeArtisan pour CE professionnel uniquement
      const lien = await prisma.demandeArtisan.create({
        data: {
          demandeId: demande.id,
          userId: destinataireId,
          accepte: null,
          recruited: false,
          clientConfirmeTravaux: false,
          travauxTermines: false,
          factureConfirmee: false,
          createdAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      results.push({ demande, lien });
    }

    return results; // Tableau de { demande, lien }
  }

  /**
   * Créer une conversation et un message système pour l'estimation
   */
  static async createConversationWithMessage(
    demandeId,
    expediteurId,
    destinataireId, // ← UN seul destinataire maintenant (plus un tableau)
    propertyDetails,
  ) {
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, companyName: true },
        },
      },
    });

    if (!demande) throw new Error("Demande non trouvée");

    const expediteur = demande.createdBy;
    const expediteurNom =
      expediteur.companyName ||
      `${expediteur.firstName} ${expediteur.lastName}`;

    const messageContent = `🏠 **Nouvelle demande d'estimation immobilière**

**Client :** ${expediteurNom}
**Email :** ${demande.contactEmail}
**Téléphone :** ${demande.contactTel}

**Détails du bien :**
- Type : ${propertyDetails.propertyType}
- Surface : ${propertyDetails.surface} m²
- Pièces : ${propertyDetails.rooms}
- Adresse : ${propertyDetails.address || "Non spécifiée"}
- Commune : ${propertyDetails.commune}
- Code postal : ${propertyDetails.postalCode}

**Message du client :** ${propertyDetails.description || "Aucun message supplémentaire"}

---
💡 *Cette estimation est gratuite et sans engagement.*`;

    // Conversation entre l'expéditeur et CE professionnel uniquement
    const conversation = await prisma.conversation.create({
      data: {
        titre: `Estimation immobilière - ${propertyDetails.commune} - ${propertyDetails.surface}m²`,
        demandeId: demande.id,
        createurId: expediteurId,
        participants: {
          create: [{ userId: expediteurId }, { userId: destinataireId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        expediteurId: expediteurId,
        contenu: messageContent,
        type: "SYSTEM",
        evenementType: "DEMANDE_ENVOYEE",
        lu: false,
        createdAt: new Date(),
      },
    });

    return { conversation, message };
  }

  /**
   * Récupérer toutes les estimations d'un utilisateur (en tant qu'expéditeur)
   */
  static async getEstimationsAsExpediteur(userId) {
    const estimations = await prisma.demande.findMany({
      where: {
        createdById: userId,
        aiClass: "estimation_immobiliere",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        artisans: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parser les aiSummary pour extraire les détails
    return estimations.map((est) => ({
      ...est,
      details: est.aiSummary ? JSON.parse(est.aiSummary) : null,
      dernierMessage: est.conversations[0]?.messages[0] || null,
    }));
  }

  /**
   * Récupérer toutes les estimations reçues par un professionnel (en tant que destinataire)
   */
  static async getEstimationsAsDestinataire(userId) {
    const demandesArtisan = await prisma.demandeArtisan.findMany({
      where: {
        userId: userId,
        demande: {
          aiClass: "estimation_immobiliere",
        },
      },
      include: {
        demande: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true,
              },
            },
            conversations: {
              include: {
                messages: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return demandesArtisan.map((da) => ({
      id: da.demande.id,
      statut: da.demande.statut,
      accepte: da.accepte,
      createdAt: da.createdAt,
      expediteur: da.demande.createdBy,
      description: da.demande.description,
      details: da.demande.aiSummary ? JSON.parse(da.demande.aiSummary) : null,
      dernierMessage: da.demande.conversations[0]?.messages[0] || null,
      demandeArtisanId: da.demande.id, // 👈 on passe demandeId (pas da.id qui n'existe pas)
    }));
  }

  /**
   * Récupérer toutes les estimations (expéditeur + destinataire)
   */
  static async getAllUserEstimations(userId) {
    const [asExpediteur, asDestinataire] = await Promise.all([
      this.getEstimationsAsExpediteur(userId),
      this.getEstimationsAsDestinataire(userId),
    ]);

    return {
      asExpediteur,
      asDestinataire,
      total: asExpediteur.length + asDestinataire.length,
    };
  }

  /**
   * Mettre à jour le statut d'une estimation (acceptée/refusée par un destinataire)
   */
  static async updateEstimationStatus(demandeArtisanId, accepte) {
    const lien = await prisma.demandeArtisan.findFirst({
      where: { demandeId: demandeArtisanId },
    });

    if (!lien) throw new Error("Lien DemandeArtisan introuvable");

    const updated = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: lien.userId,
          demandeId: lien.demandeId,
        },
      },
      data: {
        accepte: accepte,
        updatedAt: new Date(),
      },
      include: {
        demande: {
          include: {
            conversations: true, // 👈 nécessaire pour le bloc suivant
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        user: true,
      },
    });

    // Ajouter un message système dans la conversation
    if (updated.demande.conversations.length > 0) {
      const conversationId = updated.demande.conversations[0].id;
      const statusMessage = accepte
        ? `✅ L'agence **${updated.user.companyName || updated.user.firstName} ${updated.user.lastName}** a **accepté** de traiter votre demande d'estimation.`
        : `❌ L'agence **${updated.user.companyName || updated.user.firstName} ${updated.user.lastName}** a **décliné** votre demande d'estimation.`;

      await prisma.message.create({
        data: {
          conversationId: conversationId,
          expediteurId: updated.user.id,
          contenu: statusMessage,
          type: "SYSTEM",
          evenementType: accepte ? "ARTISAN_ACCEPTE" : "ARTISAN_REFUSE",
          lu: false,
          createdAt: new Date(),
        },
      });
    }

    return updated;
  }

  /**
   * Récupérer une estimation spécifique avec tous les détails
   */
  static async getEstimationById(demandeId) {
    const estimation = await prisma.demande.findUnique({
      where: {
        id: demandeId, // 👈 AJOUTER L'ID MANQUANT
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        artisans: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                expediteur: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    avatar: true,
                  },
                },
              },
            },
            participants: {
              include: {
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
        },
      },
    });

    if (estimation) {
      try {
        estimation.details = estimation.aiSummary
          ? JSON.parse(estimation.aiSummary)
          : null;
      } catch (e) {
        estimation.details = null;
      }
    }

    return estimation;
  }

  /**
   * Récupérer tous les professionnels (agences immobilières) avec leurs services
   */
  static async getProfessionnels(commune = null) {
    try {
      const professionnels = await prisma.user.findMany({
        where: {
          role: "professional",
          status: "active",
          // ❌ Supprimé : le filtre OR sur userType/professionalCategory
          // ❌ Supprimé : le filtre sur city/commune
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          commercialName: true,
          email: true,
          phone: true,
          avatar: true,
          city: true,
          address: true,
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  libelle: true,
                  description: true,
                  price: true,
                  duration: true,
                  type: true,
                },
              },
            },
            where: { isAvailable: true },
            take: 3,
          },
          metiers: {
            include: {
              metier: {
                select: {
                  id: true,
                  libelle: true,
                  categorie: true,
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { companyName: "asc" },
      });

      return professionnels.map((pro) => ({
        id: pro.id,
        name:
          pro.companyName ||
          pro.commercialName ||
          `${pro.firstName || ""} ${pro.lastName || ""}`.trim() ||
          "Professionnel",
        city: pro.city || "Non spécifiée",
        rating: 4.5,
        deals: 0,
        specialty: pro.metiers?.[0]?.metier?.libelle || "Expertise immobilière",
        avatar: pro.avatar,
        email: pro.email,
        phone: pro.phone,
        serviceCount: pro.services.length,
        services: pro.services.map((s) => ({
          id: s.service.id,
          libelle: s.service.libelle,
          description: s.service.description,
          price: s.customPrice || s.service.price,
          duration: s.customDuration || s.service.duration,
        })),
      }));
    } catch (error) {
      console.error("❌ Erreur dans getProfessionnels:", error);
      return [];
    }
  }
}

module.exports = EstimationModel;
