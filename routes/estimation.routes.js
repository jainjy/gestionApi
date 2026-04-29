// routes/estimation.routes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const EstimationModel = require("../models/estimation.models");

// ============================================
// POST /api/estimations - Créer une nouvelle estimation immobilière
// ============================================
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      propertyType, surface, rooms, address, commune,
      postalCode, firstName, lastName, phone, email,
      description, selectedAgencies,
    } = req.body;

    if (!propertyType || !surface || !commune) {
      return res.status(400).json({
        error: "Les champs propertyType, surface et commune sont requis",
      });
    }

    if (!selectedAgencies || selectedAgencies.length === 0) {
      return res.status(400).json({
        error: "Au moins une agence doit être sélectionnée",
      });
    }

    const expediteurId = req.user.id;
    const propertyDetails = {
      propertyType, surface, rooms, address,
      commune, postalCode, description,
    };

    // Créer UNE demande + UNE conversation par professionnel
    const createdItems = await EstimationModel.createEstimation({
      expediteurId,
      destinatairesIds: selectedAgencies,
      propertyType, surface, rooms, address, commune,
      postalCode, firstName, lastName, phone, email, description,
    });

    // Pour chaque demande créée, on crée sa conversation dédiée
    const conversations = [];
    for (const { demande, lien } of createdItems) {
      const { conversation, message } =
        await EstimationModel.createConversationWithMessage(
          demande.id,
          expediteurId,
          lien.userId, // Le professionnel de cette demande
          propertyDetails
        );
      conversations.push({ demandeId: demande.id, conversationId: conversation.id });
    }

    res.status(201).json({
      success: true,
      message: `${createdItems.length} demande(s) d'estimation créée(s) avec succès`,
      estimations: createdItems.map(({ demande, lien }) => ({
        id: demande.id,
        createdAt: demande.createdAt,
        statut: demande.statut,
        destinataire: {
          id: lien.user.id,
          nom: lien.user.companyName ||
            `${lien.user.firstName} ${lien.user.lastName}`,
        },
      })),
      conversations,
    });
  } catch (error) {
    console.error("❌ Erreur création estimation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/estimations/mes-estimations - Récupérer toutes les estimations de l'utilisateur connecté
// ============================================
router.get("/mes-estimations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const estimations = await EstimationModel.getAllUserEstimations(userId);

    res.json({
      success: true,
      ...estimations,
    });
  } catch (error) {
    console.error("❌ Erreur récupération estimations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/estimations/expediteur - Estimations que j'ai envoyées
// ============================================
router.get("/expediteur", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const estimations = await EstimationModel.getEstimationsAsExpediteur(userId);

    res.json({
      success: true,
      total: estimations.length,
      estimations,
    });
  } catch (error) {
    console.error("❌ Erreur récupération estimations envoyées:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/estimations/destinataire - Estimations que j'ai reçues (pour les agences)
// ============================================
router.get("/destinataire", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const estimations = await EstimationModel.getEstimationsAsDestinataire(userId);

    res.json({
      success: true,
      total: estimations.length,
      estimations,
    });
  } catch (error) {
    console.error("❌ Erreur récupération estimations reçues:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/estimations/professionnels - Récupérer tous les professionnels
// ============================================
router.get("/professionnels", authenticateToken, async (req, res) => {
  try {
    const { commune } = req.query;
    
    const professionnels = await EstimationModel.getProfessionnels(commune || null);

    res.json({
      success: true,
      total: professionnels.length,
      professionnels,
    });
  } catch (error) {
    console.error("❌ Erreur récupération professionnels:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// GET /api/estimations/:id - Récupérer une estimation spécifique
// ============================================
router.get("/:id", authenticateToken, async (req, res) => {
  const demandeId = parseInt(req.params.id, 10);
  
  if (isNaN(demandeId)) {
    return res.status(400).json({ error: "ID invalide" });
  }
  try {
    const { id } = req.params;
    const demandeId = parseInt(id, 10);
    
    const estimation = await EstimationModel.getEstimationById(demandeId);

    if (!estimation) {
      return res.status(404).json({ error: "Estimation non trouvée" });
    }

    // Vérifier que l'utilisateur a accès (expéditeur ou destinataire)
    const isExpediteur = estimation.createdById === req.user.id;
    const isDestinataire = estimation.artisans.some(a => a.userId === req.user.id);

    if (!isExpediteur && !isDestinataire && req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json({
      success: true,
      estimation,
    });
  } catch (error) {
    console.error("❌ Erreur récupération estimation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PATCH /api/estimations/:demandeArtisanId/repondre - Répondre à une estimation (accepter/refuser)
// ============================================
router.patch("/:demandeArtisanId/repondre", authenticateToken, async (req, res) => {
  try {
    const { demandeArtisanId } = req.params;
    const { accepte } = req.body; // true ou false

    if (accepte === undefined) {
      return res.status(400).json({ error: "Le champ 'accepte' est requis (true/false)" });
    }

    const updated = await EstimationModel.updateEstimationStatus(
      parseInt(demandeArtisanId, 10),
      accepte
    );

    res.json({
      success: true,
      message: accepte ? "Estimation acceptée" : "Estimation refusée",
      estimation: {
        id: updated.demande.id,
        statut: updated.demande.statut,
        accepte: updated.accepte,
      },
    });
  } catch (error) {
    console.error("❌ Erreur réponse estimation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// DELETE /api/estimations/:id - Supprimer une estimation (soft delete)
// ============================================
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const demandeId = parseInt(id, 10);

    const estimation = await prisma.demande.findUnique({
      where: { id: demandeId },
      select: { createdById: true, aiClass: true },
    });

    if (!estimation || estimation.aiClass !== "estimation_immobiliere") {
      return res.status(404).json({ error: "Estimation non trouvée" });
    }

    if (estimation.createdById !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Non autorisé à supprimer cette estimation" });
    }

    // Soft delete : changer le statut
    await prisma.demande.update({
      where: { id: demandeId },
      data: { statut: "annulée" },
    });

    res.json({ success: true, message: "Estimation annulée avec succès" });
  } catch (error) {
    console.error("❌ Erreur suppression estimation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



module.exports = router;