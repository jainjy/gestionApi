// scripts/cleanAllOrphanedDataEnhanced.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanAllOrphanedDataEnhanced() {
  try {
    console.log("🔍 Début du nettoyage COMPLET des données orphelines...");

    // 1. TABLES AVEC userId DIRECT
    console.log("🧹 Nettoyage des tables avec userId...");
    const userTables = [
      "ContratType",
      "UtilisateurMetier",
      "UtilisateurService",
      "Favorite",
      "Property",
      "BlogArticle",
      "Product",
      "Demande",
      "Message",
      "Conversation",
      "Devis",
      "Review",
      "Appointment",
      "Order",
      "Subscription",
      "Advertisement",
      "Document",
      "DocumentArchive",
      "UserMediaFavorite",
      "ProfessionalSettings",
      "UserActivity",
      "UserPreference",
      "UserEvent",
      "Audit",
      "Notification",
      "FinancementDemande",
      "TourismeBooking",
      "Podcast",
      "Video",
      "WellBeingStats",
    ];

    for (const tableName of userTables) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          DELETE FROM "${tableName}" 
          WHERE "userId" IS NOT NULL 
          AND "userId" NOT IN (SELECT id FROM "User")
        `);
        if (result > 0) {
          console.log(`✅ ${result} ${tableName} orphelins supprimés`);
        }
      } catch (error) {
        // Ignorer les tables qui n'existent pas ou ont des noms de colonnes différents
      }
    }

    // 2. RELATIONS SPÉCIFIQUES (champs personnalisés)
    console.log("🧹 Nettoyage des relations spécifiques...");

    const specificRelations = [
      { table: "Conversation", field: "createurId" },
      { table: "Message", field: "expediteurId" },
      { table: "ConversationParticipant", field: "userId" },
      { table: "Demande", field: "artisanId" },
      { table: "Demande", field: "createdById" },
      { table: "Property", field: "ownerId" },
      { table: "Advertisement", field: "createdById" },
      { table: "BlogArticle", field: "authorId" },
      { table: "Product", field: "userId" },
      { table: "Podcast", field: "authorId" },
      { table: "Video", field: "authorId" },
      { table: "Notification", field: "userProprietaireId" },
    ];

    for (const { table, field } of specificRelations) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          DELETE FROM "${table}" 
          WHERE "${field}" IS NOT NULL 
          AND "${field}" NOT IN (SELECT id FROM "User")
        `);
        if (result > 0) {
          console.log(`✅ ${result} ${table}.${field} orphelins supprimés`);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    // 3. RELATIONS VERS D'AUTRES TABLES (pas seulement User)
    console.log("🧹 Nettoyage des relations vers d'autres tables...");

    const otherRelations = [
      // Relations vers Service
      { table: "UtilisateurService", field: "serviceId", refTable: "Service" },
      { table: "Demande", field: "serviceId", refTable: "Service" },
      { table: "Review", field: "serviceId", refTable: "Service" },
      { table: "Appointment", field: "serviceId", refTable: "Service" },

      // Relations vers Metier
      { table: "UtilisateurMetier", field: "metierId", refTable: "Metier" },
      { table: "Demande", field: "metierId", refTable: "Metier" },

      // Relations vers Property
      { table: "Favorite", field: "propertyId", refTable: "Property" },
      { table: "Demande", field: "propertyId", refTable: "Property" },

      // Relations vers Demande
      { table: "DemandeArtisan", field: "demandeId", refTable: "Demande" },
      { table: "DemandeHistory", field: "demandeId", refTable: "Demande" },
      { table: "Conversation", field: "demandeId", refTable: "Demande" },
      { table: "Devis", field: "demandeId", refTable: "Demande" },

      // Relations vers Conversation
      { table: "Message", field: "conversationId", refTable: "Conversation" },
      {
        table: "ConversationParticipant",
        field: "conversationId",
        refTable: "Conversation",
      },

      // Relations vers Tourisme
      { table: "TourismeBooking", field: "listingId", refTable: "Tourisme" },

      // Relations vers SubscriptionPlan
      { table: "Subscription", field: "planId", refTable: "SubscriptionPlan" },

      // Relations vers FinancementPartenaire
      {
        table: "FinancementDemande",
        field: "partenaireId",
        refTable: "FinancementPartenaire",
      },

      // Relations vers AssuranceService
      {
        table: "FinancementDemande",
        field: "assuranceId",
        refTable: "AssuranceService",
      },

      // Relations vers Podcast/Video
      { table: "UserMediaFavorite", field: "podcastId", refTable: "Podcast" },
      { table: "UserMediaFavorite", field: "videoId", refTable: "Video" },
    ];

    for (const { table, field, refTable } of otherRelations) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          DELETE FROM "${table}" 
          WHERE "${field}" IS NOT NULL 
          AND "${field}" NOT IN (SELECT id FROM "${refTable}")
        `);
        if (result > 0) {
          console.log(
            `✅ ${result} ${table}.${field} orphelins (vs ${refTable}) supprimés`
          );
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    // 4. TABLES DE LIAISON (many-to-many)
    console.log("🧹 Nettoyage des tables de liaison...");

    const junctionTables = [
      {
        table: "MetierService",
        fields: ["metierId", "serviceId"],
        refTables: ["Metier", "Service"],
      },
      {
        table: "UtilisateurMetier",
        fields: ["userId", "metierId"],
        refTables: ["User", "Metier"],
      },
      {
        table: "UtilisateurService",
        fields: ["userId", "serviceId"],
        refTables: ["User", "Service"],
      },
      {
        table: "DemandeArtisan",
        fields: ["userId", "demandeId"],
        refTables: ["User", "Demande"],
      },
    ];

    for (const { table, fields, refTables } of junctionTables) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          DELETE FROM "${table}" 
          WHERE 
            ("${fields[0]}" NOT IN (SELECT id FROM "${refTables[0]}") OR
             "${fields[1]}" NOT IN (SELECT id FROM "${refTables[1]}"))
        `);
        if (result > 0) {
          console.log(`✅ ${result} ${table} orphelins supprimés`);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    console.log("🎉 Nettoyage COMPLET terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// FONCTION DE VÉRIFICATION AVANT/APRÈS
async function verifyCleanup() {
  try {
    console.log("🔍 Vérification des données orphelines restantes...");

    const checks = [
      {
        name: "ContratType",
        query: `SELECT COUNT(*) as count FROM "ContratType" WHERE "userId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "UtilisateurMetier",
        query: `SELECT COUNT(*) as count FROM "UtilisateurMetier" WHERE "userId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Message sans expediteur",
        query: `SELECT COUNT(*) as count FROM "Message" WHERE "expediteurId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Conversation sans createur",
        query: `SELECT COUNT(*) as count FROM "Conversation" WHERE "createurId" NOT IN (SELECT id FROM "User")`,
      },
    ];

    for (const check of checks) {
      try {
        const result = await prisma.$queryRawUnsafe(check.query);
        const count = result[0]?.count || 0;
        if (count > 0) {
          console.log(
            `⚠️  ${check.name}: ${count} données orphelines restantes`
          );
        } else {
          console.log(`✅ ${check.name}: Aucune donnée orpheline`);
        }
      } catch (error) {
        console.log(`❌ Erreur vérification ${check.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  }
}

// EXÉCUTION PRINCIPALE
async function main() {
  console.log("🚀 Démarrage du nettoyage complet...");

  // Vérification avant
  await verifyCleanup();

  // Nettoyage
  await cleanAllOrphanedDataEnhanced();

  // Vérification après
  await verifyCleanup();

  console.log("🎉 Processus terminé!");
}

// Exécuter le script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Erreur critique:", error);
    process.exit(1);
  });
