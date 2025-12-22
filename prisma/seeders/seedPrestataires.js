// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // Fonction pour générer un mot de passe hashé (simulation)
// function generatePasswordHash() {
//   return "$2a$10$e5pY3JX8KjLmN9qR.S8TZ.7vV1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T"; // mot de passe: "Password123!"
// }

// // Fonction pour générer un email basé sur le nom
// function generateEmail(nom) {
//   const cleanName = nom
//     .toLowerCase()
//     .replace(/[^a-z0-9]/g, "")
//     .replace(/\s+/g, ".");
//   return `${cleanName}@example.com`;
// }

// // Fonction pour générer un numéro de téléphone aléatoire
// function generatePhone() {
//   return `06${Math.floor(Math.random() * 100000000)
//     .toString()
//     .padStart(8, "0")}`;
// }

// // Fonction pour obtenir le métier correspondant à la catégorie
// function getMetierForCategory(category) {
//   const categoryMetiers = {
//     "Agences Immo": [
//       "Agent Immobilier - Administrateur de biens",
//       "Conseiller Immobilier",
//     ],
//     Notaires: ["Notaire", "Clerc de Notaire"],
//     Promoteurs: ["Promoteur", "Constructeur", "Aménageur - Lotisseur"],
//     Social: ["Bailleur Social", "Promoteur"],
//     Financement: [
//       "Banquier",
//       "Conseiller bancaire",
//       "Courtier",
//       "Conseiller en prêt immobilier",
//     ],
//     Assurance: ["Assureur", "Conseiller Assurance", "Expert en assurance"],
//   };

//   return categoryMetiers[category] || ["Commercial"]; // Valeur par défaut
// }

// async function main() {
//   try {
//     console.log("🌱 Seeding des prestataires professionnels...");

//     // Données des feuilles Excel
//     const prestatairesData = [
//       {
//         sheet: "Agences Immo",
//         data: [
//           "OLIMMO REUNION",
//           "GUY HOQUET",
//           "L'IMMOBILIER ENCHANTE",
//           "L'IMMOBILIERE DE LILE",
//           "HA IMMO",
//           "KOYTCHA IMMO",
//           "IAD",
//           "OUTRE MER IMMOBILIER",
//           "LA KAZE IMMO",
//           "PRMI",
//           "CITYA",
//           "COREZ",
//           "HESTIA",
//           "EFFICITY",
//           "MAXIMMO",
//           "FCT IMMO",
//           "L'EQUIPE IMMOBILIERE",
//           "LOGER",
//           "CETURY 21",
//           "ORPI",
//           "AMICASA",
//           "LITTORAL IMMOBILER",
//           "EFFICITY",
//           "EXP",
//           "L'IMMOBILIERE DE BOURBON",
//           "El Shally Immobilier",
//           "INOVISTA",
//           "HADDIMO",
//           "Hoarau Immobilier",
//           "ARH Immobilier",
//           "Urbanis",
//           "PLANET IMMO",
//           "IMMOA",
//           "BONNET IMMOBILIER",
//           "BSK IMMOBILIER",
//           "Quadran",
//         ],
//       },
//       {
//         sheet: "Notaires",
//         data: [
//           "KOYTCHA ABEL - SAINT-DENIS",
//           "KOYTCHA ABEL - SAINTE-MARIE",
//           "HOAREAU LOCATE - SAINT-DENIS",
//           "OMARJEE QUINOT - SAINT-PIERRE",
//           "BEMAT SAS NOT AVENIR - SAINT-DENIS",
//           "BEMAT SAS NOT AVENIR - SAINT-ANDRE",
//           "BEMAT SAS NOT AVENIR - SAINT-GILLES",
//           "BEMAT SAS NOT AVENIR - SAINT-PAUL",
//           "LALA - SAINT-LEU",
//           "LECADIEU - SAINT-PIERRE",
//           "BARET - SAINT-PIERRE",
//           "POPINEAU - SAINT-DENIS",
//           "PATEL MICHEL - SAINT-DENIS",
//           "THAZARDS - SAINT-BENOIT",
//           "GUILLAUME PHILIPPE - SAINTE-MARIE",
//         ],
//       },
//       {
//         sheet: "Promoteurs",
//         data: [
//           "KHEOPS",
//           "OPALE",
//           "APJ",
//           "SPAG",
//           "OCEANIS",
//           "BOURBON DEVELOPPEMENT",
//           "SFLP",
//           "ISAUTIER",
//           "OKARE IMMOBILIER",
//           "SECODIS",
//         ],
//       },
//       {
//         sheet: "Social",
//         data: [
//           "SHLMR",
//           "SIDR",
//           "SODIAC",
//           "SEDRE",
//           "SEMADER",
//           "SEMAC",
//           "KHEOPS",
//         ],
//       },
//       {
//         sheet: "Financement",
//         data: [
//           // "CREDIT REUNION",
//           "MEILLEUX TAUX",
//           "CAFPI",
//           "AFR FINANCEMENT",
//           "LA CENTRALE DE FINANCEMENT",
//           "YMANCI",
//         ],
//       },
//       {
//         sheet: "Assurance",
//         data: ["NOVA ASSURANCE", "UFA", "GROUPAMA", "GESCO ASSURANCE"],
//       },
//     ];

