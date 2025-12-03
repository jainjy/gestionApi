const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { upload, uploadToSupabase } = require("../middleware/upload");

// Middleware de débogage pour toutes les routes
router.use((req, res, next) => {
  console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`   Headers:`, {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'PRESENT' : 'MISSING'
  });
  next();
});

// =======================================
// AJOUT CATÉGORIE D'ACTIVITÉ AVEC IMAGE
// =======================================
router.post(
  "/",
  authenticateToken,
  requireRole("professional"),
  upload.single("image"),
  async (req, res) => {
    console.log("📥 ============ DÉBUT AJOUT CATÉGORIE ============");
    
    try {
      // 1. Vérification de l'authentification
      console.log("🔐 Étape 1: Vérification authentification");
      if (!req.user || !req.user.id) {
        console.error("❌ ÉCHEC: Utilisateur non authentifié");
        console.log("   req.user:", req.user);
        return res.status(401).json({
          success: false,
          message: "Non authentifié"
        });
      }

      console.log("✅ Authentification OK");
      console.log("   👤 Utilisateur ID:", req.user.id);
      console.log("   👤 Rôle:", req.user.role);
      console.log("   👤 Email:", req.user.email);

      // 2. Vérification du rôle
      console.log("👮 Étape 2: Vérification rôle");
      if (req.user.role !== "professional") {
        console.error("❌ ÉCHEC: Rôle insuffisant:", req.user.role);
        return res.status(403).json({
          success: false,
          message: "Accès réservé aux professionnels"
        });
      }
      console.log("✅ Rôle OK");

      // 3. Analyse des données reçues
      console.log("📨 Étape 3: Analyse des données reçues");
      console.log("   📋 Content-Type:", req.headers['content-type']);
      console.log("   📏 Content-Length:", req.headers['content-length']);
      
      // Vérifier si c'est une requête multipart
      const isMultipart = req.headers['content-type'] && 
                         req.headers['content-type'].includes('multipart/form-data');
      console.log("   🎯 Multipart/form-data:", isMultipart ? "✅ OUI" : "❌ NON");

      // 4. Analyse du fichier image
      console.log("🖼️ Étape 4: Analyse du fichier image");
      console.log("   📸 Fichier reçu:", req.file ? `✅ OUI - ${req.file.originalname} (${req.file.size} bytes)` : "❌ NON");
      
      if (req.file) {
        console.log("   📝 Détails fichier:", {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          bufferLength: req.file.buffer ? req.file.buffer.length : 'NO BUFFER'
        });
      }

      // 5. Analyse du corps de la requête
      console.log("📄 Étape 5: Analyse du corps de la requête");
      console.log("   🔑 Clés dans req.body:", Object.keys(req.body));
      
      // Afficher toutes les clés-valeurs
      for (const key in req.body) {
        const value = req.body[key];
        console.log(`   📌 ${key}:`, 
          typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value
        );
      }

      // 6. Extraction des données
      console.log("🔍 Étape 6: Extraction des données");
      let name, description, icon, color, isActive;
      
      // Essayer différentes méthodes d'extraction
      if (req.body.name) {
        name = req.body.name;
        console.log("   ✅ Nom extrait de req.body.name:", name);
      } else if (req.body.data) {
        try {
          const data = JSON.parse(req.body.data);
          name = data.name;
          console.log("   ✅ Nom extrait de req.body.data:", name);
        } catch (error) {
          console.error("   ❌ Erreur parsing req.body.data:", error.message);
        }
      }
      
      description = req.body.description || "";
      icon = req.body.icon || "";
      color = req.body.color || "#3B82F6";
      isActive = req.body.isActive !== undefined 
        ? (req.body.isActive === "false" || req.body.isActive === false ? false : true)
        : true;

      console.log("   📋 Données extraites:", {
        name: name || "NULL",
        description: description || "NULL",
        icon: icon || "NULL",
        color: color || "NULL",
        isActive: isActive
      });

      // 7. Validation des données
      console.log("✅ Étape 7: Validation des données");
      if (!name || name.trim() === "") {
        console.error("❌ ÉCHEC: Nom manquant ou vide");
        return res.status(400).json({
          success: false,
          message: "Le nom de la catégorie est obligatoire"
        });
      }
      console.log("✅ Validation OK");

      // 8. Upload de l'image (si présente)
      let imageUrl = null;
      if (req.file) {
        console.log("☁️ Étape 8: Upload vers Supabase");
        try {
          console.log("   📤 Début upload...");
          const uploaded = await uploadToSupabase(req.file, "activity-categories");
          imageUrl = uploaded.url;
          console.log("   ✅ Upload réussi:", imageUrl);
        } catch (uploadError) {
          console.error("   ❌ Erreur upload:", uploadError.message);
          console.log("   ⚠️ Continuer sans image...");
        }
      } else {
        console.log("🔄 Étape 8: Pas d'image à uploader");
      }

      // 9. Vérification des doublons
      console.log("🔍 Étape 9: Vérification des doublons");
      const trimmedName = name.trim();
      console.log("   🔎 Recherche catégorie:", trimmedName);
      
      const existingCategory = await prisma.activityCategory.findUnique({
        where: { name: trimmedName }
      });

      if (existingCategory) {
        console.error("❌ ÉCHEC: Catégorie déjà existante");
        console.log("   📊 ID existant:", existingCategory.id);
        return res.status(409).json({
          success: false,
          message: "Une catégorie avec ce nom existe déjà"
        });
      }
      console.log("✅ Aucun doublon trouvé");

      // 10. Préparation des données
      console.log("📦 Étape 10: Préparation des données");
      const categoryData = {
        name: trimmedName,
        description: description.trim(),
        icon: icon,
        color: color,
        isActive: isActive,
        image: imageUrl
      };

      console.log("   📊 Données à insérer:", categoryData);

      // 11. Création dans la base de données
      console.log("💾 Étape 11: Création dans la base de données");
      console.log("   🔄 Connexion à Prisma...");
      
      const category = await prisma.activityCategory.create({
        data: categoryData
      });

      console.log("✅ SUCCÈS: Catégorie créée!");
      console.log("   🆔 ID:", category.id);
      console.log("   📅 Créée le:", category.createdAt);
      console.log("============ FIN AJOUT CATÉGORIE ============\n");

      res.status(201).json({
        success: true,
        message: "Catégorie d'activité ajoutée avec succès ✅",
        data: category
      });

    } catch (error) {
      console.error("❌ ============ ERREUR CRITIQUE ============");
      console.error("⏰ Heure:", new Date().toISOString());
      console.error("📝 Message:", error.message);
      console.error("🔢 Code:", error.code);
      console.error("📚 Nom:", error.name);
      console.error("🔍 Stack complète:");
      console.error(error.stack);
      console.error("📊 Données req au moment de l'erreur:");
      console.error("   User:", req.user);
      console.error("   File:", req.file ? "PRESENT" : "ABSENT");
      console.error("   Body keys:", Object.keys(req.body));
      console.error("==========================================\n");
      
      // Gestion des erreurs spécifiques Prisma
      if (error.code === 'P2002') {
        console.error("⚠️ Erreur de contrainte unique (doublon)");
        return res.status(409).json({
          success: false,
          message: "Une catégorie avec ce nom existe déjà"
        });
      }

      if (error.code === 'P2003') {
        console.error("⚠️ Erreur de clé étrangère");
        return res.status(400).json({
          success: false,
          message: "Erreur de relation dans la base de données"
        });
      }

      if (error.name === 'PrismaClientValidationError') {
        console.error("⚠️ Erreur de validation Prisma");
        console.error("   Détails:", error.message);
        return res.status(400).json({
          success: false,
          message: "Données invalides pour la création",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      if (error.name === 'PrismaClientInitializationError') {
        console.error("⚠️ Erreur d'initialisation Prisma");
        return res.status(503).json({
          success: false,
          message: "Base de données non accessible"
        });
      }

      // Erreur générale
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      });
    }
  }
);

// =======================================
// MODIFICATION D'UNE CATÉGORIE D'ACTIVITÉ (PUT)
// =======================================
router.put(
  "/:id",
  authenticateToken,
  requireRole("professional"),
  upload.single("image"),
  async (req, res) => {
    console.log("📝 ============ DÉBUT MODIFICATION CATÉGORIE ============");
    console.log(`   🆔 ID catégorie: ${req.params.id}`);
    
    try {
      // 1. Vérification de l'authentification et du rôle
      console.log("🔐 Étape 1: Vérification authentification et rôle");
      if (!req.user || req.user.role !== "professional") {
        console.error("❌ ÉCHEC: Non autorisé");
        return res.status(403).json({
          success: false,
          message: "Accès réservé aux professionnels"
        });
      }
      console.log("✅ Authentification OK");

      // 2. Vérification de l'existence de la catégorie
      console.log("🔍 Étape 2: Vérification existence catégorie");
      const categoryId = req.params.id;
      
      const existingCategory = await prisma.activityCategory.findUnique({
        where: { id: categoryId }
      });

      if (!existingCategory) {
        console.error("❌ ÉCHEC: Catégorie non trouvée");
        return res.status(404).json({
          success: false,
          message: "Catégorie non trouvée"
        });
      }
      console.log("✅ Catégorie trouvée:", existingCategory.name);

      // 3. Extraction des données
      console.log("📋 Étape 3: Extraction des données");
      const { name, description, icon, color, isActive } = req.body;
      
      console.log("   📊 Données reçues:", {
        name: name || "Non modifié",
        description: description || "Non modifié",
        icon: icon || "Non modifié",
        color: color || "Non modifié",
        isActive: isActive !== undefined ? isActive : "Non modifié",
        imageFile: req.file ? `Présent (${req.file.originalname})` : "Absent"
      });

      // 4. Vérification des doublons (si nom modifié)
      let newName = null;
      if (name && name.trim() !== "") {
        newName = name.trim();
        
        // Vérifier si le nouveau nom est différent de l'ancien
        if (newName !== existingCategory.name) {
          console.log("🔍 Vérification doublon avec nouveau nom:", newName);
          
          const duplicateCategory = await prisma.activityCategory.findUnique({
            where: { name: newName }
          });

          if (duplicateCategory) {
            console.error("❌ ÉCHEC: Ce nom est déjà utilisé");
            return res.status(409).json({
              success: false,
              message: "Une catégorie avec ce nom existe déjà"
            });
          }
          console.log("✅ Nouveau nom disponible");
        }
      }

      // 5. Upload de la nouvelle image (si présente)
      let imageUrl = existingCategory.image;
      if (req.file) {
        console.log("☁️ Étape 5: Upload nouvelle image");
        try {
          console.log("   📤 Début upload...");
          const uploaded = await uploadToSupabase(req.file, "activity-categories");
          imageUrl = uploaded.url;
          console.log("   ✅ Upload réussi:", imageUrl);
          
          // Optionnel: Supprimer l'ancienne image de Supabase
          // (implémenter une fonction deleteFromSupabase si nécessaire)
          
        } catch (uploadError) {
          console.error("   ❌ Erreur upload:", uploadError.message);
          console.log("   ⚠️ Conservation de l'ancienne image");
        }
      } else {
        console.log("🔄 Étape 5: Pas de nouvelle image");
      }

      // 6. Préparation des données de mise à jour
      console.log("📦 Étape 6: Préparation données de mise à jour");
      const updateData = {};
      
      if (newName) updateData.name = newName;
      if (description !== undefined) updateData.description = description.trim();
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (isActive !== undefined) {
        updateData.isActive = isActive === "false" || isActive === false ? false : true;
      }
      if (imageUrl !== existingCategory.image) {
        updateData.image = imageUrl;
      }

      console.log("   📊 Données à mettre à jour:", updateData);

      // 7. Mise à jour dans la base de données
      console.log("💾 Étape 7: Mise à jour dans la base de données");
      
      const updatedCategory = await prisma.activityCategory.update({
        where: { id: categoryId },
        data: updateData
      });

      console.log("✅ SUCCÈS: Catégorie modifiée!");
      console.log("   🆔 ID:", updatedCategory.id);
      console.log("   📅 Modifiée le:", new Date().toISOString());
      console.log("============ FIN MODIFICATION CATÉGORIE ============\n");

      res.status(200).json({
        success: true,
        message: "Catégorie d'activité modifiée avec succès ✅",
        data: updatedCategory
      });

    } catch (error) {
      console.error("❌ ============ ERREUR MODIFICATION ============");
      console.error("📝 Message:", error.message);
      console.error("🔢 Code:", error.code);
      console.error("📊 Données:", {
        id: req.params.id,
        body: req.body,
        file: req.file ? "PRESENT" : "ABSENT"
      });
      console.error("============================================\n");
      
      // Gestion des erreurs spécifiques Prisma
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Catégorie non trouvée"
        });
      }

      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: "Une catégorie avec ce nom existe déjà"
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la modification de la catégorie",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =======================================
// SUPPRESSION D'UNE CATÉGORIE D'ACTIVITÉ (DELETE)
// =======================================
router.delete(
  "/:id",
  authenticateToken,
  requireRole("professional"),
  async (req, res) => {
    console.log("🗑️ ============ DÉBUT SUPPRESSION CATÉGORIE ============");
    console.log(`   🆔 ID catégorie: ${req.params.id}`);
    
    try {
      // 1. Vérification de l'authentification et du rôle
      console.log("🔐 Étape 1: Vérification authentification et rôle");
      if (!req.user || req.user.role !== "professional") {
        console.error("❌ ÉCHEC: Non autorisé");
        return res.status(403).json({
          success: false,
          message: "Accès réservé aux professionnels"
        });
      }
      console.log("✅ Authentification OK");

      // 2. Vérification de l'existence de la catégorie
      console.log("🔍 Étape 2: Vérification existence catégorie");
      const categoryId = req.params.id;
      
      const existingCategory = await prisma.activityCategory.findUnique({
        where: { id: categoryId },
        include: {
          activities: {
            select: { id: true }
          }
        }
      });

      if (!existingCategory) {
        console.error("❌ ÉCHEC: Catégorie non trouvée");
        return res.status(404).json({
          success: false,
          message: "Catégorie non trouvée"
        });
      }
      console.log("✅ Catégorie trouvée:", existingCategory.name);
      console.log(`   📊 Activités associées: ${existingCategory.activities.length}`);

      // 3. Vérification des dépendances (activités associées)
      console.log("🔗 Étape 3: Vérification des dépendances");
      if (existingCategory.activities.length > 0) {
        console.error("❌ ÉCHEC: Catégorie a des activités associées");
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer cette catégorie car elle contient des activités",
          activitiesCount: existingCategory.activities.length,
          suggestion: "Supprimez d'abord les activités ou déplacez-les vers une autre catégorie"
        });
      }
      console.log("✅ Aucune dépendance trouvée");

      // 4. Suppression de la catégorie
      console.log("💾 Étape 4: Suppression dans la base de données");
      
      const deletedCategory = await prisma.activityCategory.delete({
        where: { id: categoryId }
      });

      console.log("✅ SUCCÈS: Catégorie supprimée!");
      console.log("   🗑️ Nom:", deletedCategory.name);
      console.log("   📅 Supprimée le:", new Date().toISOString());
      
      // Optionnel: Supprimer l'image de Supabase si elle existe
      if (deletedCategory.image) {
        console.log("🖼️ Info: Image à supprimer manuellement de Supabase:", deletedCategory.image);
      }

      console.log("============ FIN SUPPRESSION CATÉGORIE ============\n");

      res.status(200).json({
        success: true,
        message: "Catégorie d'activité supprimée avec succès ✅",
        data: {
          id: deletedCategory.id,
          name: deletedCategory.name,
          deletedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("❌ ============ ERREUR SUPPRESSION ============");
      console.error("📝 Message:", error.message);
      console.error("🔢 Code:", error.code);
      console.error("🆔 ID:", req.params.id);
      console.error("============================================\n");
      
      // Gestion des erreurs spécifiques Prisma
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Catégorie non trouvée"
        });
      }

      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer cette catégorie car elle est référencée par d'autres données",
          suggestion: "Supprimez d'abord les activités associées à cette catégorie"
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la catégorie",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =======================================
// VERSION SIMPLIFIÉE POUR TEST (sans image)
// =======================================
router.post(
  "/simple",
  authenticateToken,
  requireRole("professional"),
  async (req, res) => {
    console.log("🧪 ============ TEST SIMPLE ============");
    
    try {
      console.log("📨 Données reçues:", req.body);
      console.log("👤 Utilisateur:", req.user);
      
      const { name, description, icon, color, isActive } = req.body;

      if (!name) {
        console.error("❌ Nom manquant");
        return res.status(400).json({
          success: false,
          message: "Nom requis"
        });
      }

      console.log("🔍 Vérification doublon...");
      const existing = await prisma.activityCategory.findUnique({
        where: { name: name.trim() }
      });

      if (existing) {
        console.error("❌ Doublon trouvé");
        return res.status(409).json({
          success: false,
          message: "Catégorie existante"
        });
      }

      console.log("💾 Création en cours...");
      const category = await prisma.activityCategory.create({
        data: {
          name: name.trim(),
          description: description || "",
          icon: icon || "",
          color: color || "#3B82F6",
          isActive: isActive === "false" ? false : true,
          image: null
        }
      });

      console.log("✅ Test simple réussi!");
      console.log("🆔 ID créé:", category.id);

      res.status(201).json({
        success: true,
        message: "Catégorie ajoutée (test simple)",
        data: category
      });

    } catch (error) {
      console.error("❌ Erreur test simple:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// =======================================
// ROUTE DE TEST DE BASE
// =======================================
router.get('/test', (req, res) => {
  console.log("✅ Route /test appelée");
  console.log("   Headers:", req.headers);
  
  res.json({
    success: true,
    message: "Route ActivityCategory fonctionnelle",
    timestamp: new Date().toISOString(),
    server: "Node.js/" + process.version,
    endpoints: {
      POST: "/ (ajout avec image)",
      PUT: "/:id (modification)",
      DELETE: "/:id (suppression)",
      POST_simple: "/simple (ajout sans image)",
      GET: "/ (liste)",
      GET_public: "/public (liste publique)",
      GET_test: "/test (cette route)",
      GET_health: "/health/db (santé BD)"
    }
  });
});

// =======================================
// RÉCUPÉRATION DES CATÉGORIES D'ACTIVITÉS (GET)
// =======================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log("📥 GET / - Récupération des catégories");
    console.log("👤 Utilisateur:", req.user);
    
    const categories = await prisma.activityCategory.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ ${categories.length} catégories récupérées`);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error("❌ Erreur GET catégories:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des catégories",
      error: error.message
    });
  }
});

// =======================================
// RÉCUPÉRATION DE TOUTES LES CATÉGORIES (PUBLIC)
// =======================================
router.get("/public", async (req, res) => {
  try {
    const categories = await prisma.activityCategory.findMany({
      where: {
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error("Erreur récupération catégories publiques :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des catégories"
    });
  }
});

// =======================================
// RÉCUPÉRATION D'UNE CATÉGORIE SPÉCIFIQUE
// =======================================
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /${id} - Récupération catégorie spécifique`);

    const category = await prisma.activityCategory.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            prestataire: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      console.error(`❌ Catégorie ${id} non trouvée`);
      return res.status(404).json({
        success: false,
        message: "Catégorie non trouvée"
      });
    }

    console.log(`✅ Catégorie ${id} trouvée`);
    res.status(200).json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error("Erreur récupération catégorie :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la catégorie"
    });
  }
});

