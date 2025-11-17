// routes/documents-client.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

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

    res.json(documents);
  } catch (error) {
    console.error("Erreur récupération documents:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des documents" });
  }
});

// POST /api/documents/upload - Uploader un document
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      const { type, categorie, description, dateExpiration } = req.body;

      // Calculer la taille formatée
      const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

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
          url: `/uploads/documents/${req.file.filename}`,
          cheminFichier: req.file.path,
          tags: [],
          userId: req.user.id,
        },
      });

      res.json(document);
    } catch (error) {
      console.error("Erreur upload document:", error);
      res.status(500).json({ error: "Erreur lors de l'upload du document" });
    }
  }
);

// GET /api/documents/download/:id - Télécharger un document
router.get("/download/:id", authenticateToken, async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document non trouvé" });
    }

    res.download(document.cheminFichier, document.nom);
  } catch (error) {
    console.error("Erreur téléchargement document:", error);
    res.status(500).json({ error: "Erreur lors du téléchargement" });
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
      return res.status(404).json({ error: "Document non trouvé" });
    }

    await prisma.document.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({ message: "Document supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression document:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du document" });
  }
});

module.exports = router;
