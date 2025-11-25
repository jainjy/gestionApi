const { prisma } = require('../../lib/db');
// Données synchronisées avec les Cours & Formations existants du projet
const COURSES_DATA = [
  {
    id: "cuisine",
    category: "Cours de Cuisine",
    title: "Cours de Cuisine à Domicile",
    description: "Cours de cuisine à domicile - Apprenez les secrets culinaires avec nos chefs professionnels",
    price: 129,
    priceUnit: "session",
    durationMinutes: 120,
    maxParticipants: 6,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/cuisine.gif",
    items: ["Cuisine française", "Pâtisserie", "Cuisine asiatique", "Cuisine végétale", "Gastronomie", "Boulangerie"]
  },
  {
    id: "decoration",
    category: "Cours de Décoration", 
    title: "Cours de Décoration d'Intérieur",
    description: "Formation à la décoration d'intérieur et stylisme - Créez des espaces harmonieux",
    price: 99,
    priceUnit: "session",
    durationMinutes: 90,
    maxParticipants: 8,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/decoration.gif",
    items: ["Design d'intérieur", "Couleurs & Harmonie", "Mobilier", "Accessoires", "Espaces extérieurs", "Home staging"]
  },
  {
    id: "bricolage",
    category: "Ateliers Bricolage",
    title: "Ateliers Bricolage à Domicile",
    description: "Apprenez les bases du bricolage et petits travaux - Devenez autonome dans votre maison",
    price: 79,
    priceUnit: "session", 
    durationMinutes: 180,
    maxParticipants: 4,
    materialsIncluded: true,
    level: "Débutant",
    imageUrl: "/domicile/atelier.gif",
    items: ["Menuiserie", "Électricité basique", "Plomberie", "Assemblage meubles", "Réparations", "Outils & techniques"]
  },
  {
    id: "jardinage",
    category: "Formation Jardinage",
    title: "Formation Jardinage Complet",
    description: "Maîtrisez l'art du jardinage et l'entretien des plantes - Créez votre oasis verte",
    price: 89,
    priceUnit: "session",
    durationMinutes: 150,
    maxParticipants: 5,
    materialsIncluded: true,
    level: "Tous niveaux", 
    imageUrl: "/domicile/jardinnage.gif",
    items: ["Plantes d'intérieur", "Jardinage potager", "Paysagisme", "Entretien gazon", "Arbustes & fleurs", "Compostage"]
  },
  {
    id: "feng-shui",
    category: "Feng Shui & Harmonie",
    title: "Feng Shui & Harmonie du Foyer",
    description: "Créez l'harmonie dans votre maison avec le Feng Shui - Équilibrez les énergies",
    price: 159,
    priceUnit: "session",
    durationMinutes: 120,
    maxParticipants: 10,
    materialsIncluded: false,
    level: "Tous niveaux",
    imageUrl: "/domicile/harmony.gif", 
    items: ["Principes Feng Shui", "Aménagement d'espaces", "Énergie du foyer", "Balancing", "Harmonie couleurs", "Méditation"]
  },
  {
    id: "upcycling",
    category: "Recyclage Créatif",
    title: "Recyclage Créatif & Upcycling",
    description: "Transformez vos objets en créations uniques - Donnez une seconde vie à vos affaires",
    price: 89,
    priceUnit: "session",
    durationMinutes: 180,
    maxParticipants: 6,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/recyclage.gif",
    items: ["Upcycling meubles", "DIY décoration", "Textiles récyclés", "Artisanat créatif", "Peinture customisation", "Création art"]
  },
  {
    id: "domotique", 
    category: "Formation Domotique",
    title: "Formation Domotique Intelligente",
    description: "Transformez votre maison en habitation intelligente - Maîtrisez les nouvelles technologies",
    price: 199,
    priceUnit: "session",
    durationMinutes: 180,
    maxParticipants: 4,
    materialsIncluded: false,
    level: "Intermédiaire",
    imageUrl: "/domicile/domotique.png",
    items: ["Smart Home basics", "Éclairage connecté", "Chauffage intelligent", "Sécurité domotique", "Contrôle vocal", "Applications mobiles"]
  },
  {
    id: "design-salon",
    category: "Design & Aménagement", 
    title: "Design & Aménagement sur Mesure",
    description: "Services de design sur mesure pour tous vos espaces - Expertise professionnelle",
    price: 0,
    priceUnit: "devis",
    durationMinutes: 120,
    maxParticipants: 2,
    materialsIncluded: false,
    level: "Tous niveaux",
    imageUrl: "/domicile/design.gif",
    items: ["Design Salon", "Cuisine", "Chambres", "Salle de bain", "Bureau professionnel", "Espaces extérieurs"]
  },
  {
    id: "musique",
    category: "Cours de Musique",
    title: "Cours de Musique à Domicile", 
    description: "Apprentissage d'instruments et technique musicale - Professeurs qualifiés",
    price: 60,
    priceUnit: "heure",
    durationMinutes: 60,
    maxParticipants: 1,
    materialsIncluded: false,
    level: "Tous niveaux",
    imageUrl: "/domicile/music.gif",
    items: ["Guitare", "Piano", "Chant", "Violon", "Batterie", "Théorie musicale"]
  },
  {
    id: "fitness",
    category: "Sport & Fitness",
    title: "Sport & Fitness à Domicile",
    description: "Entraînement personnalisé à domicile - Coachs professionnels",
    price: 50,
    priceUnit: "session",
    durationMinutes: 60,
    maxParticipants: 1,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/sport.gif",
    items: ["Yoga", "Pilates", "Fitness", "Musculation", "Cardio", "Stretching"]
  },
  {
    id: "soutien-scolaire",
    category: "Soutien Scolaire Enfant",
    title: "Soutien Scolaire à Domicile",
    description: "Accompagnement scolaire vacances et après l'école - Toutes matières - Enseignants diplômés",
    price: 45,
    priceUnit: "heure",
    durationMinutes: 60,
    maxParticipants: 1,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/soutien.gif",
    items: [
      "Aide aux devoirs",
      "Soutien vacances", 
      "Accompagnement après l'école",
      "Mathématiques",
      "Français",
      "Langues étrangères",
      "Révisions examens",
      "Méthodologie d'apprentissage"
    ]
  },
  {
    id: "atelier-enfant",
    category: "Atelier Enfant",
    title: "Ateliers Créatifs pour Enfants",
    description: "Ateliers créatifs et ludiques pour les enfants - Développement de la créativité et motricité",
    price: 30,
    priceUnit: "session",
    durationMinutes: 90,
    maxParticipants: 8,
    materialsIncluded: true,
    level: "Enfant",
    imageUrl: "/domicile/atelier-enfant.gif",
    items: [
      "Peinture enfant",
      "Sculpture modelage",
      "Création de bracelets", 
      "Bricolage créatif",
      "Dessin et coloriage",
      "Activités manuelles"
    ]
  },
  {
    id: "atelier-adulte",
    category: "Atelier Adulte",
    title: "Ateliers Créatifs pour Adultes", 
    description: "Ateliers créatifs pour adultes - Détente et création - Développement personnel",
    price: 40,
    priceUnit: "session",
    durationMinutes: 120,
    maxParticipants: 6,
    materialsIncluded: true,
    level: "Tous niveaux",
    imageUrl: "/domicile/atelier-adulte.gif",
    items: [
      "Peinture sur toile",
      "Sculpture terre",
      "Création bijoux",
      "Atelier créatif surprise",
      "Art-thérapie", 
      "Loisirs créatifs"
    ]
  }
];

