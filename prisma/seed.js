// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Nettoyer la base existante (optionnel)
  console.log('🧹 Nettoyage des données existantes...')
  await prisma.user.deleteMany()

  // Hasher les mots de passe
  const saltRounds = 12
  const hashedAdmin123 = await bcrypt.hash('admin123', saltRounds)
  const hashedMod123 = await bcrypt.hash('mod123', saltRounds)
  const hashedPro123 = await bcrypt.hash('pro123', saltRounds)
  const hashedArt123 = await bcrypt.hash('art123', saltRounds)
  const hashedUser123 = await bcrypt.hash('user123', saltRounds)

  // Créer les comptes administrateurs
  console.log('👑 Création des comptes administrateurs...')
  
  await prisma.user.create({
    data: {
      email: 'superadmin@servo.mg',
      passwordHash: hashedAdmin123,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+261 34 12 345 67',
      role: 'admin',
      status: 'active'
    }
  })

  await prisma.user.create({
    data: {
      email: 'moderateur@servo.mg',
      passwordHash: hashedMod123,
      firstName: 'Modérateur',
      lastName: 'SERVO',
      phone: '+261 34 12 345 68',
      role: 'admin',
      status: 'active'
    }
  })

  // Créer les comptes professionnels
  console.log('💼 Création des comptes professionnels...')
  
  await prisma.user.create({
    data: {
      email: 'pro@servo.mg',
      passwordHash: hashedPro123,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+261 34 12 345 69',
      role: 'professional',
      status: 'active'
    }
  })

  await prisma.user.create({
    data: {
      email: 'artisan@servo.mg',
      passwordHash: hashedArt123,
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+261 34 12 345 70',
      role: 'professional',
      status: 'active'
    }
  })

  // Créer le compte utilisateur standard
  console.log('👤 Création du compte utilisateur...')
  
  await prisma.user.create({
    data: {
      email: 'user@servo.mg',
      passwordHash: hashedUser123,
      firstName: 'Alice',
      lastName: 'Durand',
      phone: '+261 34 12 345 71',
      role: 'user',
      status: 'active'
    }
  })

  console.log('✅ Seeding terminé avec succès!')
  console.log('\n📋 Comptes créés:')
  console.log('===================')
  console.log('👑 Administrateurs:')
  console.log('   superadmin@servo.mg / admin123')
  console.log('   moderateur@servo.mg / mod123')
  console.log('\n💼 Professionnels:')
  console.log('   pro@servo.mg / pro123')
  console.log('   artisan@servo.mg / art123')
  console.log('\n👤 Utilisateur:')
  console.log('   user@servo.mg / user123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })