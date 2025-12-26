const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { prisma } = require("../lib/db");
const { upload, uploadToSupabase } = require("../middleware/upload");

// GET: Tous les véhicules avec filtres (MIS À JOUR)
router.get("/", async (req, res) => {
  try {
    const {
      categorie,
      typeVehicule,
      marque,
      transmission,
      carburant,
      ville,
      minPrice,
      maxPrice,
      disponible,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 12,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Nouveau filtre par catégorie
    if (categorie && categorie !== "tous") {
      where.categorie = categorie;
    }

    if (typeVehicule && typeVehicule !== "tous") {
      where.typeVehicule = typeVehicule;
    }

    if (marque) {
      where.marque = { contains: marque, mode: "insensitive" };
    }

    if (transmission && transmission !== "tous") {
      where.transmission = transmission;
    }

    if (carburant && carburant !== "tous") {
      where.carburant = carburant;
    }

    if (ville && ville !== "tous") {
      where.ville = ville;
    }

    if (minPrice || maxPrice) {
      where.prixJour = {};
      if (minPrice) where.prixJour.gte = parseFloat(minPrice);
      if (maxPrice) where.prixJour.lte = parseFloat(maxPrice);
    }

    if (disponible !== undefined) {
      where.disponible = disponible === "true";
    }

    if (search) {
      where.OR = [
        { marque: { contains: search, mode: "insensitive" } },
        { modele: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ville: { contains: search, mode: "insensitive" } },
        { typeVehicule: { contains: search, mode: "insensitive" } },
      ];
    }

    // Statut actif
    where.statut = "active";

    // Compter le total
    const total = await prisma.vehicule.count({ where });

    // Récupérer les véhicules
    const vehicules = await prisma.vehicule.findMany({
      where,
      include: {
        prestataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
        disponibilites: {
          where: {
            disponible: true,
            dateFin: { gte: new Date() },
          },
          orderBy: { dateDebut: "asc" },
          take: 5,
        },
        _count: {
          select: {
            reservations: true,
            avis: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: parseInt(limit),
    });

    // Calculer la moyenne des notes
    const vehiculesAvecStats = await Promise.all(
      vehicules.map(async (vehicule) => {
        const avis = await prisma.avisVehicule.findMany({
          where: { vehiculeId: vehicule.id, statut: "actif" },
          select: { rating: true },
        });

        const rating =
          avis.length > 0
            ? avis.reduce((sum, avis) => sum + avis.rating, 0) / avis.length
            : 0;

        return {
          ...vehicule,
          rating: parseFloat(rating.toFixed(1)),
          nombreAvis: avis.length,
        };
      })
    );

    res.json({
      success: true,
      data: vehiculesAvecStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erreur récupération véhicules:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des véhicules",
    });
  }
});

// POST: Créer un véhicule (MIS À JOUR)
router.post(
  "/",
  authenticateToken,
  requireRole(["professional", "admin"]),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        categorie,
        marque,
        modele,
        annee,
        immatriculation,
        couleur,
        typeVehicule,
        carburant,
        transmission,
        places,
        portes,
        cylindree,
        typeVelo,
        assistanceElec,
        poids,
        ville,
        adresse,
        latitude,
        longitude,
        prixJour,
        prixSemaine,
        prixMois,
        caution,
        description,
      } = req.body;

      console.log("📝 Données reçues:", {
        categorie,
        marque,
        modele,
        immatriculation,
      });

      // Vérifier si l'utilisateur est un professionnel
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true, companyName: true, commercialName: true },
      });

      // Pour les vélos, pas d'immatriculation obligatoire
      if (categorie !== "velo" && immatriculation) {
        // Vérifier si l'immatriculation existe déjà
        const existingVehicule = await prisma.vehicule.findUnique({
          where: { immatriculation },
        });

        if (existingVehicule) {
          return res.status(400).json({
            success: false,
            error: "Cette immatriculation est déjà enregistrée",
          });
        }
      }

      // Upload des images vers Supabase
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        console.log("📤 Upload des images vers Supabase...");
        for (const file of req.files) {
          try {
            const { url } = await uploadToSupabase(file, "vehicules");
            imageUrls.push(url);
            console.log("✅ Image uploadée:", url);
          } catch (uploadError) {
            console.error("❌ Erreur upload image:", uploadError);
            throw new Error(
              `Erreur lors de l'upload de l'image: ${uploadError.message}`
            );
          }
        }
      }

      if (imageUrls.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Au moins une image est requise pour créer un véhicule",
        });
      }

      // Préparer les données avec les nouveaux champs
      const vehiculeData = {
        prestataireId: userId,
        categorie,
        marque,
        modele,
        annee: annee ? parseInt(annee) : null,
        immatriculation: categorie === "velo" ? null : immatriculation,
        couleur,
        typeVehicule,
        carburant: categorie === "velo" ? null : carburant,
        transmission: categorie === "velo" ? null : transmission,
        places: places ? parseInt(places) : null,
        portes: portes ? parseInt(portes) : null,
        cylindree: cylindree ? parseInt(cylindree) : null,
        typeVelo,
        assistanceElec: assistanceElec === "true" || assistanceElec === true,
        poids: poids ? parseFloat(poids) : null,
        ville,
        adresse,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        prixJour: parseFloat(prixJour),
        prixSemaine: prixSemaine ? parseFloat(prixSemaine) : null,
        prixMois: prixMois ? parseFloat(prixMois) : null,
        caution: parseFloat(caution) || 500,
        images: imageUrls,
        description,
        disponible: true,
        statut: "active",
      };

      // Nettoyer les champs null
      Object.keys(vehiculeData).forEach(
        (key) => vehiculeData[key] === null && delete vehiculeData[key]
      );

      // Créer le véhicule
      const vehicule = await prisma.vehicule.create({
        data: vehiculeData,
      });

      console.log("✅ Véhicule créé avec succès:", vehicule.id);

      // Créer la notification Socket.io
      if (req.io) {
        req.io.emit("new-vehicule", {
          type: "vehicule_created",
          vehiculeId: vehicule.id,
          categorie: vehicule.categorie,
          marque: vehicule.marque,
          modele: vehicule.modele,
          ville: vehicule.ville,
          prixJour: vehicule.prixJour,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(201).json({
        success: true,
        data: vehicule,
        message: "Véhicule ajouté avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur création véhicule:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur lors de la création du véhicule",
      });
    }
  }
);

