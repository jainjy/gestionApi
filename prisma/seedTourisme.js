const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedTourisme() {
  console.log('🏨 Début du seeding tourisme...')

  try {
    // Supprimer les données existantes
    await prisma.tourisme.deleteMany()
    console.log('🗑️ Anciennes données supprimées')

    // Données de démonstration
    const tourismListings = [
      {
        id: 'TL-001',
        idUnique: 'TL-001',
        idPrestataire: 'PRO-001',
        title: 'Hôtel de Charme Centre Ville',
        type: 'hotel',
        price: 120,
        city: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        rating: 4.5,
        reviewCount: 127,
        images: [
          'https://i.pinimg.com/736x/27/cd/20/27cd20b21771ec82936e1edfe34c179e.jpg',
          'https://i.pinimg.com/736x/e3/5b/ae/e35bae95c6700d23c3f02eaa11e2c213.jpg',
          'https://i.pinimg.com/736x/4c/fa/82/4cfa8249306b071cf5347b7da38a1c9b.jpg'
        ],
        amenities: ['wifi', 'pool', 'spa', 'breakfast', 'ac', 'tv', 'gym'],
        maxGuests: 2,
        available: true,
        provider: 'booking',
        description: 'Hôtel de charme situé en plein cœur de Paris, à proximité des monuments historiques et des transports.',
        bedrooms: 1,
        bathrooms: 1,
        instantBook: true,
        cancellationPolicy: 'flexible',
        featured: true
      },
      {
        id: 'TL-002',
        idUnique: 'TL-002',
        idPrestataire: 'PRO-002',
        title: 'Appartement Moderne Tour Eiffel',
        type: 'apartment',
        price: 85,
        city: 'Paris',
        lat: 48.8584,
        lng: 2.2945,
        rating: 4.8,
        reviewCount: 89,
        images: [
          'https://i.pinimg.com/736x/c1/df/24/c1df246f31ff14bb2be9528561ba722a.jpg',
          'https://i.pinimg.com/736x/ad/08/05/ad080556218bd17798f19005faeeae3a.jpg',
          'https://i.pinimg.com/736x/cd/94/ca/cd94cacef4e8f25f74a5b1883c1ea27f.jpg'
        ],
        amenities: ['wifi', 'kitchen', 'ac', 'tv'],
        maxGuests: 4,
        available: true,
        provider: 'airbnb',
        description: 'Appartement moderne avec vue partielle sur la Tour Eiffel. Idéal pour les familles et les séjours professionnels.',
        bedrooms: 2,
        bathrooms: 1,
        area: 65,
        instantBook: true,
        cancellationPolicy: 'moderate',
        featured: true
      },
      {
        id: 'TL-003',
        idUnique: 'TL-003',
        idPrestataire: 'PRO-003',
        title: 'Villa Luxueuse avec Piscine',
        type: 'villa',
        price: 250,
        city: 'Nice',
        lat: 43.7102,
        lng: 7.2620,
        rating: 4.9,
        reviewCount: 45,
        images: [
          'https://i.pinimg.com/736x/61/dd/43/61dd439fe0cc2c357b4d414ca9b97448.jpg',
          'https://i.pinimg.com/736x/df/b6/ff/dfb6ff103a06e478e1dc32941f86e45e.jpg',
          'https://i.pinimg.com/1200x/c4/b9/6b/c4b96b2fd74779249b9f66499ca9b21f.jpg'
        ],
        amenities: ['wifi', 'pool', 'parking', 'ac', 'tv', 'kitchen'],
        maxGuests: 6,
        available: true,
        provider: 'direct',
        description: 'Magnifique villa avec piscine privée et jardin, à quelques minutes des plages de la Côte d\'Azur.',
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        instantBook: false,
        cancellationPolicy: 'strict',
        featured: true
      },
      {
        id: 'TL-004',
        idUnique: 'TL-004',
        idPrestataire: 'PRO-004',
        title: 'Maison d\'Hôtes Provençale',
        type: 'guesthouse',
        price: 95,
        city: 'Avignon',
        lat: 43.9493,
        lng: 4.8059,
        rating: 4.6,
        reviewCount: 67,
        images: [
          'https://i.pinimg.com/1200x/ef/c0/70/efc070efd7bb3716bda3d990a1908c32.jpg',
          'https://i.pinimg.com/736x/54/cb/c3/54cbc3c145c748a9befe1382eea6b158.jpg',
          'https://i.pinimg.com/736x/e0/e8/2c/e0e82c8370634e3d4936e6eeac08d5ed.jpg'
        ],
        amenities: ['wifi', 'breakfast', 'parking'],
        maxGuests: 2,
        available: true,
        provider: 'booking',
        description: 'Authentique maison d\'hôtes au cœur de la Provence, avec petit-déjeuner maison inclus.',
        bedrooms: 1,
        bathrooms: 1,
        instantBook: true,
        cancellationPolicy: 'flexible',
        featured: false
      }
    ]

    for (const listing of tourismListings) {
      await prisma.tourisme.create({ data: listing })
      console.log(`✅ ${listing.title} créé`)
    }

    console.log(`🎉 ${tourismListings.length} hébergements touristiques créés avec succès!`)

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

// Export
module.exports = { seedTourisme }

// Exécution directe
if (require.main === module) {
  seedTourisme()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}