// =======================================
// ROUTE POUR VÉRIFIER LA CONNEXION PRISMA
// =======================================
router.get('/health/db', async (req, res) => {
  try {
    console.log("🏥 Vérification santé base de données");
    
    // Test simple de connexion
    const count = await prisma.activityCategory.count();
    
    console.log("✅ Base de données accessible");
    console.log(`   📊 Nombre de catégories: ${count}`);
    
    res.json({
      success: true,
      message: "Base de données accessible",
      categoryCount: count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) { 
    console.error("❌ Erreur connexion base de données:", error);
    res.status(503).json({
      success: false,
      message: "Base de données non accessible",
      error: error.message
    });
  }
});

// =======================================
// ROUTE POUR LA SUPPRESSION MULTIPLE (OPTIONNEL)
// =======================================
router.delete(
  "/",
  authenticateToken,
  requireRole("professional"),
  async (req, res) => {
    console.log("🗑️ ============ SUPPRESSION MULTIPLE ============");
    
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Tableau d'IDs requis"
        });
      }

      console.log(`   📋 IDs à supprimer: ${ids.length}`);
      
      // Vérifier les dépendances
      const categoriesWithActivities = await prisma.activityCategory.findMany({
        where: {
          id: { in: ids }
        },
        include: {
          _count: {
            select: { activities: true }
          }
        }
      });

      const hasDependencies = categoriesWithActivities.some(
        cat => cat._count.activities > 0
      );

      if (hasDependencies) {
        return res.status(400).json({
          success: false,
          message: "Certaines catégories ont des activités associées",
          details: categoriesWithActivities.map(cat => ({
            id: cat.id,
            name: cat.name,
            activitiesCount: cat._count.activities
          }))
        });
      }

      // Suppression en masse
      const result = await prisma.activityCategory.deleteMany({
        where: {
          id: { in: ids }
        }
      });

      console.log(`✅ ${result.count} catégories supprimées`);
      
      res.status(200).json({
        success: true,
        message: `${result.count} catégorie(s) supprimée(s) avec succès`,
        count: result.count
      });

    } catch (error) {
      console.error("❌ Erreur suppression multiple:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression multiple",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;