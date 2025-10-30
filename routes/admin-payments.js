// routes/admin-payments.js
const express = require("express");
const { prisma } = require("../lib/db");
const router = express.Router();

// GET /api/admin/payments/stats - Statistiques des paiements
router.get("/stats", async (req, res) => {
  try {
    // Calculer les statistiques pour les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Volume total des 30 derniers jours
    const totalVolumeResult = await prisma.transaction.aggregate({
      where: {
        status: "succeeded",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });

    // Nombre de transactions des 30 derniers jours
    const transactionsCount = await prisma.transaction.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Transactions réussies vs total
    const successfulTransactions = await prisma.transaction.count({
      where: {
        status: "succeeded",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Transactions en attente
    const pendingTransactions = await prisma.transaction.count({
      where: {
        status: "pending",
      },
    });

    // Calculer les variations (simulées pour l'exemple)
    const successRate =
      transactionsCount > 0
        ? ((successfulTransactions / transactionsCount) * 100).toFixed(1)
        : 0;

    const stats = {
      totalVolume: `€${(totalVolumeResult._sum.amount || 0).toFixed(2)}`,
      transactionsCount: transactionsCount.toString(),
      successRate: `${successRate}%`,
      pendingCount: pendingTransactions.toString(),

    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/payments/transactions - Liste des transactions
router.get("/transactions", async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    // Formater les transactions pour le frontend
    const formattedTransactions = transactions.map((txn) => {
      const user = txn.user || {};
      const metadata = txn.metadata || {};

      return {
        id: txn.id,
        date: txn.createdAt.toISOString(),
        customer:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : "Client inconnu",
        type: getTransactionType(txn.referenceType),
        amount: `€${txn.amount.toFixed(2)}`,
        method: txn.provider,
        status: mapTransactionStatus(txn.status),
        reference: txn.referenceId || txn.id,
        customerEmail: user.email || "N/A",
        customerPhone: user.phone || "N/A",
        billingAddress: metadata.billingAddress || "Non spécifiée",
        cardLast4: metadata.cardLast4 || "",
        cardBrand: metadata.cardBrand || "",
        serviceDetails:
          metadata.serviceDetails || txn.description || "Service non spécifié",
        duration: metadata.duration || "",
        taxAmount: `€${(metadata.taxAmount || 0).toFixed(2)}`,
        subtotal: `€${(metadata.subtotal || txn.amount).toFixed(2)}`,
        fees: `€${(metadata.fees || 0).toFixed(2)}`,
      };
    });

    res.json(formattedTransactions);
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/payments/refund/:id - Remboursement
router.post("/refund/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    if (transaction.status !== "succeeded") {
      return res
        .status(400)
        .json({
          error: "Seules les transactions réussies peuvent être remboursées",
        });
    }

    // Mettre à jour le statut de la transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: "refunded" },
    });

    // Ici, vous devriez appeler l'API de votre processeur de paiement (Stripe, etc.)
    // pour effectuer le remboursement réel

    res.json({
      success: true,
      message: "Remboursement effectué avec succès",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Erreur lors du remboursement:", error);
    res.status(500).json({ error: "Erreur lors du remboursement" });
  }
});

// GET /api/admin/payments/export - Export des transactions
router.get("/export", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const csvData = transactions.map((txn) => ({
      ID: txn.id,
      Date: txn.createdAt.toISOString(),
      Client: txn.user ? `${txn.user.firstName} ${txn.user.lastName}` : "N/A",
      Email: txn.user?.email || "N/A",
      Type: getTransactionType(txn.referenceType),
      Montant: `€${txn.amount.toFixed(2)}`,
      Méthode: txn.provider,
      Statut: txn.status,
      Référence: txn.referenceId || "N/A",
      Description: txn.description || "N/A",
    }));

    // Convertir en CSV
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions-${new Date().toISOString().split("T")[0]}.csv`
    );
    res.send(csv);
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    res.status(500).json({ error: "Erreur lors de l'export" });
  }
});


// GET /api/admin/payments/receipt/:id - Générer un reçu
router.get("/receipt/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    // Ici, vous devriez générer un vrai PDF avec une bibliothèque comme pdfkit
    // Pour l'exemple, on retourne du texte simple
    const receiptText = `
      REÇU DE PAIEMENT
      ================
      
      ID: ${transaction.id}
      Date: ${transaction.createdAt.toISOString()}
      Statut: ${transaction.status}
      
      Client: ${transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : "N/A"}
      Email: ${transaction.user?.email || "N/A"}
      
      Montant: €${transaction.amount.toFixed(2)}
      Méthode: ${transaction.provider}
      
      Description: ${transaction.description || "N/A"}
      
      Merci pour votre confiance !
    `;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${id}.txt`
    );
    res.send(receiptText);
  } catch (error) {
    console.error("Erreur lors de la génération du reçu:", error);
    res.status(500).json({ error: "Erreur lors de la génération du reçu" });
  }
});

// Fonctions utilitaires
function getTransactionType(referenceType) {
  const types = {
    product: "Achat Produit",
    demande: "Réservation Service",
    subscription: "Abonnement",
    refund: "Remboursement",
  };
  return types[referenceType] || "Transaction";
}

function mapTransactionStatus(status) {
  const statusMap = {
    succeeded: "completed",
    pending: "pending",
    failed: "failed",
    refunded: "refunded",
  };
  return statusMap[status] || "pending";
}

module.exports = router;
