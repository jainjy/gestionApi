// clear-demandes.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Suppression des demandes...')

  try {
    // Supprimer les relations DemandeArtisan d'abord
    await prisma.demandeArtisan.deleteMany()
    console.log('✓ Relations DemandeArtisan supprimées')

    // Supprimer les demandes
    await prisma.demande.deleteMany()
    console.log('✓ Demandes supprimées')

    console.log('✅ Toutes les demandes ont été supprimées!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()