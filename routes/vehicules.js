const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { prisma } = require("../lib/db");

// GET: Tous les véhicules avec filtres
router.get("/", async (req, res) => {
  try {
    const {
      type,
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

    if (type && type !== "tous") {
      where.typeVehicule = type;
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

// POST: Créer un véhicule (Prestataire)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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
      images,
      equipements,
      caracteristiques,
      description,
      agence,
      conditionsLocation,
    } = req.body;

    // Vérifier si l'utilisateur est un professionnel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });

    if (!["professional", "prestataire"].includes(user.userType)) {
      return res.status(403).json({
        success: false,
        error: "Seuls les professionnels peuvent ajouter des véhicules",
      });
    }

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

    const vehicule = await prisma.vehicule.create({
      data: {
        prestataireId: userId,
        marque,
        modele,
        annee: parseInt(annee),
        immatriculation,
        couleur,
        puissance,
        typeVehicule,
        carburant,
        transmission,
        places: parseInt(places) || 5,
        portes: parseInt(portes) || 5,
        volumeCoffre,
        ville,
        adresse,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        prixJour: parseFloat(prixJour),
        prixSemaine: prixSemaine ? parseFloat(prixSemaine) : null,
        prixMois: prixMois ? parseFloat(prixMois) : null,
        kilometrageInclus: kilometrageInclus || "300 km/jour",
        caution: parseFloat(caution) || 500,
        images: Array.isArray(images) ? images : [],
        equipements: equipements || {},
        caracteristiques: Array.isArray(caracteristiques)
          ? caracteristiques
          : [],
        description,
        agence: agence || user.companyName || user.commercialName,
        conditionsLocation,
        disponible: true,
        statut: "active",
        publishedAt: new Date(),
      },
    });

    // Créer la notification Socket.io
    if (req.io) {
      req.io.emit("new-vehicule", {
        type: "vehicule_created",
        vehiculeId: vehicule.id,
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
    console.error("Erreur création véhicule:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création du véhicule",
    });
  }
});

// PUT: Mettre à jour un véhicule
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

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
        error: "Vous n'êtes pas autorisé à modifier ce véhicule",
      });
    }

    // Convertir les nombres
    if (updateData.annee) updateData.annee = parseInt(updateData.annee);
    if (updateData.prixJour)
      updateData.prixJour = parseFloat(updateData.prixJour);
    if (updateData.prixSemaine)
      updateData.prixSemaine = parseFloat(updateData.prixSemaine);
    if (updateData.prixMois)
      updateData.prixMois = parseFloat(updateData.prixMois);
    if (updateData.caution) updateData.caution = parseFloat(updateData.caution);
    if (updateData.places) updateData.places = parseInt(updateData.places);
    if (updateData.portes) updateData.portes = parseInt(updateData.portes);

    const updatedVehicule = await prisma.vehicule.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedVehicule,
      message: "Véhicule mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur mise à jour véhicule:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du véhicule",
    });
  }
});

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

// GET: Statistiques des véhicules
router.get("/stats/global", async (req, res) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalVehicules,
        COUNT(CASE WHEN disponible = true THEN 1 END) as disponibles,
        COUNT(CASE WHEN carburant = 'electrique' THEN 1 END) as electriques,
        COUNT(CASE WHEN carburant = 'hybride' THEN 1 END) as hybrides,
        AVG(prixJour) as prixMoyen,
        MIN(prixJour) as prixMin,
        MAX(prixJour) as prixMax
      FROM "Vehicule"
      WHERE statut = 'active'
    `;

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Erreur récupération stats:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    });
  }
});

module.exports = router;
