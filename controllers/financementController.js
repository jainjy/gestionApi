const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Récupérer tous les partenaires de financement
exports.getPartenaires = async (req, res) => {
  try {
    const partenaires = await prisma.financementPartenaire.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        ServiceFinancier: {
          where: { isActive: true },
          select: { id: true, nom: true, type: true },
        },
      },
    });
    res.json(partenaires);
  } catch (error) {
    console.error("Erreur getPartenaires:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des partenaires" });
  }
};

exports.getPartenairesPro = async (req, res) => {
  try {
    console.log('User ID:', req.user?.id);
    console.log('User:', req.user);
    
    const userId = req.user?.id;
    
    const partenaires = await prisma.financementPartenaire.findMany({
      where: { 
        isActive: true,
        userId: userId 
      },
      include: {
        ServiceFinancier: {
          where: { isActive: true },
          select: { id: true, nom: true, type: true },
        },
      },
    });
    
    console.log('Partenaires trouvés:', partenaires.length);
    console.log('Query where clause:', { isActive: true, userId: userId });
    
    res.json(partenaires);
  } catch (error) {
    console.error("Erreur getPartenaires:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des partenaires" });
  }
};

exports.getPartenairesDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const partenaires = await prisma.financementPartenaire.findFirst({
      where: { isActive: true, id: parseInt(id) },
      include: {
        ServiceFinancier: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });
    res.json(partenaires);
  } catch (error) {
    console.error("Erreur getPartenaires:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du partenaires" });
  }
};

// Créer un partenaire (admin)
exports.createPartenaire = async (req, res) => {
  try {
    const {
      nom,
      description,
      type,
      avantages,
      icon,
      website,
      phone,
      email,
      address,
      conditions,
      tauxMin,
      tauxMax,
      dureeMin,
      dureeMax,
      montantMin,
      montantMax,
      userId,
    } = req.body;

    const partenaire = await prisma.financementPartenaire.create({
      data: {
        nom,
        description,
        type,
        avantages: avantages || [],
        icon: icon || "",
        website: website || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        conditions: conditions || null,
        tauxMin: tauxMin ? parseFloat(tauxMin) : null,
        tauxMax: tauxMax ? parseFloat(tauxMax) : null,
        dureeMin: dureeMin ? parseInt(dureeMin) : null,
        dureeMax: dureeMax ? parseInt(dureeMax) : null,
        montantMin: montantMin ? parseFloat(montantMin) : null,
        montantMax: montantMax ? parseFloat(montantMax) : null,
        userId: userId || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Partenaire créé avec succès",
      data: partenaire,
    });
  } catch (error) {
    console.error("Erreur création partenaire:", error);
    res.status(500).json({ error: "Erreur lors de la création du partenaire" });
  }
};

// Mettre à jour un partenaire (admin)
exports.updatePartenaire = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const partenaire = await prisma.financementPartenaire.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Partenaire mis à jour avec succès",
      data: partenaire,
    });
  } catch (error) {
    console.error("Erreur updatePartenaire:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du partenaire" });
  }
};

// Supprimer un partenaire (admin)
exports.deletePartenaire = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.financementPartenaire.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Partenaire supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur deletePartenaire:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du partenaire" });
  }
};

// Récupérer tous les utilisateurs professionnels (admin)
exports.getProfessionals = async (req, res) => {
  try {
    const professionals = await prisma.user.findMany({
      where: {
        role: "professional",
        status: "active",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(professionals);
  } catch (error) {
    console.error("Erreur getProfessionals:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des professionnels" });
  }
};

// Récupérer tous les services d'assurance
exports.getAssurances = async (req, res) => {
  try {
    const assurances = await prisma.assuranceService.findMany({
      where: { isActive: true },
    });
    res.json(assurances);
  } catch (error) {
    console.error("Erreur getAssurances:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des assurances" });
  }
};

// Soumettre une demande de financement
exports.submitDemande = async (req, res) => {
  try {
    const {
      nom,
      email,
      telephone,
      message,
      type,
      montant,
      duree,
      estimation,
      partenaireId,
      assuranceId,
      userId,
      serviceFinancierId,
    } = req.body;

    const demande = await prisma.financementDemande.create({
      data: {
        nom,
        email,
        telephone,
        message,
        type,
        montant: montant ? parseFloat(montant) : null,
        duree: duree ? parseInt(duree) : null,
        estimation: estimation ? parseFloat(estimation) : null,
        partenaireId: partenaireId ? parseInt(partenaireId) : null,
        assuranceId: assuranceId ? parseInt(assuranceId) : null,
        userId: userId || null,
        serviceFinancierId: serviceFinancierId || null,
      },
    });

    res.json({
      success: true,
      message: "Demande envoyée avec succès",
      data: demande,
    });
  } catch (error) {
    console.error("Erreur création demande:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi de la demande" });
  }
};

// Récupérer les demandes d'un utilisateur
exports.getUserDemandes = async (req, res) => {
  try {
    const { userId } = req.params;

    const demandes = await prisma.financementDemande.findMany({
      where: { userId },
      include: {
        partenaire: true,
        assurance: true,
        serviceFinancier: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(demandes);
  } catch (error) {
    console.error("Erreur getUserDemandes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des demandes" });
  }
};

// ============================================================================
// FONCTIONS ADMIN
// ============================================================================

// Récupérer toutes les demandes de financement (admin)
exports.getAllDemandes = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const user = req.user;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    if (user.role == "professional") {
      const partenaireIds = await prisma.financementPartenaire.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      const ids = partenaireIds.map((p) => p.id);
      where.partenaireId = { in: ids };
    }

    const demandes = await prisma.financementDemande.findMany({
      where: where,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        assurance: {
          select: { id: true, nom: true },
        },
        serviceFinancier: {
          select: { id: true, nom: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.financementDemande.count({ where });

    res.json({
      demandes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Erreur getAllDemandes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des demandes" });
  }
};

// Mettre à jour le statut d'une demande (admin)
exports.updateDemandeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const demande = await prisma.financementDemande.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: demande,
    });
  } catch (error) {
    console.error("Erreur updateDemandeStatus:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
  }
};

// Supprimer une demande (admin)
exports.deleteDemande = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.financementDemande.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Demande supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteDemande:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la demande" });
  }
};

// Récupérer tous les services financiers (public)
exports.getServicesFinanciers = async (req, res) => {
  try {
    const { partenaireId, type, categorie } = req.query;

    const where = { isActive: true };
    if (partenaireId) where.partenaireId = parseInt(partenaireId);
    if (type) where.type = type;
    if (categorie) where.categorie = categorie;

    const services = await prisma.serviceFinancier.findMany({
      where,
      include: {
        partenaire: {
          select: {
            id: true,
            nom: true,
            icon: true,
            website: true,
          },
        },
      },
      orderBy: { ordreAffichage: "asc" },
    });

    res.json(services);
  } catch (error) {
    console.error("Erreur getServicesFinanciers:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des services financiers",
    });
  }
};

// Récupérer tous les services financiers (professionnel)
exports.getServicesFinanciersPro = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, categorie } = req.query;

    const partenaires = await prisma.financementPartenaire.findMany({
      where: { userId: userId, isActive: true },
      include: {
        ServiceFinancier: {
          where: {
            isActive: true,
            ...(type && { type }),
            ...(categorie && { categorie }),
          },
          orderBy: { ordreAffichage: "asc" },
        },
      },
    });

    res.json(partenaires);
  } catch (error) {
    console.error("Erreur getServicesFinanciersPro:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des services financiers",
    });
  }
};

// Récupérer un service financier par ID (public)
exports.getServiceFinancierById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceFinancier.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: {
            id: true,
            nom: true,
            description: true,
            icon: true,
            website: true,
            phone: true,
            email: true,
            conditions: true,
            tauxMin: true,
            tauxMax: true,
            dureeMin: true,
            dureeMax: true,
            montantMin: true,
            montantMax: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service financier non trouvé" });
    }

    res.json(service);
  } catch (error) {
    console.error("Erreur getServiceFinancierById:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du service financier" });
  }
};

// Créer un service financier (professionnel ou admin)
exports.createServiceFinancier = async (req, res) => {
  try {
    const {
      nom,
      description,
      type,
      categorie,
      partenaireId,
      conditions,
      avantages,
      taux,
      dureeMin,
      dureeMax,
      montantMin,
      montantMax,
      fraisDossier,
      assuranceObligatoire,
      documentsRequises,
      delaiTraitement,
      ordreAffichage,
    } = req.body;

    // Pour les admin, pas besoin de vérifier les permissions
    if (req.user.role !== "admin") {
      const partenaire = await prisma.financementPartenaire.findUnique({
        where: { id: parseInt(partenaireId) },
        include: { user: true },
      });

      if (!partenaire) {
        return res.status(404).json({ error: "Partenaire non trouvé" });
      }

      if (partenaire.userId !== req.user.id) {
        return res
          .status(403)
          .json({
            error: "Non autorisé à créer un service pour ce partenaire",
          });
      }
    }

    const service = await prisma.serviceFinancier.create({
      data: {
        nom,
        description,
        type,
        categorie,
        partenaireId: parseInt(partenaireId),
        conditions: conditions || null,
        avantages: avantages || [],
        taux: taux ? parseFloat(taux) : null,
        dureeMin: dureeMin ? parseInt(dureeMin) : null,
        dureeMax: dureeMax ? parseInt(dureeMax) : null,
        montantMin: montantMin ? parseFloat(montantMin) : null,
        montantMax: montantMax ? parseFloat(montantMax) : null,
        fraisDossier: fraisDossier ? parseFloat(fraisDossier) : null,
        assuranceObligatoire: assuranceObligatoire || false,
        documentsRequises: documentsRequises || [],
        delaiTraitement: delaiTraitement || null,
        ordreAffichage: ordreAffichage || 0,
        isActive: req.user.role === "admin",
      },
      include: {
        partenaire: {
          select: {
            id: true,
            nom: true,
            icon: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Service financier créé avec succès",
      data: service,
    });
  } catch (error) {
    console.error("Erreur création service financier:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création du service financier" });
  }
};

// Mettre à jour un service financier (professionnel ou admin)
exports.updateServiceFinancier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await prisma.serviceFinancier.findUnique({
      where: { id },
      include: {
        partenaire: {
          include: { user: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service financier non trouvé" });
    }

    if (
      req.user.role !== "admin" &&
      service.partenaire.userId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Non autorisé à modifier ce service" });
    }

    const dataToUpdate = {};
    const numericFields = [
      "taux",
      "dureeMin",
      "dureeMax",
      "montantMin",
      "montantMax",
      "fraisDossier",
      "ordreAffichage",
    ];

    Object.keys(updateData).forEach((key) => {
      if (numericFields.includes(key) && updateData[key] !== undefined) {
        dataToUpdate[key] = parseFloat(updateData[key]);
      } else if (key === "avantages" && Array.isArray(updateData[key])) {
        dataToUpdate[key] = updateData[key];
      } else if (
        key === "documentsRequises" &&
        Array.isArray(updateData[key])
      ) {
        dataToUpdate[key] = updateData[key];
      } else if (updateData[key] !== undefined) {
        dataToUpdate[key] = updateData[key];
      }
    });

    const updatedService = await prisma.serviceFinancier.update({
      where: { id },
      data: dataToUpdate,
      include: {
        partenaire: {
          select: {
            id: true,
            nom: true,
            icon: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Service financier mis à jour avec succès",
      data: updatedService,
    });
  } catch (error) {
    console.error("Erreur updateServiceFinancier:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du service financier" });
  }
};

// Supprimer un service financier (professionnel ou admin)
exports.deleteServiceFinancier = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceFinancier.findUnique({
      where: { id },
      include: {
        partenaire: {
          include: { user: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service financier non trouvé" });
    }

    if (
      req.user.role !== "admin" &&
      service.partenaire.userId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Non autorisé à supprimer ce service" });
    }

    await prisma.serviceFinancier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Service financier supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteServiceFinancier:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du service financier" });
  }
};

// ============================================================================
// FONCTIONS ADMIN SERVICES FINANCIERS
// ============================================================================

// Récupérer tous les services financiers (admin) - CORRIGÉ
exports.getAllServicesFinanciers = async (req, res) => {
  try {
    const { page = 1, limit = 10, partenaireId, type, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true }; // Par défaut, on montre seulement les actifs

    // Appliquer les filtres seulement s'ils sont spécifiés
    if (partenaireId && partenaireId !== "all") {
      where.partenaireId = parseInt(partenaireId);
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (isActive && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    const services = await prisma.serviceFinancier.findMany({
      where,
      include: {
        partenaire: {
          select: {
            id: true,
            nom: true,
            icon: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              },
            },
          },
        },
        FinancementDemande: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.serviceFinancier.count({ where });

    res.json({
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Erreur getAllServicesFinanciers:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des services financiers",
    });
  }
};

// Activer/désactiver un service financier (admin)
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const service = await prisma.serviceFinancier.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      message: `Service ${isActive ? "activé" : "désactivé"} avec succès`,
      data: service,
    });
  } catch (error) {
    console.error("Erreur toggleServiceStatus:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification du statut du service" });
  }
};
