// routes/entrepreneuriat.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const prisma = new PrismaClient();

// GET - Récupérer toutes les interviews avec filtres
router.get("/interviews", async (req, res) => {
  try {
    const {
      category,
      status = "all",
      featured,
      limit = 100,
      offset = 0,
      search,
    } = req.query;

    const where = status == "all" ? {} : { status };

    if (category && category !== "tous") {
      where.category = category;
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { guest: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [interviews, total] = await Promise.all([
      prisma.entrepreneurInterview.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              interviewInteractions: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip: parseInt(offset),
        take: parseInt(limit),
      }),
      prisma.entrepreneurInterview.count({ where }),
    ]);

    res.json({
      success: true,
      data: interviews,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération interviews:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des interviews",
    });
  }
});

// GET - Récupérer une interview par ID ou slug
router.get("/interviews/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Vérifier si c'est un UUID ou un slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier
      );

    const where = isUuid ? { id: identifier } : { slug: identifier };

    const interview = await prisma.entrepreneurInterview.findFirst({
      where: {
        ...where,
        status: "published",
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            companyName: true,
          },
        },
        interviewInteractions: {
          select: {
            action: true,
            userId: true,
          },
          where: {
            action: "view",
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview non trouvée",
      });
    }

    // Incrémenter le compteur de vues
    await prisma.entrepreneurInterview.update({
      where: { id: interview.id },
      data: { views: interview.views + 1 },
    });

    // Enregistrer l'interaction si l'utilisateur est connecté
    if (req.user) {
      await prisma.interviewInteraction.create({
        data: {
          interviewId: interview.id,
          userId: req.user.userId,
          action: "view",
          platform: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      });
    }

    res.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("❌ Erreur récupération interview:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'interview",
    });
  }
});

// POST - Créer une nouvelle interview (admin only)
router.post("/interviews", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Vérifier les permissions (admin ou content-manager)
    if (!["admin", "content-manager"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée",
      });
    }

    const {
      title,
      slug,
      description,
      content,
      excerpt,
      guest,
      role,
      company,
      duration,
      date,
      tags,
      category,
      imageUrl,
      videoUrl,
      audioUrl,
      thumbnailUrl,
      status = "draft",
      isFeatured = false,
    } = req.body;

    // Validation basique
    if (!title || !slug || !guest || !category) {
      return res.status(400).json({
        success: false,
        error: "Champs obligatoires manquants",
      });
    }

    // Vérifier si le slug existe déjà
    const existingSlug = await prisma.entrepreneurInterview.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        error: "Ce slug est déjà utilisé",
      });
    }

    const interview = await prisma.entrepreneurInterview.create({
      data: {
        title,
        slug,
        description,
        content,
        excerpt,
        guest,
        role,
        company,
        duration,
        date: date ? new Date(date) : new Date(),
        tags: tags || [],
        category,
        imageUrl,
        videoUrl,
        audioUrl,
        thumbnailUrl,
        status,
        isFeatured,
        authorId: user.userId,
        publishedAt: status === "published" ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("❌ Erreur création interview:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'interview",
    });
  }
});

// PUT - Mettre à jour une interview
router.put("/interviews/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    // Vérifier si l'interview existe
    const existingInterview = await prisma.entrepreneurInterview.findUnique({
      where: { id },
    });

    if (!existingInterview) {
      return res.status(404).json({
        success: false,
        error: "Interview non trouvée",
      });
    }

    // Vérifier les permissions (auteur ou admin)
    if (
      existingInterview.authorId !== user.userId &&
      !["admin", "content-manager"].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée",
      });
    }

    // Si le slug est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.slug && updateData.slug !== existingInterview.slug) {
      const slugExists = await prisma.entrepreneurInterview.findUnique({
        where: { slug: updateData.slug },
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: "Ce slug est déjà utilisé",
        });
      }
    }

    // Mettre à jour la date de publication si le statut passe à "published"
    if (
      updateData.status === "published" &&
      existingInterview.status !== "published"
    ) {
      updateData.publishedAt = new Date();
    }

    const updatedInterview = await prisma.entrepreneurInterview.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour interview:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de l'interview",
    });
  }
});

