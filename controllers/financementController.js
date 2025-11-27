const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les partenaires de financement
exports.getPartenaires = async (req, res) => {
  try {
    const partenaires = await prisma.financementPartenaire.findMany({
      where: { isActive: true }
    });
    res.json(partenaires);
  } catch (error) {
    console.error('Erreur getPartenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des partenaires' });
  }
};
exports.getPartenairesDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const partenaires = await prisma.financementPartenaire.findFirst({
      where: { isActive: true, id: parseInt(id) },include: {
        ServiceFinancier: true,
      }
    });
    res.json(partenaires);
  } catch (error) {
    console.error("Erreur getPartenaires:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du partenaires" });
  }
};

// Récupérer tous les services d'assurance
exports.getAssurances = async (req, res) => {
  try {
    const assurances = await prisma.assuranceService.findMany({
      where: { isActive: true }
    });
    res.json(assurances);
  } catch (error) {
    console.error('Erreur getAssurances:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des assurances' });
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
      userId
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
        userId: userId || null
      }
    });

    res.json({ 
      success: true, 
      message: 'Demande envoyée avec succès', 
      data: demande 
    });
  } catch (error) {
    console.error('Erreur création demande:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la demande' });
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
        assurance: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(demandes);
  } catch (error) {
    console.error('Erreur getUserDemandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

// ============================================================================
// FONCTIONS ADMIN
// ============================================================================

// Récupérer toutes les demandes de financement (admin)
exports.getAllDemandes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const demandes = await prisma.financementDemande.findMany({
      where,
      include: {
        partenaire: {
          select: { id: true, nom: true }
        },
        assurance: {
          select: { id: true, nom: true }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.financementDemande.count({ where });

    res.json({
      demandes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erreur getAllDemandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

// Mettre à jour le statut d'une demande (admin)
exports.updateDemandeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const demande = await prisma.financementDemande.update({
      where: { id },
      data: { status }
    });

    res.json({ 
      success: true, 
      message: 'Statut mis à jour avec succès', 
      data: demande 
    });
  } catch (error) {
    console.error('Erreur updateDemandeStatus:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

// Supprimer une demande (admin)
exports.deleteDemande = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.financementDemande.delete({
      where: { id }
    });

    res.json({ 
      success: true, 
      message: 'Demande supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur deleteDemande:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la demande' });
  }
};