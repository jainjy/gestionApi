const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const stripe = require("../utils/stripe");
const { prisma } = require("../lib/db");
const { emitNewMessage } = require("../utils/message");


// POST /api/demande-actions/:demandeId/proposer-rdv - Proposer un rendez-vous
router.post("/:demandeId/proposer-rdv", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { date, notes } = req.body;
    console.log("la date :",date)
    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sur cette demande",
      });
    }

    // Mettre à jour le rendez-vous
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        rdv: new Date(`${date}`),
        rdvNotes: notes,
      },
    });

    // Créer un message système dans la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message=await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Rendez-vous proposé pour le ${new Date(date).toLocaleDateString('fr-FR')}`,
          type: "SYSTEM",
          evenementType: "PROPOSITION_RENDEZ_VOUS",
        },
      });
      emitNewMessage(req, message);
    }
    

    res.json({
      success: true,
      message: "Rendez-vous proposé avec succès",
      rdv: updatedDemandeArtisan.rdv,
    });
  } catch (error) {
    console.error("Erreur proposition rendez-vous:", error);
    res.status(500).json({
      error: "Erreur lors de la proposition du rendez-vous",
    });
  }
});

// POST /api/demande-actions/:demandeId/envoyer-devis - Envoyer un devis
router.post("/:demandeId/envoyer-devis", authenticateToken, upload.single("devisFile"), async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { montant, description } = req.body;

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sur cette demande",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Fichier de devis requis",
      });
    }

    // Upload vers Supabase
    const { uploadToSupabase } = require("../middleware/upload");
    const fileInfo = await uploadToSupabase(req.file, "devis");

    // Mettre à jour le devis
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        devis: description || `Devis de ${montant}€`,
        devisFileUrl: fileInfo.url,
        devisFileName: fileInfo.name,
        devisFileType: fileInfo.type,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Devis envoyé - Montant: ${montant}€`,
          type: "SYSTEM",
          evenementType: "PROPOSITION_DEVIS",
          urlFichier: fileInfo.url,
          nomFichier: fileInfo.name,
          typeFichier: fileInfo.type,
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Devis envoyé avec succès",
      devis: {
        montant: parseFloat(montant),
        description: description,
        fileUrl: fileInfo.url,
        fileName: fileInfo.name,
      },
    });
  } catch (error) {
    console.error("Erreur envoi devis:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi du devis",
    });
  }
});

// POST /api/demande-actions/:demandeId/envoyer-facture - Envoyer une facture
router.post("/:demandeId/envoyer-facture", authenticateToken, upload.single("factureFile"), async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { montant } = req.body;

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sur cette demande",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Fichier de facture requis",
      });
    }

    // Upload vers Supabase
    const { uploadToSupabase } = require("../middleware/upload");
    const fileInfo = await uploadToSupabase(req.file, "factures");

    // Mettre à jour la facture
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        factureMontant: parseFloat(montant),
        factureFileUrl: fileInfo.url,
        factureFileName: fileInfo.name,
        factureFileType: fileInfo.type,
        factureStatus: "en_attente",
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Facture envoyée - Montant: ${montant}€`,
          type: "SYSTEM",
          evenementType: "FACTURE_ENVOYEE",
          urlFichier: fileInfo.url,
          nomFichier: fileInfo.name,
          typeFichier: fileInfo.type,
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Facture envoyée avec succès",
      facture: {
        montant: parseFloat(montant),
        fileUrl: fileInfo.url,
        fileName: fileInfo.name,
        status: "en_attente",
      },
    });
  } catch (error) {
    console.error("Erreur envoi facture:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi de la facture",
    });
  }
});

