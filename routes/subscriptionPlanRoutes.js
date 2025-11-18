const { prisma } = require("../lib/db");
const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/auth");
const router = express.Router();

// GET /api/subscription-plans - Récupérer tous les plans actifs
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ popular: "desc" }, { price: "asc" }],
    });

    // Transformer les données pour le frontend
    const transformedPlans = plans.map((plan) => ({
      id: plan.planType,
      title: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      period: plan.interval === "month" ? "par mois" : "par an",
      color: plan.color,
      popular: plan.popular,
      features: plan.features,
      userTypes: plan.userTypes,
      truePlanId: plan.id,
    }));

    res.json({
      success: true,
      data: transformedPlans,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des plans:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des plans",
    });
  }
});

// GET /api/subscription-plans/:planType - Récupérer un plan spécifique
router.get("/:planType", async (req, res) => {
  try {
    const { planType } = req.params;

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        planType,
        isActive: true,
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan non trouvé",
      });
    }

    // Transformer les données pour le frontend
    const transformedPlan = {
      id: plan.planType,
      title: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      period: plan.interval === "month" ? "par mois" : "par an",
      color: plan.color,
      popular: plan.popular,
      features: plan.features,
      userTypes: plan.userTypes,
    };

    res.json({
      success: true,
      data: transformedPlan,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du plan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST /api/subscription-plans - Créer un nouveau plan (Admin)
router.post("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const {
      name,
      description,
      price,
      interval,
      features,
      planType,
      userTypes,
      popular,
      color,
    } = req.body;

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        interval,
        features,
        planType,
        userTypes,
        popular: popular || false,
        color,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Plan créé avec succès",
      data: newPlan,
    });
  } catch (error) {
    console.error("Erreur lors de la création du plan:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du plan",
    });
  }
});

// PUT /api/subscription-plans/:id - Mettre à jour un plan (Admin)
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Convertir le prix en float si présent
      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      const updatedPlan = await prisma.subscriptionPlan.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      res.json({
        success: true,
        message: "Plan mis à jour avec succès",
        data: updatedPlan,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du plan:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour du plan",
      });
    }
  }
);

module.exports = router;
