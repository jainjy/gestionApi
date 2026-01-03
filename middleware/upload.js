// middleware/upload.js
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Configuration Multer pour le traitement des fichiers en mémoire
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max pour l'audio et les fichiers
  },
  fileFilter: (req, file, cb) => {
    // ✅ CORRECTION: Accepter les images, fichiers audio ET les PDF
    const acceptedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      // PDF et documents
      "application/pdf",
      "application/octet-stream",
    ];

    if (acceptedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log(`❌ Type de fichier rejeté: ${file.mimetype}`);
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  },
});

// Fonction pour uploader vers Supabase
const uploadToSupabase = async (file, folder = "blog-images") => {
  try {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    let bucket = "blog-images";
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      name: file.originalname,
      type: file.mimetype,
      bucket: bucket,
    };
  } catch (error) {
    console.error("Erreur upload Supabase:", error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadToSupabase,
};
