const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedIBR() {
  try {
    console.log("\n🌱 Seeding SAS IBR - bureau d’étude...");

    const motDePasse = "Pro@oli123";
    const hashMotDePasse = await bcrypt.hash(motDePasse, 10);

    const partenaire = {
      nom: "SAS IBR - Ingénierie Bâtiment Réunion",
      categorie: "Bureau d'étude",
      userType: "PRESTATAIRE",
      professionalCategory: "ingenierie",
      metiers: [
        "IBR",
      ],
      email: "contact@sas-ibr.com", // email générique (à confirmer)
      phone: "0262 00 00 00", // numéro fictif (à compléter si tu as)
      websiteUrl: "https://sas-ibr.com/",
      adresse: "Saint-Denis, La Réunion", // si tu as une adresse précise, tu peux remplacer
      city: "Saint-Denis",
      zipCode: "97400",
      description:
        "SAS IBR – bureau d’études techniques du bâtiment à La Réunion : permis de construire, études béton armé, charpente métallique, VRD, suivi de chantier. Prestataire pour particuliers et pros.",
      services: [
        "Étude technique bâtiment",
        "Permis de construire",
        "Suivi de chantier",
      ],
      siren: null,
    };

    // Vérifier s'il existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: partenaire.email },
    });

    if (existingUser) {
      console.log(`⚠️ Utilisateur déjà existant: ${partenaire.email}`);
      return;
    }

    // Création / récupération métiers
    const metiersIds = [];
    for (const metierNom of partenaire.metiers) {
      let metier = await prisma.metier.findFirst({
        where: { libelle: metierNom },
      });
      if (!metier) {
        metier = await prisma.metier.create({
          data: { libelle: metierNom },
        });
        console.log(`   ➕ Métier créé: ${metierNom}`);
      }
      metiersIds.push(metier.id);
    }

    // Création utilisateur
    const user = await prisma.user.create({
      data: {
        email: partenaire.email,
        passwordHash: hashMotDePasse,
        firstName: "IBR",
        lastName: "Ingénierie",
        phone: partenaire.phone,
        role: "professional",
        status: "active",
        companyName: partenaire.nom,
        commercialName: partenaire.nom,
        userType: partenaire.userType,
        professionalCategory: partenaire.professionalCategory,
        city: partenaire.city,
        address: partenaire.adresse,
        zipCode: partenaire.zipCode,
        websiteUrl: partenaire.websiteUrl,
        siren: partenaire.siren,
      },
    });

    console.log(`✅ Compte créé pour ${partenaire.nom}`);

    // Associer métiers
    for (const metierId of metiersIds) {
      await prisma.utilisateurMetier.create({
        data: {
          userId: user.id,
          metierId,
        },
      });
    }

    // Création des paramètres professionnels
    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: partenaire.nom,
        emailContact: partenaire.email,
        telephone: partenaire.phone,
        adresse: partenaire.adresse,
        delaiReponseEmail: 24,
        delaiReponseTelephone: 2,
        fraisAnnulationPourcent: 0,
        acomptePourcentage: 0,
        montantMinimum: 0,
        conditionsPaiement: "Selon devis et convention avec le client",
      },
    });

  } catch (error) {
    console.error("❌ Erreur lors du seed SAS IBR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIBR();