//     let totalCreated = 0;
//     let metiersCreated = 0;

//     // Pour chaque catégorie
//     for (const categoryData of prestatairesData) {
//       const { sheet, data } = categoryData;
//       console.log(
//         `\n📋 Traitement de la catégorie: ${sheet} (${data.length} prestataires)`
//       );

//       // Récupérer les métiers correspondants à cette catégorie
//       const metiersNoms = getMetierForCategory(sheet);

//       // Créer les métiers s'ils n'existent pas
//       const metiersIds = [];
//       for (const metierNom of metiersNoms) {
//         let metier = await prisma.metier.findFirst({
//           where: { libelle: metierNom },
//         });

//         if (!metier) {
//           console.log(`   ➕ Création du métier: ${metierNom}`);
//           metier = await prisma.metier.create({
//             data: { libelle: metierNom },
//           });
//           metiersCreated++;
//         }
//         metiersIds.push(metier.id);
//       }

//       // Pour chaque prestataire dans cette catégorie
//       for (const prestataireNom of data) {
//         const email = generateEmail(prestataireNom);

//         // Vérifier si l'utilisateur existe déjà
//         const existingUser = await prisma.user.findUnique({
//           where: { email },
//         });

//         if (existingUser) {
//           console.log(`   ⚠️  Utilisateur déjà existant: ${prestataireNom}`);
//           continue;
//         }

//         try {
//           // Créer l'utilisateur
//           const user = await prisma.user.create({
//             data: {
//               email,
//               passwordHash: generatePasswordHash(),
//               firstName:
//                 prestataireNom.split(" ")[0] || prestataireNom.substring(0, 10),
//               lastName:
//                 prestataireNom.split(" ").slice(1).join(" ") || "Prestataire",
//               phone: generatePhone(),
//               role: "professional",
//               status: "active",
//               companyName: prestataireNom,
//               commercialName: prestataireNom,
//               userType: "professional",
//               city: sheet === "Notaires" ? "La Réunion" : "Saint-Denis",
//               address: "Adresse professionnelle",
//               zipCode: "97400",
//             },
//           });

//           console.log(`   ✅ Créé: ${prestataireNom} (${email})`);
//           totalCreated++;

//           // Associer les métiers à l'utilisateur
//           for (const metierId of metiersIds) {
//             await prisma.utilisateurMetier.create({
//               data: {
//                 userId: user.id,
//                 metierId,
//               },
//             });
//           }

