// routes/planning.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // Votre middleware
const { prisma } = require('../lib/db');

// Récupérer tous les rendez-vous de l'utilisateur connecté pour le planning
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📅 Récupération planning pour user:', userId);

    // 1. Récupérer les appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId
      },
      include: {
        service: {
          select: {
            libelle: true,
            duration: true,
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
      },
      orderBy: {
        date: 'asc'
      }
    });

    // 2. Récupérer les réservations tourisme
    const tourismeBookings = await prisma.tourismeBooking.findMany({
      where: {
        userId: userId
      },
      include: {
        listing: {
          select: {
            title: true,
            type: true,
            city: true
          }
        }
      },
      orderBy: {
        checkIn: 'asc'
      }
    });

    // 3. Récupérer les demandes où l'utilisateur est créateur OU artisan assigné
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [
          { createdById: userId }, // Demandes créées par l'utilisateur
          { artisanId: userId }    // Demandes assignées directement à l'utilisateur
        ]
      },
      include: {
        service: {
          select: {
            libelle: true,
            duration: true
          }
        },
        metier: {
          select: {
            libelle: true
          }
        },
        property: {
          select: {
            title: true,
            address: true,
            city: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        artisans: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                companyName: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        dateSouhaitee: 'asc'
      }
    });

    // 4. Récupérer les demandes où l'utilisateur est artisan via DemandeArtisan
    const demandesArtisan = await prisma.demandeArtisan.findMany({
      where: {
        userId: userId
      },
      include: {
        demande: {
          include: {
            service: {
              select: {
                libelle: true,
                duration: true
              }
            },
            metier: {
              select: {
                libelle: true
              }
            },
            property: {
              select: {
                title: true,
                address: true,
                city: true
              }
            },
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        demande: {
          dateSouhaitee: 'asc'
        }
      }
    });

    // Formater les données pour le calendrier
    const planningData = {
      appointments: appointments.map(apt => ({
        id: `appointment-${apt.id}`,
        type: 'appointment',
        title: `📅 RDV: ${apt.service?.libelle || 'Service'}`,
        start: new Date(`${apt.date.toISOString().split('T')[0]}T${apt.time}`),
        end: calculateEndTime(apt.date, apt.time, apt.service?.duration),
        description: apt.message,
        status: apt.status,
        service: apt.service,
        client: apt.user,
        backgroundColor: '#3498db',
        borderColor: '#2980b9'
      })),

      tourismeBookings: tourismeBookings.map(booking => ({
        id: `tourisme-${booking.id}`,
        type: 'tourisme',
        title: `🏨 Réservation: ${booking.listing?.title || 'Tourisme'}`,
        start: booking.checkIn,
        end: booking.checkOut,
        guests: booking.guests,
        totalAmount: booking.totalAmount,
        status: booking.status,
        listing: booking.listing,
        backgroundColor: '#e74c3c',
        borderColor: '#c0392b',
        allDay: true // Les réservations sont généralement sur plusieurs jours
      })),

      demandesDirectes: demandes
        .filter(demande => demande.dateSouhaitee) // Filtrer les demandes avec date
        .map(demande => ({
          id: `demande-${demande.id}`,
          type: 'demande',
          title: `🔧 ${demande.service?.libelle || demande.metier?.libelle || 'Demande'}`,
          start: new Date(`${demande.dateSouhaitee.toISOString().split('T')[0]}T${demande.heureSouhaitee || '09:00'}`),
          end: calculateEndTime(demande.dateSouhaitee, demande.heureSouhaitee || '09:00', demande.service?.duration),
          description: demande.description,
          statut: demande.statut,
          property: demande.property,
          artisans: demande.artisans,
          createdBy: demande.createdBy,
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60'
        })),

      demandesArtisan: demandesArtisan
        .filter(da => da.demande.dateSouhaitee) // Filtrer les demandes avec date
        .map(da => ({
          id: `demande-artisan-${da.demandeId}`,
          type: 'demande_artisan',
          title: `👨‍🔧 ${da.demande.service?.libelle || da.demande.metier?.libelle || 'Intervention'}`,
          start: new Date(`${da.demande.dateSouhaitee.toISOString().split('T')[0]}T${da.demande.heureSouhaitee || '09:00'}`),
          end: calculateEndTime(da.demande.dateSouhaitee, da.demande.heureSouhaitee || '09:00', da.demande.service?.duration),
          description: da.demande.description,
          statut: da.demande.statut,
          property: da.demande.property,
          createdBy: da.demande.createdBy,
          accepte: da.accepte,
          rdv: da.rdv,
          backgroundColor: '#9b59b6',
          borderColor: '#8e44ad'
        }))
    };

    // Fusionner tous les événements
    const allEvents = [
      ...planningData.appointments,
      ...planningData.tourismeBookings,
      ...planningData.demandesDirectes,
      ...planningData.demandesArtisan
    ];

    console.log(`✅ Planning récupéré: ${allEvents.length} événements trouvés`);

    res.json({
      success: true,
      data: {
        events: allEvents,
        summary: {
          total: allEvents.length,
          appointments: planningData.appointments.length,
          tourismeBookings: planningData.tourismeBookings.length,
          demandes: planningData.demandesDirectes.length + planningData.demandesArtisan.length
        },
        user: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération planning:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du planning',
      error: error.message
    });
  }
});

