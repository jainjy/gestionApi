const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedSekoiaEntretien() {
  try {
    console.log("🌱 Seeding SEKOIA ENTRETIEN (schema compatible)");

    const motDePasse = "Pro@oli123";
    const passwordHash = await bcrypt.hash(motDePasse, 10);

    const email = "sekoia.entretien@gmail.com";

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("⚠️ Sekoia Entretien déjà existant.");
      return;
    }

    // ======================
    // USER
    // ======================
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "professional",
        status: "active",
        companyName: "Sekoia Entretien & Aménagement",
        commercialName: "Sekoia Entretien",
        userType: "PRESTATAIRE",
        professionalCategory: "artisan",
        city: "La Réunion",
        address: "La Réunion",
        zipCode: null,
        siren: null, // non public
        websiteUrl: null,
      },
    });

    console.log("✅ User créé : Sekoia Entretien");

    // ======================
    // METIER
    // ======================
    let metier = await prisma.metier.findFirst({
      where: { libelle: "Entretien et aménagement paysager" },
    });

    if (!metier) {
      metier = await prisma.metier.create({
        data: {
          libelle: "Entretien et aménagement paysager",
          categorie: "ARTISAN",
        },
      });
      console.log("➕ Métier créé");
    }

    await prisma.utilisateurMetier.create({
      data: {
        userId: user.id,
        metierId: metier.id,
      },
    });

    // ======================
    // PROFESSIONAL SETTINGS
    // ======================
    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: "Sekoia Entretien & Aménagement",
        emailContact: email,
        telephone: "+262692786370",
        adresse: "La Réunion",
        conditionsPaiement: "Selon devis",

        delaiReponseEmail: 24,
        delaiReponseTelephone: 2,
        delaiAnnulationGratuit: 48,
        acomptePourcentage: 30,
        montantMinimum: 100,
      },
    });

    console.log("✨ Seed Sekoia Entretien terminé !");
    console.log(`🔐 Mot de passe : ${motDePasse}`);
  } catch (err) {
    console.error("❌ Erreur seed Sekoia Entretien :", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSekoiaEntretien();
