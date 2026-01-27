const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedRmConstruction() {
  try {
    console.log("🌱 Seeding RM CONSTRUCTION (données officielles)");

    const motDePasse = "Pro@oli123";
    const passwordHash = await bcrypt.hash(motDePasse, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email: "stpm.richard@gmail.com" },
    });
    if (existingUser) {
      console.log("⚠️ RM CONSTRUCTION déjà présent avec cet email.");
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: "stpm.richard@gmail.com", // fourni par toi (non officiel)
        passwordHash,
        role: "professional",
        status: "inactive", // Radiée en 2025
        companyName: "RM CONSTRUCTION",
        commercialName: "RM CONSTRUCTION",
        userType: "ARTISAN",
        professionalCategory: "artisan",
        city: "Saint-André",
        address: "NUMÉRO 2, 301 Allée Polo, 97440 Saint-André, La Réunion",
        zipCode: "97440",
        siren: "819693219",
        websiteUrl: null,
      },
    });
    console.log("✅ User créé : RM CONSTRUCTION");

    // Métier
    let metier = await prisma.metier.findFirst({
      where: { libelle: "Maçonnerie générale et gros œuvre" },
    });
    if (!metier) {
      metier = await prisma.metier.create({
        data: {
          libelle: "Maçonnerie générale et gros œuvre",
          categorie: "ARTISAN",
        },
      });
      console.log("➕ Métier créé : Maçonnerie générale et gros œuvre");
    }

    await prisma.utilisateurMetier.create({
      data: {
        userId: user.id,
        metierId: metier.id,
      },
    });

    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: "RM CONSTRUCTION",
        emailContact: "stpm.richard@gmail.com",
        telephone: null, // non public
        adresse: "NUMÉRO 2, 301 Allée Polo, 97440 Saint-André, La Réunion",
        conditionsPaiement: "Selon devis",
      },
    });

    console.log("\n✨ Seed RM CONSTRUCTION terminé !");
    console.log(`🔐 Mot de passe commun : ${motDePasse}`);
  } catch (err) {
    console.error("❌ Erreur seed RM CONSTRUCTION :", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedRmConstruction();
