// routes/reservationbien_etre.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/db");
const { authenticateToken } = require("../middleware/auth");

// Récupérer les réservations de l'utilisateur connecté
router.get("/my-services", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            libelle: true,
            price: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Erreur récupération appointments :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations",
      error: error.message
    });
  }
});

// routes/reservationbien_etre.js - MODIFIEZ LA ROUTE POST /appointments
router.post("/appointments", async (req, res) => {
  try {
    console.log("📥 Requête reçue:", req.body);
    
    const {
      serviceId,
      firstName,
      lastName,
      email,
      phone,
      date,
      time,
      message = "",
      objectives = "",
      dietaryRestrictions = ""
    } = req.body;

    // Vérification des champs obligatoires
    if (!serviceId || !email || !phone || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants",
        required: ["serviceId", "email", "phone", "date", "time"]
      });
    }

    // Chercher l'utilisateur par email
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    let userId;

    if (!user) {
      // Créer un utilisateur invité
      user = await prisma.user.create({
        data: {
          email: email,
          firstName: firstName || "Invité",
          lastName: lastName || "Client",
          phone: phone,
          password: "guest_password_hash", // À adapter selon votre logique
          role: "USER"
        }
      });
      userId = user.id;
    } else {
      userId = user.id;
    }

    // Créer la date complète
    const appointmentDate = new Date(`${date}T${time}:00`);
    
    // Vérifier la validité de la date
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Date invalide"
      });
    }

    // Créer le rendez-vous selon VOTRE schéma Prisma
    const appointment = await prisma.appointment.create({
      data: {
        userId: userId, // String requis par votre modèle
        serviceId: parseInt(serviceId), // Int requis
        date: appointmentDate, // DateTime requis
        time: time, // String requis
        message: message, // Optionnel
        status: "pending" // Par défaut
      },
      include: {
        service: {
          select: {
            libelle: true,
            price: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log("✅ Rendez-vous créé:", appointment.id);

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: appointment
    });

  } catch (error) {
    console.error("❌ Erreur création rendez-vous:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du rendez-vous",
      error: error.message
    });
  }
});

// Récupérer tous les rendez-vous (admin)
router.get("/appointments", authenticateToken, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            libelle: true,
            price: true,
            duration: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Erreur récupération des rendez-vous :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message
    });
  }
});

// Mettre à jour le statut d'un rendez-vous
router.put("/appointments/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: id },
      data: { status },
      include: {
        service: {
          select: {
            libelle: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Rendez-vous ${status}`,
      data: updatedAppointment
    });

  } catch (error) {
    console.error("Erreur mise à jour rendez-vous :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du rendez-vous",
      error: error.message
    });
  }
});

// Annuler un rendez-vous
router.delete("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body; // Pour vérifier l'identité

    const appointment = await prisma.appointment.findUnique({
      where: { id: id },
      include: {
        user: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé"
      });
    }

    // Vérifier que l'email correspond
    if (appointment.user.email !== email) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à annuler ce rendez-vous"
      });
    }

    // Mettre à jour le statut
    await prisma.appointment.update({
      where: { id: id },
      data: { status: "cancelled" }
    });

    res.status(200).json({
      success: true,
      message: "Rendez-vous annulé avec succès"
    });

  } catch (error) {
    console.error("Erreur annulation rendez-vous :", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation du rendez-vous",
      error: error.message
    });
  }
});

// routes/reservationbien_etre.js - Ajoutez cette route
router.get("/my-appointments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les services créés par l'utilisateur
    const userServices = await prisma.service.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        }
      },
      select: {
        id: true
      }
    });

    const serviceIds = userServices.map(service => service.id);

    if (serviceIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Récupérer les rendez-vous pour ces services
    const appointments = await prisma.appointment.findMany({
      where: {
        serviceId: {
          in: serviceIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            libelle: true,
            price: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Erreur récupération des rendez-vous de mes services:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message
    });
  }
});

// Ajoutez aussi une route pour récupérer les services de l'utilisateur
router.get("/my-services-list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const services = await prisma.service.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        }
      },
      select: {
        id: true,
        libelle: true,
        price: true,
        duration: true,
        description: true
      }
    });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error("Erreur récupération services utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
      error: error.message
    });
  }
});

module.exports = router;