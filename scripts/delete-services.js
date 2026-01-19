// scripts/delete-services.js
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function deleteAllServices() {
  console.log('========================================');
  console.log('🧹 SUPPRESSION COMPLÈTE DES SERVICES');
  console.log('========================================\n');

  // 1. Afficher les statistiques
  console.log('📊 Statistiques actuelles:');
  
  const serviceCount = await prisma.service.count();
  const userServiceCount = await prisma.utilisateurService.count();
  const metierServiceCount = await prisma.metierService.count();
  const demandeCount = await prisma.demande.count({
    where: { serviceId: { not: null } }
  });

  console.log(`• Services: ${serviceCount}`);
  console.log(`• Liaisons utilisateurs-services: ${userServiceCount}`);
  console.log(`• Liaisons métiers-services: ${metierServiceCount}`);
  console.log(`• Demandes liées aux services: ${demandeCount}\n`);

  // 2. Demander confirmation
  const confirmation = await askQuestion(
    '⚠️  Cette action supprimera TOUS les services et leurs relations. Êtes-vous sûr? (oui/NON): '
  );

  if (confirmation.toLowerCase() !== 'oui') {
    console.log('❌ Opération annulée.');
    rl.close();
    return;
  }

  // 3. Deuxième confirmation
  const finalConfirmation = await askQuestion(
    '🚨 Cette action est IRREVERSIBLE. Tapez "SUPPRIMER" pour confirmer: '
  );

  if (finalConfirmation !== 'SUPPRIMER') {
    console.log('❌ Opération annulée.');
    rl.close();
    return;
  }

  try {
    console.log('\n🗑️  Début de la suppression...');

    // Exécuter dans une transaction
    await prisma.$transaction(async (tx) => {
      console.log('  ⏳ Suppression des demandes de droit de famille...');
      await tx.droitFamille.deleteMany();
      console.log('  ✅ Demandes de droit de famille supprimées');

      console.log('  ⏳ Suppression des rendez-vous...');
      await tx.appointment.deleteMany();
      console.log('  ✅ Rendez-vous supprimés');

      console.log('  ⏳ Suppression des avis...');
      await tx.review.deleteMany();
      console.log('  ✅ Avis supprimés');

      console.log('  ⏳ Suppression des messages de contact liés aux services...');
      await tx.contactMessage.deleteMany({
        where: { serviceId: { not: null } }
      });
      console.log('  ✅ Messages de contact supprimés');

      console.log('  ⏳ Suppression des liaisons utilisateurs-services...');
      await tx.utilisateurService.deleteMany();
      console.log('  ✅ Liaisons utilisateurs-services supprimées');

      console.log('  ⏳ Suppression des liaisons métiers-services...');
      await tx.metierService.deleteMany();
      console.log('  ✅ Liaisons métiers-services supprimées');

      console.log('  ⏳ Mise à jour des demandes (détachement des services)...');
      await tx.demande.updateMany({
        where: { serviceId: { not: null } },
        data: { serviceId: null }
      });
      console.log('  ✅ Demandes mises à jour');

      console.log('  ⏳ Suppression des services...');
      const result = await tx.service.deleteMany();
      console.log(`  ✅ ${result.count} services supprimés`);

      console.log('  🔄 Réinitialisation des séquences...');
      await tx.$executeRaw`ALTER SEQUENCE "Service_id_seq" RESTART WITH 1`;
      console.log('  ✅ Séquence réinitialisée');
    });

    console.log('\n✅ Suppression terminée avec succès!');

    // Vérification finale
    const remainingServices = await prisma.service.count();
    console.log(`\n📊 Vérification finale:`);
    console.log(`• Services restants: ${remainingServices}`);

    if (remainingServices === 0) {
      console.log('🎉 Base de données nettoyée avec succès!');
    } else {
      console.log('⚠️  Certains services persistent.');
    }

  } catch (error) {
    console.error('💥 Erreur lors de la suppression:', error);
    console.error('Détails:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  deleteAllServices()
    .then(() => {
      console.log('✨ Script terminé!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllServices };