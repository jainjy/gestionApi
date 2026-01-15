const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Seeding des métiers principaux (avec catégories)...");

  const metiers = [
    {
      libelle: "Immobilier & Commerce",
      categorie: "IMMOBILIER",
    },
    {
      libelle: "Artisan & Profession",
      categorie: "ARTISAN",
    },
    {
      libelle: "Tourisme & Loisirs",
      categorie: "TOURISME",
    },
    {
      libelle: "Sport & Bien-être",
      categorie: "BIEN_ETRE",
    },
  ];

  for (const metier of metiers) {
    const exists = await prisma.metier.findFirst({
      where: {
        libelle: {
          equals: metier.libelle,
          mode: "insensitive",
        },
      },
    });

    if (!exists) {
      await prisma.metier.create({ data: metier });
      console.log(`✅ Métier créé: ${metier.libelle} (${metier.categorie})`);
    } else {
      console.log(`ℹ️ Métier déjà existant: ${metier.libelle}`);
    }
  }

  console.log("🎉 Seeding des métiers principaux terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seeding métiers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