//           // Créer les paramètres professionnels
//           await prisma.professionalSettings.create({
//             data: {
//               userId: user.id,
//               nomEntreprise: prestataireNom,
//               emailContact: email,
//               telephone: generatePhone(),
//               adresse: "Adresse professionnelle, La Réunion",
//               horairesLundi: { debut: "09:00", fin: "18:00" },
//               horairesMardi: { debut: "09:00", fin: "18:00" },
//               horairesMercredi: { debut: "09:00", fin: "18:00" },
//               horairesJeudi: { debut: "09:00", fin: "18:00" },
//               horairesVendredi: { debut: "09:00", fin: "17:00" },
//               horairesSamedi: { debut: "09:00", fin: "12:00" },
//               horairesDimanche: null,
//               delaiReponseEmail: 24,
//               delaiReponseTelephone: 2,
//               delaiReponseUrgence: 4,
//               fraisAnnulationPourcent: 15,
//               acomptePourcentage: 30,
//               montantMinimum: 100,
//             },
//           });

//           // Pour les catégories spéciales, créer des entités supplémentaires
//           if (sheet === "Financement") {
//             // Créer un partenaire de financement
//             const isCreditReunion = prestataireNom.includes("CREDIT REUNION");
//             await prisma.financementPartenaire.create({
//               data: {
//                 nom: prestataireNom,
//                 description: `Partenaire financement ${prestataireNom}`,
//                 rating: 4.5,
//                 type: "banque",
//                 avantages: [
//                   "Taux compétitifs",
//                   "Délais rapides",
//                   "Accompagnement personnalisé",
//                 ],
//                 icon: "bank",
//                 isActive: true,
//                 userId: user.id,
//                 website: isCreditReunion
//                   ? "https://creditreunion.com/"
//                   : `https://${prestataireNom.toLowerCase().replace(/\s/g, "")}.com`,
//                 phone: generatePhone(),
//                 email: email,
//                 conditions: "Sur étude de dossier",
//                 tauxMin: isCreditReunion ? 2.5 : 3.0,
//                 tauxMax: isCreditReunion ? 4.0 : 5.5,
//                 dureeMin: 60,
//                 dureeMax: 300,
//                 montantMin: 10000,
//                 montantMax: 1000000,
//               },
//             });
//           } else if (sheet === "Assurance") {
//             // Créer un service d'assurance
//             await prisma.assuranceService.create({
//               data: {
//                 nom: prestataireNom,
//                 description: `Service d'assurance ${prestataireNom}`,
//                 details: "Assurance tous risques avec couverture complète",
//                 icon: "shield",
//                 obligatoire: false,
//                 public: "particulier",
//                 isActive: true,
//               },
//             });
//           }
//         } catch (error) {
//           console.error(
//             `   ❌ Erreur lors de la création de ${prestataireNom}:`,
//             error.message
//           );
//         }
//       }
//     }