// PUT /api/demande-actions/:demandeId/valider-facture - Valider une facture (Admin)
router.put("/:demandeId/valider-facture", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { artisanId, statut } = req.body; // statut: "validee" ou "refusee"

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Accès réservé aux administrateurs",
      });
    }

    // Mettre à jour le statut de la facture
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: artisanId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        factureStatus: statut,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const statutMessage = statut === "validee" ? "validée" : "refusée";
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Facture ${statutMessage} par l'administrateur`,
          type: "SYSTEM",
          evenementType: "FACTURE_ENVOYEE",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: `Facture ${statut === "validee" ? "validée" : "refusée"} avec succès`,
    });
  } catch (error) {
    console.error("Erreur validation facture:", error);
    res.status(500).json({
      error: "Erreur lors de la validation de la facture",
    });
  }
});

// GET /api/demande-actions/:demandeId/details-artisan - Détails de l'artisan sur la demande
router.get("/:demandeId/details-artisan", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;

    const demandeArtisan = await prisma.demandeArtisan.findUnique({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
          },
        },
      },
    });

    if (!demandeArtisan) {
      return res.status(404).json({
        error: "Artisan non trouvé sur cette demande",
      });
    }

    res.json(demandeArtisan);
  } catch (error) {
    console.error("Erreur chargement détails artisan:", error);
    res.status(500).json({
      error: "Erreur lors du chargement des détails",
    });
  }
});

// PUT /api/demande-actions/:demandeId/modifier-rdv - Modifier le rendez-vous
router.put("/:demandeId/modifier-rdv", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { date, notes } = req.body;

    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        rdv: new Date(`${date}`),
        rdvNotes: notes,
      },
    });

    // Message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
     const message = await prisma.message.create({
       data: {
         conversationId: conversation.id,
         expediteurId: userId,
         contenu: `Rendez-vous modifié pour le ${new Date(date).toLocaleDateString("fr-FR")}`,
         type: "SYSTEM",
         evenementType: "PROPOSITION_RENDEZ_VOUS",
       },
     });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Rendez-vous modifié avec succès",
      rdv: updatedDemandeArtisan.rdv,
    });
  } catch (error) {
    console.error("Erreur modification rendez-vous:", error);
    res.status(500).json({
      error: "Erreur lors de la modification du rendez-vous",
    });
  }
});

// PUT /api/demande-actions/:demandeId/modifier-devis - Modifier le devis
router.put("/:demandeId/modifier-devis", authenticateToken, upload.single("devisFile"), async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { montant, description } = req.body;

    const updateData = {
      devis: description || `Devis de ${montant}€`,
    };

    // Si nouveau fichier, uploader
    if (req.file) {
      const { uploadToSupabase } = require("../middleware/upload");
      const fileInfo = await uploadToSupabase(req.file, "devis");
      updateData.devisFileUrl = fileInfo.url;
      updateData.devisFileName = fileInfo.name;
      updateData.devisFileType = fileInfo.type;
    }

    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: updateData,
    });

    // Message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
     const message = await prisma.message.create({
       data: {
         conversationId: conversation.id,
         expediteurId: userId,
         contenu: `Devis modifié - Nouveau montant: ${montant}€`,
         type: "SYSTEM",
         evenementType: "PROPOSITION_DEVIS",
       },
     });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Devis modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur modification devis:", error);
    res.status(500).json({
      error: "Erreur lors de la modification du devis",
    });
  }
});

// POST /api/demande-actions/:demandeId/signer-devis - Signer un devis (client)
router.post("/:demandeId/signer-devis", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { artisanId } = req.body;

    // Vérifier que l'utilisateur est bien le client de cette demande
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        artisans: true
      }
    });

    if (!demande) {
      return res.status(404).json({
        error: "Demande non trouvée",
      });
    }

    if (demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à signer ce devis",
      });
    }

    // Vérifier que l'artisan existe sur cette demande
    const artisanDemande = demande.artisans.find(a => a.userId === artisanId);
    if (!artisanDemande) {
      return res.status(404).json({
        error: "Artisan non trouvé sur cette demande",
      });
    }

    // Mettre à jour le statut recruited de l'artisan
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: artisanId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        recruited: true,
      },
    });

    // Mettre à jour le statut de la demande
    const updatedDemande = await prisma.demande.update({
      where: {
        id: parseInt(demandeId),
      },
      data: {
        statut: "assignée",
        demandeAcceptee: true,
        artisanId: artisanId,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
     const message = await prisma.message.create({
       data: {
         conversationId: conversation.id,
         expediteurId: userId,
         contenu:
           "Devis signé - L'artisan a été sélectionné pour réaliser les travaux",
         type: "SYSTEM",
         evenementType: "CLIENT_SIGNE",
       },
     });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Devis signé avec succès",
      demande: updatedDemande,
      artisan: updatedDemandeArtisan,
    });
  } catch (error) {
    console.error("Erreur signature devis:", error);
    res.status(500).json({
      error: "Erreur lors de la signature du devis",
    });
  }
});

