// middleware/upload-documents.js
const multer = require("multer");
const { supabase } = require("../lib/supabase");

// Configuration Multer pour le traitement des fichiers en mémoire
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max pour les documents
  },
  fileFilter: (req, file, cb) => {
    // Accepter les documents et images
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  },
});

// Fonction pour uploader un document vers Supabase - CORRECTION DU BUCKET
const uploadDocumentToSupabase = async (file, folder = "documents") => {
  try {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    console.log(`📤 Upload vers Supabase: ${fileName}`);
    console.log(`📦 Bucket: documents`); // CHANGEMENT ICI

    // UTILISER LE BUCKET "documents" AU LIEU DE "blog-images"
    const { data, error } = await supabase.storage
      .from("documents") // CHANGEMENT CRITIQUE ICI
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      console.error("❌ Erreur upload Supabase:", error);
      throw error;
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(fileName); // CHANGEMENT ICI

    console.log(`✅ Upload réussi: ${publicUrl}`);

    return {
      url: publicUrl,
      path: fileName,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    };
  } catch (error) {
    console.error("❌ Erreur upload Supabase:", error);
    throw error;
  }
};

// Fonction pour supprimer un document de Supabase - CORRECTION DU BUCKET
const deleteDocumentFromSupabase = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from("documents") // CHANGEMENT CRITIQUE ICI
      .remove([filePath]);

    if (error) {
      console.error("❌ Erreur suppression Supabase:", error);
      throw error;
    }

    console.log(`✅ Fichier supprimé: ${filePath}`);
    return data;
  } catch (error) {
    console.error("❌ Erreur suppression Supabase:", error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadDocumentToSupabase,
  deleteDocumentFromSupabase,
};