//     console.log(`\n📊 RÉCAPITULATIF:`);
//     console.log(`✅ ${totalCreated} prestataires professionnels créés`);
//     console.log(`✅ ${metiersCreated} métiers créés si manquants`);
//     console.log("🌿 Seeding des prestataires terminé avec succès !");
//   } catch (error) {
//     console.error("❌ Erreur lors du seeding:", error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Mise à jour des prestataires professionnels...");

    // Liste des emails par catégorie
    const utilisateursEmails = {
      Agences: [
        "olimmoreunion@example.com",
        "guyhoquet@example.com",
        "limmobilierenchante@example.com",
        "limmobilieredelile@example.com",
        "haimmo@example.com",
        "koytchaimmo@example.com",
        "iad@example.com",
        "outremerimmobilier@example.com",
        "lakazeimmo@example.com",
        "prmi@example.com",
        "citya@example.com",
        "corez@example.com",
        "hestia@example.com",
        "efficity@example.com",
        "maximmo@example.com",
        "fctimmo@example.com",
        "lequipeimmobiliere@example.com",
        "loger@example.com",
        "cetury21@example.com",
        "orpi@example.com",
        "amicasa@example.com",
        "littoralimmobiler@example.com",
        "efficity2@example.com",
        "exp@example.com",
        "limmobilieredebourbon@example.com",
        "elshallyimmobilier@example.com",
        "inovista@example.com",
        "haddimo@example.com",
        "hoarauimmobilier@example.com",
        "arhimmobilier@example.com",
        "urbanis@example.com",
        "planetimmo@example.com",
        "immoa@example.com",
        "bonnetimmobilier@example.com",
        "bskimmobilier@example.com",
        "quadran@example.com",
      ],
      Notaires: [
        "koytchaabelsaintdenis@example.com",
        "koytchaabelsaintemarie@example.com",
        "hoareaulocatesaintdenis@example.com",
        "omarjeequinotsaintpierre@example.com",
        "bematsasnotavenirssaintdenis@example.com",
        "bematsasnotavenirsaintandre@example.com",
        "bematsasnotavenirssaintgilles@example.com",
        "bematsasnotavenirssaintpaul@example.com",
        "lalasaintleu@example.com",
        "lecadieusaintpierre@example.com",
        "baretsaintpierre@example.com",
        "popineausaintdenis@example.com",
        "patelmichelsaintdenis@example.com",
        "thazardssaintbenoit@example.com",
        "guillaumephilippesaintemarie@example.com",
      ],
      Promoteurs: [
        "kheops@example.com",
        "opale@example.com",
        "apj@example.com",
        "spag@example.com",
        "oceanis@example.com",
        "bourbondeveloppement@example.com",
        "sflp@example.com",
        "isautier@example.com",
        "okareimmobilier@example.com",
        "secodis@example.com",
      ],
      Social: [
        "shlmr@example.com",
        "sidr@example.com",
        "sodiac@example.com",
        "sedre@example.com",
        "semader@example.com",
        "semac@example.com",
        "kheopsocial@example.com",
      ],
      Financement: [
        "meilleuxtaux@example.com",
        "cafpi@example.com",
        "afrfinancement@example.com",
        "lacentraledefinancement@example.com",
        "ymanci@example.com",
      ],
      Assurance: [
        "novaassurance@example.com",
        "ufa@example.com",
        "groupama@example.com",
        "gescoassurance@example.com",
      ],
    };

    // Mot de passe à utiliser
    const nouveauMotDePasse = "pro123";
    const hashMotDePasse = await bcrypt.hash(nouveauMotDePasse, 10);

    let updatedCount = 0;
    let agenceCount = 0;
    let shlmrCount = 0;
    let prestataireCount = 0;

    // Pour chaque catégorie
    for (const [categorie, emails] of Object.entries(utilisateursEmails)) {
      console.log(`\n📋 Traitement de la catégorie: ${categorie}`);

      for (const email of emails) {
        try {
          // Trouver l'utilisateur
          const utilisateur = await prisma.user.findUnique({
            where: { email },
          });

          if (!utilisateur) {
            console.log(`   ⚠️  Utilisateur non trouvé: ${email}`);
            continue;
          }

          // Déterminer le userType
          let userType = "PRESTATAIRE"; // Par défaut
          let typeLabel = "Prestataire";

          if (categorie === "Agences") {
            userType = "AGENCE";
            typeLabel = "Agence immobilière";
            agenceCount++;
          } else if (email.includes("shlmr")) {
            userType = "AGENCE";
            typeLabel = "SHLMR (Agence)";
            shlmrCount++;
          } else {
            prestataireCount++;
          }

          // Mettre à jour l'utilisateur
          await prisma.user.update({
            where: { id: utilisateur.id },
            data: {
              passwordHash: hashMotDePasse,
              userType: userType,
            },
          });

          console.log(`   ✅ ${email} -> Type: ${typeLabel}`);
          updatedCount++;
        } catch (error) {
          console.error(
            `   ❌ Erreur lors de la mise à jour de ${email}:`,
            error.message
          );
        }
      }
    }

    console.log(`\n📊 RÉCAPITULATIF DE LA MISE À JOUR:`);
    console.log(`✅ ${updatedCount} utilisateurs mis à jour`);
    console.log(`🏢 ${agenceCount} agences immobilières (type: AGENCE)`);
    console.log(`🏢 ${shlmrCount} SHLMR (type: AGENCE)`);
    console.log(
      `👨‍💼 ${prestataireCount} autres prestataires (type: PRESTATAIRE)`
    );
    console.log(`🔐 Mot de passe défini sur: ${nouveauMotDePasse}`);
    console.log("✨ Mise à jour terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});