const express = require("express");
const router = express.Router();
const fs = require("fs");
const { prisma } = require("../lib/db");
const { supabase } = require("../lib/supabase");
const { authenticateToken } = require("../middleware/auth");
const {
  uploadMultipleImages,
  cleanupTempFiles
} = require("../middleware/uploadMedia");

/**
 * Upload image vers Supabase
 */
async function uploadImageToSupabase(file, folder = "parapentes") {
  const fileBuffer = fs.readFileSync(file.path);

  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error("❌ Erreur upload Supabase:", error);
    throw new Error(error.message);
  }

  const { data: publicUrl } = supabase.storage
    .from("media")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}

/**
 * CREATE Parapente
 */
router.post(
  "/",
  authenticateToken,
  uploadMultipleImages,
  cleanupTempFiles,
  async (req, res) => {
    try {
      const { title, description, price, location } = req.body;
      const userId = req.user.id;

      if (!req.files?.image?.length) {
        return res.status(400).json({
          success: false,
          message: "Aucune image reçue",
        });
      }

      const imageUrls = [];

      for (const file of req.files.image) {
        const url = await uploadImageToSupabase(file, "parapentes");
        imageUrls.push(url);
      }

      const parapente = await prisma.parapente.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          location,
          images: imageUrls,
          idUser: userId,
        },
      });

      res.status(201).json({
        success: true,
        data: parapente,
      });
    } catch (error) {
      console.error("❌ Erreur création parapente:", error);
      res.status(500).json({
        success: false,
        message: "CREATE_FAILED",
      });
    }
  }
);


/**
 * UPDATE Parapente
 */
router.put(
  "/:id",
  authenticateToken,
  uploadMultipleImages,
  cleanupTempFiles,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, location } = req.body;
      const userId = req.user.id;

      const existing = await prisma.parapente.findUnique({
        where: { id },
      });

      if (!existing || existing.idUser !== userId) {
        return res.status(403).json({
          success: false,
          error: "FORBIDDEN",
        });
      }

      // Par défaut : garder les images existantes
      let imageUrls = existing.images;

      // Si nouvelles images envoyées → on remplace
      if (req.files?.image?.length) {
        imageUrls = [];

        for (const file of req.files.image) {
          const url = await uploadImageToSupabase(file, "parapentes");
          imageUrls.push(url);
        }
      }

      const updated = await prisma.parapente.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          description: description ?? existing.description,
          price: price ? parseFloat(price) : existing.price,
          location: location ?? existing.location,
          images: imageUrls,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error("❌ Erreur update parapente:", error);
      res.status(500).json({
        success: false,
        error: "UPDATE_FAILED",
      });
    }
  }
);


/**
 * DELETE Parapente
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.parapente.findUnique({ where: { id } });
    if (!existing || existing.idUser !== userId) {
      return res.status(403).json({ success: false, error: "FORBIDDEN" });
    }

    await prisma.parapente.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "DELETE_FAILED" });
  }
});

/**
 * GET ALL Parapentes (PUBLIC)
 */
router.get("/", async (_req, res) => {
  const parapentes = await prisma.parapente.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: parapentes });
});

/**
 * GET ONE Parapente (PUBLIC)
 */
router.get("/:id", async (req, res) => {
  const parapente = await prisma.parapente.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  });

  if (!parapente) {
    return res.status(404).json({ success: false, error: "NOT_FOUND" });
  }

  res.json({ success: true, data: parapente });
});

module.exports = router;
