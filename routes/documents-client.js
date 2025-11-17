const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const {
  upload,
  uploadToSupabase,
  deleteFromSupabase,
} = require("../middleware/upload");

// GET /api/documents/mes-documents - Récupérer les documents de l'utilisateur
router.get("/mes-documents", authenticateToken, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        dateUpload: "desc",
      },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Erreur récupération documents:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des documents",
    });
  }
});

// POST /api/documents/upload - Uploader un document vers Supabase
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Aucun fichier fourni",
        });
      }

      const { type, categorie, description, dateExpiration, tags } = req.body;

      // Upload vers Supabase
      const uploadResult = await uploadToSupabase(req.file, "documents");

      // Formater la taille du fichier
      const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      // Parser les tags
      let tagsArray = [];
      if (tags) {
        tagsArray =
          typeof tags === "string"
            ? tags.split(",").map((tag) => tag.trim())
            : tags;
      }

      // Créer le document dans la base de données
      const document = await prisma.document.create({
        data: {
          nom: req.file.originalname,
          type: type || "document_client",
          categorie: categorie || "general",
          description: description,
          dateExpiration: dateExpiration ? new Date(dateExpiration) : null,
          dateUpload: new Date(),
          statut: "VALIDE",
          taille: formatFileSize(req.file.size),
          format: req.file.mimetype,
          url: uploadResult.url,
          cheminFichier: uploadResult.path,
          tags: tagsArray,
          userId: req.user.id,
        },
      });

      res.json({
        success: true,
        data: document,
        message: "Document uploadé avec succès",
      });
    } catch (error) {
      console.error("Erreur upload document:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'upload du document: " + error.message,
      });
    }
  }
);

// GET /api/documents/:id - Récupérer un document spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document non trouvé",
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Erreur récupération document:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du document",
    });
  }
});

// PUT /api/documents/:id - Mettre à jour un document
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { type, categorie, description, dateExpiration, tags, statut } =
      req.body;

    // Vérifier que le document appartient à l'utilisateur
    const existingDocument = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingDocument) {
      return res.status(404).json({
        success: false,
        error: "Document non trouvé",
      });
    }

    // Parser les tags
    let tagsArray = existingDocument.tags;
    if (tags) {
      tagsArray =
        typeof tags === "string"
          ? tags.split(",").map((tag) => tag.trim())
          : tags;
    }

    const document = await prisma.document.update({
      where: {
        id: req.params.id,
      },
      data: {
        type: type || existingDocument.type,
        categorie: categorie || existingDocument.categorie,
        description:
          description !== undefined
            ? description
            : existingDocument.description,
        dateExpiration: dateExpiration
          ? new Date(dateExpiration)
          : existingDocument.dateExpiration,
        statut: statut || existingDocument.statut,
        tags: tagsArray,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: document,
      message: "Document mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur mise à jour document:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du document",
    });
  }
});

// DELETE /api/documents/:id - Supprimer un document
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document non trouvé",
      });
    }

    // Supprimer le fichier de Supabase
    try {
      await deleteFromSupabase(document.cheminFichier);
    } catch (error) {
      console.warn(
        "⚠️ Impossible de supprimer le fichier de Supabase:",
        error.message
      );
      // Continuer quand même avec la suppression en base
    }

    // Supprimer le document de la base de données
    await prisma.document.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Document supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression document:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du document",
    });
  }
});

// GET /api/documents/stats - Statistiques des documents
router.get("/stats/mes-statistiques", authenticateToken, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: req.user.id,
      },
    });

    const stats = {
      total: documents.length,
      parStatut: {
        VALIDE: documents.filter((d) => d.statut === "VALIDE").length,
        EXPIRÉ: documents.filter((d) => d.statut === "EXPIRÉ").length,
        EN_ATTENTE: documents.filter((d) => d.statut === "EN_ATTENTE").length,
      },
      parCategorie: {},
      prochainExpiration: null,
    };

    // Compter par catégorie
    documents.forEach((doc) => {
      stats.parCategorie[doc.categorie] =
        (stats.parCategorie[doc.categorie] || 0) + 1;
    });

    // Trouver le prochain document à expirer
    const documentsAvecExpiration = documents
      .filter(
        (d) => d.dateExpiration && new Date(d.dateExpiration) > new Date()
      )
      .sort((a, b) => new Date(a.dateExpiration) - new Date(b.dateExpiration));

    if (documentsAvecExpiration.length > 0) {
      stats.prochainExpiration = documentsAvecExpiration[0];
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur statistiques documents:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du calcul des statistiques",
    });
  }
});

// POST /api/documents/upload-multiple - Upload multiple
router.post(
  "/upload-multiple",
  authenticateToken,
  upload.array("files", 10), // Max 10 fichiers
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucun fichier fourni",
        });
      }

      const { type, categorie } = req.body;
      const results = [];

      for (const file of req.files) {
        try {
          const uploadResult = await uploadToSupabase(file, "documents");

          const formatFileSize = (bytes) => {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (
              parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
            );
          };

          const document = await prisma.document.create({
            data: {
              nom: file.originalname,
              type: type || "document_client",
              categorie: categorie || "general",
              dateUpload: new Date(),
              statut: "VALIDE",
              taille: formatFileSize(file.size),
              format: file.mimetype,
              url: uploadResult.url,
              cheminFichier: uploadResult.path,
              tags: [],
              userId: req.user.id,
            },
          });

          results.push({
            success: true,
            data: document,
          });
        } catch (fileError) {
          results.push({
            success: false,
            error: `Erreur avec ${file.originalname}: ${fileError.message}`,
            fileName: file.originalname,
          });
        }
      }

      res.json({
        success: true,
        results: results,
        message: `${req.files.length} fichiers traités`,
      });
    } catch (error) {
      console.error("Erreur upload multiple:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'upload multiple",
      });
    }
  }
);

module.exports = router;