// DELETE - Supprimer une interview
router.delete("/interviews/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Vérifier si l'interview existe
    const existingInterview = await prisma.entrepreneurInterview.findUnique({
      where: { id },
    });

    if (!existingInterview) {
      return res.status(404).json({
        success: false,
        error: "Interview non trouvée",
      });
    }

    // Seuls les admins peuvent supprimer définitivement
    if (!["admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "Permission refusée",
      });
    }

    await prisma.entrepreneurInterview.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Interview supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression interview:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'interview",
    });
  }
});

// POST - Enregistrer une interaction (vue, écoute, like, etc.)
router.post("/interviews/:id/interact", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action = "view", duration = null } = req.body;
    const user = req.user;

    // Vérifier si l'interview existe
    const interview = await prisma.entrepreneurInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview non trouvée",
      });
    }

    // Vérifier si l'utilisateur a déjà effectué cette action aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingInteraction = await prisma.interviewInteraction.findFirst({
      where: {
        interviewId: id,
        userId: user.userId,
        action,
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingInteraction && action !== "listen") {
      return res.json({
        success: true,
        message: "Interaction déjà enregistrée aujourd'hui",
      });
    }

    // Créer l'interaction
    await prisma.interviewInteraction.create({
      data: {
        interviewId: id,
        userId: user.userId,
        action,
        duration,
        completed:
          action === "listen" && duration > interview.duration * 60 * 0.8, // 80% de l'écoute
        platform: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    // Mettre à jour les compteurs de l'interview
    const updateData = {};
    if (action === "view") updateData.views = interview.views + 1;
    if (action === "listen") updateData.listens = interview.listens + 1;
    if (action === "like") updateData.likes = interview.likes + 1;
    if (action === "share") updateData.shares = interview.shares + 1;

    await prisma.entrepreneurInterview.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Interaction enregistrée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur enregistrement interaction:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'enregistrement de l'interaction",
    });
  }
});

// GET - Récupérer toutes les ressources
router.get("/resources", async (req, res) => {
  try {
    const {
      type,
      category,
      isFree,
      status = "all",
      limit = 100,
      offset = 0,
      search,
    } = req.query;

    const where = status=="all" ? {} : { status };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (isFree !== undefined) {
      where.isFree = isFree === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.entrepreneurResource.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: parseInt(offset),
        take: parseInt(limit),
      }),
      prisma.entrepreneurResource.count({ where }),
    ]);

    res.json({
      success: true,
      data: resources,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération ressources:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des ressources",
    });
  }
});

// GET - Télécharger une ressource
router.get("/resources/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.entrepreneurResource.findUnique({
      where: { id },
    });

    if (!resource || resource.status !== "published") {
      return res.status(404).json({
        success: false,
        error: "Ressource non trouvée",
      });
    }

    // Incrémenter le compteur de téléchargements
    await prisma.entrepreneurResource.update({
      where: { id },
      data: { downloads: resource.downloads + 1 },
    });

    // Rediriger vers l'URL du fichier
    res.json({
      success: true,
      data: {
        downloadUrl: resource.fileUrl,
        fileName: `${resource.title}.${resource.fileType}`,
      },
    });
  } catch (error) {
    console.error("❌ Erreur téléchargement ressource:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du téléchargement de la ressource",
    });
  }
});

