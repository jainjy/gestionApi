// seed.js
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Démarrage du seed global...\n");

  const seedersPath = path.join(__dirname, "prisma", "seeders");
  const files = fs.readdirSync(seedersPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(seedersPath, file);
    console.log(`🌱 Exécution du seed: ${file}`);

    try {
      const seeder = require(filePath);
      if (typeof seeder.seed === "function") {
        await seeder.seed(prisma);
        console.log(`✅ ${file} terminé avec succès.\n`);
      } else {
        console.warn(`⚠️  ${file} ne contient pas de fonction 'seed()' exportée.\n`);
      }
    } catch (error) {
      console.error(`❌ Erreur dans ${file}:`, error);
    }
  }

  console.log("🎉 Tous les seeders ont été exécutés !");
}

main()
  .catch((e) => {
    console.error("Erreur globale du seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Déconnexion de Prisma");
  });
