// prisma/seeders/listServicesSeeder.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listServicesByType() {
  console.log("📊 Listing des services par type...\n");

  try {
    // 1. Récupérer tous les services avec leur catégorie
    const services = await prisma.service.findMany({
      include: {
        category: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`📋 Total des services dans la base: ${services.length}\n`);

    // 2. Grouper par type
    const servicesByType = {
      art: [],
      bienetre: [],
      general: [],
      null: [],
    };

    services.forEach((service) => {
      const type = service.type || "null";

      if (!servicesByType[type]) {
        servicesByType[type] = [];
      }

      servicesByType[type].push(service);
    });

    // 3. Afficher les statistiques
    console.log("📈 STATISTIQUES PAR TYPE:");
    console.log("=".repeat(50));
    Object.entries(servicesByType).forEach(([type, items]) => {
      console.log(
        `🎯 Type: ${type.padEnd(10)} | Nombre: ${items.length.toString().padEnd(4)} | Pourcentage: ${((items.length / services.length) * 100).toFixed(1)}%`
      );
    });
    console.log("=".repeat(50) + "\n");

    // 4. Détail des services ART
    if (servicesByType.art.length > 0) {
      console.log("🎨 SERVICES ART:");
      console.log("=".repeat(80));
      servicesByType.art.forEach((service, index) => {
        console.log(`\n${index + 1}. ID: ${service.id}`);
        console.log(`   📛 Libellé: ${service.libelle}`);
        console.log(
          `   📝 Description: ${service.description?.substring(0, 100)}${service.description?.length > 100 ? "..." : ""}`
        );
        console.log(
          `   🏷️  Catégorie: ${service.category?.name || "Non définie"} (ID: ${service.categoryId})`
        );
        console.log(
          `   💰 Prix: ${service.price ? `${service.price}€` : "Non défini"}`
        );
        console.log(
          `   ⏱️  Durée: ${service.duration ? `${service.duration} min` : "Non définie"}`
        );
        console.log(
          `   👤 Créateur: ${service.createdBy?.firstName || "Inconnu"} ${service.createdBy?.lastName || ""}`
        );
        console.log(
          `   📧 Email: ${service.createdBy?.email || "Non disponible"}`
        );
        console.log(
          `   🏢 Société: ${service.createdBy?.companyName || "Non définie"}`
        );
        console.log(
          `   🏷️  Tags: ${service.tags?.length > 0 ? service.tags.join(", ") : "Aucun"}`
        );
        console.log(`   🔧 Personnalisé: ${service.isCustom ? "Oui" : "Non"}`);
        console.log(`   📸 Images: ${service.images?.length || 0} image(s)`);
        console.log(
          `   📅 Créé le: ${service.createdAt?.toLocaleDateString("fr-FR")}`
        );
      });
      console.log("=".repeat(80) + "\n");
    } else {
      console.log('ℹ️  Aucun service de type "art" trouvé.\n');
    }

    // 5. Détail des services BIEN-ÊTRE
    if (servicesByType.bienetre.length > 0) {
      console.log("🌿 SERVICES BIEN-ÊTRE:");
      console.log("=".repeat(80));
      servicesByType.bienetre.forEach((service, index) => {
        console.log(`\n${index + 1}. ID: ${service.id}`);
        console.log(`   📛 Libellé: ${service.libelle}`);
        console.log(
          `   📝 Description: ${service.description?.substring(0, 100)}${service.description?.length > 100 ? "..." : ""}`
        );
        console.log(
          `   🏷️  Catégorie: ${service.category?.name || "Non définie"} (ID: ${service.categoryId})`
        );
        console.log(
          `   💰 Prix: ${service.price ? `${service.price}€` : "Non défini"}`
        );
        console.log(
          `   ⏱️  Durée: ${service.duration ? `${service.duration} min` : "Non définie"}`
        );
        console.log(
          `   👤 Créateur: ${service.createdBy?.firstName || "Inconnu"} ${service.createdBy?.lastName || ""}`
        );
        console.log(
          `   📧 Email: ${service.createdBy?.email || "Non disponible"}`
        );
        console.log(
          `   🏢 Société: ${service.createdBy?.companyName || "Non définie"}`
        );
        console.log(
          `   🏷️  Tags: ${service.tags?.length > 0 ? service.tags.join(", ") : "Aucun"}`
        );
        console.log(`   🔧 Personnalisé: ${service.isCustom ? "Oui" : "Non"}`);
        console.log(`   📸 Images: ${service.images?.length || 0} image(s)`);
        console.log(
          `   📅 Créé le: ${service.createdAt?.toLocaleDateString("fr-FR")}`
        );
      });
      console.log("=".repeat(80) + "\n");
    } else {
      console.log('ℹ️  Aucun service de type "bienetre" trouvé.\n');
    }

    // 6. Afficher un tableau récapitulatif formaté
    console.log("📊 RÉCAPITULATIF FORMATÉ:");
    console.log("─".repeat(120));
    console.log(
      "│ ID │ Type".padEnd(10) +
        " │ Libellé".padEnd(30) +
        " │ Catégorie".padEnd(20) +
        " │ Prix".padEnd(10) +
        " │ Créateur".padEnd(20) +
        " │"
    );
    console.log("─".repeat(120));

    // Combiner art et bien-être pour le tableau
    const servicesToShow = [...servicesByType.art, ...servicesByType.bienetre];

    if (servicesToShow.length > 0) {
      servicesToShow.sort(
        (a, b) => a.type?.localeCompare(b.type || "") || a.id - b.id
      );

      servicesToShow.forEach((service) => {
        const id = service.id.toString().padEnd(4);
        const type = (service.type || "null").padEnd(10);
        const libelle = (
          service.libelle?.substring(0, 28) +
          (service.libelle?.length > 28 ? "..." : "")
        ).padEnd(30);
        const categorie = (
          service.category?.name?.substring(0, 18) +
            (service.category?.name?.length > 18 ? "..." : "") || "N/A"
        ).padEnd(20);
        const prix = (service.price ? `${service.price}€` : "N/A").padEnd(10);
        const createur = (
          (service.createdBy?.firstName || "") +
          " " +
          (service.createdBy?.lastName || "")
        )
          .trim()
          .substring(0, 18)
          .padEnd(20);

        console.log(
          `│ ${id} │ ${type} │ ${libelle} │ ${categorie} │ ${prix} │ ${createur} │`
        );
      });
    } else {
      console.log("│".padEnd(117) + "│");
      console.log("│".padEnd(55) + "AUCUN SERVICE TROUVÉ".padEnd(62) + "│");
      console.log("│".padEnd(117) + "│");
    }
    console.log("─".repeat(120) + "\n");

    // 7. Exporter vers un fichier JSON (optionnel)
    if (servicesByType.art.length > 0 || servicesByType.bienetre.length > 0) {
      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalServices: services.length,
          artCount: servicesByType.art.length,
          bienetreCount: servicesByType.bienetre.length,
        },
        artServices: servicesByType.art.map((s) => ({
          id: s.id,
          libelle: s.libelle,
          description: s.description,
          category: s.category?.name,
          categoryId: s.categoryId,
          price: s.price,
          duration: s.duration,
          type: s.type,
          tags: s.tags,
          creator: s.createdBy
            ? {
                name: `${s.createdBy.firstName} ${s.createdBy.lastName}`,
                email: s.createdBy.email,
                company: s.createdBy.companyName,
              }
            : null,
          imagesCount: s.images?.length || 0,
          createdAt: s.createdAt,
        })),
        bienetreServices: servicesByType.bienetre.map((s) => ({
          id: s.id,
          libelle: s.libelle,
          description: s.description,
          category: s.category?.name,
          categoryId: s.categoryId,
          price: s.price,
          duration: s.duration,
          type: s.type,
          tags: s.tags,
          creator: s.createdBy
            ? {
                name: `${s.createdBy.firstName} ${s.createdBy.lastName}`,
                email: s.createdBy.email,
                company: s.createdBy.companyName,
              }
            : null,
          imagesCount: s.images?.length || 0,
          createdAt: s.createdAt,
        })),
      };

      // Optionnel: Écrire dans un fichier JSON
      const fs = require("fs");
      const path = require("path");

      const exportDir = path.join(__dirname, "../exports");
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const exportPath = path.join(
        exportDir,
        `services_export_${Date.now()}.json`
      );
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      console.log(`💾 Export JSON sauvegardé dans: ${exportPath}`);
    }

    // 8. Suggestions d'amélioration basées sur les données
    console.log("\n💡 SUGGESTIONS D'AMÉLIORATION:");
    console.log("─".repeat(50));

    const servicesWithoutPrice = servicesToShow.filter((s) => !s.price).length;
    const servicesWithoutDescription = servicesToShow.filter(
      (s) => !s.description || s.description.trim().length < 10
    ).length;
    const servicesWithoutImages = servicesToShow.filter(
      (s) => !s.images || s.images.length === 0
    ).length;

    if (servicesWithoutPrice > 0) {
      console.log(`⚠️  ${servicesWithoutPrice} services sans prix défini`);
    }
    if (servicesWithoutDescription > 0) {
      console.log(
        `⚠️  ${servicesWithoutDescription} services avec description manquante ou trop courte`
      );
    }
    if (servicesWithoutImages > 0) {
      console.log(`⚠️  ${servicesWithoutImages} services sans images`);
    }

    if (
      servicesWithoutPrice === 0 &&
      servicesWithoutDescription === 0 &&
      servicesWithoutImages === 0
    ) {
      console.log("✅ Tous les services sont bien configurés !");
    }
  } catch (error) {
    console.error("❌ Erreur lors du listing des services:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script pour exécuter le listing
if (require.main === module) {
  console.log("\n" + "🌟".repeat(25));
  console.log("   LISTING DES SERVICES ART & BIEN-ÊTRE");
  console.log("🌟".repeat(25) + "\n");

  listServicesByType()
    .then(() => {
      console.log("\n✨ Listing terminé avec succès !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur lors du listing:", error);
      process.exit(1);
    });
}

module.exports = { listServicesByType };