// POST /api/demande-actions/:demandeId/payer-facture - Payer une facture (client)
router.post("/:demandeId/payer-facture", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { artisanId } = req.body;
    // Récupérer les détails de la facture
    const demandeArtisan = await prisma.demandeArtisan.findUnique({
      where: {
        userId_demandeId: {
          userId: artisanId,
          demandeId: parseInt(demandeId),
        },
      },
    });

    if (!demandeArtisan || !demandeArtisan.factureMontant) {
      return res.status(404).json({
        error: "Facture non trouvée",
      });
    }

    // Simulation de création d'intent de paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(demandeArtisan.factureMontant * 100), // Convertir en centimes
      currency: 'eur',
      metadata: {
        demandeId: demandeId,
        artisanId: artisanId,
        clientId: userId,
      },
    });

    // Simuler un paiement réussi (dans la réalité, vous attendriez le webhook de confirmation)
    // Pour la démo, on marque directement comme payé
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: artisanId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        factureStatus: "validee",
      },
    });

    // Message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Facture payée - Montant: ${demandeArtisan.factureMontant}€`,
          type: "SYSTEM",
          evenementType: "FACTURE_PAYEE",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Paiement effectué avec succès",
      paymentIntent: paymentIntent.client_secret,
      facture: {
        montant: demandeArtisan.factureMontant,
        status: "validee",
      },
    });
  } catch (error) {
    console.error("Erreur paiement facture:", error);
    res.status(500).json({
      error: "Erreur lors du paiement de la facture",
    });
  }
});
// POST /api/demande-actions/:demandeId/confirmer-paiement - Confirmer le paiement (Pro)
router.post("/:demandeId/confirmer-paiement", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { confirmer } = req.body; // true ou false

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sur cette demande",
      });
    }

    // Vérifier que la facture est payée
    if (demandeArtisan.factureStatus !== "validee") {
      return res.status(400).json({
        error: "La facture n'est pas encore payée",
      });
    }

    // Mettre à jour la confirmation du paiement
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        factureConfirmee: confirmer,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = confirmer 
        ? "Paiement confirmé par l'artisan" 
        : "Paiement refusé par l'artisan - Merci de contacter le support";
      
      const messages = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: message,
          type: "SYSTEM",
          evenementType: confirmer ? "FACTURE_CONFIRMEE" : "FACTURE_REFUSEE",
        },
      });
      emitNewMessage(req, messages);
    }

    res.json({
      success: true,
      message: confirmer ? "Paiement confirmé avec succès" : "Paiement refusé",
      factureConfirmee: confirmer,
    });
  } catch (error) {
    console.error("Erreur confirmation paiement:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation du paiement",
    });
  }
});

// POST /api/demande-actions/:demandeId/terminer-travaux - Marquer les travaux comme terminés (Pro)
router.post("/:demandeId/terminer-travaux", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sur cette demande",
      });
    }
    console.log(demandeArtisan)

    // Vérifier que la facture est confirmée
    if (!demandeArtisan.factureConfirmee) {
      return res.status(400).json({
        error: "Le paiement doit être confirmé avant de marquer les travaux comme terminés",
      });
    }

    // Marquer les travaux comme terminés
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        travauxTermines: true,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
     const message = await prisma.message.create({
       data: {
         conversationId: conversation.id,
         expediteurId: userId,
         contenu: "Travaux marqués comme terminés par l'artisan",
         type: "SYSTEM",
         evenementType: "TRAVAUX_TERMINES",
       },
     });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Travaux marqués comme terminés avec succès",
      travauxTermines: true,
    });
  } catch (error) {
    console.error("Erreur fin des travaux:", error);
    res.status(500).json({
      error: "Erreur lors du marquage des travaux comme terminés",
    });
  }
});

