
// seed-categories-travaux.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("✓ Début du seed des catégories travaux supplémentaires");

  // Catégories pour travaux
  const categoriesTravaux = [
    { name: "Matériaux et Fournitures" },
    { name: "Services Techniques Spécialisés" },
    { name: "Gestion et Expertise Chantier" },
    { name: "Démolition et Déblaiement" },
    { name: "Isolation et Performance Énergétique" },
    { name: "Prestations intérieures" },
    { name: "Prestations extérieures" },
    { name: "Constructions" },
    { name: "Pilates" },
    { name: "Yoga" },
    { name: "Cuisine" },
    { name: "Sport" },
    { name: "Motivation" },
    { name: "Guérison" },
    { name: "Spriritualité" },
    { name: "Méditation" },
  ];

  for (const category of categoriesTravaux) {
    // Vérifier si la catégorie existe déjà
    const existing = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existing) {
      await prisma.category.create({
        data: category
      });
      console.log(`✓ Catégorie créée: ${category.name}`);
    } else {
      console.log(`⚠ Catégorie déjà existante: ${category.name}`);
    }
  }

  console.log("✓ Seed des catégories travaux terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });