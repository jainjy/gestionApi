// const express = require("express");
// const router = express.Router();
// const { prisma } = require("../lib/db");
// const { authenticateToken } = require("../middleware/auth");

// // Route protégée
// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // 1. APPOINTMENTS
//     const appointments = await prisma.appointment.findMany({
//       where: { userId },
//       orderBy: { date: "asc" }
//     });

//     const appointmentEvents = appointments.map(a => {
//       let extra = {};
//       try {
//         extra = JSON.parse(a.message || "{}");
//       } catch {}

//       return {
//         type: "appointment",
//         date: a.date,
//         time: a.time,
//         motif: extra.titre || extra.notes || "Rendez-vous",
//         ...extra
//       };
//     });

//     // 2. DEMANDES
//     const demandes = await prisma.demande.findMany({
//       where: {
//         OR: [
//           { createdById: userId },
//           { artisanId: userId }
//         ]
//       }
//     });

//     const demandesEvents = demandes.map(d => ({
//       type: d.artisanId === userId ? "demande_artisan_direct" : "demande_creee",
//       date: d.dateSouhaitee,
//       time: d.heureSouhaitee,
//       motif: d.description
//     }));

//     // 3. DEMANDE ARTISAN
//     const demandesArtisan = await prisma.demandeArtisan.findMany({
//       where: { userId }
//     });

//     const demandesArtisanEvents = demandesArtisan.map(a => ({
//       type: "demande_artisan_rdv",
//       date: a.rdv,
//       time: null,
//       motif: a.rdvNotes || "Rendez-vous artisan"
//     }));

//     // 4. TOURISME
//     const bookings = await prisma.tourismeBooking.findMany({
//       where: { userId },
//       include: { listing: true }
//     });

//     const bookingEvents = bookings.map(b => ({
//       type: "tourisme_booking",
//       date: b.checkIn,
//       time: null,
//       motif: "Réservation : " + (b.listing?.title || "")
//     }));

//     // COMBINE
//     const planning = [
//       ...appointmentEvents,
//       ...demandesEvents,
//       ...demandesArtisanEvents,
//       ...bookingEvents
//     ];

//     res.json({
//       success: true,
//       planning
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: "Erreur planning" });
//   }
// });
 

// router.post("/", authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const {
//       titre,
//       date,
//       heureDebut,
//       heureFin,
//       type,
//       statut,
//       agent,
//       couleur,
//       client,
//       bien,
//       notes,
//       serviceId
//     } = req.body;

//     // Stocker les données complexes dans un JSON compact
//     const extraData = {
//       titre,
//       heureFin,
//       type,
//       statut,
//       agent,
//       couleur,
//       client,
//       bien,
//       notes
//     };

//     const appointment = await prisma.appointment.create({
//       data: {
//         userId,
//         serviceId: Number(serviceId),
//         date: new Date(date),
//         time: heureDebut, // heure de début
//         status: statut || "pending",
//         message: JSON.stringify(extraData)
//       }
//     });

//     return res.json({
//       success: true,
//       message: "Rendez-vous créé avec succès",
//       appointment
//     });

//   } catch (error) {
//     console.error("Erreur création rendez-vous:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Erreur lors de la création du rendez-vous",
//       error: error.message
//     });
//   }
// }); 

// // // 📌 GET — récupérer tout le planning d’un utilisateur par son userId
// // router.get("/test/:userId", async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     console.log("📌 Récupération du planning pour user:", userId);

// //     // Vérifier les modèles disponibles
// //     console.log("📦 Modèles Prisma chargés :", Object.keys(prisma));

// //     // TEST DES MODELES
// //     if (!prisma.planningPro) console.log("❌ prisma.planningPro n'existe pas");
// //     if (!prisma.demande) console.log("❌ prisma.demande n'existe pas");
// //     if (!prisma.demandeArtisan) console.log("❌ prisma.demandeArtisan n'existe pas");
// //     if (!prisma.tourismeBooking) console.log("❌ prisma.tourismeBooking n'existe pas");
// //     if (!prisma.appointment) console.log("❌ prisma.appointment n'existe pas");

// //     // Récupération des RDV (adapter avec les bons noms après seeing logs)
// //     const appointments = prisma.appointment
// //       ? await prisma.appointment.findMany({ where: { userId } })
// //       : [];

// //     const demandes = prisma.demande
// //       ? await prisma.demande.findMany({ where: { userId } })
// //       : [];

// //     const artisan = prisma.demandeArtisan
// //       ? await prisma.demandeArtisan.findMany({ where: { userId } })
// //       : [];

// //     const tourisme = prisma.tourismeBooking
// //       ? await prisma.tourismeBooking.findMany({ where: { userId } })
// //       : [];

// //     const all = [
// //       ...appointments.map(a => ({ ...a, type: "appointment" })),
// //       ...demandes.map(d => ({ ...d, type: "demande" })),
// //       ...artisan.map(a => ({ ...a, type: "demande_artisan" })),
// //       ...tourisme.map(t => ({ ...t, type: "tourisme" })),
// //     ];

// //     return res.json({
// //       success: true,
// //       total: all.length,
// //       planning: all,
// //     });

// //   } catch (err) {
// //     console.error("❌ Erreur GET /planning :", err);
// //     return res.status(500).json({
// //       success: false,
// //       error: err.message,
// //     });
// //   }
// // });
// module.exports = router;

// routes/planning.js
// routes/planning.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  // Ici, vous devriez vérifier le token JWT
  // Pour l'exemple, on simule un user avec userId en string
  req.user = { id: "1" }; // ← CHANGEMENT ICI : "1" au lieu de 1
  next();
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Chargement du planning pour l'utilisateur: ${userId} (type: ${typeof userId})`);

    // 1. APPOINTMENTS - CORRIGÉ : userId doit être une string
    const appointments = await prisma.appointment.findMany({
      where: { 
        userId: userId // ← userId est maintenant une string
      },
      orderBy: { date: "asc" }
    });

    console.log(`Appointments trouvés: ${appointments.length}`);

    const appointmentEvents = appointments.map(a => {
      let extra = {};
      try {
        extra = JSON.parse(a.message || "{}");
      } catch (error) {
        console.log("Erreur parsing JSON appointment:", error);
      }

      return {
        id: `appointment_${a.id}`,
        type: "appointment",
        date: a.date.toISOString().split('T')[0], // Format YYYY-MM-DD
        time: a.time,
        motif: extra.titre || extra.notes || "Rendez-vous",
        ...extra
      };
    });

    // 2. DEMANDES - Assurez-vous que les userId sont des strings ici aussi
    const demandes = await prisma.demande.findMany({
      where: {
        OR: [
          { createdById: userId }, // ← string
          { artisanId: userId }    // ← string
        ]
      }
    });

    console.log(`Demandes trouvées: ${demandes.length}`);

    const demandesEvents = demandes.map(d => ({
      id: `demande_${d.id}`,
      type: d.artisanId === userId ? "demande_artisan_direct" : "demande_creee",
      date: d.dateSouhaitee ? new Date(d.dateSouhaitee).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: d.heureSouhaitee,
      motif: d.description || "Demande sans description"
    }));

    // 3. DEMANDE ARTISAN - Assurez-vous que userId est une string
    const demandesArtisan = await prisma.demandeArtisan.findMany({
      where: { userId: userId } // ← string
    });

    console.log(`Demandes artisan trouvées: ${demandesArtisan.length}`);

    const demandesArtisanEvents = demandesArtisan.map(a => ({
      id: `demande_artisan_${a.id}`,
      type: "demande_artisan_rdv",
      date: a.rdv ? new Date(a.rdv).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: null,
      motif: a.rdvNotes || "Rendez-vous artisan"
    }));

    // 4. TOURISME - Assurez-vous que userId est une string
    const bookings = await prisma.tourismeBooking.findMany({
      where: { userId: userId }, // ← string
      include: { listing: true }
    });

    console.log(`Réservations tourisme trouvées: ${bookings.length}`);

    const bookingEvents = bookings.map(b => ({
      id: `booking_${b.id}`,
      type: "tourisme_booking",
      date: b.checkIn ? new Date(b.checkIn).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: null,
      motif: "Réservation : " + (b.listing?.title || "Sans titre")
    }));

    // COMBINER TOUS LES ÉVÉNEMENTS
    const planning = [
      ...appointmentEvents,
      ...demandesEvents,
      ...demandesArtisanEvents,
      ...bookingEvents
    ].filter(event => event.date); // Filtrer les événements sans date

    console.log(`Total des événements de planning: ${planning.length}`);

    res.json({
      success: true,
      planning,
      counts: {
        total: planning.length,
        appointments: appointmentEvents.length,
        demandes: demandesEvents.length,
        demandesArtisan: demandesArtisanEvents.length,
        tourisme: bookingEvents.length
      }
    });

  } catch (error) {
    console.error("Erreur détaillée planning:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors du chargement du planning",
      error: error.message 
    });
  }
});

// Route pour créer un rendez-vous - CORRIGÉE AUSSI
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // string
    const { titre, date, heureDebut, heureFin, type, statut, client, bien, notes, couleur, serviceId } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        userId: userId, // string
        serviceId: serviceId || 1, // number
        date: new Date(date),
        time: heureDebut,
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