const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Seeding métiers avec catégories");

  const metiers = [
    // TOURISME
    { libelle: "Agent de voyage", categorie: "TOURISME" },
    { libelle: "Guide touristique", categorie: "TOURISME" },
    { libelle: "Animateur touristique", categorie: "TOURISME" },
    { libelle: "Accompagnateur touristique", categorie: "TOURISME" },
    { libelle: "Réceptionniste hôtelier", categorie: "TOURISME" },
    { libelle: "Responsable d’hébergement", categorie: "TOURISME" },
    { libelle: "Gestionnaire de gîte", categorie: "TOURISME" },
    { libelle: "Gestionnaire de location saisonnière", categorie: "TOURISME" },

    // SPORT
    { libelle: "Coach sportif", categorie: "BIEN_ETRE" },
    { libelle: "Éducateur sportif", categorie: "BIEN_ETRE" },
    { libelle: "Entraîneur sportif", categorie: "BIEN_ETRE" },
    { libelle: "Préparateur physique", categorie: "BIEN_ETRE" },
    { libelle: "Animateur sportif", categorie: "BIEN_ETRE" },
    { libelle: "Professeur de fitness", categorie: "BIEN_ETRE" },
    { libelle: "Moniteur de sport", categorie: "BIEN_ETRE" },
    { libelle: "Responsable de salle de sport", categorie: "BIEN_ETRE" },
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
      console.log(`✅ ${metier.libelle} (${metier.categorie})`);
    }
  }

  console.log("🎉 Seeding terminé");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
