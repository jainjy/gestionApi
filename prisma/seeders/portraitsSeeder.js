// prisma/seeders/portraitsSeeder.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPortraits() {
  console.log("🌱 Seeding portraits...");

  try {
    // Vérifier si des portraits existent déjà
    const existingPortraits = await prisma.portraitLocal.count();
    if (existingPortraits > 0) {
      console.log("✅ Portraits already seeded");
      return;
    }

    const portraits = [
      {
        name: "Mamie Marie-Claire",
        age: 94,
        generation: "anciens",
        country: "Réunion",
        location: "Salazie",
        profession: "Tisserande traditionnelle",
        description: "Détentrice des savoirs traditionnels du tissage vacoa",
        story:
          "Née en 1930, elle a vu l'île se transformer tout en préservant l'art du tissage vacoa transmis par sa grand-mère. Elle a enseigné cet art à plus de 50 personnes au cours de sa vie.",
        shortStory:
          "Née en 1930, elle a vu l'île se transformer tout en préservant l'art du tissage vacoa transmis par sa grand-mère.",
        quote:
          "Chaque feuille de vacoa raconte une histoire. Mes mains ont tissé la mémoire de cette île.",
        color: "amber",
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1584302179602-e76e20f6e19e",
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
          "https://images.unsplash.com/photo-1597212617258-7f2d6f282e4c",
        ],
        interviewAudioUrl:
          "https://assets.mixkit.co/music/preview/mixkit-ethnic-deep-african-168.mp3",
        interviewDuration: "24:15",
        interviewTopics: ["Traditions", "Mémoire", "Transmission"],
        wisdom: [
          "La patience est la mère de toutes les vertus",
          "Un homme sans mémoire est comme un arbre sans racines",
          "Le savoir-faire se transmet par le cœur, pas seulement par les mains",
        ],
        instagramHandle: "mamie_marieclaire",
        facebookHandle: "MamieMarieClaireReunion",
        youtubeHandle: "@MamieReunion",
        categories: ["artisanat", "traditions"],
        tags: ["vacoa", "tissage", "mémoire", "ancien"],
        latitude: -21.0295,
        longitude: 55.5394,
        region: "Cirque de Salazie",
        isActive: true,
      },
      {
        name: "Papa Jacques",
        age: 87,
        generation: "anciens",
        country: "Réunion",
        location: "Saint-Paul",
        profession: "Pêcheur traditionnel",
        description:
          "Dernier détenteur des techniques de pêche au filet volant",
        story:
          "Depuis 70 ans, il lit la mer comme un livre ouvert. Dernier détenteur des techniques de pêche au filet volant. Il connaît chaque courant, chaque marée, chaque poisson qui peuple les eaux réunionnaises.",
        shortStory:
          "Depuis 70 ans, il lit la mer comme un livre ouvert. Dernier détenteur des techniques de pêche au filet volant.",
        quote: "La mer ne ment jamais. Elle te donne ce que tu mérites.",
        color: "blue",
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
          "https://images.unsplash.com/photo-1557862925-8d5d0902e5f7",
          "https://images.unsplash.com/photo-1560250097-0b93528c311a",
        ],
        interviewAudioUrl:
          "https://assets.mixkit.co/music/preview/mixkit-deep-sea-ambience-169.mp3",
        interviewDuration: "18:30",
        interviewTopics: ["Mer", "Transmission", "Écologie"],
        wisdom: [
          "Respecte la mer et elle te nourrira",
          "Un bon pêcheur écoute avant de parler",
          "Les poissons viennent à ceux qui patientent",
        ],
        instagramHandle: "papa_jacques_pecheur",
        facebookHandle: "PapaJacquesPecheur",
        youtubeHandle: "@PecheTraditionnelle",
        categories: ["pêche", "traditions", "écologie"],
        tags: ["pêche", "mer", "traditions", "savoir-faire"],
        latitude: -21.0375,
        longitude: 55.2684,
        region: "Ouest",
        isActive: true,
      },
      {
        name: "Marie-Ange",
        age: 42,
        generation: "actuels",
        country: "Réunion",
        location: "Saint-Pierre",
        profession: "Agricultrice bio",
        description: "Ingénieure agronome revenue à la terre familiale",
        story:
          "Ingénieure agronome revenue à la terre familiale pour développer l'agriculture durable et les circuits courts. Elle a transformé 5 hectares en exploitation biologique certifiée.",
        shortStory:
          "Ingénieure agronome revenue à la terre familiale pour développer l'agriculture durable et les circuits courts.",
        quote: "Notre terre nous nourrit, à nous de la nourrir en retour.",
        color: "green",
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
          "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c",
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
        ],
        interviewAudioUrl:
          "https://assets.mixkit.co/music/preview/mixkit-cooking-show-125.mp3",
        interviewDuration: "28:20",
        interviewTopics: ["Agriculture durable", "Innovation", "Transmission"],
        wisdom: [
          "Une graine plantée avec amour donne toujours des fruits",
          "L'innovation doit respecter la tradition",
          "Manger local, c'est préserver notre avenir",
        ],
        instagramHandle: "marieange_agricultrice",
        facebookHandle: "MarieAngeAgricultureBio",
        youtubeHandle: "@AgricultureDurableReunion",
        categories: ["agriculture", "écologie", "innovation"],
        tags: ["bio", "agriculture", "circuits courts", "durable"],
        latitude: -21.3458,
        longitude: 55.4785,
        region: "Sud",
        isActive: true,
      },
      {
        name: "Fatou",
        age: 28,
        generation: "jeunes",
        country: "Réunion",
        location: "Saint-Benoît",
        profession: "Artiste numérique",
        description: "Fusionne art traditionnel et technologies",
        story:
          "Diplômée des Beaux-Arts, elle fusionne art traditionnel et technologies pour créer une nouvelle identité visuelle réunionnaise. Ses œuvres ont été exposées à Paris, Tokyo et New York.",
        shortStory:
          "Diplômée des Beaux-Arts, elle fusionne art traditionnel et technologies pour créer une nouvelle identité visuelle réunionnaise.",
        quote: "Nos racines sont notre force, la technologie notre aile.",
        color: "purple",
        featured: true,
        images: [
          "https://images.unsplash.com/photo-1494790108755-2616b612b786",
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        ],
        interviewAudioUrl:
          "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
        interviewDuration: "26:40",
        interviewTopics: ["Art numérique", "Identité", "Innovation"],
        wisdom: [
          "L'art doit parler à son époque",
          "La tradition n'est pas un musée, c'est une source",
          "Chaque pixel peut raconter une histoire",
        ],
        instagramHandle: "fatou_digitalart",
        facebookHandle: "FatouArtNumerique",
        youtubeHandle: "@ArtNumeriqueReunion",
        categories: ["art", "technologie", "innovation"],
        tags: ["art numérique", "création", "identité", "jeunesse"],
        latitude: -21.0339,
        longitude: 55.7128,
        region: "Est",
        isActive: true,
      },
    ];

    // Créer les portraits
    for (const portraitData of portraits) {
      await prisma.portraitLocal.create({
        data: portraitData,
      });
    }

    console.log(`✅ ${portraits.length} portraits created successfully`);
  } catch (error) {
    console.error("❌ Error seeding portraits:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedPortraits;

// Si vous voulez exécuter directement
if (require.main === module) {
  seedPortraits()
    .then(() => {
      console.log("🌱 Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
