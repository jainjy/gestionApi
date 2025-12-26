const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/db');
const { supabase } = require('../lib/supabase');
const { authenticateToken } = require('../middleware/auth');
const { uploadVideo, uploadImage, cleanupTempFiles } = require('../middleware/uploadMedia');

/**
 * 🔧 Fonction utilitaire : upload vers Supabase
 */
async function uploadToSupabase(file, folder) {
  // Lire le fichier en mémoire (BUFFER)
  const fileBuffer = fs.readFileSync(file.path);

  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('media') // bucket
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error('❌ Erreur upload Supabase:', error);
    throw error;
  }

  const { data: publicUrl } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}


/**
 * =====================================================
 * 📌 POST /api/projets
 * Création d'un projet (image OU vidéo)
 * =====================================================
 */
router.post(
  '/',
  authenticateToken,

  // 👉 choisir un seul middleware selon le besoin
  (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('video')) {
      return uploadVideo(req, res, next);
    }
    return uploadImage(req, res, next);
  },

  cleanupTempFiles,

  async (req, res) => {
    try {
      const { titre, details, duree, categorie, status } = req.body;
      const userId = req.user.id;

      if (!titre || !details || !duree) {
        return res.status(400).json({
          success: false,
          message: 'Champs requis manquants',
        });
      }

      let mediaUrl = null;

      /**
       * 📤 Upload media vers Supabase
       */
      if (req.files?.video) {
        mediaUrl = await uploadToSupabase(req.files.video[0], 'videos');
      } else if (req.files?.image) {
        mediaUrl = await uploadToSupabase(req.files.image[0], 'images');
      }

      /**
       * 🧠 Insertion Prisma
       */
     const projet = await prisma.Projet.create({
        data: {
          idpro: userId,
          titre,
          details,
          duree: new Date(duree),
          media: mediaUrl,
          categorie: categorie || null,
          status: status || 'active',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Projet créé avec succès',
        data: projet,
      });

    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
    }
  }
);

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const projets = await prisma.projet.findMany({
      where: {
        idpro: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        titre: true,
        details: true,
        duree: true,
        media: true,
        status: true,
        categorie: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: projets.length,
      data: projets,
    });
  } catch (error) {
    console.error('❌ Erreur récupération projets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});

module.exports = router;
