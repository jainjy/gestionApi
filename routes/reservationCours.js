// routes/reservationCours.js
const express = require("express");
const { prisma } = require("../lib/db");
const router = express.Router();

// GET /api/reservation-cours - Liste des réservations avec filtres
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      professionalId, 
      userId, 
      status,
      courseId 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('📚 [RESERVATION COURS] Récupération réservations - Page:', page, 'Professional:', professionalId);

    const where = {};
    
    if (professionalId) {
      where.course = {
        professionalId: professionalId
      };
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (courseId) {
      where.courseId = courseId;
    }

    const reservations = await prisma.reservationCours.findMany({
      where,
      include: {
        course: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                avatar: true,
                email: true,
                phone: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.reservationCours.count({ where });

    console.log('✅ [RESERVATION COURS]', reservations.length, 'réservations récupérées sur', total);

    res.json({
      success: true,
      data: reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error("❌ [RESERVATION COURS] Erreur lors de la récupération:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// GET /api/reservation-cours/:id - Détail d'une réservation
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📖 [RESERVATION COURS DETAIL] Récupération réservation ID:', id);

    const reservation = await prisma.reservationCours.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                avatar: true,
                email: true,
                phone: true,
                city: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!reservation) {
      console.log('❌ [RESERVATION COURS DETAIL] Réservation non trouvée:', id);
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    console.log('✅ [RESERVATION COURS DETAIL] Réservation récupérée:', id);

    res.json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error("❌ [RESERVATION COURS DETAIL] Erreur:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// POST /api/reservation-cours - Créer une nouvelle réservation
router.post("/", async (req, res) => {
  try {
    const {
      courseId,
      userId,
      userEmail,
      userName,
      date,
      participants = 1,
      totalPrice,
      notes,
      status = "en_attente"
    } = req.body;

    console.log('🎯 [CREATE RESERVATION COURS] Données reçues:', {
      courseId,
      userId,
      userEmail,
      date,
      participants,
      totalPrice
    });

    // Validation des champs requis
    if (!courseId || !userId || !userEmail || !userName || !date || !totalPrice) {
      console.log('❌ [CREATE RESERVATION COURS] Champs manquants');
      return res.status(400).json({
        success: false,
        message: "courseId, userId, userEmail, userName, date et totalPrice sont requis"
      });
    }

    // Vérifier que le cours existe
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { professional: true }
    });

    if (!course) {
      console.log('❌ [CREATE RESERVATION COURS] Cours non trouvé:', courseId);
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('❌ [CREATE RESERVATION COURS] Utilisateur non trouvé:', userId);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier la disponibilité (nombre de participants)
    if (participants > course.maxParticipants) {
      console.log('❌ [CREATE RESERVATION COURS] Trop de participants:', participants, 'max:', course.maxParticipants);
      return res.status(400).json({
        success: false,
        message: `Nombre de participants trop élevé. Maximum: ${course.maxParticipants}`
      });
    }

    // Vérifier si une réservation existe déjà pour cette date et ce cours
    const existingReservation = await prisma.reservationCours.findFirst({
      where: {
        courseId,
        date: new Date(date),
        status: {
          in: ['en_attente', 'confirmee']
        }
      }
    });

    if (existingReservation) {
      console.log('❌ [CREATE RESERVATION COURS] Réservation déjà existante pour cette date');
      return res.status(400).json({
        success: false,
        message: "Une réservation existe déjà pour ce cours à cette date"
      });
    }

    // Créer la réservation
    console.log('💾 [CREATE RESERVATION COURS] Création en base de données...');
    const reservation = await prisma.reservationCours.create({
      data: {
        courseId,
        userId,
        userEmail,
        userName,
        date: new Date(date),
        participants: parseInt(participants),
        totalPrice: parseFloat(totalPrice),
        notes,
        status,
        professionalId: course.professionalId,
        courseTitle: course.title,
        professionalName: `${course.professional.firstName} ${course.professional.lastName}`,
        courseCategory: course.category,
        courseDuration: course.durationMinutes
      },
      include: {
        course: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log('✅ [CREATE RESERVATION COURS] Réservation créée avec succès:', reservation.id);

    res.status(201).json({
      success: true,
      data: reservation,
      message: "Réservation effectuée avec succès"
    });

  } catch (error) {
    console.error("❌ [CREATE RESERVATION COURS] Erreur lors de la création:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// PUT /api/reservation-cours/:id/status - Mettre à jour le statut d'une réservation
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, raisonAnnulation } = req.body;

    console.log('🔄 [UPDATE RESERVATION COURS STATUS] Mise à jour réservation ID:', id, 'Statut:', status);

    // Vérifier si la réservation existe
    const existingReservation = await prisma.reservationCours.findUnique({
      where: { id }
    });

    if (!existingReservation) {
      console.log('❌ [UPDATE RESERVATION COURS STATUS] Réservation non trouvée:', id);
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    // Mettre à jour le statut
    const reservation = await prisma.reservationCours.update({
      where: { id },
      data: {
        status,
        ...(status === 'annulee' && raisonAnnulation && { raisonAnnulation }),
        ...(status === 'annulee' && { dateAnnulation: new Date() })
      },
      include: {
        course: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('✅ [UPDATE RESERVATION COURS STATUS] Statut mis à jour:', id, '->', status);

    res.json({
      success: true,
      data: reservation,
      message: `Statut de la réservation mis à jour: ${status}`
    });

  } catch (error) {
    console.error("❌ [UPDATE RESERVATION COURS STATUS] Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// PUT /api/reservation-cours/:id - Mettre à jour une réservation
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      participants,
      notes
    } = req.body;

    console.log('🔄 [UPDATE RESERVATION COURS] Mise à jour réservation ID:', id);

    // Vérifier si la réservation existe
    const existingReservation = await prisma.reservationCours.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!existingReservation) {
      console.log('❌ [UPDATE RESERVATION COURS] Réservation non trouvée:', id);
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    // Vérifier la disponibilité (nombre de participants)
    if (participants && participants > existingReservation.course.maxParticipants) {
      console.log('❌ [UPDATE RESERVATION COURS] Trop de participants:', participants, 'max:', existingReservation.course.maxParticipants);
      return res.status(400).json({
        success: false,
        message: `Nombre de participants trop élevé. Maximum: ${existingReservation.course.maxParticipants}`
      });
    }

    // Mettre à jour la réservation
    const reservation = await prisma.reservationCours.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(participants && { participants: parseInt(participants) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        course: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('✅ [UPDATE RESERVATION COURS] Réservation mise à jour:', id);

    res.json({
      success: true,
      data: reservation,
      message: "Réservation mise à jour avec succès"
    });

  } catch (error) {
    console.error("❌ [UPDATE RESERVATION COURS] Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

// GET /api/reservation-cours/professional/:professionalId/stats - Statistiques pour un professionnel
router.get("/professional/:professionalId/stats", async (req, res) => {
  try {
    const { professionalId } = req.params;

    console.log('📊 [RESERVATION COURS STATS] Statistiques pour professionnel:', professionalId);

    const totalReservations = await prisma.reservationCours.count({
      where: {
        course: {
          professionalId: professionalId
        }
      }
    });

    const enAttenteReservations = await prisma.reservationCours.count({
      where: {
        course: {
          professionalId: professionalId
        },
        status: 'en_attente'
      }
    });

    const confirmeeReservations = await prisma.reservationCours.count({
      where: {
        course: {
          professionalId: professionalId
        },
        status: 'confirmee'
      }
    });

    const annuleeReservations = await prisma.reservationCours.count({
      where: {
        course: {
          professionalId: professionalId
        },
        status: 'annulee'
      }
    });

    const termineeReservations = await prisma.reservationCours.count({
      where: {
        course: {
          professionalId: professionalId
        },
        status: 'terminee'
      }
    });

    const totalRevenue = await prisma.reservationCours.aggregate({
      where: {
        course: {
          professionalId: professionalId
        },
        status: 'confirmee'
      },
      _sum: {
        totalPrice: true
      }
    });

    const stats = {
      total: totalReservations,
      en_attente: enAttenteReservations,
      confirmee: confirmeeReservations,
      annulee: annuleeReservations,
      terminee: termineeReservations,
      totalRevenue: totalRevenue._sum.totalPrice || 0
    };

    console.log('✅ [RESERVATION COURS STATS] Statistiques récupérées:', stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ [RESERVATION COURS STATS] Erreur:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur serveur" 
    });
  }
});

// DELETE /api/reservation-cours/:id - Supprimer une réservation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ [DELETE RESERVATION COURS] Suppression réservation ID:', id);

    const reservation = await prisma.reservationCours.findUnique({
      where: { id }
    });

    if (!reservation) {
      console.log('❌ [DELETE RESERVATION COURS] Réservation non trouvée:', id);
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    await prisma.reservationCours.delete({
      where: { id }
    });

    console.log('✅ [DELETE RESERVATION COURS] Réservation supprimée:', id);

    res.json({
      success: true,
      message: "Réservation supprimée avec succès"
    });

  } catch (error) {
    console.error("❌ [DELETE RESERVATION COURS] Erreur lors de la suppression:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur: " + error.message
    });
  }
});

module.exports = router;