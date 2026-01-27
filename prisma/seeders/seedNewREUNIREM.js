const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedReunirem() {
  try {
    console.log("🌱 Seed REUNIREM DIAGNOSTIC (données réelles)");

    const motDePasse = "Pro@oli123";
    const hashPw = await bcrypt.hash(motDePasse, 10);

    const existing = await prisma.user.findUnique({
      where: { email: "reuniremdiagnostic@gmail.com" },
    });
    if (existing) {
      console.log("⚠️ REUNIREM DIAGNOSTIC existe déjà. Abandon seed.");
      return;
    }

    // 1️⃣ Création du user
    const user = await prisma.user.create({
      data: {
        email: "reuniremdiagnostic@gmail.com",
        passwordHash: hashPw,
        firstName: "REUNIREM",
        lastName: "DIAGNOSTIC",
        phone: "0693025977",
        role: "professional",
        status: "active",
        companyName: "REUNIREM DIAGNOSTIC",
        commercialName: "REUNIREM DIAGNOSTIC",
        userType: "PRESTATAIRE",
        professionalCategory: "real-estate",
        address: "1 Rue Maurice Paturau",
        city: "Sainte-Marie",
        zipCode: "97438",
        siren: "893259853",
        websiteUrl: "https://www.reunirem.fr/",
      },
    });

    console.log(`✅ Utilisateur créé : REUNIREM DIAGNOSTIC (id: ${user.id})`);

    // 2️⃣ Métier diagnostic immobilier
    let metier = await prisma.metier.findFirst({
      where: { libelle: "Diagnostiqueur immobilier" },
    });
    if (!metier) {
      metier = await prisma.metier.create({
        data: {
          libelle: "Diagnostiqueur immobilier",
          categorie: "IMMOBILIER",
        },
      });
      console.log("➕ Métier créé : Diagnostiqueur immobilier");
    }

    await prisma.utilisateurMetier.create({
      data: {
        userId: user.id,
        metierId: metier.id,
      },
    });

    // 3️⃣ ProfessionalSettings réalistes
    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: "REUNIREM DIAGNOSTIC",
        emailContact: "reuniremdiagnostic@gmail.com",
        telephone: "0693025977",
        adresse: "1 Rue Maurice Paturau, 97438 Sainte-Marie",
        conditionsPaiement: "Selon devis diagnostic immobilier obligatoire",
      },
    });

    console.log("🔧 ProfessionalSettings créés");

    // 4️⃣ Services génériques (réalisables)
    const services = [
      "Diagnostic immobilier avant vente/location",
      "Repérage amiante",
      "Diagnostic électricité",
      "Diagnostic gaz",
      "Diagnostic plomb",
      "Diagnostic termites",
      "Métrage Loi Carrez / Loi Boutin",
    ];
    for (const s of services) {
      await prisma.service.create({
        data: {
          libelle: s,
          description: `${s} par REUNIREM DIAGNOSTIC`,
          price: 0, // à compléter si tu veux des prix
          duration: 60,
          isActive: true,
          createdById: user.id,
          tags: ["diagnostic", "immobilier"],
        },
      });
    }

    console.log("🛠️ Services diagnostiques créés");

    console.log("\n✨ Seed REUNIREM DIAGNOSTIC terminé !");
    console.log(`🔐 Mot de passe commun: ${motDePasse}`);
  } catch (error) {
    console.error("❌ Erreur seed REUNIREM DIAGNOSTIC:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReunirem();
