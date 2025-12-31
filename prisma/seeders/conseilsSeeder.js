// seeders/conseilsSeeder.js - ADAPTÉ À VOTRE BASE EXISTANTE
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  {
    name: "nature",
    description: "Conseils pour la protection de la nature et l'écologie",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "green",
    sortOrder: 1,
    isActive: true
  },
  {
    name: "shopping",
    description: "Conseils pour un shopping responsable et économique",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    color: "blue",
    sortOrder: 2,
    isActive: true
  },
  {
    name: "maison",
    description: "Conseils pour une maison éco-responsable",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    color: "amber",
    sortOrder: 3,
    isActive: true
  },
  {
    name: "cuisine",
    description: "Conseils pour une cuisine zéro déchet et économique",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    color: "rose",
    sortOrder: 4,
    isActive: true
  },
  {
    name: "transport",
    description: "Conseils pour des transports écologiques",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "cyan",
    sortOrder: 5,
    isActive: true
  },
  {
    name: "jardin",
    description: "Conseils pour le jardinage écologique",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "emerald",
    sortOrder: 6,
    isActive: true
  }
];

const conseils = [
  {
    title: "Réduire sa consommation d'eau",
    category: "maison",
    difficulty: "Facile",
    duration: "10 min",
    description: "Des astuces simples pour économiser l'eau au quotidien",
    content: [
      "Installer des réducteurs de débit sur les robinets",
      "Privilégier les douches courtes aux bains",
      "Récupérer l'eau de pluie pour arroser les plantes",
      "Faire tourner le lave-linge et lave-vaisselle uniquement quand ils sont pleins"
    ],
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "blue",
    urgency: "Important",
    expert: "Éco-conseiller",
    location: "Tous les cirques",
    isFeatured: true,
    isActive: true,
    views: 1250,
    saves: 340
  },
  {
    title: "Composter ses déchets alimentaires",
    category: "nature",
    difficulty: "Moyen",
    duration: "15 min",
    description: "Guide complet pour démarrer le compostage à la maison",
    content: [
      "Choisir un composteur adapté à son espace",
      "Alterner couches de déchets verts et bruns",
      "Brasser régulièrement pour aérer",
      "Maintenir une bonne humidité"
    ],
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "green",
    urgency: "Écologique",
    expert: "Jardinier expert",
    location: "Cirques ruraux",
    isFeatured: true,
    isActive: true,
    views: 980,
    saves: 210
  },
  {
    title: "Faire ses produits ménagers naturels",
    category: "maison",
    difficulty: "Facile",
    duration: "20 min",
    description: "Recettes simples pour des produits ménagers écologiques",
    content: [
      "Nettoyant multi-usage : vinaigre blanc + eau + huiles essentielles",
      "Lessive maison : savon de Marseille râpé + cristaux de soude",
      "Détartrant : jus de citron ou vinaigre blanc pur",
      "Désodorisant : bicarbonate de soude + huiles essentielles"
    ],
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "amber",
    urgency: "Économique",
    expert: "Naturopathe",
    location: "Tous les cirques",
    isFeatured: false,
    isActive: true,
    views: 750,
    saves: 180
  },
  {
    title: "Cuisiner avec les restes",
    category: "cuisine",
    difficulty: "Débutant",
    duration: "30 min",
    description: "Transformer vos restes en délicieux repas",
    content: [
      "Pain rassis → chapelure ou pain perdu",
      "Légumes fanés → soupe ou purée",
      "Restes de riz → galettes ou salade",
      "Fruits trop mûrs → compote ou smoothie"
    ],
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    color: "rose",
    urgency: "Pratique",
    expert: "Chef cuisinier",
    location: "Tous les cirques",
    isFeatured: true,
    isActive: true,
    views: 620,
    saves: 150
  },
  {
    title: "Optimiser ses déplacements",
    category: "transport",
    difficulty: "Facile",
    duration: "5 min",
    description: "Réduire son empreinte carbone dans les transports",
    content: [
      "Privilégier le vélo ou la marche pour les courtes distances",
      "Utiliser les transports en commun quand c'est possible",
      "Organiser du covoiturage avec ses voisins",
      "Regrouper ses déplacements pour moins se déplacer"
    ],
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "cyan",
    urgency: "Écologique",
    expert: "Urbaniste",
    location: "Cirques urbains",
    isFeatured: false,
    isActive: true,
    views: 890,
    saves: 220
  },
  {
    title: "Créer un potager sur son balcon",
    category: "jardin",
    difficulty: "Moyen",
    duration: "45 min",
    description: "Jardiner même en appartement",
    content: [
      "Choisir des pots profonds avec des trous de drainage",
      "Sélectionner des plantes adaptées : aromatiques, tomates cerises, salades",
      "Utiliser un terreau de qualité pour potager",
      "Arroser régulièrement mais sans excès"
    ],
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "emerald",
    urgency: "Utile",
    expert: "Jardinier urbain",
    location: "Cirques urbains",
    isFeatured: true,
    isActive: true,
    views: 1100,
    saves: 290
  },
  {
    title: "Acheter en vrac intelligemment",
    category: "shopping",
    difficulty: "Facile",
    duration: "10 min",
    description: "Guide pour des courses zéro déchet",
    content: [
      "Apporter ses propres contenants (poches en tissu, bocaux)",
      "Préparer une liste de courses pour éviter le gaspillage",
      "Privilégier les produits locaux et de saison",
      "Vérifier les dates de péremption pour acheter juste ce qu'il faut"
    ],
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
    color: "blue",
    urgency: "Économique",
    expert: "Consom'acteur",
    location: "Tous les cirques",
    isFeatured: false,
    isActive: true,
    views: 530,
    saves: 120
  }
];

