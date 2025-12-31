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
      'audio/aac',
      'audio/x-m4a',
      'audio/mp4',
      'audio/x-wav'
    ];
    if (allowedAudioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier audio non supporté. Formats acceptés: MP3, WAV, OGG, AAC, M4A'), false);
    }
  } 
  else if (file.fieldname === 'video') {
    const allowedVideoTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
      'video/avi',
      'video/x-ms-wmv'
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier vidéo non supporté. Formats acceptés: MP4, MOV, AVI, WebM, MKV, WMV'), false);
    }
  }
  else if (file.fieldname === 'thumbnail' || file.fieldname === 'image') {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml'
    ];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type d\'image non supporté. Formats acceptés: JPEG, PNG, WebP, GIF, SVG'), false);
    }
  }
  else {
    cb(new Error('Champ de fichier non reconnu'), false);
  }
};

// Fonction pour obtenir la limite de taille selon le type de fichier
const getFileSizeLimit = (fieldname) => {
  const limits = {
    audio: 100 * 1024 * 1024, // 100MB pour les podcasts
    video: 500 * 1024 * 1024, // 500MB pour les vidéos
    thumbnail: 10 * 1024 * 1024, // 10MB pour les images
    image: 10 * 1024 * 1024 // 10MB pour les images
  };
  return limits[fieldname] || 10 * 1024 * 1024; // 10MB par défaut
};

// Configuration Multer de base
const createMulterConfig = (fields) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: Math.max(...fields.map(field => getFileSizeLimit(field.name)))
    }
  }).fields(fields);
};

// Middleware spécifique pour l'upload de podcasts
const uploadAudio = (req, res, next) => {
  const uploadMiddleware = createMulterConfig([
    { name: 'audio', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload audio:', err.message);
      
      // Nettoyer les fichiers temporaires en cas d'erreur
      if (req.files) {
        manualCleanup(req.files);
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Validation des fichiers requis
    if (!req.files || !req.files.audio) {
      if (req.files) manualCleanup(req.files);
      return res.status(400).json({
        success: false,
        message: 'Fichier audio requis'
      });
    }

    console.log('✅ Fichiers audio temporaires enregistrés:');
    if (req.files.audio) {
      console.log('   🎵 Audio:', req.files.audio[0].originalname, `(${(req.files.audio[0].size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (req.files.thumbnail) {
      console.log('   🖼️  Thumbnail:', req.files.thumbnail[0].originalname, `(${(req.files.thumbnail[0].size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    
    console.log('📤 Prêts pour Supabase');
    next();
  });
};

// Middleware spécifique pour l'upload de vidéos
const uploadVideo = (req, res, next) => {
  const uploadMiddleware = createMulterConfig([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload vidéo:', err.message);
      
      // Nettoyer les fichiers temporaires en cas d'erreur
      if (req.files) {
        manualCleanup(req.files);
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Validation des fichiers requis
    if (!req.files || !req.files.video) {
      if (req.files) manualCleanup(req.files);
      return res.status(400).json({
        success: false,
        message: 'Fichier vidéo requis'
      });
    }

    console.log('✅ Fichiers vidéo temporaires enregistrés:');
    if (req.files.video) {
      console.log('   🎬 Vidéo:', req.files.video[0].originalname, `(${(req.files.video[0].size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (req.files.thumbnail) {
      console.log('   🖼️  Thumbnail:', req.files.thumbnail[0].originalname, `(${(req.files.thumbnail[0].size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    
    console.log('📤 Prêts pour Supabase');
    next();
  });
};

// Middleware pour upload d'images simples
const uploadImage = (req, res, next) => {
  const uploadMiddleware = createMulterConfig([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload image:', err.message);
      
      if (req.files) {
        manualCleanup(req.files);
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    console.log('✅ Fichiers image temporaires enregistrés');
    if (req.files) {
      Object.entries(req.files).forEach(([field, files]) => {
        files.forEach(file => {
          console.log(`   📸 ${field}:`, file.originalname, `(${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
        });
      });
    }
    
    next();
  });
};

// Middleware de nettoyage automatique
const cleanupTempFiles = (req, res, next) => {
  // Sauvegarder la méthode send originale
  const originalSend = res.send;
  
  res.send = function(data) {
    // Nettoyer les fichiers temporaires après envoi de la réponse
    if (req.files) {
      setTimeout(() => {
        console.log('🧹 Nettoyage automatique des fichiers temporaires...');
        manualCleanup(req.files);
      }, 3000); // Nettoyage après 3 secondes
    }
    
    // Restaurer la méthode send originale
    res.send = originalSend;
    return res.send(data);
  };
  
  next();
};

// Nettoyage manuel en cas d'erreur
const manualCleanup = (files) => {
  if (!files) {
    console.log('🧹 Aucun fichier à nettoyer');
    return;
  }
  
  let cleanedCount = 0;
  let errorCount = 0;
  
  Object.values(files).forEach(fileArray => {
    fileArray.forEach(file => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log('   ✅ Fichier nettoyé:', file.path);
          cleanedCount++;
        } catch (error) {
          console.warn('   ⚠️ Impossible de nettoyer le fichier:', file.path, error.message);
          errorCount++;
        }
      } else {
        console.log('   ℹ️  Fichier déjà nettoyé:', file.path);
      }
    });
  });
  
  console.log(`🧹 Nettoyage terminé: ${cleanedCount} fichiers supprimés, ${errorCount} erreurs`);
};

// Fonction utilitaire pour valider les fichiers
const validateFiles = (files, requiredFields = []) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!files[field] || files[field].length === 0) {
      errors.push(`Le champ ${field} est requis`);
    }
  });
  
  // Validation des tailles de fichiers
  if (files) {
    Object.entries(files).forEach(([field, fileArray]) => {
      fileArray.forEach(file => {
        const maxSize = getFileSizeLimit(field);
        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024);
          errors.push(`Le fichier ${file.originalname} est trop volumineux. Maximum: ${maxSizeMB}MB`);
        }
      });
    });
  }
  
  return errors;
};

// Middleware pour logger les uploads
const logUpload = (req, res, next) => {
  const startTime = Date.now();
  
  console.log('📥 Début upload:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  });
  
  // Logger la fin de l'upload
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📤 Upload terminé: ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

const uploadVideoOrImage = (req, res, next) => {
  const uploadMiddleware = createMulterConfig([
    { name: 'video', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload média:', err.message);
      if (req.files) manualCleanup(req.files);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.files?.video && !req.files?.image) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier image ou vidéo reçu',
      });
    }

    console.log('✅ Média reçu:', {
      video: req.files?.video?.[0]?.originalname,
      image: req.files?.image?.[0]?.originalname,
    });

    next();
  });
};

// Middleware pour upload d'images multiples
const uploadMultipleImages = (req, res, next) => {
  const uploadMiddleware = createMulterConfig([
    { name: 'image', maxCount: 10 }, // Jusqu'à 10 images
  ]);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload images multiples:', err.message);
      
      if (req.files) {
        manualCleanup(req.files);
      }

      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    console.log('✅ Images multiples reçues:', 
      req.files?.image?.length || 0, 'fichier(s)');
    
    next();
  });
};


module.exports = {
  upload: multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  }),

  uploadAudio,
  uploadVideo,
  uploadImage,
  uploadVideoOrImage, // ✅ AJOUTÉ ICI
  cleanupTempFiles,
  manualCleanup,
   uploadMultipleImages,
  validateFiles,
  logUpload,
  getFileSizeLimit,
};
