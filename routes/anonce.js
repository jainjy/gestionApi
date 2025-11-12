const express = require("express");
const router = express.Router();
const { prisma,pool } = require("../lib/db");
const { upload, uploadToSupabase } = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");

// ✅ Création d'une propriété (auth requise)
router.post("/",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        status,
        price,
        surface,
        rooms,
        bedrooms,
        bathrooms,
        address,
        city,
        zipCode,
        latitude,
        longitude,
        features,
        listingType,
        rentType,
      } = req.body;

      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
      }

      // Validation des champs obligatoires
      if (!title || !city || !type) {
        return res
          .status(400)
          .json({ error: "Champs obligatoires : title, city, type" });
      }

      // Validation des champs numériques
      if (price && isNaN(parseFloat(price))) {
        return res.status(400).json({ error: "Le prix doit être un nombre valide" });
      }
      if (surface && isNaN(parseInt(surface))) {
        return res.status(400).json({ error: "La surface doit être un nombre valide" });
      }

      let imageUrls = [];
      
      // Upload des images vers Supabase
      if (req.files?.length > 0) {
        try {
          const uploads = await Promise.all(
            req.files.map((file) => uploadToSupabase(file, "property-images"))
          );
          imageUrls = uploads.map((f) => f.url);
        } catch (uploadError) {
          console.error("Erreur upload images:", uploadError);
          return res.status(500).json({ error: "Erreur lors de l'upload des images" });
        }
      }

      // Génération du slug unique
      const baseSlug = title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .substring(0, 80);

      let slug = baseSlug;
      let counter = 1;

      // Vérifier si le slug existe déjà
      while (true) {
        const existingProperty = await prisma.property.findUnique({
          where: { slug },
        });

        if (!existingProperty) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
        
        if (counter > 100) {
          return res.status(500).json({ error: "Erreur de génération du slug" });
        }
      }

      // Création de l'annonce
      const property = await prisma.property.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          type,
          status: status || "pending",
          price: price ? parseFloat(price) : null,
          surface: surface ? parseInt(surface) : null,
          rooms: rooms ? parseInt(rooms) : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          address: address ? address.trim() : null,
          city: city.trim(),
          zipCode: zipCode ? zipCode.trim() : null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          ownerId,
          features: features ? features.split(",").map((f) => f.trim()) : [],
          images: imageUrls,
          listingType: listingType || "sale",
          rentType: rentType || "longue_duree",
          slug,
          metaDescription: "Annonces & Transaction", 
        },
      });

      res.status(201).json({
        message: "✅ Annonce créée avec succès",
        property,
      });
    } catch (error) {
      console.error("Erreur création property:", error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({ error: "Une propriété avec ce slug existe déjà" });
      }
      
      res.status(500).json({ error: "Erreur serveur lors de la création de l'annonce" });
    }
  }
);

// ✅ Route : afficher toutes les annonces ajoutées (protégée par token)
router.get("/affiche_anonce", authenticateToken, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        metaDescription: "Annonces & Transaction", // ← filtre ajouté
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        price: true,
        surface: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        address: true,
        city: true,
        zipCode: true,
        features: true,
        images: true,
        listingType: true,
        rentType: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "✅ Liste des propriétés récupérée avec succès",
      data: properties,
    });
  } catch (error) {
    console.error("Erreur récupération annonces:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du chargement des propriétés",
    });
  }
});


module.exports = router;
