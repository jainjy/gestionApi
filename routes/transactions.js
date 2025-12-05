const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET /api/transactions/history - Récupérer l'historique des paiements
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    // Construire le filtre
    const where = { userId };
    if (status) {
      where.status = status;
    }

    // Récupérer les transactions avec pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Compter le total pour la pagination
    const total = await prisma.transaction.count({
      where,
    });

    // ✅ CORRECTION: Retourner directement le tableau
    res.json(transactions);
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'historique",
    });
  }
});

// GET /api/transactions/:id - Récupérer une transaction spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction non trouvée",
      });
    }

    // Vérifier que la transaction appartient à l'utilisateur
    if (transaction.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Erreur récupération transaction:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la transaction",
    });
  }
});

// GET /api/transactions/stats/summary - Récupérer un résumé des statistiques
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total des paiements complétés
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "completed",
      },
    });

    const totalPaid = completedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Nombre de paiements
    const paymentCount = completedTransactions.length;

    // Dernier paiement
    const lastTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Paiements en attente
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "pending",
      },
    });

    const totalPending = pendingTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Paiements échoués
    const failedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "failed",
      },
    });

    res.json({
      success: true,
      data: {
        totalPaid,
        paymentCount,
        lastPaymentDate: lastTransaction ? lastTransaction.createdAt : null,
        lastPaymentAmount: lastTransaction ? lastTransaction.amount : null,
        pendingAmount: totalPending,
        pendingCount: pendingTransactions.length,
        failedCount: failedTransactions.length,
      },
    });
  } catch (error) {
    console.error("Erreur récupération statistiques:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
});

// GET /api/transactions/by-status/:status - Récupérer les transactions par statut
router.get("/by-status/:status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Valider le statut
    const validStatuses = ["completed", "pending", "failed", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Statut invalide",
        validStatuses,
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.transaction.count({
      where: {
        userId,
        status,
      },
    });

    res.json({
      success: true,
      status,
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Erreur récupération transactions par statut:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des transactions",
    });
  }
});

// GET /api/transactions/month/:year/:month - Récupérer les transactions d'un mois
router.get("/month/:year/:month", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      month: `${year}-${month}`,
      data: transactions,
      summary: {
        count: transactions.length,
        total,
        average: transactions.length > 0 ? total / transactions.length : 0,
      },
    });
  } catch (error) {
    console.error("Erreur récupération transactions du mois:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des transactions",
    });
  }
});

// POST /api/transactions/export - Exporter l'historique en CSV
router.post("/export", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = "csv" } = req.body;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Créer le CSV
      const headers = [
        "Date",
        "Description",
        "Montant",
        "Devise",
        "Statut",
        "Plan",
        "Référence",
      ];
      const rows = transactions.map((t) => [
        new Date(t.createdAt).toLocaleDateString("fr-FR"),
        t.description || "",
        t.amount,
        t.currency,
        t.status,
        t.subscription?.plan?.name || "N/A",
        t.providerId || "N/A",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="historique_paiements.csv"'
      );
      res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="historique_paiements.json"'
      );
      res.json({ success: true, data: transactions });
    } else {
      res.status(400).json({
        success: false,
        error: "Format invalide. Utilisez 'csv' ou 'json'",
      });
    }
  } catch (error) {
    console.error("Erreur export historique:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'export de l'historique",
    });
  }
});

module.exports = router;
