const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/professional/billing/payments - Paiements reçus par le professionnel
router.get("/payments", authenticateToken, async (req, res) => {
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

    // Récupérer les transactions liées aux services du professionnel
    const payments = await prisma.transaction.findMany({
      where: {
        // Ici vous devrez adapter la logique selon comment vous liez les transactions aux professionnels
        // Par exemple, via les devis, services, ou commandes
        OR: [
          {
            referenceType: "devis",
            referenceId: {
              in: await getProfessionalDevisIds(req.user.id),
            },
          },
          {
            referenceType: "service",
            referenceId: {
              in: await getProfessionalServiceIds(req.user.id),
            },
          },
        ],
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      date: payment.createdAt.toISOString().split("T")[0],
      client: `${payment.user?.firstName} ${payment.user?.lastName}`,
      description: payment.description,
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error("Erreur récupération paiements professionnel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/professional/billing/invoices - Factures générées par le professionnel
router.get("/invoices", authenticateToken, async (req, res) => {
  try {
    const invoices = await prisma.devis.findMany({
      where: {
        prestataireId: req.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
          },
        },
        demande: {
          select: {
            description: true,
          },
        },
      },
    });

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.numero,
      total: invoice.montantTTC,
      vat: invoice.tva,
      status: mapInvoiceStatus(invoice.status),
      issued: invoice.dateCreation.toISOString().split("T")[0],
      client:
        invoice.client.companyName ||
        `${invoice.client.firstName} ${invoice.client.lastName}`,
      description: invoice.description,
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error("Erreur récupération factures professionnel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/professional/billing/analytics - Statistiques de facturation
router.get("/analytics", authenticateToken, async (req, res) => {
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
    }

    // Calcul des statistiques
    const payments = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            referenceType: "devis",
            referenceId: {
              in: await getProfessionalDevisIds(req.user.id),
            },
          },
          {
            referenceType: "service",
            referenceId: {
              in: await getProfessionalServiceIds(req.user.id),
            },
          },
        ],
        status: "succeeded",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    });

    const totalPayments = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const avgPayment =
      payments.length > 0 ? totalPayments / payments.length : 0;

    // Calcul du taux de remboursement (simplifié)
    const refundedPayments = await prisma.transaction.count({
      where: {
        OR: [
          {
            referenceType: "devis",
            referenceId: {
              in: await getProfessionalDevisIds(req.user.id),
            },
          },
          {
            referenceType: "service",
            referenceId: {
              in: await getProfessionalServiceIds(req.user.id),
            },
          },
        ],
        status: "refunded",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    });

    const refundRate =
      payments.length > 0
        ? ((refundedPayments / payments.length) * 100).toFixed(1)
        : "0";

    const stats = {
      totalPayments: `${totalPayments.toFixed(0)} €`,
      avgPayment: `${avgPayment.toFixed(0)} €`,
      refundRate: `${refundRate}%`,
      totalTransactions: payments.length,
      successRate:
        payments.length > 0
          ? `${(((payments.length - refundedPayments) / payments.length) * 100).toFixed(1)}%`
          : "100%",
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur récupération statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/professional/billing/invoices - Créer une nouvelle facture
router.post("/invoices", authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      demandeId,
      montantHT,
      tva,
      description,
      conditions,
      dateValidite,
    } = req.body;

    if (!clientId || !montantHT) {
      return res.status(400).json({ error: "Client et montant HT requis" });
    }

    // Générer un numéro de facture unique
    const invoiceCount = await prisma.devis.count({
      where: {
        prestataireId: req.user.id,
      },
    });

    const numero = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, "0")}`;
    const montantTTC = montantHT * (1 + (tva || 0.2));

    const newInvoice = await prisma.devis.create({
      data: {
        numero,
        dateCreation: new Date(),
        dateValidite: dateValidite
          ? new Date(dateValidite)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
        montantHT: parseFloat(montantHT),
        montantTTC,
        tva: tva || 0.2,
        status: "en_attente",
        description,
        conditions,
        clientId,
        prestataireId: req.user.id,
        demandeId: demandeId || null,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Facture créée avec succès",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("Erreur création facture:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/professional/billing/invoices/:id - Mettre à jour une facture
router.put("/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { montantHT, tva, description, conditions, status, dateValidite } =
      req.body;

    const invoice = await prisma.devis.findFirst({
      where: {
        id,
        prestataireId: req.user.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    const updateData = {};
    if (montantHT !== undefined) {
      updateData.montantHT = parseFloat(montantHT);
      updateData.montantTTC = montantHT * (1 + (tva || invoice.tva));
    }
    if (tva !== undefined) updateData.tva = parseFloat(tva);
    if (description !== undefined) updateData.description = description;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (status !== undefined) updateData.status = status;
    if (dateValidite !== undefined)
      updateData.dateValidite = new Date(dateValidite);

    const updatedInvoice = await prisma.devis.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });

    res.json({
      message: "Facture mise à jour avec succès",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Erreur mise à jour facture:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/professional/billing/invoices/:id/pdf - Télécharger une facture PDF
router.get("/invoices/:id/pdf", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.devis.findFirst({
      where: {
        id,
        prestataireId: req.user.id,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            address: true,
            city: true,
            zipCode: true,
            email: true,
          },
        },
        prestataire: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            address: true,
            city: true,
            zipCode: true,
            email: true,
            phone: true,
            siret: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Facture non trouvée" });
    }

    // Ici vous généreriez le PDF avec une librairie comme pdfkit
    // Pour l'instant, on retourne les données
    res.json({
      message: "Facture PDF générée avec succès",
      invoice: {
        ...invoice,
        pdfUrl: `/api/professional/billing/invoices/${id}/download`,
      },
    });
  } catch (error) {
    console.error("Erreur génération facture PDF:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Fonctions utilitaires
async function getProfessionalDevisIds(userId) {
  const devis = await prisma.devis.findMany({
    where: { prestataireId: userId },
    select: { id: true },
  });
  return devis.map((d) => d.id);
}

async function getProfessionalServiceIds(userId) {
  const userServices = await prisma.utilisateurService.findMany({
    where: { userId },
    select: { serviceId: true },
  });
  return userServices.map((us) => us.serviceId.toString());
}

function mapInvoiceStatus(status) {
  const statusMap = {
    en_attente: "unpaid",
    paye: "paid",
    annule: "cancelled",
    refuse: "refused",
  };
  return statusMap[status] || "unpaid";
}

function mapTransactionStatus(status) {
  const statusMap = {
    succeeded: "succeeded",
    pending: "pending",
    failed: "failed",
    refunded: "refunded",
  };
  return statusMap[status] || "pending";
}

module.exports = router;
