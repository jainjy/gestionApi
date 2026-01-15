const { prisma } = require("../lib/db");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📦 Récupération des métiers depuis la base de données...");

  const metiers = await prisma.metier.findMany({
    orderBy: {
      libelle: "asc",
    },
  });

  const outputPath = path.join(__dirname, "metier.json");

  fs.writeFileSync(outputPath, JSON.stringify(metiers, null, 2), "utf-8");

  console.log(`✅ ${metiers.length} métiers exportés`);
  console.log(`📄 Fichier généré : ${outputPath}`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur lors de l'export des métiers :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
