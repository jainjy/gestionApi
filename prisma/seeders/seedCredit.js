const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
  console.log("🔄 Vérification du compte Crédit Réunion...");

  const email = "contact@creditreunion.com";
  const password = "créditréunion974";

  // Vérifier si user existe déjà
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log("✔️ Le compte Crédit Réunion existe déjà.");
    return;
  }

  console.log("🆕 Création du compte Crédit Réunion...");

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: email,
      passwordHash: hashedPassword,
      firstName: "Crédit",
      lastName: "Réunion",
      companyName: "Crédit Réunion",
      commercialName: "Crédit Réunion",
      role: "professional", // tu peux changer en "admin" si nécessaire
      status: "active",
      userType: "bank", // si tu veux catégoriser
      providerName: "creditreunion",
      address: "Réunion",
      city: "Saint-Denis",
    },
  });

  console.log("🎉 Compte Crédit Réunion créé avec succès !");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
