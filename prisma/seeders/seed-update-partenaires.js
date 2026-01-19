const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const partners = [
  {
    companyName: "Guy Hoquet Réunion - Saint-Denis",
    nom: "Guy Hoquet Réunion - Saint-Denis",
    email: "saintdenis@guyhoquet.re",
    phone: "0262416600",
    websiteUrl: "https://la-reunion-saint-denis.guy-hoquet.com/",
    address: "13 Rue Charles Gounod",
    city: "Saint-Denis",
    zipCode: "97400",
    professionalCategory: "real-estate",
    userType: "AGENCE",
  },
  {
    companyName: "Olimmo Réunion",
    nom: "Olimmo Réunion",
    email: "olimmoreunion@gmail.com",
    phone: "0692667755",
    websiteUrl: "https://olimmoreunion.re/",
    address: "45 Rue Alexis De Villeneuve",
    city: "Saint-Denis",
    zipCode: "97400",
    professionalCategory: "real-estate",
    userType: "AGENCE",
  },
  {
    companyName: "L'Immobilier Enchanté",
    nom: "L'Immobilier Enchanté",
    email: null,
    phone: "0692150661",
    websiteUrl:
      "https://www.superimmo.com/agence/saint-denis-97400/l-immobilier-enchante-xq5f9",
    address: "16 Rue Saint Bernard, Apt 1",
    city: "Saint-Denis",
    zipCode: "97400",
    professionalCategory: "real-estate",
    userType: "AGENCE",
  },
  {
    companyName: "Parapente Île de La Réunion",
    nom: "Parapente Île de La Réunion",
    email: "alizeparapente974@icloud.com",
    phone: "0692682338",
    websiteUrl: "https://www.parapente-ile-reunion.com/",
    address: "Saint-Leu – sites de décollage",
    city: "Saint-Leu",
    zipCode: "97436",
    professionalCategory: "sports",
    userType: "PRESTATAIRE",
  },
];

async function upsertPartner(p) {
  const user = await prisma.user.findFirst({
    where: { companyName: p.companyName },
  });

  if (!user) {
    console.log(`⚠️ Utilisateur non trouvé : ${p.companyName}`);
    return;
  }

  // 1️⃣ Mise à jour User
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: p.email || user.email,
      phone: p.phone,
      websiteUrl: p.websiteUrl,
      address: p.address,
      city: p.city,
      zipCode: p.zipCode,
      professionalCategory: p.professionalCategory,
      userType: p.userType,
    },
  });

  console.log(`✅ User mis à jour : ${p.companyName}`);

  // 2️⃣ ProfessionalSettings (unique par userId)
  const prof = await prisma.professionalSettings.findUnique({
    where: { userId: user.id },
  });

  if (prof) {
    await prisma.professionalSettings.update({
      where: { id: prof.id },
      data: {
        nomEntreprise: p.nom,
        emailContact: p.email || prof.emailContact,
        telephone: p.phone,
        adresse: p.address,
      },
    });
    console.log("   🔧 ProfessionalSettings mis à jour");
  } else {
    await prisma.professionalSettings.create({
      data: {
        userId: user.id,
        nomEntreprise: p.nom,
        emailContact: p.email || "",
        telephone: p.phone,
        adresse: p.address,
      },
    });
    console.log("   ➕ ProfessionalSettings créé");
  }
}

async function main() {
  try {
    for (const p of partners) {
      await upsertPartner(p);
    }
    console.log("✨ Mise à jour finale terminée (sans agences)");
  } catch (e) {
    console.error("❌ Erreur globale:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
