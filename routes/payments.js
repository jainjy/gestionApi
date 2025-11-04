const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/payments/transactions - Historique des transactions
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const { period = "3m" } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case "1m":
        dateFilter = { gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case "3m":
        dateFilter = { gte: new Date(now.setMonth(now.getMonth() - 3)) };
        break;
      case "12m":
        dateFilter = { gte: new Date(now.setMonth(now.getMonth() - 12)) };
        break;
      // "all" - pas de filtre de date
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Transformer les données pour le frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      date: tx.createdAt.toISOString().split('T')[0],
      description: tx.description || "Transaction",
      amount: tx.amount,
      status: mapTransactionStatus(tx.status),
      receiptUrl: `/api/payments/receipt/${tx.id}`
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error("Erreur récupération transactions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/payments/invoices - Liste des factures
router.get("/invoices", authenticateToken, async (req, res) => {
  try {
    // Pour l'instant, on récupère les transactions comme factures
    // À adapter selon votre logique métier
    const invoices = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        status: "succeeded"
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        description: true
      }
    });

    const formattedInvoices = invoices.map((inv, index) => ({
      id: inv.id,
      number: `FA-${inv.createdAt.getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      date: inv.createdAt.toISOString().split('T')[0],
      total: inv.amount,
      pdfUrl: `/api/payments/invoice/${inv.id}/pdf`
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error("Erreur récupération factures:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/payments/payment-methods - Méthodes de paiement
router.get("/payment-methods", authenticateToken, async (req, res) => {
  try {
    // Pour l'instant, on retourne des données mockées
    // À intégrer avec Stripe ou autre processeur de paiement
    const paymentMethods = [
      {
        id: "pm_1",
        brand: "Visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2026,
        holder: `${req.user.firstName} ${req.user.lastName}`,
        isDefault: true,
      },
      {
        id: "pm_2",
        brand: "Mastercard",
        last4: "4444",
        expMonth: 7,
        expYear: 2025,
        holder: `${req.user.firstName} ${req.user.lastName}`,
      },
    ];

    res.json(paymentMethods);
  } catch (error) {
    console.error("Erreur récupération méthodes paiement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/payments/payment-methods - Ajouter une méthode de paiement
router.post("/payment-methods", authenticateToken, async (req, res) => {
  try {
    const { holder, number, expMonth, expYear, brand, last4 } = req.body;

    // Validation basique
    if (!holder || !number || !expMonth || !expYear) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Ici, vous intégrerez avec Stripe pour créer un PaymentMethod
    // Pour l'instant, on simule l'ajout
    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: brand || (number.startsWith("4") ? "Visa" : "Mastercard"),
      last4: last4 || number.slice(-4),
      expMonth: parseInt(expMonth),
      expYear: parseInt(expYear),
      holder,
      isDefault: false
    };

    res.json(newPaymentMethod);
  } catch (error) {
    console.error("Erreur ajout méthode paiement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/payments/payment-methods/:id/default - Définir comme méthode par défaut
router.put("/payment-methods/:id/default", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Logique pour définir comme méthode par défaut
    // À intégrer avec votre processeur de paiement
    
    res.json({ message: "Méthode par défaut mise à jour" });
  } catch (error) {
    console.error("Erreur mise à jour méthode par défaut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/payments/payment-methods/:id - Supprimer une méthode de paiement
router.delete("/payment-methods/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Logique pour supprimer la méthode de paiement
    // À intégrer avec votre processeur de paiement
    
    res.json({ message: "Méthode de paiement supprimée" });
  } catch (error) {
    console.error("Erreur suppression méthode paiement:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/payments/billing-address - Adresse de facturation
router.get("/billing-address", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        firstName: true,
        lastName: true,
        address: true,
        addressComplement: true,
        city: true,
        zipCode: true
      }
    });

    const billingAddress = {
      name: `${user.firstName} ${user.lastName}`,
      address: user.address,
      addressComplement: user.addressComplement,
      city: user.city,
      zipCode: user.zipCode,
      country: "France" // Par défaut
    };

    res.json(billingAddress);
  } catch (error) {
    console.error("Erreur récupération adresse facturation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/payments/billing-address - Mettre à jour l'adresse de facturation
router.put("/billing-address", authenticateToken, async (req, res) => {
  try {
    const { name, address, addressComplement, city, zipCode, country } = req.body;

    // Extraire prénom et nom
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        address,
        addressComplement,
        city,
        zipCode
      }
    });

    res.json({ message: "Adresse de facturation mise à jour" });
  } catch (error) {
    console.error("Erreur mise à jour adresse facturation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/payments/receipt/:id - Télécharger un reçu
router.get("/receipt/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    // Générer un PDF de reçu (simulé pour l'instant)
    // À implémenter avec une librairie PDF comme pdfkit
    res.json({
      message: "Reçu généré avec succès",
      transactionId: id,
      amount: transaction.amount,
      date: transaction.createdAt
    });
  } catch (error) {
    console.error("Erreur génération reçu:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/payments/invoice/:id/pdf - Télécharger une facture PDF
router.get("/invoice/:id/pdf", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    // Générer un PDF de facture (simulé pour l'instant)
    res.json({
      message: "Facture PDF générée avec succès",
      invoiceId: id,
      amount: transaction.amount,
      date: transaction.createdAt
    });
  } catch (error) {
    console.error("Erreur génération facture:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Fonction utilitaire pour mapper les statuts
function mapTransactionStatus(status) {
  const statusMap = {
    "succeeded": "payee",
    "pending": "en_attente", 
    "failed": "echoue",
    "refunded": "rembourse"
  };
  return statusMap[status] || "en_attente";
}

module.exports = router;