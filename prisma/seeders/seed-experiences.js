// prisma/seeders/seed-experiences.js (version corrigée)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // 1. Créer plusieurs utilisateurs de test pour les avis
  console.log('📝 Création utilisateurs test...');
  
  const testUsers = [
    {
      email: 'pro@servo.mg',
      firstName: 'Servo',
      lastName: 'Pro',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      phone: '+262692123456',
      role: 'admin',
      userType: 'professional',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=servo'
    },
    {
      email: 'client1@example.com',
      firstName: 'Marie',
      lastName: 'Dupont',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      phone: '+262692111111',
      role: 'user',
      userType: 'client',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marie'
    },
    {
      email: 'client2@example.com',
      firstName: 'Pierre',
      lastName: 'Martin',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      phone: '+262692222222',
      role: 'user',
      userType: 'client',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pierre'
    },
    {
      email: 'client3@example.com',
      firstName: 'Sophie',
      lastName: 'Bernard',
      passwordHash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      phone: '+262692333333',
      role: 'user',
      userType: 'client',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie'
    }
  ];

  // Créer ou mettre à jour les utilisateurs
  const createdUsers = [];
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log(`✅ Utilisateur créé: ${user.email}`);
  }

  const mainUser = createdUsers[0]; // pro@servo.mg

  // 2. Créer des expériences de test
  console.log('🏔️ Création des expériences...');
  
  const experiences = [
    {
      title: "Randonnée Volcanique au Piton de la Fournaise",
      slug: "randonnee-volcanique-piton-fournaise",
      category: "aventure",
      description: "Découverte du volcan actif de La Réunion avec guide vulcanologue.",
      duration: "Journée complète (8h)",
      location: "Piton de la Fournaise, La Réunion",
      price: 95,
      highlights: ["Guide vulcanologue", "Équipement fourni", "Pique-nique créole"],
      images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"],
      difficulty: "Intermédiaire",
      groupSize: "8 personnes maximum",
      season: "Avril à Novembre",
      included: ["Transport", "Guide", "Repas"],
      requirements: ["Bonne condition physique", "Chaussures randonnée"],
      isFeatured: true,
      createdById: mainUser.id
    },
    {
      title: "Safari Baleines à Bossière",
      slug: "safari-baleines-bossiere",
      category: "marine",
      description: "Observation des baleines à bosse dans leur milieu naturel.",
      duration: "Demi-journée (4h)",
      location: "Saint-Gilles, La Réunion",
      price: 75,
      highlights: ["Biologiste marin", "Approche respectueuse", "Snorkeling optionnel"],
      images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80"],
      difficulty: "Facile",
      groupSize: "12 personnes maximum",
      season: "Juillet à Octobre",
      included: ["Bateau", "Guide", "Collation"],
      requirements: ["Savoir nager", "Âge minimum: 6 ans"],
      isFeatured: true,
      createdById: mainUser.id
    },
    {
      title: "Retraite Yoga et Bien-être à Hell-Bourg",
      slug: "retraite-yoga-bien-etre-hell-bourg",
      category: "bienetre",
      description: "Retraite spirituelle de 3 jours dans le cirque de Salazie.",
      duration: "3 jours / 2 nuits",
      location: "Hell-Bourg, Cirque de Salazie",
      price: 420,
      highlights: ["Maître yoga certifié", "Cuisine ayurvédique", "Massages"],
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"],
      difficulty: "Tous niveaux",
      groupSize: "10 personnes maximum",
      season: "Toute l'année",
      included: ["Hébergement", "Repas", "Activités"],
      requirements: ["Tenue confortable", "Ouverture d'esprit"],
      createdById: mainUser.id
    },
    {
      title: "Immersion Culture Créole",
      slug: "immersion-culture-creole",
      category: "culture",
      description: "Découverte de la culture créole réunionnaise.",
      duration: "Journée complète (7h)",
      location: "Saint-Pierre, La Réunion",
      price: 85,
      highlights: ["Plantation vanille", "Atelier tissage", "Cours cuisine"],
      images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"],
      difficulty: "Facile",
      groupSize: "15 personnes maximum",
      season: "Toute l'année",
      included: ["Transport", "Ateliers", "Déjeuner"],
      requirements: ["Intérêt culturel"],
      createdById: mainUser.id
    }
  ];

  // Créer chaque expérience
  const createdExperiences = [];
  for (const expData of experiences) {
    const experience = await prisma.experience.upsert({
      where: { slug: expData.slug },
      update: {},
      create: expData,
    });
    createdExperiences.push(experience);
    console.log(`✅ Expérience créée: ${experience.title}`);
  }

  // 3. Créer des avis avec DIFFÉRENTS utilisateurs
  console.log('⭐ Ajout d\'avis de test...');
  
  // Chaque utilisateur donne un avis sur chaque expérience
  const reviewsByUser = [
    {
      userId: createdUsers[1].id, // Marie
      reviews: [
        { rating: 5, comment: "Incroyable ! À refaire absolument." },
        { rating: 4, comment: "Très belle expérience, organisation parfaite." },
        { rating: 5, comment: "Un moment magique, équipe formidable." },
        { rating: 4, comment: "Découverte culturelle enrichissante." }
      ]
    },
    {
      userId: createdUsers[2].id, // Pierre
      reviews: [
        { rating: 4, comment: "Belle randonnée, guide compétent." },
        { rating: 5, comment: "Moment inoubliable avec les baleines !" },
        { rating: 4, comment: "Détente totale, je recommande." },
        { rating: 3, comment: "Intéressant mais un peu long." }
      ]
    },
    {
      userId: createdUsers[3].id, // Sophie
      reviews: [
        { rating: 5, comment: "Sensation forte garantie !" },
        { rating: 5, comment: "Les enfants ont adoré, merci !" },
        { rating: 4, comment: "Cadre idyllique, personnel attentionné." },
        { rating: 5, comment: "Apprentissage passionnant." }
      ]
    }
  ];

  for (let i = 0; i < createdExperiences.length; i++) {
    for (const userReview of reviewsByUser) {
      if (userReview.reviews[i]) {
        try {
          await prisma.experienceReview.create({
            data: {
              rating: userReview.reviews[i].rating,
              comment: userReview.reviews[i].comment,
              verified: true,
              experienceId: createdExperiences[i].id,
              userId: userReview.userId,
              images: []
            }
          });
          console.log(`✅ Avis ajouté par ${userReview.userId.slice(0, 8)} pour ${createdExperiences[i].title.slice(0, 20)}...`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Avis déjà existant pour cet utilisateur/expérience, on passe...`);
          } else {
            throw error;
          }
        }
      }
    }
  }

  // 4. Mettre à jour les statistiques des expériences
  console.log('📊 Mise à jour des statistiques...');
  
  for (const exp of createdExperiences) {
    const reviews = await prisma.experienceReview.findMany({
      where: { experienceId: exp.id }
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await prisma.experience.update({
        where: { id: exp.id },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: reviews.length
        }
      });
      console.log(`📈 ${exp.title}: ${avgRating.toFixed(1)}/5 (${reviews.length} avis)`);
    }
  }

  // 5. Créer quelques FAQ
  console.log('❓ Ajout de FAQ...');
  
  const faqs = [
    { question: "Annulation possible ?", answer: "Gratuite jusqu'à 48h avant." },
    { question: "Transport inclus ?", answer: "Voir section 'Inclus'." },
    { question: "Niveau requis ?", answer: "Voir difficulté indiquée." }
  ];

  for (const exp of createdExperiences.slice(0, 2)) {
    for (const [index, faq] of faqs.entries()) {
      await prisma.experienceFAQ.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          order: index,
          isActive: true,
          experienceId: exp.id
        }
      });
    }
  }

  // 6. Créer quelques favoris
  console.log('❤️ Ajout de favoris...');
  
  for (let i = 0; i < Math.min(3, createdExperiences.length); i++) {
    for (const user of createdUsers.slice(1, 3)) { // Marie et Pierre
      await prisma.experienceFavorite.create({
        data: {
          experienceId: createdExperiences[i].id,
          userId: user.id
        }
      });
    }
  }

  console.log('🎉 Seeding terminé avec succès !');
  console.log(`📊 Résumé:`);
  console.log(`   - Utilisateurs: ${createdUsers.length}`);
  console.log(`   - Expériences: ${createdExperiences.length}`);
  console.log(`   - Avis: ${await prisma.experienceReview.count()}`);
  console.log(`   - FAQ: ${await prisma.experienceFAQ.count()}`);
  console.log(`   - Favoris: ${await prisma.experienceFavorite.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e.message);
    if (e.code === 'P2002') {
      console.error('🔍 Problème de contrainte d\'unicité. Essayez de réinitialiser la base:');
      console.error('   npm run seed:reset');
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });