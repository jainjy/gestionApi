import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ownerId = '43227338-ee84-4210-b754-1887ee8ea754'

  // 🔹 Vérifie que le owner existe
  const owner = await prisma.user.findUnique({ where: { id: ownerId } })
  if (!owner) {
    throw new Error(`Aucun utilisateur trouvé avec l'ID ${ownerId}`)
  }

  console.log(`✅ Utilisateur propriétaire trouvé : ${owner.email || '(email inconnu)'}`)

  // 🔹 Création de quelques propriétés
  const properties = await prisma.property.createMany({
    data: [
      {
        title: 'Villa moderne avec piscine',
        description: 'Belle villa avec piscine privée, jardin et terrasse spacieuse.',
        type: 'villa',
        status: 'for_sale',
        price: 250000,
        surface: 240,
        rooms: 6,
        bedrooms: 4,
        bathrooms: 3,
        address: 'Route d’Ambatobe',
        city: 'Antananarivo',
        zipCode: '101',
        latitude: -18.8792,
        longitude: 47.5079,
        features: ['pool', 'garden', 'terrace'],
        images: [
          'https://picsum.photos/800/400?random=1',
          'https://picsum.photos/800/400?random=2'
        ],
        ownerId,
        isFeatured: true,
      },
      {
        title: 'Appartement en centre-ville',
        description: 'Appartement moderne au cœur du centre-ville, proche de toutes commodités.',
        type: 'apartment',
        status: 'for_rent',
        price: 800,
        surface: 85,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        address: 'Rue Ravelojaona',
        city: 'Antananarivo',
        zipCode: '101',
        latitude: -18.8792,
        longitude: 47.5079,
        features: ['balcony', 'parking'],
        images: [
          'https://picsum.photos/800/400?random=3',
          'https://picsum.photos/800/400?random=4'
        ],
        ownerId,
        isFeatured: false,
      },
      {
        title: 'Terrain à vendre à Ivato',
        description: 'Terrain plat de 1000m², idéal pour projet immobilier ou construction.',
        type: 'land',
        status: 'for_sale',
        price: 45000,
        surface: 1000,
        city: 'Ivato',
        zipCode: '105',
        latitude: -18.796,
        longitude: 47.478,
        features: [],
        images: [
          'https://picsum.photos/800/400?random=5'
        ],
        ownerId,
        isFeatured: false,
      },
    ]
  })

  console.log(`🏡 ${properties.count} propriétés ajoutées.`)

  // 🔹 Crée un utilisateur test pour les favoris (si pas déjà existant)
  let testUser = await prisma.user.findFirst({ where: { email: 'testuser@servo.mg' } })
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'testuser@servo.mg',
        passwordHash: 'hashedpassword', // temporaire
        firstName: 'Test',
        lastName: 'User',
        status: 'active',
      },
    })
    console.log(`👤 Utilisateur de test créé : ${testUser.email}`)
  }

  // 🔹 Récupère quelques propriétés existantes
  const allProps = await prisma.property.findMany({ take: 2 })

  // 🔹 Crée des favoris pour l’utilisateur test
  for (const prop of allProps) {
    await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: testUser.id,
          propertyId: prop.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        propertyId: prop.id,
      },
    })
  }

  console.log(`⭐ ${allProps.length} favoris ajoutés pour ${testUser.email}`)
}

main()
  .then(() => {
    console.log('✅ Données insérées avec succès.')
  })
  .catch((err) => {
    console.error('❌ Erreur lors du seed:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
