// restore.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function restore() {
  console.log('Starting database restoration...\n')
  
  // Read backup file (change the filename to your backup)
  const backupFile = 'backup-2026-02-10T11-52-18-816Z.json' // Your backup filename
  const backups = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
  
  console.log(`Found ${Object.keys(backups).length} tables in backup\n`)
  
  // Define insertion order to respect foreign key constraints
  const insertionOrder = [
    // 1. Users and auth first (foreign keys reference these)
    'user',
    'passwordResetRequest',
    'refreshToken',
    'professionalSettings',
    
    // 2. Core categories and metadata
    'metier',
    'category',
    'service',
    'conseilType',
    'activityCategory',
    'financementPartenaire',
    'serviceFinancier',
    'assuranceService',
    'subscriptionPlan',
    'deliveryPrice',
    'conseilCategory',
    
    // 3. Junction tables (many-to-many)
    'metierService',
    'utilisateurMetier',
    'utilisateurService',
    
    // 4. Content tables
    'blogArticle',
    'blogArticleLike',
    'blogComment',
    'blogCommentLike',
    'podcast',
    'video',
    'conseil',
    'portraitLocal',
    'entrepreneurInterview',
    'entrepreneurResource',
    'entrepreneurEvent',
    
    // 5. Properties and real estate
    'property',
    'favorite',
    'patrimoine',
    
    // 6. Products and commerce
    'product',
    
    // 7. Demands and services
    'demande',
    'demandeArtisan',
    'demandeHistory',
    'devis',
    
    // 8. Finance
    'financementDemande',
    'transaction',
    'review',
    'appointment',
    'order',
    
    // 9. Tourism and travel
    'tourisme',
    'flight',
    
    // 10. Subscriptions and ads
    'subscription',
    'advertisement',
    
    // 11. Media and preferences
    'userMediaFavorite',
    'wellBeingStats',
    
    // 12. Documents
    'document',
    'contratType',
    'documentArchive',
    
    // 13. Notifications and activity
    'notification',
    'audit',
    'userActivity',
    'userPreference',
    'userEvent',
    
    // 14. Courses
    'course',
    'courseAvailability',
    'reservationCours',
    
    // 15. Investments
    'investmentRequest',
    'reportDestination',
    
    // 16. Activities and events
    'activity',
    'activityBooking',
    'activityReview',
    'activityFavorite',
    'event',
    'discovery',
    
    // 17. Experiences
    'experience',
    'experienceBooking',
    'experienceReview',
    'experienceFAQ',
    'experienceMedia',
    'experienceFavorite',
    
    // 18. Legal and consulting
    'droitFamille',
    'demandeConseil',
    'suiviConseil',
    'rendezvousEntreprise',
    
    // 19. Vehicles
    'vehicule',
    'disponibiliteVehicule',
    'reservationVehicule',
    'avisVehicule',
    
    // 20. Employment
    'formation',
    'emploi',
    'alternanceStage',
    'candidature',
    'projet',
    
    // 21. Portraits
    'portraitShare',
    'portraitListen',
    'portraitComment',
    
    // 22. Interviews and interactions
    'interviewInteraction',
    
    // 23. Other
    'conseilSave',
    'conseilView',
    'conseilBookmark',
    'parapente',
    
    // 24. Conversations (needs users to exist)
    'conversation',
    'conversationParticipant',
    'message',
    'contactMessage',
    
    // 25. Bookings and reservations (needs users and parent records)
    'locationSaisonniere',
    'paiementLocation',
    'tourismeBooking',
    'touristicPlaceBooking',
    'reservationFlight'
  ]
  
  // Filter to only tables that exist in backup
  const tablesToRestore = insertionOrder.filter(table => 
    backups[table] && Array.isArray(backups[table]) && backups[table].length > 0
  )
  
  console.log(`Will restore ${tablesToRestore.length} tables in order\n`)
  
  let totalRestored = 0
  const failedTables = []
  
  for (const tableName of tablesToRestore) {
    const records = backups[tableName]
    
    if (!records || records.length === 0) {
      console.log(`⚠️  ${tableName}: No records to restore`)
      continue
    }
    
    console.log(`Restoring ${tableName} (${records.length} records)...`)
    
    try {
      // Handle tables with composite keys differently
      if (['metierService', 'utilisateurMetier', 'utilisateurService', 'demandeArtisan'].includes(tableName)) {
        await restoreCompositeTable(tableName, records)
      } else {
        await restoreStandardTable(tableName, records)
      }
      
      console.log(`  ✅ Restored ${records.length} records`)
      totalRestored += records.length
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`)
      failedTables.push({ table: tableName, error: error.message })
      
      // Log first error details for debugging
      if (records[0]) {
        console.log(`  Sample record: ${JSON.stringify(records[0])}`)
      }
    }
  }
  
  // Summary
  console.log(`\n📊 RESTORATION SUMMARY:`)
  console.log(`======================`)
  console.log(`Total records restored: ${totalRestored}`)
  console.log(`Tables restored: ${tablesToRestore.length - failedTables.length}/${tablesToRestore.length}`)
  
  if (failedTables.length > 0) {
    console.log(`\n⚠️  Failed tables:`)
    failedTables.forEach(({ table, error }) => {
      console.log(`  - ${table}: ${error}`)
    })
  }
  
  await prisma.$disconnect()
  console.log(`\n✅ Restoration complete!`)
}

async function restoreStandardTable(tableName, records) {
  // Batch insert to avoid memory issues
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    // Use createMany if available, otherwise create individually
    try {
      await prisma[tableName].createMany({
        data: batch,
        skipDuplicates: true
      })
    } catch (error) {
      // Fallback to individual inserts
      for (const record of batch) {
        try {
          await prisma[tableName].create({
            data: record
          })
        } catch (individualError) {
          console.log(`    Skipping duplicate/error in ${tableName}: ${individualError.message}`)
        }
      }
    }
  }
}

async function restoreCompositeTable(tableName, records) {
  // For composite key tables, we need to use upsert or create individually
  for (const record of records) {
    try {
      // Try to create, if duplicate skip
      await prisma[tableName].create({
        data: record
      })
    } catch (error) {
      if (error.code === 'P2002') {
        // Duplicate entry, skip
        continue
      }
      throw error
    }
  }
}

// Run restoration
restore().catch(error => {
  console.error('Fatal error during restoration:', error)
  process.exit(1)
})