// GET: Statistiques des véhicules (MIS À JOUR)
router.get("/stats/global", async (req, res) => {
  try {
    // Récupérer les statistiques par catégorie
    const statsByCategory = await prisma.vehicule.groupBy({
      by: ["categorie"],
      where: { statut: "active" },
      _count: { id: true },
      _avg: { prixJour: true },
    });

    // Statistiques globales
    const globalStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as "totalVehicules",
        COUNT(CASE WHEN disponible = true THEN 1 END) as "disponibles",
        COUNT(CASE WHEN carburant = 'electrique' THEN 1 END) as "electriques",
        COUNT(CASE WHEN carburant = 'hybride' THEN 1 END) as "hybrides",
        AVG("prixJour") as "prixMoyen",
        MIN("prixJour") as "prixMin",
        MAX("prixJour") as "prixMax"
      FROM "Vehicule"
      WHERE statut = 'active'
    `;

    // Compter par catégorie
    const categories = await prisma.vehicule.groupBy({
      by: ["categorie"],
      where: { statut: "active" },
      _count: { id: true },
    });

    // Convertir les statistiques
    const convertedStats = {
      totalVehicules: Number(globalStats[0].totalVehicules),
      disponibles: Number(globalStats[0].disponibles),
      electriques: Number(globalStats[0].electriques),
      hybrides: Number(globalStats[0].hybrides),
      prixMoyen: globalStats[0].prixMoyen
        ? parseFloat(globalStats[0].prixMoyen)
        : 0,
      prixMin: globalStats[0].prixMin ? parseFloat(globalStats[0].prixMin) : 0,
      prixMax: globalStats[0].prixMax ? parseFloat(globalStats[0].prixMax) : 0,
      parCategorie: categories.reduce((acc, category) => {
        acc[category.categorie] = Number(category._count.id);
        return acc;
      }, {}),
      statsByCategory: statsByCategory.map((stat) => ({
        categorie: stat.categorie,
        count: Number(stat._count.id),
        avgPrice: stat._avg.prixJour ? parseFloat(stat._avg.prixJour) : 0,
      })),
    };

    res.json({
      success: true,
      data: convertedStats,
    });
  } catch (error) {
    console.error("Erreur récupération stats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
});

// GET: Véhicule par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const vehicule = await prisma.vehicule.findUnique({
      where: { id },
      include: {
        prestataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            commercialName: true,
            avatar: true,
            phone: true,
            email: true,
            rating: true,
            reviewCount: true,
          },
        },
        disponibilites: {
          where: {
            disponible: true,
            dateFin: { gte: new Date() },
          },
          orderBy: { dateDebut: "asc" },
        },
        avis: {
          where: { statut: "actif" },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            reservations: true,
            avis: true,
          },
        },
      },
    });

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        error: "Véhicule non trouvé",
      });
    }

    // Calculer la moyenne des notes
    const avis = await prisma.avisVehicule.findMany({
      where: { vehiculeId: id, statut: "actif" },
    });

    const rating =
      avis.length > 0
        ? avis.reduce((sum, avis) => sum + avis.rating, 0) / avis.length
        : 0;

    // Incrémenter le compteur de vues
    await prisma.vehicule.update({
      where: { id },
      data: { vues: { increment: 1 } },
    });

    res.json({
      success: true,
      data: {
        ...vehicule,
        rating: parseFloat(rating.toFixed(1)),
        nombreAvis: avis.length,
      },
    });
  } catch (error) {
    console.error("Erreur récupération véhicule:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du véhicule",
    });
  }
});

// PUT: Mettre à jour un véhicule - VERSION CORRIGÉE
router.put(
  "/:id",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log("📝 Mise à jour véhicule ID:", id);
      console.log("📸 Nouvelles images:", req.files?.length || 0);
      console.log("📦 Corps de la requête:", req.body);

      // Vérifier si le véhicule appartient à l'utilisateur ou si c'est un admin
      const vehicule = await prisma.vehicule.findUnique({
        where: { id },
        select: { prestataireId: true, images: true },
      });

      if (!vehicule) {
        return res.status(404).json({
          success: false,
          error: "Véhicule non trouvé",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (vehicule.prestataireId !== userId && user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Vous n'êtes pas autorisé à modifier ce véhicule",
        });
      }

      // Récupérer les données
      const {
        marque,
        modele,
        annee,
        immatriculation,
        couleur,
        puissance,
        typeVehicule,
        carburant,
        transmission,
        places,
        portes,
        volumeCoffre,
        ville,
        adresse,
        latitude,
        longitude,
        prixJour,
        prixSemaine,
        prixMois,
        kilometrageInclus,
        caution,
        equipements,
        caracteristiques,
        description,
        agence,
        conditionsLocation,
        disponible,
        statut,
      } = req.body;

      // Parsing des champs JSON
      let parsedEquipements = {};
      let parsedCaracteristiques = [];

      if (equipements) {
        try {
          parsedEquipements = JSON.parse(equipements);
        } catch (e) {
          parsedEquipements = {};
        }
      }

      if (caracteristiques) {
        try {
          parsedCaracteristiques = JSON.parse(caracteristiques);
        } catch (e) {
          parsedCaracteristiques = [];
        }
      }

      // Traiter les images
      let finalImages = vehicule.images || [];

      // Uploader les nouvelles images vers Supabase
      if (req.files && req.files.length > 0) {
        console.log("📤 Upload des nouvelles images...");
        for (const file of req.files) {
          try {
            const { url } = await uploadToSupabase(file, "vehicules");
            finalImages.push(url);
            console.log("✅ Nouvelle image ajoutée:", url);
          } catch (uploadError) {
            console.error("❌ Erreur upload nouvelle image:", uploadError);
          }
        }
      }

      // Limiter à 10 images maximum
      if (finalImages.length > 10) {
        finalImages = finalImages.slice(0, 10);
      }

      // Préparer les données de mise à jour
      const updateData = {
        marque: marque || undefined,
        modele: modele || undefined,
        annee: annee ? parseInt(annee) : undefined,
        immatriculation: immatriculation || undefined,
        couleur: couleur || undefined,
        puissance: puissance || undefined,
        typeVehicule: typeVehicule || undefined,
        carburant: carburant || undefined,
        transmission: transmission || undefined,
        places: places ? parseInt(places) : undefined,
        portes: portes ? parseInt(portes) : undefined,
        volumeCoffre: volumeCoffre || undefined,
        ville: ville || undefined,
        adresse: adresse || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        prixJour: prixJour ? parseFloat(prixJour) : undefined,
        prixSemaine: prixSemaine ? parseFloat(prixSemaine) : undefined,
        prixMois: prixMois ? parseFloat(prixMois) : undefined,
        kilometrageInclus: kilometrageInclus || undefined,
        caution: caution ? parseFloat(caution) : undefined,
        images: finalImages,
        equipements: parsedEquipements,
        caracteristiques: Array.isArray(parsedCaracteristiques)
          ? parsedCaracteristiques
          : [],
        description: description || undefined,
        agence: agence || undefined,
        conditionsLocation: conditionsLocation || undefined,
        updatedAt: new Date(),
      };

      // Gérer les booléens
      if (disponible !== undefined) {
        updateData.disponible = disponible === "true" || disponible === true;
      }

      if (statut) {
        updateData.statut = statut;
      }

      // Nettoyer les champs undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      console.log("📝 Données de mise à jour:", updateData);

      // Mettre à jour le véhicule
      const updatedVehicule = await prisma.vehicule.update({
        where: { id },
        data: updateData,
      });

      console.log("✅ Véhicule mis à jour avec succès:", updatedVehicule.id);

      res.json({
        success: true,
        data: updatedVehicule,
        message: "Véhicule mis à jour avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur mise à jour véhicule:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erreur lors de la mise à jour du véhicule",
      });
    }
  }
);

// DELETE: Supprimer un véhicule
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier si le véhicule appartient à l'utilisateur ou si c'est un admin
    const vehicule = await prisma.vehicule.findUnique({
      where: { id },
      select: { prestataireId: true },
    });

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        error: "Véhicule non trouvé",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (vehicule.prestataireId !== userId && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer ce véhicule",
      });
    }

    // Vérifier s'il y a des réservations en cours
    const reservationsActives = await prisma.reservationVehicule.findFirst({
      where: {
        vehiculeId: id,
        statut: { in: ["en_attente", "confirmee", "en_cours"] },
      },
    });

    if (reservationsActives) {
      return res.status(400).json({
        success: false,
        error:
          "Impossible de supprimer ce véhicule car il a des réservations actives",
      });
    }

    // Marquer comme supprimé plutôt que supprimer physiquement
    await prisma.vehicule.update({
      where: { id },
      data: {
        statut: "supprime",
        disponible: false,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Véhicule supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression véhicule:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du véhicule",
    });
  }
});

// GET: Véhicules d'un prestataire
router.get("/prestataire/:prestataireId", async (req, res) => {
  try {
    const { prestataireId } = req.params;

    const vehicules = await prisma.vehicule.findMany({
      where: {
        prestataireId,
        statut: "active",
      },
      include: {
        _count: {
          select: {
            reservations: true,
            avis: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ajouter les notes moyennes
    const vehiculesAvecStats = await Promise.all(
      vehicules.map(async (vehicule) => {
        const avis = await prisma.avisVehicule.findMany({
          where: { vehiculeId: vehicule.id, statut: "actif" },
        });

        const rating =
          avis.length > 0
            ? avis.reduce((sum, avis) => sum + avis.rating, 0) / avis.length
            : 0;

        return {
          ...vehicule,
          rating: parseFloat(rating.toFixed(1)),
          nombreAvis: avis.length,
        };
      })
    );

    res.json({
      success: true,
      data: vehiculesAvecStats,
    });
  } catch (error) {
    console.error("Erreur récupération véhicules prestataire:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des véhicules",
    });
  }
});

module.exports = router;
