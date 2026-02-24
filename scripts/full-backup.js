// full-backup.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function backup() {
  console.log('Starting complete database backup...\n')
  
  const backups = {}
  const errors = []
  
  // Define backup methods for problematic tables
  const backupMethods = {
    metierService: async () => {
      return await prisma.metierService.findMany({
        orderBy: { metierId: 'asc' }
      })
    },
    utilisateurMetier: async () => {
      return await prisma.utilisateurMetier.findMany({
        orderBy: { userId: 'asc' }
      })
    },
    utilisateurService: async () => {
      return await prisma.utilisateurService.findMany({
        orderBy: { userId: 'asc' }
      })
    },
    demandeArtisan: async () => {
      return await prisma.demandeArtisan.findMany({
        orderBy: { userId: 'asc' }
      })
    },
    demande: async () => {
      try {
        // Try minimal selection first
        return await prisma.demande.findMany({
          select: {
            id: true,
            description: true,
            contactNom: true,
            contactPrenom: true,
            contactEmail: true,
            contactTel: true,
            disponibiliteBien: true,
            contactAdresse: true,
            contactAdresseCp: true,
            contactAdresseVille: true,
            lieuAdresse: true,
            lieuAdresseCp: true,
            lieuAdresseVille: true,
            optionAssurance: true,
            demandeAcceptee: true,
            nombreArtisans: true,
            createdById: true,
            serviceId: true,
            createdAt: true,
            dateSouhaitee: true,
            heureSouhaitee: true,
            metierId: true,
            propertyId: true,
            statut: true,
            isRead: true,
            artisanId: true,
            devis: true,
          },
          orderBy: { id: 'asc' }
        })
      } catch (error) {
        console.log(`  ⚠️  demande: Using raw SQL due to schema drift`)
        
        // Fallback to raw SQL - exclude ai fields
        return await prisma.$queryRaw`
          SELECT 
            id, description, "contactNom", "contactPrenom", "contactEmail", 
            "contactTel", "disponibiliteBien", "contactAdresse", "contactAdresseCp", 
            "contactAdresseVille", "lieuAdresse", "lieuAdresseCp", "lieuAdresseVille", 
            "optionAssurance", "demandeAcceptee", "nombreArtisans", "createdById", 
            "serviceId", "createdAt", "dateSouhaitee", "heureSouhaitee", "metierId", 
            "propertyId", statut, "isRead", "artisanId", devis
          FROM "Demande"
          ORDER BY id ASC
          LIMIT 50000
        `
      }
    }
  }
  
  const modelNames = [
    // Blog
    'blogArticle', 'blogArticleLike', 'blogComment', 'blogCommentLike',
    
    // User and auth
    'user', 'passwordResetRequest', 'refreshToken', 'professionalSettings',
    'userActivity', 'userPreference', 'userEvent',
    
    // Conversations
    'conversation', 'conversationParticipant', 'message', 'contactMessage',
    
    // Properties
    'property', 'favorite', 'locationSaisonniere', 'paiementLocation',
    
    // Services
    'product', 'metier', 'category', 'service',
    
    // Other tables
    'demandeHistory', 'devis', 'financementDemande', 'financementPartenaire',
    'serviceFinancier', 'assuranceService', 'transaction', 'review', 'appointment',
    'order', 'tourisme', 'tourismeBooking', 'touristicPlaceBooking', 'flight',
    'reservationFlight', 'advertisement', 'subscriptionPlan', 'subscription',
    'podcast', 'video', 'userMediaFavorite', 'wellBeingStats', 'document',
    'contratType', 'documentArchive', 'notification', 'audit', 'course',
    'courseAvailability', 'reservationCours', 'investmentRequest', 'reportDestination',
    'activityCategory', 'activity', 'activityBooking', 'activityReview', 'activityFavorite',
    'event', 'discovery', 'experience', 'experienceBooking', 'experienceReview',
    'experienceFAQ', 'experienceMedia', 'experienceFavorite', 'patrimoine',
    'droitFamille', 'conseilType', 'demandeConseil', 'suiviConseil',
    'rendezvousEntreprise', 'conseil', 'conseilSave', 'conseilView',
    'conseilCategory', 'conseilBookmark', 'vehicule', 'disponibiliteVehicule',
    'reservationVehicule', 'avisVehicule', 'formation', 'emploi', 'alternanceStage',
    'candidature', 'projet', 'portraitLocal', 'portraitShare', 'portraitListen',
    'portraitComment', 'entrepreneurInterview', 'entrepreneurResource',
    'entrepreneurEvent', 'interviewInteraction', 'deliveryPrice', 'parapente'
  ]
  
  console.log(`Total models to backup: ${modelNames.length + Object.keys(backupMethods).length}\n`)
  
  // Backup tables with custom methods first
  console.log('=== Custom Method Tables ===')
  for (const [modelName, backupMethod] of Object.entries(backupMethods)) {
    try {
      console.log(`Backing up ${modelName}...`)
      const records = await backupMethod()
      backups[modelName] = records
      console.log(`  ✅ ${records.length} records`)
    } catch (error) {
      errors.push(`${modelName}: ${error.message}`)
      console.log(`  ❌ ${modelName}: ${error.message}`)
      backups[modelName] = []
    }
  }
  
  // Backup standard tables
  console.log('\n=== Standard Tables ===')
  for (const modelName of modelNames) {
    try {
      console.log(`Backing up ${modelName}...`)
      
      // Try different orderBy options
      let queryOptions = { take: 50000 }
      
      // Try to add orderBy if the model has id or createdAt
      try {
        const firstRecord = await prisma[modelName].findFirst()
        if (firstRecord) {
          if (firstRecord.id !== undefined) {
            queryOptions.orderBy = { id: 'asc' }
          } else if (firstRecord.createdAt !== undefined) {
            queryOptions.orderBy = { createdAt: 'asc' }
          }
        }
      } catch (e) {
        // If we can't determine, just use findMany without orderBy
      }
      
      const records = await prisma[modelName].findMany(queryOptions)
      backups[modelName] = records
      console.log(`  ✅ ${records.length} records`)
    } catch (error) {
      errors.push(`${modelName}: ${error.message}`)
      console.log(`  ❌ Failed: ${error.message}`)
      backups[modelName] = []
    }
  }
  
  // Save backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup-${timestamp}.json`
  
  fs.writeFileSync(filename, JSON.stringify(backups, null, 2))
  
  // Summary
  let totalRecords = 0
  const summary = {}
  
  Object.entries(backups).forEach(([table, data]) => {
    if (Array.isArray(data)) {
      summary[table] = data.length
      totalRecords += data.length
    }
  })
  
  console.log('\n📊 BACKUP COMPLETE')
  console.log('=================')
  console.log(`Total tables: ${Object.keys(backups).length}`)
  console.log(`Total records: ${totalRecords}`)
  console.log(`Backup file: ${filename}`)
  console.log(`File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`)
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length} tables):`)
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`))
    if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`)
  }
  
  // Show largest tables
  console.log('\n📈 Largest tables:')
  const topTables = Object.entries(summary)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  topTables.forEach(([table, count], index) => {
    console.log(`  ${index + 1}. ${table}: ${count} records`)
  })
  
  await prisma.$disconnect()
  console.log('\n✅ Backup finished!')
}

// Run backup
backup().catch(error => {
  console.error('Fatal error during backup:', error)
  process.exit(1)
})