// Récupérer le planning pour une période spécifique
router.get('/period', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Les paramètres start et end sont requis'
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    console.log(`📅 Récupération planning période: ${startDate} à ${endDate}`);

    // Récupérer les appointments dans la période
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true
      }
    });

    // Récupérer les réservations tourisme dans la période
    const tourismeBookings = await prisma.tourismeBooking.findMany({
      where: {
        userId: userId,
        OR: [
          {
            checkIn: { lte: endDate },
            checkOut: { gte: startDate }
          }
        ]
      },
      include: {
        listing: true
      }
    });

    // Récupérer les demandes avec date souhaitée dans la période
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [
          { createdById: userId },
          { artisanId: userId }
        ],
        dateSouhaitee: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true,
        property: true,
        createdBy: true
      }
    });

    // Récupérer les demandes artisan dans la période
    const demandesArtisan = await prisma.demandeArtisan.findMany({
      where: {
        userId: userId,
        demande: {
          dateSouhaitee: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        demande: {
          include: {
            service: true,
            property: true,
            createdBy: true
          }
        }
      }
    });

    // Formater les données
    const events = [
      ...appointments.map(apt => formatAppointment(apt)),
      ...tourismeBookings.map(booking => formatTourismeBooking(booking)),
      ...demandes.map(demande => formatDemande(demande)),
      ...demandesArtisan.map(da => formatDemandeArtisan(da))
    ];

    res.json({
      success: true,
      data: {
        events,
        period: { start: startDate, end: endDate },
        total: events.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération planning période:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du planning',
      error: error.message
    });
  }
});

// Fonctions de formatage
function formatAppointment(apt) {
  return {
    id: `appointment-${apt.id}`,
    type: 'appointment',
    title: `📅 ${apt.service?.libelle || 'RDV'}`,
    start: new Date(`${apt.date.toISOString().split('T')[0]}T${apt.time}`),
    end: calculateEndTime(apt.date, apt.time, apt.service?.duration),
    description: apt.message,
    status: apt.status,
    backgroundColor: '#3498db'
  };
}

function formatTourismeBooking(booking) {
  return {
    id: `tourisme-${booking.id}`,
    type: 'tourisme',
    title: `🏨 ${booking.listing?.title || 'Réservation'}`,
    start: booking.checkIn,
    end: booking.checkOut,
    status: booking.status,
    backgroundColor: '#e74c3c',
    allDay: true
  };
}

function formatDemande(demande) {
  return {
    id: `demande-${demande.id}`,
    type: 'demande',
    title: `🔧 ${demande.service?.libelle || 'Demande'}`,
    start: new Date(`${demande.dateSouhaitee.toISOString().split('T')[0]}T${demande.heureSouhaitee || '09:00'}`),
    end: calculateEndTime(demande.dateSouhaitee, demande.heureSouhaitee || '09:00', demande.service?.duration),
    description: demande.description,
    statut: demande.statut,
    backgroundColor: '#2ecc71'
  };
}

function formatDemandeArtisan(da) {
  return {
    id: `demande-artisan-${da.demandeId}`,
    type: 'demande_artisan',
    title: `👨‍🔧 ${da.demande.service?.libelle || 'Intervention'}`,
    start: new Date(`${da.demande.dateSouhaitee.toISOString().split('T')[0]}T${da.demande.heureSouhaitee || '09:00'}`),
    end: calculateEndTime(da.demande.dateSouhaitee, da.demande.heureSouhaitee || '09:00', da.demande.service?.duration),
    description: da.demande.description,
    accepte: da.accepte,
    backgroundColor: '#9b59b6'
  };
}

// Fonction utilitaire pour calculer l'heure de fin
function calculateEndTime(date, time, durationMinutes = 60) {
  const startDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
  const endDateTime = new Date(startDateTime.getTime() + (durationMinutes || 60) * 60000);
  return endDateTime;
}

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { titre, date, heureDebut, heureFin, type, statut, client, bien, notes, couleur, serviceId } = req.body;

    // Validation des champs requis
    if (!heureDebut) {
      return res.status(400).json({
        success: false,
        message: "Le champ 'heureDebut' est requis"
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: userId,
        serviceId: serviceId || 1,
        date: new Date(date),
        time: heureDebut, // Utilisez directement la valeur de heureDebut
        message: JSON.stringify({
          titre,
          heureFin,
          type,
          statut,
          client,
          bien,
          notes,
          couleur
        })
      }
    });

    res.json({
      success: true,
      message: "Rendez-vous créé avec succès",
      appointment
    });

  } catch (error) {
    console.error("Erreur création rendez-vous:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création du rendez-vous",
      error: error.message 
    });
  }
});


module.exports = router;