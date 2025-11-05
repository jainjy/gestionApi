const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const prisma = new PrismaClient();

// POST /api/demande-actions/:demandeId/proposer-rdv - Proposer un rendez-vous
router.post("/:demandeId/proposer-rdv", authenticateToken, async (req, res) => {
  try {
    const { demandeId } = req.params;
    const userId = req.user.id;
    const { date, heure, notes } = req.body;

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
        rdv: new Date(`${date}T${heure}`),
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
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Rendez-vous proposé pour le ${new Date(date).toLocaleDateString('fr-FR')} à ${heure}`,
          type: "SYSTEM",
          evenementType: "PROPOSITION_RENDEZ_VOUS",
        },
      });
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
      await prisma.message.create({
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
      await prisma.message.create({
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
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Facture ${statutMessage} par l'administrateur`,
          type: "SYSTEM",
          evenementType: "FACTURE_ENVOYEE",
        },
      });
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
    const { date, heure, notes } = req.body;

    const updatedDemandeArtisan = await prisma.demandeArtisan.update({
      where: {
        userId_demandeId: {
          userId: userId,
          demandeId: parseInt(demandeId),
        },
      },
      data: {
        rdv: new Date(`${date}T${heure}`),
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
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Rendez-vous modifié pour le ${new Date(date).toLocaleDateString('fr-FR')} à ${heure}`,
          type: "SYSTEM",
          evenementType: "PROPOSITION_RENDEZ_VOUS",
        },
      });
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
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          expediteurId: userId,
          contenu: `Devis modifié - Nouveau montant: ${montant}€`,
          type: "SYSTEM",
          evenementType: "PROPOSITION_DEVIS",
        },
      });
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

module.exports = router;