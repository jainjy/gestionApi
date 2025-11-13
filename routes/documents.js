// routes/documents.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const {
  upload,
  uploadDocumentToSupabase,
  deleteDocumentFromSupabase,
} = require("../middleware/upload-documents");

// Récupérer tous les documents de l'utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { type, statut, recherche } = req.query;

    let where = {
      userId: req.user.id,
    };

    if (type && type !== "Tous") {
      where.type = type;
    }

    if (statut && statut !== "Tous") {
      where.statut = statut;
    }

    if (recherche) {
      where.OR = [
        { nom: { contains: recherche, mode: "insensitive" } },
        { description: { contains: recherche, mode: "insensitive" } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(documents);
  } catch (error) {
    console.error("Erreur récupération documents:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des documents" });
  }
});

// Récupérer les statistiques
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const total = await prisma.document.count({
      where: { userId: req.user.id },
    });

    const expirant = await prisma.document.count({
      where: {
        userId: req.user.id,
        statut: "EXPIRANT",
      },
    });

    const expire = await prisma.document.count({
      where: {
        userId: req.user.id,
        statut: "EXPIRE",
      },
    });

    const immobilier = await prisma.document.count({
      where: {
        userId: req.user.id,
        type: "IMMOBILIER",
      },
    });

    const contrats = await prisma.contratType.count({
      where: { userId: req.user.id },
    });

    res.json({
      total,
      expirant,
      expire,
      immobilier,
      contrats,
    });
  } catch (error) {
    console.error("Erreur récupération statistiques:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

// Récupérer les archives signées
router.get("/archives", authenticateToken, async (req, res) => {
  try {
    const archives = await prisma.documentArchive.findMany({
      where: { userId: req.user.id },
      orderBy: { dateSignature: "desc" },
    });

    res.json(archives);
  } catch (error) {
    console.error("Erreur récupération archives:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des archives" });
  }
});

// Récupérer les documents immobiliers
router.get("/immobilier", authenticateToken, async (req, res) => {
  try {
    const { categorie, recherche } = req.query;

    let where = {
      userId: req.user.id,
      type: "IMMOBILIER",
    };

    if (categorie && categorie !== "Tous") {
      where.categorie = categorie;
    }

    if (recherche) {
      where.OR = [
        { nom: { contains: recherche, mode: "insensitive" } },
        { description: { contains: recherche, mode: "insensitive" } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(documents);
  } catch (error) {
    console.error("Erreur récupération documents immobiliers:", error);
    res
      .status(500)
      .json({
        error: "Erreur lors de la récupération des documents immobiliers",
      });
  }
});

// Récupérer un document spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    res.json(document);
  } catch (error) {
    console.error("Erreur récupération document:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du document" });
  }
});

// Uploader un document vers Supabase - CORRECTION DATE
router.post(
  "/upload",
  authenticateToken,
  upload.single("fichier"),
  async (req, res) => {
    try {
      const { nom, type, categorie, dateExpiration, description, tags } =
        req.body;

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      console.log("📥 Début upload document:", {
        nom,
        type,
        taille: req.file.size,
        mimetype: req.file.mimetype,
        dateExpiration,
      });

      // Upload vers Supabase
      const uploadResult = await uploadDocumentToSupabase(
        req.file,
        "documents-professionnels"
      );

      // Calculer la taille en MB
      const tailleMB = (req.file.size / (1024 * 1024)).toFixed(1);

      // Déterminer le statut
      let statut = "VALIDE";
      let dateExpirationFormatted = null;

      if (dateExpiration) {
        try {
          // Convertir la date en format DateTime pour Prisma
          dateExpirationFormatted = new Date(dateExpiration);

          // Vérifier que la date est valide
          if (isNaN(dateExpirationFormatted.getTime())) {
            throw new Error("Date d'expiration invalide");
          }

          const aujourdhui = new Date();
          const diffTime = dateExpirationFormatted - aujourdhui;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            statut = "EXPIRE";
          } else if (diffDays <= 30) {
            statut = "EXPIRANT";
          }
        } catch (dateError) {
          console.error("Erreur traitement date:", dateError);
          // Continuer sans date d'expiration si elle est invalide
        }
      }

      // Créer le document dans la base de données
      const document = await prisma.document.create({
        data: {
          nom,
          type,
          categorie: type === "IMMOBILIER" ? categorie : null,
          dateExpiration: dateExpirationFormatted,
          dateUpload: new Date(),
          statut,
          taille: `${tailleMB} MB`,
          format: req.file.originalname.split(".").pop().toUpperCase(),
          url: uploadResult.url,
          cheminFichier: uploadResult.path,
          description: description || null,
          tags: tags ? JSON.parse(tags) : [],
          userId: req.user.id,
        },
      });

      console.log("✅ Document créé en base:", document.id);

      res.json(document);
    } catch (error) {
      console.error("❌ Erreur upload document:", error);
      res.status(500).json({
        error: "Erreur lors de l'upload du document",
        details: error.message,
      });
    }
  }
);

// Supprimer un document (Supabase + DB)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le document pour supprimer le fichier de Supabase
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    // Supprimer le fichier de Supabase
    if (document.cheminFichier) {
      try {
        await deleteDocumentFromSupabase(document.cheminFichier);
      } catch (supabaseError) {
        console.error(
          "Erreur suppression Supabase, continuation:",
          supabaseError
        );
        // Continuer même si la suppression Supabase échoue
      }
    }

    // Supprimer de la base de données
    await prisma.document.delete({
      where: { id },
    });

    res.json({
      message: "Document supprimé avec succès",
      documentId: id,
    });
  } catch (error) {
    console.error("Erreur suppression document:", error);
    res.status(500).json({
      error: "Erreur lors de la suppression du document",
      details: error.message,
    });
  }
});

// Télécharger un document (retourne l'URL Supabase)
router.get("/:id/download", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    // Retourner l'URL Supabase
    res.json({
      downloadUrl: document.url,
      nom: document.nom,
      format: document.format,
    });
  } catch (error) {
    console.error("Erreur téléchargement document:", error);
    res
      .status(500)
      .json({ error: "Erreur lors du téléchargement du document" });
  }
});

module.exports = router;
