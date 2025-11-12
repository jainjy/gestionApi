const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer pour stockage TEMPORAIRE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Créer des dossiers temporaires selon le type
    let uploadPath = '';
    
    if (file.fieldname === 'audio') {
      uploadPath = 'uploads/temp/audio/';
    } else if (file.fieldname === 'video') {
      uploadPath = 'uploads/temp/videos/';
    } else if (file.fieldname === 'thumbnail' || file.fieldname === 'image') {
      uploadPath = 'uploads/temp/thumbnails/';
    } else {
      uploadPath = 'uploads/temp/others/';
    }

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  console.log('📁 Fichier reçu:', file.fieldname, file.mimetype, file.originalname);

  // Validation des types MIME
  if (file.fieldname === 'audio') {
    const allowedAudioTypes = [
      'audio/mpeg', 
      'audio/mp3', 
      'audio/wav', 
      'audio/ogg', 
      'audio/aac'
    ];
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier audio non supporté. Formats acceptés: MP3, WAV, OGG, AAC'), false);
    }
  } 
  else if (file.fieldname === 'video') {
    const allowedVideoTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo'
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier vidéo non supporté. Formats acceptés: MP4, MOV, AVI'), false);
    }
  }
  else if (file.fieldname === 'thumbnail' || file.fieldname === 'image') {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type d\'image non supporté. Formats acceptés: JPEG, PNG, WebP, GIF'), false);
    }
  }
  else {
    cb(new Error('Champ de fichier non reconnu'), false);
  }
};

// Configuration Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: {
      audio: 100 * 1024 * 1024, // 100MB pour les podcasts
      video: 500 * 1024 * 1024, // 500MB pour les vidéos
      thumbnail: 10 * 1024 * 1024 // 10MB pour les images
    }[this?.fieldname] || 10 * 1024 * 1024 // 10MB par défaut
  }
});

// Middleware spécifique pour l'upload de podcasts
const uploadAudio = (req, res, next) => {
  const uploadMiddleware = upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload audio:', err.message);
      
      // Nettoyer les fichiers temporaires en cas d'erreur
      if (req.files) {
        Object.values(req.files).forEach(files => {
          files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Validation des fichiers requis
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        message: 'Fichier audio requis'
      });
    }

    console.log('✅ Fichiers audio temporaires enregistrés, prêts pour Supabase');
    next();
  });
};

// Middleware spécifique pour l'upload de vidéos
const uploadVideo = (req, res, next) => {
  const uploadMiddleware = upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload vidéo:', err.message);
      
      // Nettoyer les fichiers temporaires en cas d'erreur
      if (req.files) {
        Object.values(req.files).forEach(files => {
          files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Validation des fichiers requis
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Fichier vidéo requis'
      });
    }

    console.log('✅ Fichiers vidéo temporaires enregistrés, prêts pour Supabase');
    next();
  });
};

// Middleware de nettoyage automatique (optionnel)
const cleanupTempFiles = (req, res, next) => {
  // Intercepter la réponse pour nettoyer après envoi
  const originalSend = res.send;
  
  res.send = function(data) {
    // Nettoyer les fichiers temporaires après envoi de la réponse
    if (req.files) {
      setTimeout(() => {
        Object.values(req.files).forEach(files => {
          files.forEach(file => {
            if (fs.existsSync(file.path)) {
              try {
                fs.unlinkSync(file.path);
                console.log('🧹 Fichier temporaire nettoyé:', file.path);
              } catch (cleanupError) {
                console.warn('⚠️ Impossible de nettoyer le fichier temporaire:', cleanupError.message);
              }
            }
          });
        });
      }, 5000); // Nettoyage après 5 secondes
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Nettoyage manuel en cas d'erreur
const manualCleanup = (files) => {
  if (!files) return;
  
  Object.values(files).forEach(fileArray => {
    fileArray.forEach(file => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log('🧹 Nettoyage manuel réussi:', file.path);
        } catch (error) {
          console.warn('⚠️ Nettoyage manuel échoué:', error.message);
        }
      }
    });
  });
};

module.exports = {
  upload,
  uploadAudio,
  uploadVideo,
  cleanupTempFiles,
  manualCleanup
};