// Disponibilités par défaut (tous les jours de la semaine)
const DEFAULT_AVAILABILITIES = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", isRecurring: true },
  { dayOfWeek: 1, startTime: "14:00", endTime: "18:00", isRecurring: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "12:00", isRecurring: true },
  { dayOfWeek: 2, startTime: "14:00", endTime: "18:00", isRecurring: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "12:00", isRecurring: true },
  { dayOfWeek: 3, startTime: "14:00", endTime: "18:00", isRecurring: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "12:00", isRecurring: true },
  { dayOfWeek: 4, startTime: "14:00", endTime: "18:00", isRecurring: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", isRecurring: true },
  { dayOfWeek: 5, startTime: "14:00", endTime: "18:00", isRecurring: true },
  { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isRecurring: true }
];


async function seedCourses() {
  const user = await prisma.user.findFirst({
    where: { email: "agence@immo.mg" },
  });
  // ID du professionnel spécifique (celui que vous avez fourni)
  //const PROFESSIONAL_ID = "b14f8e76-667b-4c13-9eb5-d24a0f012071";
  const PROFESSIONAL_ID = user.id;

  try {
    console.log('🌱 Début du seeding des cours à domicile...');
    console.log(`👨‍💼 Utilisation du professionnel ID: ${PROFESSIONAL_ID}`);

    // Vérifier que le professionnel existe
    const professional = await prisma.user.findUnique({
      where: { id: PROFESSIONAL_ID }
    });

    if (!professional) {
      console.error('❌ Professionnel non trouvé avec l\'ID:', PROFESSIONAL_ID);
      console.log('💡 Vérifiez que l\'ID est correct et que l\'utilisateur existe dans la base de données.');
      return;
    }

    console.log(`✅ Professionnel trouvé: ${professional.firstName} ${professional.lastName} (${professional.email})`);

    // Optionnel: Supprimer les anciens cours de ce professionnel
    console.log('🧹 Nettoyage des anciens cours du professionnel...');
    const existingCourses = await prisma.course.findMany({
      where: { professionalId: PROFESSIONAL_ID }
    });

    if (existingCourses.length > 0) {
      console.log(`🗑️ Suppression de ${existingCourses.length} cours existants...`);
      
      // Supprimer d'abord les disponibilités
      await prisma.courseAvailability.deleteMany({
        where: {
          courseId: {
            in: existingCourses.map(course => course.id)
          }
        }
      });
      
      // Puis supprimer les cours
      await prisma.course.deleteMany({
        where: { professionalId: PROFESSIONAL_ID }
      });
      
      console.log('✅ Anciens cours supprimés');
    }

    let createdCount = 0;
    let errorCount = 0;

    // Créer chaque cours
    for (const courseData of COURSES_DATA) {
      try {
        console.log(`📝 Création du cours: ${courseData.title}`);

        const course = await prisma.course.create({
          data: {
            professionalId: PROFESSIONAL_ID,
            category: courseData.category,
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            priceUnit: courseData.priceUnit,
            durationMinutes: courseData.durationMinutes,
            maxParticipants: courseData.maxParticipants,
            materialsIncluded: courseData.materialsIncluded,
            level: courseData.level,
            imageUrl: courseData.imageUrl,
            documents: [], // Aucun document par défaut
            isActive: true,
          }
        });

        // Créer les disponibilités pour ce cours
        for (const availability of DEFAULT_AVAILABILITIES) {
          await prisma.courseAvailability.create({
            data: {
              courseId: course.id,
              dayOfWeek: availability.dayOfWeek,
              startTime: availability.startTime,
              endTime: availability.endTime,
              isRecurring: availability.isRecurring
            }
          });
        }

        createdCount++;
        console.log(`✅ Cours créé: ${course.title} (ID: ${course.id})`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur lors de la création du cours ${courseData.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Seeding terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   - Cours créés avec succès: ${createdCount}`);
    console.log(`   - Erreurs: ${errorCount}`);
    console.log(`   - Total: ${COURSES_DATA.length} cours traités`);
    
    // Afficher les statistiques finales
    const totalCourses = await prisma.course.count({
      where: { professionalId: PROFESSIONAL_ID }
    });
    const totalAvailabilities = await prisma.courseAvailability.count({
      where: {
        course: {
          professionalId: PROFESSIONAL_ID
        }
      }
    });
    
    console.log(`\n📈 Dans la base de données:`);
    console.log(`   - Total cours du professionnel: ${totalCourses}`);
    console.log(`   - Total disponibilités créées: ${totalAvailabilities}`);
    console.log(`   - Professionnel: ${professional.firstName} ${professional.lastName}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seeder si le fichier est appelé directement
if (require.main === module) {
  seedCourses()
    .then(() => {
      console.log('\n✅ Seeding des cours terminé avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors du seeding:', error);
      process.exit(1);
    });
}

module.exports = { seedCourses, COURSES_DATA };