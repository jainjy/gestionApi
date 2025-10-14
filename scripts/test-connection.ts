import  {prisma}  from '@/lib/db'

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Connexion à la base de données réussie')
    
    // Test d'une requête simple
    const users = await prisma.user.findMany()
    console.log(`✅ ${users.length} utilisateurs trouvés`)
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()