const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Coordonnées approximatives de La Réunion
const REUNION_BOUNDS = {
  minLat: -21.4,
  maxLat: -20.8,
  minLng: 55.2,
  maxLng: 55.9,
};

// Villes principales de La Réunion avec leurs coordonnées approximatives
const REUNION_CITIES = [
  { name: "Saint-Denis", lat: -20.8789, lng: 55.4481 },
  { name: "Saint-Paul", lat: -21.0097, lng: 55.2698 },
  { name: "Saint-Pierre", lat: -21.3393, lng: 55.4781 },
  { name: "Le Tampon", lat: -21.2775, lng: 55.5172 },
  { name: "Saint-Louis", lat: -21.286, lng: 55.41 },
  { name: "Le Port", lat: -20.9392, lng: 55.2942 },
  { name: "Saint-André", lat: -20.9633, lng: 55.6508 },
  { name: "Saint-Joseph", lat: -21.3781, lng: 55.6192 },
  { name: "Saint-Benoît", lat: -21.0339, lng: 55.7128 },
  { name: "Saint-Leu", lat: -21.1658, lng: 55.2883 },
  { name: "Bras-Panon", lat: -21.0014, lng: 55.6781 },
  { name: "Les Avirons", lat: -21.2414, lng: 55.3389 },
  { name: "Étang-Salé", lat: -21.2636, lng: 55.3392 },
  { name: "Petite-Île", lat: -21.3536, lng: 55.5647 },
  { name: "La Possession", lat: -20.9256, lng: 55.3358 },
  { name: "Cilaos", lat: -21.1333, lng: 55.4667 },
  { name: "Salazie", lat: -21.0272, lng: 55.5386 },
  { name: "Sainte-Marie", lat: -20.8972, lng: 55.5492 },
  { name: "Sainte-Suzanne", lat: -20.9061, lng: 55.6078 },
  { name: "Sainte-Rose", lat: -21.1292, lng: 55.7944 },
];

// Fonction pour générer un nombre aléatoire dans une plage
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Fonction pour générer des coordonnées réalistes dans une ville spécifique
function generateCoordinatesInCity(city) {
  // Variation de ±0.02 degrés pour répartir autour du centre-ville
  const latVariation = randomInRange(-0.02, 0.02);
  const lngVariation = randomInRange(-0.02, 0.02);

  return {
    latitude: city.lat + latVariation,
    longitude: city.lng + lngVariation,
  };
}

// Fonction pour générer des coordonnées aléatoires dans La Réunion
function generateRandomReunionCoordinates() {
  const randomCity =
    REUNION_CITIES[Math.floor(Math.random() * REUNION_CITIES.length)];
  return generateCoordinatesInCity(randomCity);
}

async function seedReunionCoordinates() {
  console.log("🌋 Début du seed des coordonnées de La Réunion...");

  try {
    // 1. Mettre à jour les utilisateurs professionnels
    const professionalUsers = await prisma.user.findMany({
      where: {
        role: "professional",
      },
      select: {
        id: true,
        city: true,
      },
    });

    console.log(
      `👷 Mise à jour de ${professionalUsers.length} utilisateurs professionnels...`
    );

    for (const user of professionalUsers) {
      let coordinates;

      // Si l'utilisateur a déjà une ville, essayer de la matcher
      if (user.city) {
        const userCity = REUNION_CITIES.find((city) =>
          user.city
            .toLowerCase()
            .includes(city.name.toLowerCase().replace("-", " "))
        );

        if (userCity) {
          coordinates = generateCoordinatesInCity(userCity);
        } else {
          coordinates = generateRandomReunionCoordinates();
        }
      } else {
        coordinates = generateRandomReunionCoordinates();
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      });
    }

    console.log("✅ Utilisateurs professionnels mis à jour");

    // 2. Mettre à jour les propriétés
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        city: true,
      },
    });

    console.log(`🏠 Mise à jour de ${properties.length} propriétés...`);

    for (const property of properties) {
      let coordinates;

      // Si la propriété a une ville, essayer de la matcher
      if (property.city) {
        const propertyCity = REUNION_CITIES.find((city) =>
          property.city
            .toLowerCase()
            .includes(city.name.toLowerCase().replace("-", " "))
        );

        if (propertyCity) {
          coordinates = generateCoordinatesInCity(propertyCity);
        } else {
          coordinates = generateRandomReunionCoordinates();
        }
      } else {
        coordinates = generateRandomReunionCoordinates();
      }

      await prisma.property.update({
        where: { id: property.id },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
      });
    }

    console.log("✅ Propriétés mises à jour");

    // 3. Statistiques finales
    const updatedUsers = await prisma.user.count({
      where: {
        role: "professional",
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const updatedProperties = await prisma.property.count({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    console.log(`
🎉 Seed des coordonnées de La Réunion terminé !
    
📊 Statistiques finales:
   👷 ${updatedUsers} utilisateurs professionnels avec coordonnées
   🏠 ${updatedProperties} propriétés avec coordonnées
   🗺️  Toutes les coordonnées sont dans les limites de La Réunion
    `);
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    throw error;
  }
}

// Version pour les villes spécifiques (optionnelle)
async function seedWithSpecificCities() {
  console.log("🏙️  Seed avec répartition par villes...");

  const professionalUsers = await prisma.user.findMany({
    where: { role: "professional" },
  });

  const properties = await prisma.property.findMany();

  // Répartir équitablement entre les villes
  const allEntities = [...professionalUsers, ...properties];

  for (let i = 0; i < allEntities.length; i++) {
    const cityIndex = i % REUNION_CITIES.length;
    const city = REUNION_CITIES[cityIndex];
    const coordinates = generateCoordinatesInCity(city);

    if (allEntities[i].hasOwnProperty("role")) {
      // C'est un utilisateur
      await prisma.user.update({
        where: { id: allEntities[i].id },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          city: city.name, // Optionnel: mettre à jour la ville aussi
        },
      });
    } else {
      // C'est une propriété
      await prisma.property.update({
        where: { id: allEntities[i].id },
        data: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          city: city.name, // Optionnel: mettre à jour la ville aussi
        },
      });
    }
  }

  console.log("✅ Répartition par villes terminée");
}

// Fonction principale pour exécuter le seed
async function main() {
  console.log("🌺 Démarrage du seed des coordonnées La Réunion...");

  // Version basique avec coordonnées aléatoires
  //await seedReunionCoordinates();
  await seedWithSpecificCities();

  console.log("✅ Seed terminé avec succès !");
}

// Exécution du script
main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
