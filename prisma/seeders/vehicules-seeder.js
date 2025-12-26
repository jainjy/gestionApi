const { prisma } = require("../../lib/db");
const {
  CategorieVehicule,
  CarburantType,
  TransmissionType,
} = require("@prisma/client");

async function seedVehicules() {
  try {
    console.log("🌱 Début du seeding des véhicules...");

    // Trouver quelques prestataires
    const prestataires = await prisma.user.findMany({
      where: {
        userType: { in: ["professional", "prestataire"] },
      },
      take: 8,
    });

    if (prestataires.length === 0) {
      console.log("❌ Aucun prestataire trouvé pour ajouter des véhicules");
      return;
    }

    const vehiculesData = [
      // ============ VOITURES ============
      {
        categorie: CategorieVehicule.voiture,
        marque: "Toyota",
        modele: "Yaris",
        annee: 2023,
        immatriculation: "AB-123-CD",
        couleur: "Blanc",
        typeVehicule: "économique",
        carburant: CarburantType.essence,
        transmission: TransmissionType.manuelle,
        places: 5,
        portes: 5,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: null,
        ville: "saint-denis",
        adresse: "123 Rue de Paris",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 35,
        prixSemaine: 210,
        prixMois: 800,
        caution: 500,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?w=800&auto=format&fit=crop",
        ],
        description:
          "Voiture économique parfaite pour la ville, consommation réduite. Idéale pour les déplacements urbains.",
      },
      {
        categorie: CategorieVehicule.voiture,
        marque: "Renault",
        modele: "Clio",
        annee: 2024,
        immatriculation: "EF-456-GH",
        couleur: "Gris",
        typeVehicule: "compacte",
        carburant: CarburantType.diesel,
        transmission: TransmissionType.automatique,
        places: 5,
        portes: 5,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: null,
        ville: "saint-pierre",
        adresse: "456 Avenue du Général",
        latitude: -21.3393,
        longitude: 55.4781,
        prixJour: 45,
        prixSemaine: 270,
        prixMois: 1000,
        caution: 600,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
        ],
        description:
          "Compacte spacieuse avec transmission automatique, idéale pour la famille. Confort et sécurité garantis.",
      },
      {
        categorie: CategorieVehicule.voiture,
        marque: "Peugeot",
        modele: "3008",
        annee: 2023,
        immatriculation: "IJ-789-KL",
        couleur: "Bleu",
        typeVehicule: "suv",
        carburant: CarburantType.hybride,
        transmission: TransmissionType.automatique,
        places: 5,
        portes: 5,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: null,
        ville: "saint-paul",
        adresse: "789 Boulevard de l'Océan",
        latitude: -21.0097,
        longitude: 55.2697,
        prixJour: 75,
        prixSemaine: 450,
        prixMois: 1600,
        caution: 800,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1563720223486-7a472e5c7b52?w=800&auto=format&fit=crop",
        ],
        description:
          "SUV familial hybride, confort et espace pour vos aventures réunionnaises. Parfait pour explorer l'île.",
      },
      // ============ CAMIONS ============
      {
        categorie: CategorieVehicule.camion,
        marque: "Ford",
        modele: "Ranger",
        annee: 2023,
        immatriculation: "UV-678-WX",
        couleur: "Gris",
        typeVehicule: "pick-up",
        carburant: CarburantType.diesel,
        transmission: TransmissionType.automatique,
        places: 5,
        portes: 4,
        cylindree: 2198,
        typeVelo: null,
        assistanceElec: null,
        poids: 2100,
        ville: "saint-louis",
        adresse: "333 Route du Littoral",
        latitude: -21.286,
        longitude: 55.4092,
        prixJour: 85,
        prixSemaine: 510,
        prixMois: 1800,
        caution: 1000,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1566474591191-8a583d6af81b?w=800&auto=format&fit=crop",
        ],
        description:
          "Pick-up robuste pour travaux et transport de matériel en tout terrain. Idéal pour les chantiers.",
      },
      {
        categorie: CategorieVehicule.camion,
        marque: "Renault",
        modele: "Master",
        annee: 2022,
        immatriculation: "QR-345-ST",
        couleur: "Blanc",
        typeVehicule: "utilitaire",
        carburant: CarburantType.diesel,
        transmission: TransmissionType.manuelle,
        places: 3,
        portes: 5,
        cylindree: 2298,
        typeVelo: null,
        assistanceElec: null,
        poids: 2800,
        ville: "le-tampon",
        adresse: "222 Route des Plaines",
        latitude: -21.2775,
        longitude: 55.5172,
        prixJour: 65,
        prixSemaine: 390,
        prixMois: 1400,
        caution: 800,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&auto=format&fit=crop",
        ],
        description:
          "Camion utilitaire pratique pour le transport de marchandises, volume important. Parfait pour les professionnels.",
      },
      // ============ MOTOS ============
      {
        categorie: CategorieVehicule.moto,
        marque: "Yamaha",
        modele: "MT-07",
        annee: 2023,
        immatriculation: "MO-123-RE",
        couleur: "Noir",
        typeVehicule: "roadster",
        carburant: CarburantType.essence,
        transmission: TransmissionType.manuelle,
        places: 2,
        portes: null,
        cylindree: 689,
        typeVelo: null,
        assistanceElec: null,
        poids: 184,
        ville: "saint-pierre",
        adresse: "777 Route des Colimaçons",
        latitude: -21.3393,
        longitude: 55.4781,
        prixJour: 40,
        prixSemaine: 240,
        prixMois: 900,
        caution: 300,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop",
        ],
        description:
          "Roadster agile et polyvalent, parfait pour découvrir les routes sinueuses de La Réunion. Moto plaisir accessible.",
      },
      {
        categorie: CategorieVehicule.moto,
        marque: "Honda",
        modele: "Africa Twin",
        annee: 2024,
        immatriculation: "MO-456-AD",
        couleur: "Rouge",
        typeVehicule: "trail",
        carburant: CarburantType.essence,
        transmission: TransmissionType.manuelle,
        places: 2,
        portes: null,
        cylindree: 1084,
        typeVelo: null,
        assistanceElec: null,
        poids: 226,
        ville: "saint-denis",
        adresse: "888 Chemin des Hauts",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 55,
        prixSemaine: 330,
        prixMois: 1200,
        caution: 400,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1527847263472-aa5338d178b8?w=800&auto=format&fit=crop",
        ],
        description:
          "Trail tout-terrain idéal pour explorer les pistes de l'île. Confortable sur route et performant en chemin.",
      },
      {
        categorie: CategorieVehicule.moto,
        marque: "Zero",
        modele: "SR/F",
        annee: 2024,
        immatriculation: "MO-789-EL",
        couleur: "Argent",
        typeVehicule: "sportive",
        carburant: CarburantType.electrique,
        transmission: TransmissionType.automatique,
        places: 2,
        portes: null,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: 220,
        ville: "saint-paul",
        adresse: "999 Avenue de la Plage",
        latitude: -21.0097,
        longitude: 55.2697,
        prixJour: 60,
        prixSemaine: 360,
        prixMois: 1300,
        caution: 500,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1620748690536-eba2d67a10e6?w=800&auto=format&fit=crop",
        ],
        description:
          "Moto électrique sportive avec une puissance instantanée. Silencieuse, écologique et performante pour découvrir l'île.",
      },
      // ============ VÉLOS ============
      {
        categorie: CategorieVehicule.velo,
        marque: "Cube",
        modele: "Stereo 160",
        annee: 2023,
        immatriculation: null, // Pas d'immatriculation pour les vélos
        couleur: "Vert",
        typeVehicule: "VTT",
        carburant: null,
        transmission: null,
        places: 1,
        portes: null,
        cylindree: null,
        typeVelo: "VTT",
        assistanceElec: true,
        poids: 22.5,
        ville: "cilaos",
        adresse: "111 Route du Bras Sec",
        latitude: -21.1333,
        longitude: 55.4667,
        prixJour: 25,
        prixSemaine: 150,
        prixMois: 500,
        caution: 150,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&auto=format&fit=crop",
        ],
        description:
          "VTT à assistance électrique haut de gamme pour affronter les sentiers de montagne de La Réunion. Autonomie 120km.",
      },
      {
        categorie: CategorieVehicule.velo,
        marque: "Trek",
        modele: "Domane SL 6",
        annee: 2024,
        immatriculation: null,
        couleur: "Bleu",
        typeVehicule: "route",
        carburant: null,
        transmission: null,
        places: 1,
        portes: null,
        cylindree: null,
        typeVelo: "route",
        assistanceElec: false,
        poids: 8.2,
        ville: "saint-leu",
        adresse: "222 Boulevard de la Liane",
        latitude: -21.1706,
        longitude: 55.2883,
        prixJour: 20,
        prixSemaine: 120,
        prixMois: 400,
        caution: 100,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop",
        ],
        description:
          "Vélo de route carbone ultra-léger pour les amateurs de cyclisme sur route. Parfait pour le tour de l'île.",
      },
      {
        categorie: CategorieVehicule.velo,
        marque: "Moustache",
        modele: "Samedi 27 Xroad",
        annee: 2023,
        immatriculation: null,
        couleur: "Orange",
        typeVehicule: "VTC",
        carburant: null,
        transmission: null,
        places: 1,
        portes: null,
        cylindree: null,
        typeVelo: "VTC",
        assistanceElec: true,
        poids: 27.3,
        ville: "saint-gilles",
        adresse: "333 Rue du Général de Gaulle",
        latitude: -21.0596,
        longitude: 55.2253,
        prixJour: 22,
        prixSemaine: 130,
        prixMois: 450,
        caution: 120,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop",
        ],
        description:
          "VTC électrique polyvalent, confortable pour la ville comme pour les chemins. Idéal pour les balades côtières.",
      },
      {
        categorie: CategorieVehicule.velo,
        marque: "Specialized",
        modele: "Turbo Levo SL",
        annee: 2024,
        immatriculation: null,
        couleur: "Noir",
        typeVehicule: "VTT électrique",
        carburant: null,
        transmission: null,
        places: 1,
        portes: null,
        cylindree: null,
        typeVelo: "VTT",
        assistanceElec: true,
        poids: 18.9,
        ville: "saint-benoit",
        adresse: "444 Chemin des Cascades",
        latitude: -21.0339,
        longitude: 55.7128,
        prixJour: 28,
        prixSemaine: 168,
        prixMois: 600,
        caution: 180,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1598335624134-5bceb5de202d?w=800&auto=format&fit=crop",
        ],
        description:
          "VTT à assistance électrique léger et performant pour les trails techniques du Piton de la Fournaise.",
      },
      // ============ VOITURE ÉLECTRIQUE ============
      {
        categorie: CategorieVehicule.voiture,
        marque: "Nissan",
        modele: "Leaf",
        annee: 2024,
        immatriculation: "YZ-901-BC",
        couleur: "Bleu",
        typeVehicule: "compacte",
        carburant: CarburantType.electrique,
        transmission: TransmissionType.automatique,
        places: 5,
        portes: 5,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: null,
        ville: "saint-pierre",
        adresse: "444 Avenue de la Paix",
        latitude: -21.3393,
        longitude: 55.4781,
        prixJour: 60,
        prixSemaine: 360,
        prixMois: 1300,
        caution: 600,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
        ],
        description:
          "Voiture électrique silencieuse et économique, parfaite pour l'île. Écologique et performante.",
      },
      // ============ VOITURE LUXE ============
      {
        categorie: CategorieVehicule.voiture,
        marque: "Mercedes",
        modele: "Classe C",
        annee: 2024,
        immatriculation: "MN-012-OP",
        couleur: "Noir",
        typeVehicule: "luxe",
        carburant: CarburantType.essence,
        transmission: TransmissionType.automatique,
        places: 5,
        portes: 4,
        cylindree: null,
        typeVelo: null,
        assistanceElec: null,
        poids: null,
        ville: "saint-denis",
        adresse: "101 Avenue de la Victoire",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 120,
        prixSemaine: 720,
        prixMois: 2500,
        caution: 1500,
        disponible: true,
        images: [
          "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop",
        ],
        description:
          "Berline premium avec tous les équipements haut de gamme. Luxe et performance pour vos déplacements.",
      },
    ];

    console.log(`🎯 Création de ${vehiculesData.length} véhicules...`);

    // Créer les véhicules
    for (let i = 0; i < vehiculesData.length; i++) {
      const prestataire = prestataires[i % prestataires.length];
      const vehiculeData = vehiculesData[i];

      // Calculer une note aléatoire entre 3.5 et 5
      const rating = 3.5 + Math.random() * 1.5;

      // Nombre d'avis aléatoire
      const nombreAvis = Math.floor(Math.random() * 30);

      // Nombre de réservations aléatoire
      const nombreReservations = Math.floor(Math.random() * 25);

      await prisma.vehicule.create({
        data: {
          prestataireId: prestataire.id,
          ...vehiculeData,
          statut: "active",
          rating: parseFloat(rating.toFixed(1)),
          nombreAvis: nombreAvis,
          nombreReservations: nombreReservations,
        },
      });

      const categorieEmoji = {
        [CategorieVehicule.voiture]: "🚗",
        [CategorieVehicule.camion]: "🚚",
        [CategorieVehicule.moto]: "🏍️",
        [CategorieVehicule.velo]: "🚲",
      };

      console.log(
        `${categorieEmoji[vehiculeData.categorie]} Véhicule ${i + 1} créé: ${vehiculeData.marque} ${vehiculeData.modele} (${vehiculeData.categorie})`
      );
    }

    // Créer quelques disponibilités
    console.log("📅 Création des disponibilités...");
    const vehicules = await prisma.vehicule.findMany();

    for (const vehicule of vehicules) {
      // Créer des périodes de disponibilité aléatoires
      const today = new Date();
      const createdDates = new Set(); // Tracker les combinaisons créées

      // Ajouter quelques périodes de disponibilité (6 mois à venir)
      for (let i = 0; i < 5; i++) {
        let startDate, endDate, dateKey;
        let attempts = 0;

        // Générer des dates uniques
        do {
          const startDay = Math.floor(Math.random() * 180) + 1; // 1 à 180 jours dans le futur
          const duration = Math.floor(Math.random() * 14) + 3; // 3 à 16 jours

          startDate = new Date(today);
          startDate.setDate(today.getDate() + startDay);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + duration);

          dateKey = `${startDate.getTime()}-${endDate.getTime()}`;
          attempts++;
        } while (createdDates.has(dateKey) && attempts < 10);

        // Ajouter à l'ensemble si on a trouvé une date unique
        if (!createdDates.has(dateKey)) {
          createdDates.add(dateKey);

          // Pour les vélos, moins de prix spéciaux
          const isSpecialPrice =
            vehicule.categorie === CategorieVehicule.velo
              ? Math.random() > 0.9
              : Math.random() > 0.8;

          const prixSpecial = isSpecialPrice
            ? vehicule.prixJour * (0.85 + Math.random() * 0.1)
            : null;

          try {
            await prisma.disponibiliteVehicule.create({
              data: {
                vehiculeId: vehicule.id,
                dateDebut: startDate,
                dateFin: endDate,
                disponible: true, // Toutes les périodes créées sont disponibles
                prixSpecial: prixSpecial
                  ? parseFloat(prixSpecial.toFixed(2))
                  : null,
              },
            });
          } catch (error) {
            if (!error.message.includes("Unique constraint")) {
              console.warn(
                `⚠️ Disponibilité non créée pour ${vehicule.id}:`,
                error.message
              );
            }
          }
        }
      }
    }

    console.log("🎉 Seeding des véhicules terminé !");
    console.log(
      `📊 ${vehiculesData.length} véhicules créés (voitures, camions, motos, vélos)`
    );
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder si appelé directement
if (require.main === module) {
  seedVehicules();
}

module.exports = seedVehicules;
