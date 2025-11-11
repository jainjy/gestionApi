const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const mediaDirs = {
  audio: 'uploads/audio',
  video: 'uploads/videos',
  thumbnails: 'uploads/thumbnails'
};

Object.values(mediaDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.mimetype.startsWith('audio/')) {
      uploadPath = mediaDirs.audio;
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = mediaDirs.video;
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = mediaDirs.thumbnails;
    } else {
      return cb(new Error('Type de fichier non supporté'));
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nom unique : timestamp + nom original
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'],
    video: ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 'video/webm'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  };

  const isAudio = allowedTypes.audio.includes(file.mimetype);
  const isVideo = allowedTypes.video.includes(file.mimetype);
  const isImage = allowedTypes.image.includes(file.mimetype);

  if (isAudio || isVideo || isImage) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non supporté. Formats acceptés: ${Object.values(allowedTypes).flat().join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
    files: 5
  }
});

// Middlewares spécifiques
const uploadAudio = upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);
const uploadVideo = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

module.exports = {
  uploadAudio,
  uploadVideo,
  upload
};