// POST /api/demande-actions/:demandeId/confirmer-travaux-termines - Confirmer la fin des travaux (Client)
router.post("/:demandeId/confirmer-travaux-termines", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { confirmer } = req.body;

    // Vérifier que l'utilisateur est le client de cette demande
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
    });

    if (!demande || demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à confirmer les travaux",
      });
    }

    // Mettre à jour le statut de la demande
    const updatedDemande = await prisma.demande.update({
      where: {
        id: parseInt(demandeId),
      },
      data: {
        statut: confirmer ? "terminée" : "en_cours",
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = confirmer 
        ? "Travaux confirmés comme terminés par le client" 
        : "Travaux non confirmés - Merci de contacter l'artisan";
      
      const messages = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: message,
          type: "SYSTEM",
          evenementType: confirmer
            ? "TRAVAUX_CONFIRMES"
            : "TRAVAUX_NON_CONFIRMES",
        },
      });
      emitNewMessage(req, messages);
    }

    res.json({
      success: true,
      message: confirmer ? "Travaux confirmés comme terminés" : "Confirmation refusée",
      statut: updatedDemande.statut,
    });
  } catch (error) {
    console.error("Erreur confirmation travaux:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation des travaux",
    });
  }
});
// POST /api/demande-actions/:demandeId/confirmer-paiement-client
router.post("/:demandeId/confirmer-paiement-client", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { montant, modePaiement } = req.body; // "espèces", "virement", "lydia", etc.

    // Vérifier que l'utilisateur est le client de cette demande
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        artisans: {
          where: { recruited: true }
        }
      }
    });

    if (!demande || demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à confirmer ce paiement",
      });
    }

    // Vérifier qu'un artisan est sélectionné
    const artisanRecrute = demande.artisans[0];
    if (!artisanRecrute) {
      return res.status(400).json({
        error: "Aucun artisan sélectionné pour cette demande",
      });
    }

    // Mettre à jour la confirmation du paiement client
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: artisanRecrute.userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        clientConfirmePaiement: true,
        paiementMontant: parseFloat(montant),
        paiementMode: modePaiement,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Paiement confirmé par le client - ${montant}€ (${modePaiement})`,
          type: "SYSTEM",
          evenementType: "PAIEMENT_CONFIRME_CLIENT",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Paiement confirmé avec succès",
      paiement: {
        montant: parseFloat(montant),
        mode: modePaiement,
        confirmeParClient: true,
      },
    });
  } catch (error) {
    console.error("Erreur confirmation paiement client:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation du paiement",
    });
  }
});
// POST /api/demande-actions/:demandeId/confirmer-reception-paiement
router.post("/:demandeId/confirmer-reception-paiement", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { montantRecu } = req.body;

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
        recruited: true,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sélectionné sur cette demande",
      });
    }

    // Vérifier que le client a confirmé le paiement
    if (!demandeArtisan.clientConfirmePaiement) {
      return res.status(400).json({
        error: "Le client n'a pas encore confirmé le paiement",
      });
    }

    // Mettre à jour la confirmation de réception
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        artisanConfirmeReception: true,
        factureConfirmee:true,
        // Optionnel: enregistrer le montant effectivement reçu
        paiementMontant: montantRecu ? parseFloat(montantRecu) : demandeArtisan.paiementMontant,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: "Paiement reçu et confirmé par l'artisan",
          type: "SYSTEM",
          evenementType: "PAIEMENT_RECU_ARTISAN",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Réception du paiement confirmée avec succès",
      paiement: {
        confirmeParArtisan: true,
        montant: updatedDemandeArtisan.paiementMontant,
      },
    });
  } catch (error) {
    console.error("Erreur confirmation réception paiement:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation de la réception",
    });
  }
});
// POST /api/demande-actions/:demandeId/terminer-travaux
router.post("/:demandeId/terminer-travaux", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est artisan sur cette demande
    const demandeArtisan = await prisma.demandeArtisan.findFirst({
      where: {
        demandeId: parseInt(demandeId),
        userId: userId,
        recruited: true,
      },
    });

    if (!demandeArtisan) {
      return res.status(403).json({
        error: "Vous n'êtes pas artisan sélectionné sur cette demande",
      });
    }

    // Vérifier que le paiement a été confirmé par les deux parties
    if (!demandeArtisan.clientConfirmePaiement || !demandeArtisan.artisanConfirmeReception) {
      return res.status(400).json({
        error: "Le paiement doit être confirmé par les deux parties avant de terminer les travaux",
      });
    }

    // Marquer les travaux comme terminés
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        travauxTermines: true,
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: "Travaux marqués comme terminés par l'artisan",
          type: "SYSTEM",
          evenementType: "TRAVAUX_TERMINES",
        },
      });
      emitNewMessage(req, message);
    }

    res.json({
      success: true,
      message: "Travaux marqués comme terminés avec succès",
      travauxTermines: true,
    });
  } catch (error) {
    console.error("Erreur fin des travaux:", error);
    res.status(500).json({
      error: "Erreur lors du marquage des travaux comme terminés",
    });
  }
});// POST /api/demande-actions/:demandeId/confirmer-travaux-termines-client
router.post("/:demandeId/confirmer-travaux-termines-client", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { confirmer } = req.body; // true ou false

    // Vérifier que l'utilisateur est le client de cette demande
    const demande = await prisma.demande.findUnique({
      where: { id: parseInt(demandeId) },
      include: {
        artisans: {
          where: { recruited: true }
        }
      }
    });

    if (!demande || demande.createdById !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à confirmer les travaux",
      });
    }

    const artisanRecrute = demande.artisans[0];
    if (!artisanRecrute) {
      return res.status(400).json({
        error: "Aucun artisan sélectionné pour cette demande",
      });
    }

    // Vérifier que les travaux sont marqués comme terminés par l'artisan
    if (!artisanRecrute.travauxTermines) {
      return res.status(400).json({
        error: "L'artisan n'a pas encore marqué les travaux comme terminés",
      });
    }

    // Mettre à jour la confirmation client
    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: artisanRecrute.userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        clientConfirmeTravaux: confirmer,
      },
    });

    // Mettre à jour le statut global de la demande
    const updatedDemande = await prisma.demande.update({
      where: {
        id: parseInt(demandeId),
      },
      data: {
        statut: confirmer ? "terminée" : "en_cours",
      },
    });

    // Créer un message système
    const conversation = await prisma.conversation.findFirst({
      where: {
        demandeId: parseInt(demandeId),
      },
    });

    if (conversation) {
      const message = confirmer 
        ? "Travaux confirmés comme terminés par le client - Demande clôturée" 
        : "Travaux non confirmés - Veuillez contacter l'artisan pour plus d'informations";
      
      const messages = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: message,
          type: "SYSTEM",
          evenementType: confirmer
            ? "TRAVAUX_CONFIRMES_CLIENT"
            : "TRAVAUX_NON_CONFIRMES_CLIENT",
        },
      });
      emitNewMessage(req, messages);
    }

    res.json({
      success: true,
      message: confirmer ? "Travaux confirmés comme terminés" : "Confirmation refusée",
      statut: updatedDemande.statut,
      demandeTerminee: confirmer,
    });
  } catch (error) {
    console.error("Erreur confirmation travaux client:", error);
    res.status(500).json({
      error: "Erreur lors de la confirmation des travaux",
    });
  }
});
module.exports = router;