async function main() {
  console.log('🌱 Début du seeding des conseils...');

  try {
    // Vérifier si des catégories existent déjà
    const existingCategories = await prisma.conseilCategory.count();
    
    if (existingCategories > 0) {
      console.log(`⚠️ ${existingCategories} catégories existent déjà.`);
      console.log('Pour nettoyer et recommencer, supprimez d\'abord les données existantes:');
      console.log('   npm run db:reset-conseils');
      console.log('\nSinon, continuer avec les données existantes...');
    } else {
      // Créer les catégories seulement si elles n'existent pas
      console.log('📂 Création des catégories...');
      for (const category of categories) {
        await prisma.conseilCategory.create({
          data: category
        });
      }
      console.log(`✅ ${categories.length} catégories créées`);
    }

    // Récupérer l'utilisateur super admin
    const superAdmin = await prisma.user.findUnique({
      where: { 
        email: "superadmin@servo.mg" 
      }
    });

    if (!superAdmin) {
      console.error('❌ Utilisateur superadmin@servo.mg non trouvé');
      console.log('⚠️ Veuillez vous assurer que l\'utilisateur admin existe');
      return;
    }

    console.log(`👤 Utilisateur admin trouvé: ${superAdmin.firstName} ${superAdmin.lastName}`);

    // Vérifier si des conseils existent déjà
    const existingConseils = await prisma.conseil.count();
    
    if (existingConseils > 0) {
      console.log(`⚠️ ${existingConseils} conseils existent déjà.`);
      console.log('Pour les remplacer, supprimez-les d\'abord.');
      console.log('Sinon, le seeder ajoutera seulement les nouveaux conseils.');
    }

    // Créer les conseils
    console.log('📝 Création des conseils...');
    const createdConseils = [];
    
    for (const conseil of conseils) {
      // Vérifier si un conseil similaire existe déjà
      const existingConseil = await prisma.conseil.findFirst({
        where: {
          title: conseil.title,
          category: conseil.category
        }
      });

      if (!existingConseil) {
        const created = await prisma.conseil.create({
          data: {
            ...conseil,
            authorId: superAdmin.id
          }
        });
        createdConseils.push(created);
        console.log(`   ✅ Créé: ${conseil.title}`);
      } else {
        console.log(`   ⏭️ Existe déjà: ${conseil.title}`);
      }
    }
    
    console.log(`✅ ${createdConseils.length} nouveaux conseils créés (sur ${conseils.length} total)`);

    // Si aucun nouveau conseil n'a été créé, utiliser ceux existants
    const conseilsToUse = createdConseils.length > 0 ? createdConseils : await prisma.conseil.findMany({ take: 10 });

    if (conseilsToUse.length === 0) {
      console.log('⚠️ Aucun conseil disponible pour générer des données de test');
      return;
    }

    // Générer des données de test pour les statistiques
    console.log('📊 Génération de données de test pour les statistiques...');
    
    // Récupérer tous les utilisateurs actifs
    const allUsers = await prisma.user.findMany({
      where: {
        status: "active"
      },
      take: 50 // Limiter pour ne pas surcharger
    });

    console.log(`👥 ${allUsers.length} utilisateurs actifs disponibles`);

    // Pour chaque conseil, créer des interactions uniques
    for (const conseil of conseilsToUse) {
      console.log(`📈 Génération de données pour: ${conseil.title}`);
      
      // S'assurer qu'on a des utilisateurs
      if (allUsers.length === 0) {
        console.log('   ⚠️ Aucun utilisateur disponible pour générer des interactions');
        continue;
      }

      // Générer des combinaisons uniques conseil-utilisateur pour les vues
      const numViews = Math.min(Math.floor(Math.random() * 15) + 5, allUsers.length);
      const shuffledUsers = [...allUsers].sort(() => Math.random() - 0.5);
      const selectedUsersForViews = shuffledUsers.slice(0, numViews);
      
      // Créer les vues
      let viewCount = 0;
      for (const user of selectedUsersForViews) {
        try {
          await prisma.conseilView.create({
            data: {
              conseilId: conseil.id,
              userId: user.id,
              ipAddress: '127.0.0.1',
              userAgent: 'Seeder'
            }
          });
          viewCount++;
        } catch (error) {
          // Ignorer les doublons
          if (error.code !== 'P2002') {
            console.error(`   ❌ Erreur création vue: ${error.message}`);
          }
        }
      }
      
      // Générer des combinaisons uniques conseil-utilisateur pour les sauvegardes
      const numSaves = Math.min(Math.floor(Math.random() * 8) + 2, allUsers.length);
      const selectedUsersForSaves = shuffledUsers.slice(numViews, numViews + numSaves);
      
      // Créer les sauvegardes
      let saveCount = 0;
      for (const user of selectedUsersForSaves) {
        try {
          await prisma.conseilSave.create({
            data: {
              conseilId: conseil.id,
              userId: user.id
            }
          });
          saveCount++;
        } catch (error) {
          // Ignorer les doublons
          if (error.code !== 'P2002') {
            console.error(`   ❌ Erreur création sauvegarde: ${error.message}`);
          }
        }
      }
      
      // Mettre à jour les compteurs dans le conseil
      await prisma.conseil.update({
        where: { id: conseil.id },
        data: {
          views: viewCount * 10, // Multiplier pour simuler plus d'activité
          saves: saveCount
        }
      });
      
      console.log(`   👁️ ${viewCount} vues | 💾 ${saveCount} sauvegardes`);
    }

    console.log('✅ Données de test générées avec succès');
    
    // Afficher un récapitulatif
    const totalConseils = await prisma.conseil.count();
    const totalCategories = await prisma.conseilCategory.count();
    const totalViews = await prisma.conseilView.count();
    const totalSaves = await prisma.conseilSave.count();

    console.log('\n📊 RÉCAPITULATIF DU SEEDING:');
    console.log('============================');
    console.log(`📂 Catégories: ${totalCategories}`);
    console.log(`📝 Conseils: ${totalConseils}`);
    console.log(`👁️ Vues totales: ${totalViews}`);
    console.log(`💾 Sauvegardes totales: ${totalSaves}`);
    
    // Afficher quelques statistiques par catégorie
    try {
      const categoryStats = await prisma.$queryRaw`
        SELECT 
          c.category,
          COUNT(*) as conseil_count,
          SUM(c.views) as total_views,
          SUM(c.saves) as total_saves
        FROM "Conseil" c
        GROUP BY c.category
        ORDER BY total_views DESC
      `;
      
      console.log('\n📈 STATISTIQUES PAR CATÉGORIE:');
      console.log('===============================');
      categoryStats.forEach(stat => {
        console.log(`${stat.category}: ${Number(stat.conseil_count)} conseils, ${Number(stat.total_views)} vues, ${Number(stat.total_saves)} sauvegardes`);
      });
    } catch (error) {
      console.log('⚠️ Impossible d\'afficher les stats par catégorie:', error.message);
    }

    console.log('\n🎉 Seeding terminé avec succès!');
    console.log('\n🔗 URLs de test:');
    console.log('   • Conseils publics: http://localhost:3001/api/conseils');
    console.log('   • Statistiques globales: http://localhost:3001/api/conseils/stats/global');
    console.log('   • Catégories: http://localhost:3001/api/conseils/categories');
    console.log('\n👤 Connectez-vous avec:');
    console.log('   • Email: superadmin@servo.mg');
    console.log('   • Mot de passe: admin123 (ou le mot de passe que vous avez configuré)');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    
    // Afficher plus de détails pour le débogage
    if (error.code === 'P2002') {
      console.error('   → Erreur de contrainte d\'unicité');
      console.error('   → Détails:', error.meta);
    }
    
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });