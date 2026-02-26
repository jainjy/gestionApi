const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// ============================================
// POST /api/demandes/immobilier - Créer une nouvelle demande de visite
// ============================================
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      contactNom,
      contactPrenom,
      contactEmail,
      contactTel,
      lieuAdresse,
      lieuAdresseCp,
      lieuAdresseVille,
      optionAssurance,
      description,
      serviceId,
      nombreArtisans,
      createdById,      // <- ID du DEMANDEUR (celui qui fait la demande)
      propertyId,
      dateSouhaitee,
      heureSouhaitee,
      artisanId,
    } = req.body;

    // Validation de base
    if (!createdById) {
      return res.status(400).json({ error: "createdById est requis" });
    }

    if (!contactNom || !contactPrenom || !contactEmail || !contactTel) {
      return res
        .status(400)
        .json({ error: "Les informations de contact sont obligatoires" });
    }

    if (!propertyId) {
      return res.status(400).json({ error: "propertyId est requis pour une demande de visite" });
    }

    // Vérifier si c'est une demande de service (propertyId est null pour les services)
    const isDemandeService = !propertyId;

    let service = null;
    let chosenServiceId = serviceId;
    let serviceLibelle = "Demande de visite";
    
    // IMPORTANT: createdById est l'ID du demandeur, on le garde tel quel
    const demandeurId = createdById;

    // RÉCUPÉRER LE PROPRIÉTAIRE DU BIEN
    let propertyOwnerId = null;

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });

      if (property && property.ownerId) {
        propertyOwnerId = property.ownerId;
      }
    }

    // Si c'est une demande de service OU si le serviceId n'est pas fourni
    if (isDemandeService || !serviceId) {
      chosenServiceId = propertyOwnerId || demandeurId;
      serviceLibelle = `Demande de ${propertyId ? "visite" : "service"} par ${contactPrenom} ${contactNom}`;
    } else {
      service = await prisma.service.findUnique({
        where: { id: parseInt(serviceId) },
        select: { libelle: true },
      });
      if (service) {
        serviceLibelle = service.libelle;
      }
    }

    // Créer la demande
    const nouvelleDemande = await prisma.demande.create({
      data: {
        contactNom,
        contactPrenom,
        contactEmail,
        contactTel,
        lieuAdresse: lieuAdresse || "",
        lieuAdresseCp: lieuAdresseCp || "",
        lieuAdresseVille: lieuAdresseVille || "",
        optionAssurance: optionAssurance || false,
        description,
        serviceId: chosenServiceId ? parseInt(chosenServiceId) : null,
        statut: "en attente",
        nombreArtisans: nombreArtisans || "UNIQUE",
        createdById: demandeurId, // ✅ ICI C'EST CRUCIAL : on garde l'ID du demandeur
        propertyId,
        artisanId,
        dateSouhaitee:
          dateSouhaitee && heureSouhaitee
            ? new Date(dateSouhaitee + "T" + heureSouhaitee + ":00.000Z")
            : dateSouhaitee
              ? new Date(dateSouhaitee + "T00:00:00.000Z")
              : null,
        heureSouhaitee: heureSouhaitee || null,
      },
      include: {
        property: {
          include: {
            owner: {
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
        },
        service: {
          select: {
            id: true,
            libelle: true,
            description: true,
            images: true,
            price: true,
            duration: true,
          },
        },
        artisan: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            commercialName: true,
          },
        },
      },
    });

    // Créer une conversation si nécessaire
    let conversation = null;

    if (isDemandeService || !serviceId) {
      const participants = [{ userId: demandeurId }];

      if (propertyOwnerId && propertyOwnerId !== demandeurId) {
        participants.push({ userId: propertyOwnerId });
      }

      if (artisanId) {
        participants.push({ userId: artisanId });
      }

      conversation = await prisma.conversation.create({
        data: {
          titre: `Demande ${serviceLibelle}`,
          demandeId: nouvelleDemande.id,
          createurId: demandeurId,
          participants: {
            create: participants,
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

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: demandeurId,
          contenu: `Nouvelle demande ${propertyId ? "de visite" : "de service"} créée. ${description ? `Description : ${description}` : ""}`,
          type: "SYSTEM",
          evenementType: "DEMANDE_ENVOYEE",
        },
      });

      if (artisanId) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            expediteurId: demandeurId,
            contenu: `Cette demande vous est spécialement adressée. Merci de prendre contact avec le client dans les plus brefs délais.`,
            type: "SYSTEM",
            evenementType: "GENERIC",
          },
        });
      }
    }

    const response = {
      message: "Demande créée avec succès",
      demande: nouvelleDemande,
    };

    if ((isDemandeService || !serviceId) && conversation) {
      response.conversation = {
        id: conversation.id,
        titre: conversation.titre,
        participants: conversation.participants,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/demandes/immobilier/user/:userId - Récupérer les demandes avec filtrage par type
// ============================================
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // "asDemandeur" ou "asProprietaire" ou "all"
    
    // Vérifier les droits d'accès
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Unauthorized. Only the owner or admin can access this.",
      });
    }

    // Récupérer l'utilisateur pour obtenir son email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true 
      }
    });

    if (!user || !user.email) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    console.log(`🔍 Recherche des demandes pour l'utilisateur: ${user.email} (ID: ${user.id})`);
    console.log(`🔍 Type demandé: ${type || 'all'}`);

    // Trouver toutes les propriétés appartenant à cet utilisateur
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    const propertyIds = userProperties.map(p => p.id);
    console.log(`🏠 Propriétés trouvées: ${propertyIds.length}`);

    // Construire la clause WHERE en fonction du type demandé
    let whereClause = {};

    if (type === 'asDemandeur') {
      // UNIQUEMENT les demandes où l'utilisateur est demandeur
      whereClause = {
        contactEmail: {
          equals: user.email,
          mode: 'insensitive'
        },
        NOT: {
          propertyId: null // S'assurer que ce sont des demandes immobilières
        }
      };
      console.log("📋 Mode: Demandeur uniquement");
    } 
    else if (type === 'asProprietaire') {
      // UNIQUEMENT les demandes pour ses propriétés
      if (propertyIds.length > 0) {
        whereClause = {
          propertyId: {
            in: propertyIds
          }
        };
        console.log("📋 Mode: Propriétaire uniquement");
      } else {
        console.log("📋 Mode: Propriétaire mais pas de propriétés");
        return res.json([]);
      }
    } 
    else {
      // Mode 'all' : les deux types
      let orConditions = [
        {
          contactEmail: {
            equals: user.email,
            mode: 'insensitive'
          }
        }
      ];

      if (propertyIds.length > 0) {
        orConditions.push({
          propertyId: {
            in: propertyIds
          }
        });
      }

      whereClause = {
        OR: orConditions
      };
      console.log("📋 Mode: Toutes les demandes");
    }

    // Récupérer les demandes
    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            owner: {
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
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ ${demandes.length} demandes trouvées`);

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut || "en attente",
      description: demande.description,
      date: demande.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt,
      relation: {
        isDemandeur: demande.contactEmail?.toLowerCase() === user.email.toLowerCase(),
        isProprietaire: demande.property?.ownerId === userId
      }
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/demandes/immobilier/as-demandeur/:userId - Route dédiée pour les demandes du client
// ============================================
router.get("/as-demandeur/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier les droits d'accès
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Unauthorized. Only the owner or admin can access this.",
      });
    }

    // Récupérer l'utilisateur pour obtenir son email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true 
      }
    });

    if (!user || !user.email) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    console.log(`🔍 [DEMANDEUR] Recherche des demandes pour: ${user.email}`);

    // UNIQUEMENT les demandes où l'utilisateur est demandeur
    const demandes = await prisma.demande.findMany({
      where: {
        contactEmail: {
          equals: user.email,
          mode: 'insensitive'
        },
        NOT: {
          propertyId: null // S'assurer que ce sont des demandes immobilières
        }
      },
      include: {
        property: {
          include: {
            owner: {
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
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ [DEMANDEUR] ${demandes.length} demandes trouvées`);

    // Transformer les données pour le frontend
    const transformedDemandes = demandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut || "en attente",
      description: demande.description,
      date: demande.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt,
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/demandes/immobilier/owner/:userId - Récupérer les demandes pour les propriétés d'un utilisateur
// ============================================
router.get("/owner/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Vérifier les droits d'accès
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Unauthorized. Only the owner or admin can access this.",
      });
    }

    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
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

    const propertyIds = userProperties.map((p) => p.id);
    const propertiesMap = new Map(userProperties.map((p) => [p.id, p]));

    let whereClause = {
      propertyId: {
        in: propertyIds,
      },
    };

    if (status) {
      whereClause.statut = status;
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        property: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enrichedDemandes = demandes.map((demande) => {
      const property = propertiesMap.get(demande.propertyId);
      return {
        ...demande,
        property: property
          ? {
              ...demande.property,
              owner: property.owner,
            }
          : demande.property,
      };
    });

    const transformedDemandes = enrichedDemandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut || "en attente",
      description: demande.description,
      date: demande.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      propertyId: demande.propertyId,
      property: demande.property,
      createdBy: demande.createdBy,
      contactNom: demande.contactNom,
      contactPrenom: demande.contactPrenom,
      contactEmail: demande.contactEmail,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      heureSouhaitee: demande.heureSouhaitee,
      createdAt: demande.createdAt,
    }));

    res.json(transformedDemandes);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/demandes/immobilier/:id/statut - Mettre à jour le statut d'une demande
// ============================================
router.patch("/:id/statut", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!statut) {
      return res.status(400).json({ error: "Le champ statut est requis." });
    }

    // Récupérer la demande avec les informations du client et du bien
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande introuvable" });
    }

    // Si on annule la demande
    const lower = String(statut || "").toLowerCase();
    if (
      lower === "annulée" ||
      lower === "annulee" ||
      lower === "annulé" ||
      lower === "annule"
    ) {
      try {
        await prisma.demandeHistory.create({
          data: {
            demandeId: demande.id,
            title: "Demande annulée",
            message: "La demande a été annulée et archivée.",
            snapshot: demande,
          },
        });
      } catch (e) {
        console.error("Impossible de créer historique", e);
      }

      await prisma.demande.delete({ where: { id: demande.id } });
      return res.json({ message: "Demande annulée et archivée" });
    }

    // Met à jour le champ "statut" de la demande
    const updated = await prisma.demande.update({
      where: { id: parseInt(id, 10) },
      data: { statut },
    });

    // === ENVOI DE NOTIFICATION ET EMAIL ===

    const statusLabels = {
      "en attente": "En attente",
      validée: "Validée",
      validee: "Validée",
      valide: "Validée",
      refusée: "Refusée",
      refusee: "Refusée",
      refus: "Refusée",
      archivée: "Archivée",
      archivee: "Archivée",
      archive: "Archivée",
      terminée: "Terminée",
      terminee: "Terminée",
    };

    const statusLabel = statusLabels[lower] || statut;
    const propertyTitle = demande.property?.title || "Bien immobilier";
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const clientId = demande.createdBy?.id;
    const clientEmail = demande.contactEmail || demande.createdBy?.email;
    const clientName =
      `${demande.contactPrenom || demande.createdBy?.firstName || ""} ${demande.contactNom || demande.createdBy?.lastName || ""}`.trim() ||
      "Client";

    console.log(`✅ Client trouvé: ${clientEmail} (ID: ${clientId})`);

    // 1. Créer une notification POUR LE CLIENT
    if (clientId) {
      const notificationTitle = `Demande ${statusLabel.toLowerCase()}`;
      const notificationMessage = `Votre demande de visite pour "${propertyTitle}" a été ${statusLabel.toLowerCase()}.`;

      try {
        const fetch = require("node-fetch");

        await fetch(`${baseUrl}/api/notifications/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
          body: JSON.stringify({
            userId: clientId,
            title: notificationTitle,
            message: notificationMessage,
            type: "demande_immobilier",
            propertyId: demande.propertyId,
          }),
        });

        console.log(
          `✅ Notification créée pour le client ${clientEmail} (ID: ${clientId})`,
        );
      } catch (notifError) {
        console.error(
          "❌ Erreur lors de la création de la notification:",
          notifError,
        );
      }
    }

    // 2. Envoyer un email au client
    try {
      const { sendEmail } = require("../services/emailService");

      if (!clientEmail) {
        console.error(
          "❌ Aucun email client trouvé pour la demande",
          demande.id,
        );
      } else {
        const emailSubject = `Mise à jour de votre demande - ${statusLabel}`;

        let emailMessage = "";
        let statusColor = "";

        switch (lower) {
          case "validée":
          case "validee":
          case "valide":
            statusColor = "#10b981";
            emailMessage = `
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="color: #166534; margin: 0;">Bonne nouvelle ! Votre demande a été acceptée.</p>
                <p style="color: #166534; margin-top: 10px;">Le propriétaire vous contactera prochainement pour organiser la visite.</p>
              </div>
            `;
            break;
          case "refusée":
          case "refusee":
          case "refus":
            statusColor = "#ef4444";
            emailMessage = `
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                <p style="color: #991b1b; margin: 0;">Nous sommes désolés, votre demande n'a pas pu être acceptée.</p>
                <p style="color: #991b1b; margin-top: 10px;">N'hésitez pas à consulter d'autres biens disponibles.</p>
              </div>
            `;
            break;
          case "archivée":
          case "archivee":
          case "archive":
            statusColor = "#6b7280";
            emailMessage = `
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280;">
                <p style="color: #374151; margin: 0;">Votre demande a été archivée.</p>
              </div>
            `;
            break;
          case "terminée":
          case "terminee":
            statusColor = "#3b82f6";
            emailMessage = `
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="color: #1e40af; margin: 0;">La visite est maintenant terminée.</p>
                <p style="color: #1e40af; margin-top: 10px;">Merci d'avoir utilisé notre service !</p>
              </div>
            `;
            break;
          default:
            statusColor = "#f59e0b";
            emailMessage = `
              <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0;">Le statut de votre demande a été mis à jour.</p>
              </div>
            `;
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mise à jour de votre demande</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; border: 1px solid #e9ecef;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #556B2F; margin: 0;">Bonjour ${clientName},</h1>
                <p style="color: #6c757d; margin-top: 10px;">Votre demande de visite immobilière</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 10px 20px; border-radius: 50px; font-weight: bold; display: inline-block;">
                  ${statusLabel}
                </span>
              </div>
              
              <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef;">
                <h3 style="color: #556B2F; margin-top: 0; margin-bottom: 15px;">Bien concerné</h3>
                <p style="margin: 5px 0;"><strong>Titre :</strong> ${propertyTitle}</p>
                ${demande.property?.address ? `<p style="margin: 5px 0;"><strong>Adresse :</strong> ${demande.property.address}${demande.property.city ? `, ${demande.property.city}` : ""}</p>` : ""}
              </div>
              
              ${emailMessage}
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #556B2F; margin-top: 0; margin-bottom: 15px;">Détails de votre demande</h3>
                <p style="margin: 5px 0;"><strong>Date de la demande :</strong> ${new Date(demande.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                ${demande.dateSouhaitee ? `<p style="margin: 5px 0;"><strong>Date souhaitée :</strong> ${new Date(demande.dateSouhaitee).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
                ${demande.heureSouhaitee ? `<p style="margin: 5px 0;"><strong>Heure souhaitée :</strong> ${demande.heureSouhaitee}</p>` : ""}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/mes-demandes" style="background-color: #6B8E23; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Voir mes demandes
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d; font-size: 0.9em;">
                <p>Cet email a été envoyé automatiquement à <strong>${clientEmail}</strong>, merci de ne pas y répondre.</p>
                <p>© ${new Date().getFullYear()} Votre Société. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: clientEmail,
          subject: emailSubject,
          html: htmlContent,
          text: `Le statut de votre demande pour "${propertyTitle}" a été mis à jour : ${statusLabel}`,
        });

        console.log(`✅ Email envoyé à ${clientEmail}`);
      }
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
    }

    res.json({
      message: "Statut mis à jour",
      demande: updated,
      notification: clientId
        ? "Notification et email envoyés au client"
        : "Email envoyé au client (notification non créée - ID client non trouvé)",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/demandes/immobilier/property/:propertyId - Récupérer les demandes pour une propriété
// ============================================
router.get("/property/:propertyId", authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    console.log(
      `🔍 [BACKEND] Recherche demandes pour propriété: ${propertyId}`,
    );

    const demandes = await prisma.demande.findMany({
      where: {
        propertyId: propertyId,
        statut: { in: ["validée", "en attente"] },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            rentType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ [BACKEND] ${demandes.length} demandes trouvées`);

    const formattedDemandes = demandes.map((demande) => ({
      id: demande.id,
      statut: demande.statut,
      clientId: demande.createdById,
      contactEmail: demande.contactEmail,
      contactPrenom: demande.contactPrenom,
      contactNom: demande.contactNom,
      contactTel: demande.contactTel,
      dateSouhaitee: demande.dateSouhaitee,
      createdAt: demande.createdAt,
      property: demande.property,
    }));

    res.json(formattedDemandes);
  } catch (error) {
    console.error("❌ [BACKEND] Erreur récupération demandes:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE /api/demandes/immobilier/:id - Supprimer ou archiver une demande
// ============================================
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        property: true,
        createdBy: true,
      },
    });

    if (!demande) {
      return res.status(404).json({ error: "Demande introuvable" });
    }

    const isRequestCreator = demande.createdById === req.user.id;
    const isPropertyOwner = demande.property?.ownerId === req.user.id;

    if (isRequestCreator) {
      await prisma.demande.delete({
        where: { id: parseInt(id, 10) },
      });
      res.json({ message: "Demande supprimée définitivement" });
    } else if (isPropertyOwner) {
      await prisma.demandeHistory.create({
        data: {
          demandeId: demande.id,
          title: "Demande archivée",
          message: `Demande archivée pour le bien: ${demande.property?.title || "Non spécifié"}`,
          snapshot: demande,
        },
      });

      await prisma.demande.update({
        where: { id: parseInt(id, 10) },
        data: {
          statut: "archivée",
          archived: true,
          isRead: true,
        },
      });
      res.json({ message: "Demande archivée avec succès" });
    } else {
      res.status(403).json({ error: "Non autorisé à supprimer cette demande" });
    }
  } catch (error) {
    console.error(
      "Erreur lors de la suppression/archivage de la demande:",
      error,
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/demandes/immobilier/:id/history - Obtenir l'historique d'une demande
// ============================================
router.get("/:id/history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.demandeHistory.findMany({
      where: { demandeId: parseInt(id, 10) },
      orderBy: { createdAt: "desc" },
    });
    res.json(history);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;