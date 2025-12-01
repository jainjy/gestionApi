const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding des activités...');

  // 1. Créer les catégories d'activités
  const categories = [
    { 
      name: 'Plein Air', 
      description: 'Activités en extérieur et nature',
      icon: 'Mountain',
      color: 'from-green-500 to-emerald-500',
      sortOrder: 1
    },
    { 
      name: 'Aventure', 
      description: 'Expériences aventurières et excitantes',
      icon: 'Compass',
      color: 'from-orange-500 to-red-500',
      sortOrder: 2
    },
    { 
      name: 'Nocturne', 
      description: 'Activités en soirée et nuit',
      icon: 'Moon',
      color: 'from-blue-500 to-indigo-500',
      sortOrder: 3
    },
    { 
      name: 'Aquatique', 
      description: 'Sports et loisirs nautiques',
      icon: 'Waves',
      color: 'from-cyan-500 to-blue-500',
      sortOrder: 4
    },
    { 
      name: 'Intérieur', 
      description: 'Activités couvertes et en intérieur',
      icon: 'Tent',
      color: 'from-yellow-500 to-orange-500',
      sortOrder: 5
    },
    { 
      name: 'Famille', 
      description: 'Activités adaptées aux familles',
      icon: 'TreePine',
      color: 'from-pink-500 to-rose-500',
      sortOrder: 6
    },
    { 
      name: 'Sportif', 
      description: 'Défis sportifs et activités physiques',
      icon: 'Trophy',
      color: 'from-red-500 to-pink-500',
      sortOrder: 7
    },
    { 
      name: 'Bien-être', 
      description: 'Relaxation et activités wellness',
      icon: 'Zap',
      color: 'from-teal-500 to-green-500',
      sortOrder: 8
    }
  ];

  for (const categoryData of categories) {
    await prisma.activityCategory.upsert({
      where: { name: categoryData.name },
      update: categoryData,
      create: categoryData
    });
  }
  console.log('✅ Catégories créées');

  // 2. Créer un guide de test (utilise le premier utilisateur trouvé)
  const testUser = await prisma.user.findFirst();
  if (testUser) {
    await prisma.activityGuide.upsert({
      where: { userId: testUser.id },
      update: {
        bio: "Guide passionné par les activités de plein air avec 5 ans d'expérience",
        specialties: ["Randonnée", "Escalade", "VTT"],
        languages: ["Français", "Anglais"],
        experience: 5,
        certifications: ["Guide de montagne", "Premiers secours"],
        isVerified: true,
        hourlyRate: 50
      },
      create: {
        userId: testUser.id,
        bio: "Guide passionné par les activités de plein air avec 5 ans d'expérience",
        specialties: ["Randonnée", "Escalade", "VTT"],
        languages: ["Français", "Anglais"],
        experience: 5,
        certifications: ["Guide de montagne", "Premiers secours"],
        isVerified: true,
        hourlyRate: 50
      }
    });
    console.log('✅ Guide de test créé');

    // 3. Créer quelques activités de démonstration
    const pleinAirCategory = await prisma.activityCategory.findFirst({
      where: { name: 'Plein Air' }
    });

    if (pleinAirCategory) {
      const demoActivities = [
        {
          title: "Randonnée en montagne",
          description: "Découverte des plus beaux sentiers de montagne avec un guide expérimenté. Paysages à couper le souffle et faune locale.",
          categoryId: pleinAirCategory.id,
          image: "https://i.pinimg.com/1200x/91/e7/61/91e761120ecac64ef8187e657d49243a.jpg",
          price: 45,
          duration: "4 heures",
          level: "Intermédiaire",
          maxParticipants: 8,
          minParticipants: 2,
          location: "Massif des Alpes",
          meetingPoint: "Parking du départ de randonnée",
          included: ["Guide diplômé", "Matériel de sécurité", "Collation"],
          requirements: ["Chaussures de randonnée", "Eau", "Vêtements adaptés"],
          highlights: ["Vues panoramiques", "Découverte faune/flore", "Photos souvenirs"]
        },
        {
          title: "Session VTT descente",
          description: "Parcours sensationnel en VTT de descente pour les amateurs de sensations fortes. Encadrement par moniteur professionnel.",
          categoryId: pleinAirCategory.id,
          image: "https://i.pinimg.com/736x/35/32/80/353280742f9436371cb969c51d62feb5.jpg",
          price: 65,
          duration: "3 heures",
          level: "Avancé",
          maxParticipants: 6,
          minParticipants: 1,
          location: "Station de ski été",
          meetingPoint: "Départ remontées mécaniques",
          included: ["VTT de descente", "Protections", "Moniteur", "Remontées mécaniques"],
          requirements: ["Condition physique", "Expérience VTT"],
          highlights: ["Sensations fortes", "Parcours techniques", "Encadrement pro"]
        }
      ];

      const guide = await prisma.activityGuide.findFirst({
        where: { userId: testUser.id }
      });

      for (const activityData of demoActivities) {
        await prisma.activity.create({
          data: {
            ...activityData,
            guideId: guide.id,
            statistics: {
              create: {}
            }
          }
        });
      }
      console.log('✅ Activités de démonstration créées');
    }
  }

  console.log('🎉 Seeding des activités terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });