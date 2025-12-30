const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Vider les tables existantes
  await prisma.discovery.deleteMany();
  await prisma.event.deleteMany();
  console.log('✅ Tables vidées');

  // Créer des événements avec les nouveaux champs
  const events = await prisma.event.createMany({
    data: [
      {
        title: "Festival de Musique Électronique",
        description: "Un festival de musique électronique avec les meilleurs DJs internationaux. Venez vivre une expérience unique avec des installations visuelles époustouflantes.",
        date: new Date('2024-06-15'),
        startTime: "18:00",
        endTime: "23:00",
        location: "Parc des Expositions",
        address: "1 Avenue de la Porte de Versailles",
        city: "Paris",
        postalCode: "75015",
        category: "Musique",
        subCategory: "Festival",
        capacity: 500,
        price: 50,
        discountPrice: 40,
        currency: "EUR",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
        images: [
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"
        ],
        featured: true,
        status: "ACTIVE",
        organizer: "Music Events Corp",
        contactEmail: "contact@music-events.com",
        contactPhone: "+33123456789",
        website: "https://music-festival.com",
        tags: ["musique", "festival", "DJ", "nuit"],
        requirements: "Pièce d'identité requise. Interdit aux moins de 18 ans.",
        highlights: ["DJ internationaux", "Installations lumineuses", "Zone VIP", "Food trucks"],
        duration: "5 heures",
        difficulty: "EASY",
        targetAudience: ["18-25", "26-35", "36-45"],
        includes: ["Entrée", "Accès aux zones communes"],
        notIncludes: ["Boissons", "Parking", "Transport"],
        cancellationPolicy: "Annulation possible jusqu'à 7 jours avant l'événement",
        refundPolicy: "Remboursement à 80% en cas d'annulation valide",
        visibility: "PUBLIC",
        registrationDeadline: new Date('2024-06-10'),
        earlyBirdDeadline: new Date('2024-05-15'),
        earlyBirdPrice: 35,
        participants: 150,
        revenue: 7500
      },
      {
        title: "Conférence Tech Innovation",
        description: "Conférence sur les dernières innovations technologiques avec des experts du secteur.",
        date: new Date('2024-07-20'),
        startTime: "09:00",
        endTime: "17:00",
        location: "Centre des Congrès",
        address: "50 Quai Charles de Gaulle",
        city: "Lyon",
        postalCode: "69006",
        category: "Conférence",
        subCategory: "Technologie",
        capacity: 300,
        price: 100,
        currency: "EUR",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
        featured: true,
        status: "UPCOMING",
        organizer: "Tech Innovators",
        contactEmail: "info@tech-innovators.com",
        tags: ["tech", "innovation", "conférence", "IA"],
        duration: "8 heures",
        includes: ["Conférences", "Déjeuner", "Networking"],
        visibility: "PUBLIC",
        participants: 0,
        revenue: 0
      }
    ]
  });
  console.log(`✅ ${events.count} événements créés`);

  // Créer des découvertes avec les nouveaux champs
  const discoveries = await prisma.discovery.createMany({
    data: [
      {
        title: "Randonnée Montagne des Alpes",
        description: "Une randonnée épique dans les Alpes avec vue panoramique sur les sommets. Parfait pour les amateurs de nature.",
        type: "Randonnée",
        location: "Alpes Françaises",
        address: "Route du Mont Blanc",
        city: "Chamonix",
        postalCode: "74400",
        difficulty: "MEDIUM",
        duration: "6 heures",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=800"
        ],
        featured: true,
        status: "PUBLISHED",
        organizer: "Alpine Adventures",
        contactEmail: "info@alpine-adventures.com",
        contactPhone: "+33450506070",
        website: "https://alpine-adventures.com",
        tags: ["nature", "montagne", "aventure", "randonnée"],
        highlights: ["Vue panoramique", "Faune locale", "Photos souvenir", "Guide expert"],
        recommendations: "Prévoir des vêtements chauds et de bonnes chaussures",
        bestSeason: ["été", "automne"],
        bestTime: ["matin"],
        accessibility: "Bonne condition physique requise",
        equipment: ["Chaussures de randonnée", "Veste imperméable", "Bâtons de marche"],
        safety: "Guide certifié, équipement de sécurité fourni",
        price: 89,
        currency: "EUR",
        includes: ["Guide", "Equipement", "Repas du midi"],
        notIncludes: ["Transport depuis l'hôtel", "Assurance"],
        groupSizeMin: 4,
        groupSizeMax: 15,
        ageRestrictionMin: 12,
        languages: ["français", "anglais"],
        guideIncluded: true,
        transportIncluded: false,
        mealIncluded: true,
        parkingAvailable: true,
        wifiAvailable: false,
        familyFriendly: false,
        petFriendly: false,
        wheelchairAccessible: false,
        sustainabilityRating: 4.5,
        carbonFootprint: "Faible",
        coordinates: { lat: 45.8336, lng: 6.8652 },
        includedServices: ["guide", "équipement", "repas"],
        requirements: ["bonne condition physique", "chaussures de randonnée"],
        maxVisitors: 15,
        availableDates: ["2024-06-15", "2024-06-22", "2024-06-29"],
        visits: 1200,
        revenue: 24000
      },
      {
        title: "Visite des Caves à Vin",
        description: "Découverte des caves et dégustation de vins d'exception dans la région de Bourgogne.",
        type: "Gastronomie",
        location: "Bourgogne",
        city: "Beaune",
        postalCode: "21200",
        difficulty: "EASY",
        duration: "3 heures",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800",
        featured: true,
        status: "ACTIVE",
        organizer: "Vineyard Tours",
        tags: ["vin", "dégustation", "culture", "gastronomie"],
        highlights: ["Dégustation exclusive", "Rencontre avec le vigneron", "Caves historiques"],
        price: 65,
        currency: "EUR",
        includes: ["Dégustation", "Guide", "Fromages"],
        groupSizeMax: 12,
        ageRestrictionMin: 18,
        languages: ["français", "anglais"],
        guideIncluded: true,
        mealIncluded: true,
        parkingAvailable: true,
        familyFriendly: false,
        coordinates: { lat: 47.0525, lng: 4.3837 },
        maxVisitors: 12,
        visits: 850,
        revenue: 17000
      }
    ]
  });
  console.log(`✅ ${discoveries.count} découvertes créées`);

  console.log('🌱 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });