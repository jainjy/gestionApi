const { prisma } = require("../../lib/db");

async function seedVehicules() {
  try {
    console.log("🌱 Début du seeding des véhicules...");

    // Trouver quelques prestataires
    const prestataires = await prisma.user.findMany({
      where: {
        userType: { in: ["professional", "prestataire"] },
      },
      take: 5,
    });

    if (prestataires.length === 0) {
      console.log("❌ Aucun prestataire trouvé pour ajouter des véhicules");
      return;
    }

    const vehiculesData = [
      {
        marque: "Toyota",
        modele: "Yaris",
        annee: 2023,
        immatriculation: "AB-123-CD",
        couleur: "Blanc",
        puissance: "75ch",
        typeVehicule: "economique",
        carburant: "essence",
        transmission: "manuelle",
        places: 4,
        portes: 5,
        volumeCoffre: "350L",
        ville: "saint-denis",
        adresse: "123 Rue de Paris",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 35,
        prixSemaine: 210,
        prixMois: 800,
        kilometrageInclus: "300 km/jour",
        caution: 500,
        images: [
          "https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisation: true,
          gps: false,
          bluetooth: true,
          cameraRecul: true,
          regulateurVitesse: false,
        },
        caracteristiques: [
          "4 places",
          "Climatisation",
          "Bluetooth",
          "Airbags",
          "ABS",
        ],
        description:
          "Voiture économique parfaite pour la ville, consommation réduite. Idéale pour les déplacements urbains.",
        agence: "Location Réunion Auto",
        conditionsLocation:
          "Permis valide depuis plus de 1 an, carte de crédit obligatoire, caution de 500€.",
      },
      {
        marque: "Renault",
        modele: "Clio",
        annee: 2024,
        immatriculation: "EF-456-GH",
        couleur: "Gris",
        puissance: "90ch",
        typeVehicule: "compacte",
        carburant: "diesel",
        transmission: "automatique",
        places: 5,
        portes: 5,
        volumeCoffre: "390L",
        ville: "saint-pierre",
        adresse: "456 Avenue du Général",
        latitude: -21.3393,
        longitude: 55.4781,
        prixJour: 45,
        prixSemaine: 270,
        prixMois: 1000,
        kilometrageInclus: "illimité",
        caution: 600,
        images: [
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisation: true,
          gps: true,
          bluetooth: true,
          cameraRecul: true,
          regulateurVitesse: true,
          toitOuvrant: true,
        },
        caracteristiques: [
          "5 places",
          "Climatisation",
          "GPS",
          "Toit ouvrant",
          "Régulateur",
        ],
        description:
          "Compacte spacieuse avec transmission automatique, idéale pour la famille. Confort et sécurité garantis.",
        agence: "Auto Loc 974",
        conditionsLocation:
          "Âge minimum 21 ans, permis valide depuis 2 ans, dépôt de garantie obligatoire.",
      },
      {
        marque: "Peugeot",
        modele: "3008",
        annee: 2023,
        immatriculation: "IJ-789-KL",
        couleur: "Bleu",
        puissance: "180ch",
        typeVehicule: "suv",
        carburant: "hybride",
        transmission: "automatique",
        places: 5,
        portes: 5,
        volumeCoffre: "520L",
        ville: "saint-paul",
        adresse: "789 Boulevard de l'Océan",
        latitude: -21.0097,
        longitude: 55.2697,
        prixJour: 75,
        prixSemaine: 450,
        prixMois: 1600,
        kilometrageInclus: "400 km/jour",
        caution: 800,
        images: [
          "https://images.unsplash.com/photo-1563720223486-7a472e5c7b52?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisationBiZone: true,
          gps: true,
          bluetooth: true,
          camera360: true,
          regulateurVitesseAdaptatif: true,
          toitPanoramique: true,
          quatreQuatre: true,
        },
        caracteristiques: [
          "5 places",
          "Climatisation bi-zone",
          "GPS",
          "Toit panoramique",
          "4x4",
        ],
        description:
          "SUV familial hybride, confort et espace pour vos aventures réunionnaises. Parfait pour explorer l'île.",
        agence: "Premium Location",
        conditionsLocation:
          "Assurance tous risques recommandée, kilométrage limité à 400km/jour.",
      },
      {
        marque: "Mercedes",
        modele: "Classe C",
        annee: 2024,
        immatriculation: "MN-012-OP",
        couleur: "Noir",
        puissance: "258ch",
        typeVehicule: "luxe",
        carburant: "essence",
        transmission: "automatique",
        places: 5,
        portes: 4,
        volumeCoffre: "455L",
        ville: "saint-denis",
        adresse: "101 Avenue de la Victoire",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 120,
        prixSemaine: 720,
        prixMois: 2500,
        kilometrageInclus: "illimité",
        caution: 1500,
        images: [
          "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisationQuatreZones: true,
          gpsPremium: true,
          systemeAudioPremium: true,
          siegesCuir: true,
          assistanceConduite: true,
          pharesLed: true,
        },
        caracteristiques: [
          "5 places",
          "Climatisation 4 zones",
          "GPS premium",
          "Cuir",
          "Assistance conduite",
        ],
        description:
          "Berline premium avec tous les équipements haut de gamme. Luxe et performance pour vos déplacements.",
        agence: "Luxe Auto Réunion",
        conditionsLocation:
          "Âge minimum 25 ans, permis valide depuis 3 ans, assurance tous risques obligatoire.",
      },
      {
        marque: "Renault",
        modele: "Kangoo",
        annee: 2022,
        immatriculation: "QR-345-ST",
        couleur: "Blanc",
        puissance: "95ch",
        typeVehicule: "utilitaire",
        carburant: "diesel",
        transmission: "manuelle",
        places: 3,
        portes: 5,
        volumeCoffre: "3.9m³",
        ville: "le-tampon",
        adresse: "222 Route des Plaines",
        latitude: -21.2775,
        longitude: 55.5172,
        prixJour: 55,
        prixSemaine: 330,
        prixMois: 1200,
        kilometrageInclus: "300 km/jour",
        caution: 700,
        images: [
          "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisation: true,
          hayonElectrique: true,
          cameraRecul: true,
          systemeChargement: true,
        },
        caracteristiques: [
          "3 places",
          "Climatisation",
          "Grand volume",
          "Hayon",
          "ABS",
        ],
        description:
          "Utilitaire pratique pour le transport de marchandises, volume important. Parfait pour les professionnels.",
        agence: "Pro Location 974",
        conditionsLocation:
          "Utilisation professionnelle autorisée, caution majorée pour les entreprises.",
      },
      {
        marque: "Ford",
        modele: "Ranger",
        annee: 2023,
        immatriculation: "UV-678-WX",
        couleur: "Gris",
        puissance: "213ch",
        typeVehicule: "camion",
        carburant: "diesel",
        transmission: "automatique",
        places: 5,
        portes: 4,
        volumeCoffre: "Benne 1 tonne",
        ville: "saint-louis",
        adresse: "333 Route du Littoral",
        latitude: -21.286,
        longitude: 55.4092,
        prixJour: 85,
        prixSemaine: 510,
        prixMois: 1800,
        kilometrageInclus: "250 km/jour",
        caution: 1000,
        images: [
          "https://images.unsplash.com/photo-1566474591191-8a583d6af81b?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisation: true,
          quatreQuatrePermanent: true,
          treuilElectrique: true,
          protectionCaisse: true,
          benneAmovible: true,
        },
        caracteristiques: [
          "5 places",
          "Climatisation",
          "4x4",
          "Grande benne",
          "Treuil",
        ],
        description:
          "Pick-up robuste pour travaux et transport de matériel en tout terrain. Idéal pour les chantiers.",
        agence: "Location Pro Réunion",
        conditionsLocation:
          "Conduite hors-route interdite, retour avec le réservoir plein obligatoire.",
      },
      {
        marque: "Nissan",
        modele: "Leaf",
        annee: 2024,
        immatriculation: "YZ-901-BC",
        couleur: "Bleu",
        puissance: "150ch",
        typeVehicule: "compacte",
        carburant: "electrique",
        transmission: "automatique",
        places: 5,
        portes: 5,
        volumeCoffre: "435L",
        ville: "saint-pierre",
        adresse: "444 Avenue de la Paix",
        latitude: -21.3393,
        longitude: 55.4781,
        prixJour: 60,
        prixSemaine: 360,
        prixMois: 1300,
        kilometrageInclus: "illimité",
        caution: 600,
        images: [
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisation: true,
          ecranTactile: true,
          rechargeRapide: true,
          aidesConduite: true,
          autonomie: "270km",
        },
        caracteristiques: [
          "5 places",
          "Climatisation",
          "Autonomie 270km",
          "Recharge rapide",
          "Écran tactile",
        ],
        description:
          "Voiture électrique silencieuse et économique, parfaite pour l'île. Écologique et performante.",
        agence: "Eco Location Réunion",
        conditionsLocation:
          "Retour avec au moins 20% de batterie, borne de recharge incluse.",
      },
      {
        marque: "Volkswagen",
        modele: "Caravelle",
        annee: 2023,
        immatriculation: "DE-234-FG",
        couleur: "Blanc",
        puissance: "150ch",
        typeVehicule: "minibus",
        carburant: "diesel",
        transmission: "manuelle",
        places: 9,
        portes: 5,
        volumeCoffre: "Grand volume",
        ville: "saint-denis",
        adresse: "555 Boulevard du Commerce",
        latitude: -20.88231,
        longitude: 55.45041,
        prixJour: 95,
        prixSemaine: 570,
        prixMois: 2000,
        kilometrageInclus: "300 km/jour",
        caution: 1200,
        images: [
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop",
        ],
        equipements: {
          climatisationDoubleZone: true,
          siegesAmovibles: true,
          portesCoulissantes: true,
          espaceChargement: true,
        },
        caracteristiques: [
          "9 places",
          "Climatisation",
          "Grand espace",
          "Sièges amovibles",
          "Toit élevé",
        ],
        description:
          "Minibus 9 places idéal pour les groupes, familles ou équipes. Confortable et spacieux.",
        agence: "Family Location",
        conditionsLocation:
          "Conducteur additionnel obligatoire pour les longs trajets, assurance groupe incluse.",
      },
    ];

    // Créer les véhicules
    for (let i = 0; i < vehiculesData.length; i++) {
      const prestataire = prestataires[i % prestataires.length];
      const vehiculeData = vehiculesData[i];

      await prisma.vehicule.create({
        data: {
          prestataireId: prestataire.id,
          ...vehiculeData,
          disponible: true,
          statut: "active",
          rating: 4 + Math.random() * 1, // Note entre 4 et 5
          nombreReservations: Math.floor(Math.random() * 20),
          vues: Math.floor(Math.random() * 100),
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
        },
      });

      console.log(
        `✅ Véhicule ${i + 1} créé: ${vehiculeData.marque} ${vehiculeData.modele}`
      );
    }

    // Créer quelques disponibilités
    console.log("📅 Création des disponibilités...");
    const vehicules = await prisma.vehicule.findMany();

    for (const vehicule of vehicules) {
      // Créer des périodes d'indisponibilité aléatoires
      const today = new Date();
      const createdDates = new Set(); // Tracker les combinaisons créées

      // Ajouter quelques jours d'indisponibilité
      for (let i = 0; i < 3; i++) {
        let startDate, endDate, dateKey;
        let attempts = 0;

        // Générer des dates uniques
        do {
          startDate = new Date(today);
          startDate.setDate(today.getDate() + Math.floor(Math.random() * 20) + 5);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1);
          
          dateKey = `${startDate.getTime()}-${endDate.getTime()}`;
          attempts++;
        } while (createdDates.has(dateKey) && attempts < 10);

        // Ajouter à l'ensemble si on a trouvé une date unique
        if (!createdDates.has(dateKey)) {
          createdDates.add(dateKey);

          try {
            await prisma.disponibiliteVehicule.upsert({
              where: {
                vehiculeId_dateDebut_dateFin: {
                  vehiculeId: vehicule.id,
                  dateDebut: startDate,
                  dateFin: endDate,
                },
              },
              update: {
                disponible: Math.random() > 0.7,
                prixSpecial: Math.random() > 0.8 ? vehicule.prixJour * 0.9 : null,
              },
              create: {
                vehiculeId: vehicule.id,
                dateDebut: startDate,
                dateFin: endDate,
                disponible: Math.random() > 0.7,
                prixSpecial: Math.random() > 0.8 ? vehicule.prixJour * 0.9 : null,
                createdAt: new Date(),
              },
            });
          } catch (error) {
            console.warn(`⚠️ Disponibilité non créée pour ${vehicule.id}:`, error.message);
          }
        }
      }
    }

    console.log("🎉 Seeding des véhicules terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder si appelé directement
if (require.main === module) {
  seedVehicules();
}

module.exports = seedVehicules;
