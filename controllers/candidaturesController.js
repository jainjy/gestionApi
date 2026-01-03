const { PrismaClient } = require('@prisma/client');const prisma = new PrismaClient();

exports.createCandidature = async (req, res) => {
  console.log('📝 POST /candidatures - Début');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  
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
        success: false,
        error: 'Champs obligatoires manquants'
      });
    }

    const offreIdNum = parseInt(offreId);
    if (isNaN(offreIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'offreId doit être un nombre'
      });
    }

    // 🔴 CORRECTION : Déterminer quel champ utiliser selon le type
    let offreField;
    let whereCondition;
    
    switch (offreType.toLowerCase()) {
      case 'formation':
        offreField = 'formationId';
        whereCondition = { formationId: offreIdNum };
        break;
      case 'emploi':
        offreField = 'emploiId';
        whereCondition = { emploiId: offreIdNum };
        break;
      case 'alternance':
        offreField = 'alternanceStageId';
        whereCondition = { alternanceStageId: offreIdNum };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Type d'offre invalide"
        });
    }

    // Vérifier si l'offre existe
    let offreExistante;
    switch (offreType.toLowerCase()) {
      case 'formation':
        offreExistante = await prisma.formation.findUnique({
          where: { id: offreIdNum, status: 'active' }
        });
        break;
      case 'emploi':
        offreExistante = await prisma.emploi.findUnique({
          where: { id: offreIdNum, status: 'active' }
        });
        break;
      case 'alternance':
        offreExistante = await prisma.alternanceStage.findUnique({
          where: { id: offreIdNum, status: 'active' }
        });
        break;
    }

    if (!offreExistante) {
      return res.status(404).json({
        success: false,
        error: 'Offre non trouvée'
      });
    }

    // Vérifier si l'utilisateur a déjà postulé
    const candidatureExistante = await prisma.candidature.findFirst({
      where: {
        userId: req.user.id,
        offreType: offreType.toUpperCase(),
        ...whereCondition
      }
    });

    if (candidatureExistante) {
      console.log('⚠️ Candidature déjà existante:', candidatureExistante.id);
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà postulé à cette offre'
      });
    }

    // ✅ CORRECTION : Créer la candidature EN BASE DE DONNÉES
    const candidatureData = {
      userId: req.user.id,
      offreType: offreType.toUpperCase(),
      titreOffre: titreOffre,
      messageMotivation: messageMotivation || '',
      cvUrl: cvUrl || null,
      lettreMotivationUrl: lettreMotivationUrl || null,
      nomCandidat: nomCandidat || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      emailCandidat: emailCandidat || req.user.email,
      telephoneCandidat: telephoneCandidat || null,
      documents: documents || null,
      statut: 'en_attente'
    };

    // Ajouter le champ spécifique
    candidatureData[offreField] = offreIdNum;

    console.log('📝 Données à insérer en BD:', candidatureData);

    // 🔴 CRÉER EN BASE DE DONNÉES
    const candidature = await prisma.candidature.create({
      data: candidatureData
    });

    console.log('✅ Candidature créée en BD ID:', candidature.id);

    // Mettre à jour le compteur
    try {
      if (offreType.toLowerCase() === 'formation') {
        await prisma.formation.update({
          where: { id: offreIdNum },
          data: { 
            applications: { increment: 1 },
            currentParticipants: { increment: 1 }
          }
        });
      } else if (offreType.toLowerCase() === 'emploi') {
        await prisma.emploi.update({
          where: { id: offreIdNum },
          data: { candidaturesCount: { increment: 1 } }
        });
      } else if (offreType.toLowerCase() === 'alternance') {
        await prisma.alternanceStage.update({
          where: { id: offreIdNum },
          data: { candidaturesCount: { increment: 1 } }
        });
      }
      console.log('✅ Compteur mis à jour');
    } catch (updateError) {
      console.warn('⚠️ Erreur mise à jour compteur:', updateError.message);
    }

    // Réponse avec les vraies données de la BD
    res.status(201).json({
      success: true,
      message: 'Candidature envoyée avec succès',
      candidature: {
        id: candidature.id,
        offreId: offreIdNum,
        offreType: offreType,
        titreOffre: titreOffre,
        messageMotivation: messageMotivation,
        statut: candidature.statut,
        createdAt: candidature.createdAt
      }
    });

  } catch (error) {
    console.error('💥 ERREUR création candidature:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });

    let errorMessage = 'Erreur lors de la création de la candidature';
    let statusCode = 500;

    if (error.code === 'P2002') {
      errorMessage = 'Vous avez déjà postulé à cette offre';
      statusCode = 400;
    } else if (error.code === 'P2003') {
      errorMessage = 'Offre non trouvée';
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      whereClause.offreType = type.toUpperCase();
    }

    if (statut) {
      whereClause.statut = statut;
    }

    const candidatures = await prisma.candidature.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        formation: true,
        emploi: true,
        alternanceStage: true
      }
    });

    res.json({ 
      success: true,
      candidatures 
    });

  } catch (error) {
    console.error('Erreur récupération candidatures:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};