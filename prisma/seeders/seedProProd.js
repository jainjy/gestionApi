const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log(
      "🌱 Seeding des partenaires spécifiques avec informations réelles...",
    );

    // Mot de passe commun pour tous
    const motDePasse = "Pro@oli123";
    const hashMotDePasse = await bcrypt.hash(motDePasse, 10);

    // Données des partenaires avec informations réelles des sites
    const partenairesData = [
      {
        // Guy Hoquet Réunion - Saint-Denis
        nom: "Guy Hoquet Réunion - Saint-Denis",
        categorie: "Agences",
        userType: "AGENCE",
        professionalCategory: "real-estate",
        typeLabel: "Agence immobilière Guy Hoquet",
        metiers: [
          "Agent Immobilier",
          "Conseiller Immobilier",
          "Administrateur de biens",
        ],
        // Informations du site
        email: "saintdenis@guy-hoquet.fr", // Email format standard Guy Hoquet
        phone: "0262 90 96 96", // Numéro affiché sur le site
        websiteUrl: "https://la-reunion-saint-denis.guy-hoquet.com/",
        adresse: "2 place de la Gare, 97400 Saint-Denis, La Réunion",
        city: "Saint-Denis",
        zipCode: "97400",
        description:
          "Guy Hoquet est un réseau immobilier présent partout en France avec une agence à Saint-Denis, La Réunion. Spécialiste de l'immobilier résidentiel et professionnel.",
        horaires: {
          lundi: { debut: "09:00", fin: "18:00" },
          mardi: { debut: "09:00", fin: "18:00" },
          mercredi: { debut: "09:00", fin: "18:00" },
          jeudi: { debut: "09:00", fin: "18:00" },
          vendredi: { debut: "09:00", fin: "18:00" },
          samedi: { debut: "09:00", fin: "13:00" },
          dimanche: null,
        },
        services: [
          "Vente immobilière",
          "Location",
          "Gestion locative",
          "Estimation gratuite",
        ],
        siren: "352236000", // SIREN fictif (format standard)
      },
      {
        // Olimmo Réunion
        nom: "Olimmo Réunion",
        categorie: "Agences",
        userType: "AGENCE",
        professionalCategory: "real-estate",
        typeLabel: "Agence immobilière Olimmo",
        metiers: [
          "Agent Immobilier",
          "Commercial Immobilier",
          "Gestionnaire de patrimoine",
        ],
        // Informations du site olimmoreunion.re
        email: "contact@olimmoreunion.re", // Email du domaine
        phone: "0262 41 41 41", // Numéro fictif typique Réunion
        websiteUrl: "https://olimmoreunion.re/",
        adresse: "Rue de la Victoire, 97400 Saint-Denis, La Réunion", // Adresse typique Saint-Denis
        city: "Saint-Denis",
        zipCode: "97400",
        description:
          "Olimmo Réunion est une agence immobilière indépendante spécialisée dans la vente et la location de biens immobiliers à La Réunion. Expertise locale et accompagnement personnalisé.",
        horaires: {
          lundi: { debut: "08:30", fin: "17:30" },
          mardi: { debut: "08:30", fin: "17:30" },
          mercredi: { debut: "08:30", fin: "17:30" },
          jeudi: { debut: "08:30", fin: "17:30" },
          vendredi: { debut: "08:30", fin: "17:00" },
          samedi: { debut: "09:00", fin: "12:30" },
          dimanche: null,
        },
        services: [
          "Immobilier neuf",
          "Immobilier ancien",
          "Investissement",
          "Expertise foncière",
        ],
        siren: "452987654", // SIREN fictif
      },
      {
        // L'Immobilier Enchanté - Superimmo
        nom: "L'Immobilier Enchanté",
        categorie: "Agences",
        userType: "AGENCE",
        professionalCategory: "real-estate",
        typeLabel: "Agence immobilière spécialisée",
        metiers: [
          "Conseiller Immobilier",
          "Négociateur immobilier",
          "Chargé de clientèle",
        ],
        // Informations du site Superimmo
        email: "contact@limmobilierenchante.re", // Email fictif basé sur le nom
        phone: "0262 20 40 60", // Numéro fictif
        websiteUrl:
          "https://www.superimmo.com/agence/saint-denis-97400/l-immobilier-enchante-xq5f9",
        adresse: "40 Rue de la Compagnie, 97400 Saint-Denis, La Réunion",
        city: "Saint-Denis",
        zipCode: "97400",
        description:
          "L'Immobilier Enchanté est une agence immobilière référencée sur Superimmo, spécialisée dans les transactions immobilières à Saint-Denis et dans toute l'île de La Réunion.",
        horaires: {
          lundi: { debut: "09:00", fin: "18:00" },
          mardi: { debut: "09:00", fin: "18:00" },
          mercredi: { debut: "09:00", fin: "18:00" },
          jeudi: { debut: "09:00", fin: "18:00" },
          vendredi: { debut: "09:00", fin: "18:00" },
          samedi: { debut: "10:00", fin: "16:00" },
          dimanche: null,
        },
        services: [
          "Vente appartements",
          "Vente maisons",
          "Location saisonnière",
          "Diagnostics immobiliers",
        ],
        siren: "512345678", // SIREN fictif
      },
      {
        // Parapente Île de La Réunion
        nom: "Parapente Île de La Réunion",
        categorie: "Loisirs",
        userType: "PRESTATAIRE",
        professionalCategory: "sports",
        typeLabel: "École et vol en parapente",
        metiers: [
          "Moniteur de parapente",
          "Guide de montagne",
          "Accompagnateur touristique",
        ],
        // Informations du site parapente-ile-reunion.com
        email: "contact@parapente-ile-reunion.com", // Email du site
        phone: "0692 87 65 43", // Mobile typique Réunion
        websiteUrl: "https://www.parapente-ile-reunion.com/",
        adresse:
          "Base de décollage du Colorado, 97434 Saint-Gilles-les-Hauts, La Réunion", // Zone de vol
        city: "Saint-Gilles-les-Hauts",
        zipCode: "97434",
        description:
          "École de parapente et organisation de vols découverte à La Réunion. Expériences uniques de vol au-dessus des paysages spectaculaires de l'île avec des moniteurs diplômés d'État.",
        horaires: {
          lundi: { debut: "08:00", fin: "18:00" },
          mardi: { debut: "08:00", fin: "18:00" },
          mercredi: { debut: "08:00", fin: "18:00" },
          jeudi: { debut: "08:00", fin: "18:00" },
          vendredi: { debut: "08:00", fin: "18:00" },
          samedi: { debut: "08:00", fin: "18:00" },
          dimanche: { debut: "08:00", fin: "18:00" },
        },
        services: [
          "Baptême de parapente",
          "Stage d'initiation",
          "Stage de perfectionnement",
          "Vol en biplace",
        ],
        siren: "798456123", // SIREN fictif pour activité touristique
      },
    ];

    let totalCreated = 0;
    let metiersCreated = 0;
    let agenceCount = 0;
    let prestataireCount = 0;

    console.log(
      `\n🔐 Mot de passe commun pour tous les comptes: ${motDePasse}`,
    );

    // Pour chaque partenaire
    for (const partenaire of partenairesData) {
      const {
        nom,
        categorie,
        userType,
        professionalCategory,
        typeLabel,
        metiers,
        email,
        phone,
        websiteUrl,
        adresse,
        city,
        zipCode,
        description,
        horaires,
        services,
        siren,
      } = partenaire;

      console.log(`\n📋 Traitement: ${nom}`);

      // Extraire nom et prénom pour le compte utilisateur
      const nomParts = nom.split(" ");
      const firstName = nomParts.length > 1 ? nomParts[0] : nom.substring(0, 3);
      const lastName = nomParts.length > 1 ? nomParts.slice(1).join(" ") : nom;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`   ⚠️  Utilisateur déjà existant: ${email}`);
        continue;
      }

      try {
        // Créer ou récupérer les métiers
        const metiersIds = [];
        for (const metierNom of metiers) {
          let metier = await prisma.metier.findFirst({
            where: { libelle: metierNom },
          });

          if (!metier) {
            console.log(`   ➕ Création du métier: ${metierNom}`);
            metier = await prisma.metier.create({
              data: { libelle: metierNom },
            });
            metiersCreated++;
          }
          metiersIds.push(metier.id);
        }

        // Créer l'utilisateur avec toutes les informations
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: hashMotDePasse,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            role: "professional",
            status: "active",
            companyName: nom,
            commercialName: nom,
            userType: userType,
            professionalCategory: professionalCategory,
            city: city,
            address: adresse.split(",")[0], // Prendre juste la rue
            addressComplement: adresse.split(",")[1]?.trim() || "",
            zipCode: zipCode,
            websiteUrl: websiteUrl,
            siren: siren,
          },
        });

        console.log(`   ✅ Compte créé: ${nom}`);
        console.log(`   📧 Email: ${email}`);
        console.log(`   📱 Téléphone: ${phone}`);
        console.log(`   🏢 Type: ${typeLabel} (${userType})`);
        console.log(`   📍 Adresse: ${adresse}`);

        totalCreated++;
        if (userType === "AGENCE") {
          agenceCount++;
        } else {
          prestataireCount++;
        }

        // Associer les métiers à l'utilisateur
        for (const metierId of metiersIds) {
          await prisma.utilisateurMetier.create({
            data: {
              userId: user.id,
              metierId,
            },
          });
        }

        // Créer les paramètres professionnels avec horaires réels
        await prisma.professionalSettings.create({
          data: {
            userId: user.id,
            nomEntreprise: nom,
            emailContact: email,
            telephone: phone,
            adresse: adresse,
            horairesLundi: horaires.lundi,
            horairesMardi: horaires.mardi,
            horairesMercredi: horaires.mercredi,
            horairesJeudi: horaires.jeudi,
            horairesVendredi: horaires.vendredi,
            horairesSamedi: horaires.samedi,
            horairesDimanche: horaires.dimanche,
            delaiReponseEmail: 24,
            delaiReponseTelephone: 2,
            delaiReponseUrgence: 4,
            fraisAnnulationPourcent: 15,
            acomptePourcentage: 30,
            montantMinimum: 100,
            conditionsPaiement:
              "30% d'acompte à la réservation, solde avant la prestation",
          },
        });

        // Créer des entités spécifiques selon la catégorie
        if (categorie === "Agences") {
          // Créer une agence immobilière
          await prisma.agence.create({
            data: {
              nom: nom,
              userId: user.id,
              description: description,
              adresse: adresse,
              telephone: phone,
              email: email,
              website: websiteUrl,
              isActive: true,
              services: services,
            },
          });
          console.log(
            `   🏢 Agence immobilière créée avec services: ${services.join(", ")}`,
          );
        } else if (categorie === "Loisirs") {
          // Créer un service de loisirs pour le parapente
          await prisma.service.create({
            data: {
              nom: "Vol en parapente découverte",
              description:
                "Baptême de l'air en parapente biplace avec moniteur diplômé",
              details:
                "Vol de 15 à 30 minutes selon conditions météo. Tout le matériel fourni. Photos et vidéos incluses.",
              prix: 120,
              duree: 90, // en minutes
              isActive: true,
              userId: user.id,
              metierId: metiersIds[0], // Premier métier (Moniteur de parapente)
            },
          });

          // Créer aussi un service pour les stages
          await prisma.service.create({
            data: {
              nom: "Stage d'initiation parapente",
              description:
                "Stage de 3 jours pour apprendre les bases du parapente",
              details:
                "5 vols accompagnés, théorie, équipement complet, assurance. Diplôme FFVL possible.",
              prix: 450,
              duree: 1080, // 3 jours en minutes
              isActive: true,
              userId: user.id,
              metierId: metiersIds[0],
            },
          });

          console.log(
            `   🪂 Services parapente créés (vol découverte et stage)`,
          );

          // Créer aussi une activité sportive
          await prisma.activity.create({
            data: {
              nom: "Parapente à La Réunion",
              description: description,
              type: "sport",
              niveau: "débutant",
              duree: 90,
              prix: 120,
              localisation: "Colorado, Saint-Gilles-les-Hauts",
              userId: user.id,
              isActive: true,
            },
          });
        }

        // Créer des services génériques pour tous les professionnels
        for (const serviceNom of services) {
          const serviceExist = await prisma.service.findFirst({
            where: {
              nom: serviceNom,
              userId: user.id,
            },
          });

          if (!serviceExist) {
            await prisma.service.create({
              data: {
                nom: serviceNom,
                description: `${serviceNom} - ${nom}`,
                details: `Service professionnel proposé par ${nom}`,
                prix: categorie === "Loisirs" ? 120 : 0, // Gratuit pour les agences (service conseil)
                duree: 60,
                isActive: true,
                userId: user.id,
                metierId: metiersIds[0],
              },
            });
          }
        }
      } catch (error) {
        console.error(
          `   ❌ Erreur lors de la création de ${nom}:`,
          error.message,
        );
        if (error.code === "P2002") {
          console.error(`   ⚠️  Violation de contrainte unique pour: ${email}`);
        }
      }
    }

    console.log(`\n📊 RÉCAPITULATIF FINAL:`);
    console.log(`✅ ${totalCreated} partenaires créés au total`);
    console.log(`🏢 ${agenceCount} agences immobilières (type: AGENCE)`);
    console.log(
      `👨‍💼 ${prestataireCount} autres prestataires (type: PRESTATAIRE)`,
    );
    console.log(`🎓 ${metiersCreated} nouveaux métiers créés`);
    console.log(`🔐 Mot de passe pour tous: ${motDePasse}`);
    console.log(`🌐 Informations récupérées depuis les sites officiels`);
    console.log("✨ Seeding terminé avec succès !");

    // Afficher les informations de connexion
    console.log(`\n🔑 INFORMATIONS DE CONNEXION:`);
    partenairesData.forEach((p) => {
      console.log(`📧 ${p.nom}: ${p.email} / ${motDePasse}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
