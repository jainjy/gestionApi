const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ensureSupportForUser } = require("../middleware/autoCreateSupport");

async function initAllSupports() {
  console.log('🚀 Initialisation des comptes support pour tous les utilisateurs...');
  
  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany();
    
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const support = await ensureSupportForUser(user.id);
        if (support) {
          // Vérifier si c'est une nouvelle création
          const isNew = await prisma.personel.findFirst({
            where: {
              idUser: user.id,
              rolePersonel: 'support',
              createdAt: {
                gte: new Date(Date.now() - 5000) // Créé il y a moins de 5 secondes
              }
            }
          });
          
          if (isNew) {
            created++;
            console.log(`✅ Support créé pour ${user.email}`);
          } else {
            skipped++;
            console.log(`⏭️  Support déjà existant pour ${user.email}`);
          }
        }
      } catch (err) {
        errors++;
        console.error(`❌ Erreur pour ${user.email}:`, err.message);
      }
    }

    console.log('\n📊 RÉSUMÉ:');
    console.log(`   ✅ Créés: ${created}`);
    console.log(`   ⏭️  Existants: ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
initAllSupports();