// GET - Récupérer tous les événements
router.get("/events", async (req, res) => {
  try {
    const {
      format,
      status,
      upcoming = "true",
      limit = 20,
      offset = 0,
      search,
    } = req.query;

    const where = {};

    if (format) {
      where.format = format;
    }

    if (status) {
      where.status = status;
    }

    if (upcoming === "true") {
      where.date = {
        gte: new Date(),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { speakers: { has: search } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.entrepreneurEvent.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
        skip: parseInt(offset),
        take: parseInt(limit),
      }),
      prisma.entrepreneurEvent.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération événements:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des événements",
    });
  }
});

// GET - Statistiques générales
router.get("/stats", async (req, res) => {
  try {
    const [
      totalInterviews,
      totalResources,
      totalEvents,
      totalDownloads,
      featuredInterviews,
      recentEvents,
    ] = await Promise.all([
      prisma.entrepreneurInterview.count({
        where: { status: "published" },
      }),
      prisma.entrepreneurResource.count({
        where: { status: "published" },
      }),
      prisma.entrepreneurEvent.count({
        where: {
          date: { gte: new Date() },
          status: "upcoming",
        },
      }),
      prisma.entrepreneurResource.aggregate({
        where: { status: "published" },
        _sum: { downloads: true },
      }),
      prisma.entrepreneurInterview.findMany({
        where: {
          status: "published",
          isFeatured: true,
        },
        take: 4,
        orderBy: { date: "desc" },
      }),
      prisma.entrepreneurEvent.findMany({
        where: {
          date: { gte: new Date() },
          status: "upcoming",
        },
        take: 3,
        orderBy: { date: "asc" },
      }),
    ]);

    // Calculer le nombre total d'entrepreneurs interviewés
    const uniqueEntrepreneurs = await prisma.entrepreneurInterview.groupBy({
      by: ["guest"],
      where: { status: "published" },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        interviews: totalInterviews,
        entrepreneurs: uniqueEntrepreneurs.length,
        resources: totalResources,
        events: totalEvents,
        downloads: totalDownloads._sum.downloads || 0,
        featuredInterviews,
        recentEvents,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération statistiques:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
});

// GET - Catégories disponibles
router.get("/categories", async (req, res) => {
  try {
    // Récupérer toutes les catégories uniques des interviews
    const interviewCategories = await prisma.entrepreneurInterview.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: true,
    });

    // Récupérer toutes les catégories uniques des ressources
    const resourceCategories = await prisma.entrepreneurResource.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: true,
    });

    // Types de ressources
    const resourceTypes = await prisma.entrepreneurResource.groupBy({
      by: ["type"],
      where: { status: "published" },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        interviewCategories,
        resourceCategories,
        resourceTypes,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération catégories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
    });
  }
});

// POST - S'inscrire à un événement
router.post("/events/:id/register", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const event = await prisma.entrepreneurEvent.findUnique({
      where: { id },
    });

    if (!event || event.status !== "upcoming") {
      return res.status(404).json({
        success: false,
        error: "Événement non disponible",
      });
    }

    if (!event.isRegistrationOpen) {
      return res.status(400).json({
        success: false,
        error: "Les inscriptions sont closes",
      });
    }

    if (event.maxParticipants && event.registered >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: "Événement complet",
      });
    }

    // Incrémenter le nombre d'inscrits
    await prisma.entrepreneurEvent.update({
      where: { id },
      data: {
        registered: event.registered + 1,
      },
    });

    // Ici, vous pourriez aussi créer un enregistrement dans une table d'inscriptions
    // pour suivre qui s'est inscrit à quoi

    // Envoyer une notification via WebSocket
    if (req.io) {
      req.io.to(`user:${user.userId}`).emit("event-registration", {
        eventId: id,
        eventTitle: event.title,
        date: event.date,
        time: event.time,
        message: "Votre inscription a été enregistrée avec succès",
      });
    }

    res.json({
      success: true,
      message: "Inscription enregistrée avec succès",
      data: {
        eventId: id,
        registered: event.registered + 1,
      },
    });
  } catch (error) {
    console.error("❌ Erreur inscription événement:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'inscription à l'événement",
    });
  }
});

module.exports = router;
