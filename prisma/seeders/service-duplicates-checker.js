// seeders/service-duplicates-cleaner.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function deleteOnlyDuplicates() {
  console.log("🔍 Recherche et suppression des doublons de services...\n");

  try {
    // 1. Récupérer tous les services avec leurs relations
    const allServices = await prisma.service.findMany({
      include: {
        metiers: true,
        users: true,
        demandes: true,
        Review: true,
        Appointment: true,
      },
      orderBy: {
        libelle: "asc",
      },
    });

    // 2. Grouper les services par libellé
    const servicesByLibelle = new Map();

    allServices.forEach((service) => {
      const key = service.libelle.toLowerCase().trim();
      if (!servicesByLibelle.has(key)) {
        servicesByLibelle.set(key, []);
      }
      servicesByLibelle.get(key).push(service);
    });

    // 3. Identifier seulement les groupes de doublons
    const duplicateGroups = Array.from(servicesByLibelle.entries()).filter(
      ([libelle, services]) => services.length > 1
    );

    console.log("📊 STATISTIQUES INITIALES:");
    console.log(`📋 Total des services: ${allServices.length}`);
    console.log(`🔄 Groupes de libellés: ${servicesByLibelle.size}`);
    console.log(`🚨 Groupes de doublons: ${duplicateGroups.length}`);

    if (duplicateGroups.length === 0) {
      console.log("🎉 Aucun doublon détecté ! Aucune action nécessaire.");
      return;
    }

    console.log("\n🔎 ANALYSE DES DOUBLONS:");

    let totalToDelete = 0;
    let totalToKeep = 0;
    const servicesToDelete = [];

    // 4. Pour chaque groupe de doublons, décider lesquels supprimer
    duplicateGroups.forEach(([libelle, services]) => {
      console.log(`\n📛 Groupe: "${libelle}" (${services.length} services)`);

      // Compter les relations pour chaque service du groupe
      const servicesWithRelations = services.map((service) => {
        const relationCount =
          service.metiers.length +
          service.users.length +
          service.demandes.length +
          service.Review.length +
          service.Appointment.length;

        return {
          ...service,
          relationCount,
          canBeDeleted: relationCount === 0,
        };
      });

      // Trier par nombre de relations (du plus au moins)
      servicesWithRelations.sort((a, b) => b.relationCount - a.relationCount);

      // Le service à conserver est celui avec le plus de relations
      // En cas d'égalité, on prend le plus récent
      const serviceToKeep = servicesWithRelations[0];

      console.log(
        `   ✅ À conserver: ${serviceToKeep.id} (${serviceToKeep.relationCount} relations)`
      );
      totalToKeep++;

      // Les autres services du groupe sont candidats à la suppression
      const candidatesForDeletion = servicesWithRelations.slice(1);

      candidatesForDeletion.forEach((service) => {
        if (service.canBeDeleted) {
          console.log(`   🗑️  À supprimer: ${service.id} (0 relations)`);
          servicesToDelete.push(service);
          totalToDelete++;
        } else {
          console.log(
            `   ⚠️  Ne peut être supprimé: ${service.id} (${service.relationCount} relations)`
          );
          console.log(
            `      💡 Ce service a des relations actives, conservation obligatoire`
          );
        }
      });
    });

    // 5. Résumé avant suppression
    console.log("\n" + "=".repeat(60));
    console.log("📋 RÉSUMÉ DES ACTIONS:");
    console.log("=".repeat(60));
    console.log(
      `✅ Services uniques (non touchés): ${allServices.length - (totalToDelete + totalToKeep)}`
    );
    console.log(
      `🔒 Services conservés (dans les groupes de doublons): ${totalToKeep}`
    );
    console.log(
      `🗑️  Services à supprimer (doublons sans relations): ${totalToDelete}`
    );
    console.log(
      `📊 Total après nettoyage: ${allServices.length - totalToDelete} services`
    );

    // 6. Demande de confirmation pour la suppression
    if (servicesToDelete.length > 0) {
      console.log("\n⚠️  CONFIRMATION DE SUPPRESSION:");
      console.log("Les services suivants seront supprimés:");

      servicesToDelete.forEach((service) => {
        console.log(`   • ${service.id} - "${service.libelle}"`);
      });

      // Simuler une confirmation (décommentez pour une vraie confirmation)
      const confirmed = true; // Remplacez par une vraie logique de confirmation si besoin
      // const readline = require('readline');
      // const confirmed = await askConfirmation('Voulez-vous procéder à la suppression ? (oui/non) ');

      if (confirmed) {
        console.log("\n🗑️  SUPPRESSION EN COURS...");

        for (const service of servicesToDelete) {
          await prisma.service.delete({
            where: { id: service.id },
          });
          console.log(`✅ Supprimé: ${service.libelle} (ID: ${service.id})`);
        }

        console.log(`\n🎉 SUPPRESSION TERMINÉE !`);
        console.log(
          `📊 ${servicesToDelete.length} doublons supprimés avec succès`
        );

        // Vérification finale
        const remainingServices = await prisma.service.count();
        console.log(
          `📋 Total de services après nettoyage: ${remainingServices}`
        );
      } else {
        console.log("❌ Suppression annulée par l'utilisateur");
      }
    } else {
      console.log(
        "\nℹ️  Aucun service à supprimer. Tous les doublons ont des relations actives."
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des doublons:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction utilitaire pour demander une confirmation (optionnelle)
async function askConfirmation(question) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "oui" || answer.toLowerCase() === "o");
    });
  });
}

// Exécution principale
async function main() {
  try {
    await deleteOnlyDuplicates();
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution:", error);
    process.exit(1);
  }
}

main().finally(() => process.exit(0));
