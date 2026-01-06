// routes/entrepreneuriat-admin.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const prisma = new PrismaClient();

// Middleware admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Accès réservé aux administrateurs",
    });
  }
  next();
};

router.use(authenticateToken, adminOnly);

// GET - Statistiques détaillées
router.get("/stats", async (req, res) => {
  try {
    const [
      totalInterviews,
      totalResources,
      totalEvents,
      totalDownloads,
      publishedInterviews,
      draftInterviews,
      featuredInterviews,
      recentInteractions,
      topInterviews,
    ] = await Promise.all([
      prisma.entrepreneurInterview.count(),
      prisma.entrepreneurResource.count(),
      prisma.entrepreneurEvent.count(),
      prisma.entrepreneurResource.aggregate({
        _sum: { downloads: true },
      }),
      prisma.entrepreneurInterview.count({
        where: { status: "published" },
      }),
      prisma.entrepreneurInterview.count({
        where: { status: "draft" },
      }),
      prisma.entrepreneurInterview.count({
        where: { isFeatured: true },
      }),
      prisma.interviewInteraction.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          interview: {
            select: { title: true },
          },
          user: {
            select: { email: true },
          },
        },
      }),
      prisma.entrepreneurInterview.findMany({
        take: 5,
        orderBy: { views: "desc" },
        select: {
          id: true,
          title: true,
          views: true,
          guest: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          interviews: totalInterviews,
          resources: totalResources,
          events: totalEvents,
          downloads: totalDownloads._sum.downloads || 0,
        },
        interviews: {
          published: publishedInterviews,
          draft: draftInterviews,
          featured: featuredInterviews,
        },
        recentInteractions,
        topInterviews,
      },
    });
  } catch (error) {
    console.error("❌ Erreur stats admin:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
});

// GET - Interactions récentes
router.get("/interactions", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const [interactions, total] = await Promise.all([
      prisma.interviewInteraction.findMany({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: "desc" },
        include: {
          interview: {
            select: { title: true },
          },
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.interviewInteraction.count(),
    ]);

    res.json({
      success: true,
      data: interactions,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("❌ Erreur interactions:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des interactions",
    });
  }
});

// PATCH - Batch update
router.patch("/batch", async (req, res) => {
  try {
    const { items, updates } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Liste d'items requise",
      });
    }

    let updatedItems = [];

    // Déterminer le type d'items (interviews, resources, events)
    if (items[0].includes("interview_")) {
      // Mettre à jour les interviews
      const interviewIds = items.map((id) => id.replace("interview_", ""));

      for (const id of interviewIds) {
        const updated = await prisma.entrepreneurInterview.update({
          where: { id },
          data: updates,
        });
        updatedItems.push(updated);
      }
    }

    res.json({
      success: true,
      data: updatedItems,
      message: `${updatedItems.length} items mis à jour`,
    });
  } catch (error) {
    console.error("❌ Erreur batch update:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour groupée",
    });
  }
});

// DELETE - Batch delete
router.delete("/batch", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Liste d'items requise",
      });
    }

    let deletedCount = 0;

    // Trier les items par type
    const interviews = items.filter((item) => item.startsWith("interview_"));
    const resources = items.filter((item) => item.startsWith("resource_"));
    const events = items.filter((item) => item.startsWith("event_"));

    // Supprimer les interviews
    if (interviews.length > 0) {
      const interviewIds = interviews.map((id) => id.replace("interview_", ""));
      await prisma.entrepreneurInterview.deleteMany({
        where: { id: { in: interviewIds } },
      });
      deletedCount += interviewIds.length;
    }

    // Supprimer les ressources
    if (resources.length > 0) {
      const resourceIds = resources.map((id) => id.replace("resource_", ""));
      await prisma.entrepreneurResource.deleteMany({
        where: { id: { in: resourceIds } },
      });
      deletedCount += resourceIds.length;
    }

    // Supprimer les événements
    if (events.length > 0) {
      const eventIds = events.map((id) => id.replace("event_", ""));
      await prisma.entrepreneurEvent.deleteMany({
        where: { id: { in: eventIds } },
      });
      deletedCount += eventIds.length;
    }

    res.json({
      success: true,
      message: `${deletedCount} items supprimés avec succès`,
    });
  } catch (error) {
    console.error("❌ Erreur batch delete:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression groupée",
    });
  }
});

// GET - Export data
router.get("/export/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { format = "csv" } = req.query;

    let data = [];
    let filename = "";

    if (type === "interviews") {
      data = await prisma.entrepreneurInterview.findMany({
        include: {
          author: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      filename = `interviews_export_${Date.now()}.${format}`;
    } else if (type === "resources") {
      data = await prisma.entrepreneurResource.findMany({
        include: {
          author: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      filename = `resources_export_${Date.now()}.${format}`;
    } else if (type === "events") {
      data = await prisma.entrepreneurEvent.findMany({
        include: {
          organizer: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      filename = `events_export_${Date.now()}.${format}`;
    } else if (type === "interactions") {
      data = await prisma.interviewInteraction.findMany({
        include: {
          interview: {
            select: { title: true },
          },
          user: {
            select: { email: true },
          },
        },
      });
      filename = `interactions_export_${Date.now()}.${format}`;
    }

    if (format === "csv") {
      // Convertir en CSV
      const csv = convertToCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return res.json(data);
    }

    res.status(400).json({
      success: false,
      error: "Format non supporté",
    });
  } catch (error) {
    console.error("❌ Erreur export:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'export des données",
    });
  }
});

// Fonction utilitaire pour convertir en CSV
function convertToCSV(data) {
  if (!data.length) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value);
        }
        return String(value || "").replace(/"/g, '""');
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

module.exports = router;
