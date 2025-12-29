const express = require('express');
const router = express.Router();
const fs = require('fs');
const { prisma } = require('../lib/db');
const { supabase } = require('../lib/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadVideo, uploadImage, cleanupTempFiles } = require('../middleware/uploadMedia');

/**
 * 🔧 Upload Supabase
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


//route user 
router.get(
  '/pro/:idpro',
  authenticateToken,
  requireRole('user'),
  async (req, res) => {
    const { idpro } = req.params;

    const pro = await prisma.user.findUnique({ where: { id: idpro } });
    if (!pro) return res.status(404).json({ success: false });

    const projets = await prisma.projet.findMany({
      where: { idpro, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, professionnel: pro, data: projets });
  }
);

//modifier le projet  
router.put(
  '/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  // Middleware pour détecter le type de média
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
      const { id } = req.params;
      const userId = req.user.id;
      const { titre, details, duree, categorie, status } = req.body;

      // Récupérer le projet existant
      const projet = await prisma.projet.findUnique({ where: { id } });

      if (!projet) {
        return res.status(404).json({ success: false, message: 'Projet introuvable' });
      }

      // Vérifier les permissions
      if (projet.idpro !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      let mediaUrl = projet.media;

      // Gérer le nouveau média si fourni
      if (req.files?.video) {
        // Supprimer l'ancien média si existant
        if (projet.media) {
          const oldFilePath = projet.media.split('/media/')[1];
          if (oldFilePath) {
            await supabase.storage.from('media').remove([oldFilePath]);
          }
        }
        mediaUrl = await uploadToSupabase(req.files.video[0], 'videos');
      } else if (req.files?.image) {
        // Supprimer l'ancien média si existant
        if (projet.media) {
          const oldFilePath = projet.media.split('/media/')[1];
          if (oldFilePath) {
            await supabase.storage.from('media').remove([oldFilePath]);
          }
        }
        mediaUrl = await uploadToSupabase(req.files.image[0], 'images');
      }

      // Mettre à jour le projet
      const updatedProjet = await prisma.projet.update({
        where: { id },
        data: {
          titre: titre ?? projet.titre,
          details: details ?? projet.details,
          duree: duree ? new Date(duree) : projet.duree,
          categorie: categorie ?? projet.categorie,
          status: status ?? projet.status,
          media: mediaUrl,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Projet modifié avec succès',
        data: updatedProjet,
      });

    } catch (error) {
      console.error('❌ Erreur modification projet:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);



/**
 * =====================================================
 * 🗑️ DELETE /api/projets/:id
 * Supprimer un projet (propriétaire uniquement)
 * =====================================================
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['professional', 'admin']),
  async (req, res) => {
    const { id } = req.params;

    const projet = await prisma.projet.findUnique({ where: { id } });
    if (!projet) return res.status(404).json({ success: false });

    if (projet.idpro !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false });
    }

    if (projet.media) {
      const filePath = projet.media.split('/media/')[1];
      if (filePath) {
        await supabase.storage.from('media').remove([filePath]);
      }
    }

    await prisma.projet.delete({ where: { id } });
    res.json({ success: true, message: 'Projet supprimé' });
  }
);

module.exports = router;

