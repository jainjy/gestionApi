const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createCandidature = async (req, res) => {
  try {
    const {
      offreId,
      offreType,
      titreOffre,
      messageMotivation,
      cvUrl,
      lettreMotivationUrl,
      nomCandidat,
      emailCandidat,
      telephoneCandidat,
      documents
    } = req.body;

    // Validation
    if (!offreId || !offreType || !titreOffre) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants'
      });
    }

    // Vérifier si l'offre existe selon son type
    let offreExistante;
    switch (offreType) {
      case 'formation':
        offreExistante = await prisma.formation.findUnique({
          where: { id: parseInt(offreId), status: 'active' }
        });
        break;
      case 'emploi':
        offreExistante = await prisma.emploi.findUnique({
          where: { id: parseInt(offreId), status: 'active' }
        });
        break;
      case 'alternance':
        offreExistante = await prisma.alternanceStage.findUnique({
          where: { id: parseInt(offreId), status: 'active' }
        });
        break;
      default:
        return res.status(400).json({
          error: "Type d'offre invalide"
        });
    }

    if (!offreExistante) {
      return res.status(404).json({
        error: 'Offre non trouvée ou non disponible'
      });
    }

    // Vérifier si l'utilisateur a déjà postulé
    const candidatureExistante = await prisma.candidature.findFirst({
      where: {
        userId: req.user.id,
        offreId: parseInt(offreId),
        offreType
      }
    });

    if (candidatureExistante) {
      return res.status(400).json({
        error: 'Vous avez déjà postulé à cette offre'
      });
    }

    // Créer la candidature
    const candidature = await prisma.candidature.create({
      data: {
        userId: req.user.id,
        offreId: parseInt(offreId),
        offreType,
        titreOffre,
        messageMotivation: messageMotivation || '',
        cvUrl: cvUrl || null,
        lettreMotivationUrl: lettreMotivationUrl || null,
        nomCandidat: nomCandidat || req.user.name || null,
        emailCandidat: emailCandidat || req.user.email || null,
        telephoneCandidat: telephoneCandidat || null,
        documents: documents || null
      }
    });

    // Mettre à jour le compteur de candidatures de l'offre
    switch (offreType) {
      case 'formation':
        await prisma.formation.update({
          where: { id: parseInt(offreId) },
          data: { applications: { increment: 1 } }
        });
        break;
      case 'emploi':
        await prisma.emploi.update({
          where: { id: parseInt(offreId) },
          data: { candidaturesCount: { increment: 1 } }
        });
        break;
      case 'alternance':
        await prisma.alternanceStage.update({
          where: { id: parseInt(offreId) },
          data: { candidaturesCount: { increment: 1 } }
        });
        break;
    }

    res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès',
      candidature
    });

  } catch (error) {
    console.error('Erreur lors de la création de candidature:', error);
    res.status(500).json({
      error: 'Erreur serveur'
    });
  }
};

exports.getUserCandidatures = async (req, res) => {
  try {
    const { type, statut } = req.query;

    const whereClause = {
      userId: req.user.id
    };

    if (type) {
      whereClause.offreType = type;
    }

    if (statut) {
      whereClause.statut = statut;
    }

    // Inclure dynamiquement les relations
    const include = {};
    if (type) {
      if (type === 'formation') {
        include.formation = true;
      } else if (type === 'emploi') {
        include.emploi = true;
      } else if (type === 'alternance') {
        include.alternanceStage = true;
      }
    } else {
      // Si pas de type spécifié, inclure toutes les relations
      include.formation = true;
      include.emploi = true;
      include.alternanceStage = true;
    }

    const candidatures = await prisma.candidature.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include
    });

    res.json({ candidatures });

  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures:', error);
    res.status(500).json({
      error: 'Erreur serveur'
    });
  }
};