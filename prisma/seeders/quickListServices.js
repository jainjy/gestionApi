// seeders/quickListServices.js
const { PrismaClient } = require("@prisma/client");
const Table = require("cli-table3"); // Installez avec: npm install cli-table3

const prisma = new PrismaClient();

async function quickListServices() {
  console.log("📋 Listing rapide des services...\n");

  try {
    // Récupérer seulement les services art et bien-être
    const services = await prisma.service.findMany({
      where: {
        type: {
          in: ["art", "bienetre"],
        },
      },
      include: {
        category: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { id: "asc" }],
    });

    console.log(`🎯 Services trouvés: ${services.length}\n`);

    if (services.length === 0) {
      console.log('❌ Aucun service de type "art" ou "bienetre" trouvé.');
      return;
    }

    // Tableau formaté
    const table = new Table({
      head: ["ID", "Type", "Libellé", "Catégorie", "Prix", "Créateur"],
      colWidths: [8, 12, 35, 20, 15, 25],
      style: {
        head: ["cyan"],
        border: ["gray"],
      },
    });

    services.forEach((service) => {
      table.push([
        service.id,
        service.type === "art" ? "🎨 Art" : "🌿 Bien-être",
        service.libelle.length > 34
          ? service.libelle.substring(0, 31) + "..."
          : service.libelle,
        service.category?.name || "N/A",
        service.price ? `${service.price}€` : "Gratuit",
        service.createdBy
          ? `${service.createdBy.firstName || ""} ${service.createdBy.lastName || ""}`.trim() ||
            "Anonyme"
          : "Anonyme",
      ]);
    });

    console.log(table.toString());

    // Statistiques par type
    const artCount = services.filter((s) => s.type === "art").length;
    const bienetreCount = services.filter((s) => s.type === "bienetre").length;

    console.log("\n📊 Statistiques:");
    console.log(`🎨 Services Art: ${artCount}`);
    console.log(`🌿 Services Bien-être: ${bienetreCount}`);
    console.log(`📈 Total: ${services.length}`);

    // Aperçu des catégories
    const categories = [
      ...new Set(services.map((s) => s.category?.name).filter(Boolean)),
    ];
    console.log(`\n🏷️  Catégories représentées: ${categories.length}`);
    categories.forEach((cat, i) => {
      const count = services.filter((s) => s.category?.name === cat).length;
      console.log(
        `   ${i + 1}. ${cat} (${count} service${count > 1 ? "s" : ""})`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickListServices()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
