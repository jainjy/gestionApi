// scripts/cleanAllOrphanedDataEnhancedProduction.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Configuration de sécurité
const SAFE_MODE = process.env.SAFE_MODE === "true"; // Activer le mode "dry-run"
const BATCH_SIZE = 1000; // Traitement par lots pour éviter les locks
const DELAY_BETWEEN_BATCHES = 100; // Délai en ms entre les lots

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logToAudit(action, table, count, details = "") {
  try {
    await prisma.audit.create({
      data: {
        titre: `Nettoyage données orphelines - ${action}`,
        description: `Table: ${table}, Nombre: ${count}${details ? `, Détails: ${details}` : ""}`,
        type: "MAINTENANCE",
        responsable: "SYSTEM",
        statut: "TERMINE",
        userId: "00000000-0000-0000-0000-000000000000", // ID système
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'audit:", error.message);
  }
}

async function cleanAllOrphanedDataEnhanced() {
  const deletedCounts = {};
  let totalDeleted = 0;

  try {
    console.log("🔍 Début du nettoyage COMPLET des données orphelines...");
    console.log(
      `📊 Mode: ${SAFE_MODE ? "DRY-RUN (pas de suppression)" : "PRODUCTION"}`
    );

    // 1. TABLES AVEC userId DIRECT - NOUVELLES TABLES AJOUTÉES
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
      "Course",
      "ReservationCours",
      "InvestmentRequest",
      "Flight",
      "ReservationFlight",
      "TouristicPlaceBooking",
      "ActivityGuide",
      "Activity",
      "ActivityBooking",
      "ActivityReview",
      "ActivityFavorite",
      "ActivityShare",
      "GuideContact",
      "ContactMessage",
      "DroitFamille",
      "DemandeConseil",
      "SuiviConseil",
      "RendezvousEntreprise",
      "Vehicule",
      "ReservationVehicule",
      "AvisVehicule",
      "Formation",
      "Emploi",
      "AlternanceStage",
      "Candidature",
      "Projet",
      "PortraitLocal",
      "PortraitShare",
      "PortraitListen",
      "PortraitComment",
      "Event",
      "Discovery",
      "Experience",
      "ExperienceBooking",
      "ExperienceReview",
      "ExperienceFavorite",
      "Patrimoine",
      "Conseil",
      "ConseilSave",
      "ConseilView",
      "ConseilBookmark",
      "EntrepreneurInterview",
      "EntrepreneurResource",
      "EntrepreneurEvent",
      "InterviewInteraction",
    ];

    for (const tableName of userTables) {
      try {
        // Vérifier d'abord si la table existe et a le champ userId
        const checkResult = await prisma.$queryRawUnsafe(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND column_name = 'userId'
        `);

        let fieldFound = "userId";
        if (checkResult.length === 0) {
          // Essayer d'autres noms de champ courants
          const altFields = [
            "authorId",
            "clientId",
            "prestataireId",
            "guideId",
            "proId",
            "createdById",
            "expediteurId",
            "recipientId",
            "organizerId",
          ];

          for (const field of altFields) {
            const altCheck = await prisma.$queryRawUnsafe(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = '${tableName}' 
              AND column_name = '${field}'
            `);
            if (altCheck.length > 0) {
              fieldFound = field;
              break;
            }
          }

          if (fieldFound === "userId") continue;
        }

        const query = SAFE_MODE
          ? `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${fieldFound}" IS NOT NULL AND "${fieldFound}" NOT IN (SELECT id FROM "User")`
          : `DELETE FROM "${tableName}" WHERE "${fieldFound}" IS NOT NULL AND "${fieldFound}" NOT IN (SELECT id FROM "User")`;

        const result = await prisma.$executeRawUnsafe(query);

        if (SAFE_MODE) {
          const count = result[0]?.count || 0;
          if (count > 0) {
            console.log(
              `🔍 DRY-RUN: ${count} ${tableName}.${fieldFound} orphelins seraient supprimés`
            );
            deletedCounts[`${tableName}.${fieldFound}`] = count;
            totalDeleted += count;
          }
        } else {
          if (result > 0) {
            console.log(
              `✅ ${result} ${tableName}.${fieldFound} orphelins supprimés`
            );
            deletedCounts[`${tableName}.${fieldFound}`] = result;
            totalDeleted += result;
            await logToAudit(
              "DELETE",
              tableName,
              result,
              `Champ: ${fieldFound}`
            );
          }
        }

        await delay(DELAY_BETWEEN_BATCHES);
      } catch (error) {
        if (error.message && error.message.includes("does not exist")) {
          // Table n'existe pas, on continue
        } else {
          console.error(`⚠️  Erreur sur ${tableName}:`, error.message);
        }
      }
    }

    // 2. RELATIONS SPÉCIFIQUES (champs personnalisés)
    console.log("🧹 Nettoyage des relations spécifiques...");

    const specificRelations = [
      { table: "Conversation", field: "createurId" },
      { table: "Message", field: "expediteurId" },
      { table: "Message", field: "receiverId" },
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
      { table: "Flight", field: "idPrestataire" },
      { table: "ReservationFlight", field: "idPrestataire" },
      { table: "ReservationFlight", field: "idUser" },
      { table: "Vehicule", field: "prestataireId" },
      { table: "ReservationVehicule", field: "clientId" },
      { table: "ReservationVehicule", field: "prestataireId" },
      { table: "AvisVehicule", field: "clientId" },
    ];

    for (const relation of specificRelations) {
      try {
        const query = SAFE_MODE
          ? `SELECT COUNT(*) as count FROM "${relation.table}" WHERE "${relation.field}" IS NOT NULL AND "${relation.field}" NOT IN (SELECT id FROM "User")`
          : `DELETE FROM "${relation.table}" WHERE "${relation.field}" IS NOT NULL AND "${relation.field}" NOT IN (SELECT id FROM "User")`;

        const result = await prisma.$executeRawUnsafe(query);

        if (SAFE_MODE) {
          const count = result[0]?.count || 0;
          if (count > 0) {
            console.log(
              `🔍 DRY-RUN: ${count} ${relation.table}.${relation.field} orphelins seraient supprimés`
            );
            deletedCounts[`${relation.table}.${relation.field}`] = count;
            totalDeleted += count;
          }
        } else {
          if (result > 0) {
            console.log(
              `✅ ${result} ${relation.table}.${relation.field} orphelins supprimés`
            );
            deletedCounts[`${relation.table}.${relation.field}`] = result;
            totalDeleted += result;
            await logToAudit(
              "DELETE",
              relation.table,
              result,
              `Champ: ${relation.field}`
            );
          }
        }

        await delay(DELAY_BETWEEN_BATCHES);
      } catch (error) {
        if (error.message && !error.message.includes("does not exist")) {
          console.error(
            `⚠️  Erreur sur ${relation.table}.${relation.field}:`,
            error.message
          );
        }
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
      { table: "DroitFamille", field: "serviceId", refTable: "Service" },
      { table: "ContactMessage", field: "serviceId", refTable: "Service" },

      // Relations vers Metier
      { table: "UtilisateurMetier", field: "metierId", refTable: "Metier" },
      { table: "Demande", field: "metierId", refTable: "Metier" },
      { table: "ContactMessage", field: "metierId", refTable: "Metier" },

      // Relations vers Property
      { table: "Favorite", field: "propertyId", refTable: "Property" },
      { table: "Demande", field: "propertyId", refTable: "Property" },
      {
        table: "LocationSaisonniere",
        field: "propertyId",
        refTable: "Property",
      },

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
      {
        table: "TouristicPlaceBooking",
        field: "placeId",
        refTable: "Tourisme",
      },

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

      // Relations vers Course
      { table: "ReservationCours", field: "courseId", refTable: "Course" },
      { table: "CourseAvailability", field: "courseId", refTable: "Course" },

      // Relations vers Flight
      { table: "ReservationFlight", field: "flightId", refTable: "Flight" },

      // Relations vers Activity
      { table: "ActivityBooking", field: "activityId", refTable: "Activity" },
      { table: "ActivityReview", field: "activityId", refTable: "Activity" },
      { table: "ActivityFavorite", field: "activityId", refTable: "Activity" },
      { table: "ActivityShare", field: "activityId", refTable: "Activity" },
      { table: "ActivityMedia", field: "activityId", refTable: "Activity" },
      { table: "ActivityFAQ", field: "activityId", refTable: "Activity" },
      { table: "ActivityPromotion", field: "activityId", refTable: "Activity" },
      { table: "GuideContact", field: "activityId", refTable: "Activity" },

      // Relations vers ActivityGuide
      { table: "GuideContact", field: "guideId", refTable: "ActivityGuide" },

      // Relations vers ActivityAvailability
      {
        table: "ActivityBooking",
        field: "availabilityId",
        refTable: "ActivityAvailability",
      },

      // Relations vers Vehicule
      {
        table: "ReservationVehicule",
        field: "vehiculeId",
        refTable: "Vehicule",
      },
      { table: "AvisVehicule", field: "vehiculeId", refTable: "Vehicule" },
      {
        table: "DisponibiliteVehicule",
        field: "vehiculeId",
        refTable: "Vehicule",
      },

      // Relations vers Formation/Emploi/AlternanceStage
      { table: "Candidature", field: "formationId", refTable: "Formation" },
      { table: "Candidature", field: "emploiId", refTable: "Emploi" },
      {
        table: "Candidature",
        field: "alternanceStageId",
        refTable: "AlternanceStage",
      },

      // Relations vers PortraitLocal
      {
        table: "PortraitShare",
        field: "portraitId",
        refTable: "PortraitLocal",
      },
      {
        table: "PortraitListen",
        field: "portraitId",
        refTable: "PortraitLocal",
      },
      {
        table: "PortraitComment",
        field: "portraitId",
        refTable: "PortraitLocal",
      },

      // Relations vers Experience
      {
        table: "ExperienceBooking",
        field: "experienceId",
        refTable: "Experience",
      },
      {
        table: "ExperienceReview",
        field: "experienceId",
        refTable: "Experience",
      },
      {
        table: "ExperienceFavorite",
        field: "experienceId",
        refTable: "Experience",
      },
      { table: "ExperienceFAQ", field: "experienceId", refTable: "Experience" },
      {
        table: "ExperienceMedia",
        field: "experienceId",
        refTable: "Experience",
      },

      // Relations vers Conseil
      { table: "ConseilSave", field: "conseilId", refTable: "Conseil" },
      { table: "ConseilView", field: "conseilId", refTable: "Conseil" },
      { table: "ConseilBookmark", field: "conseilId", refTable: "Conseil" },

      // Relations vers EntrepreneurInterview
      {
        table: "InterviewInteraction",
        field: "interviewId",
        refTable: "EntrepreneurInterview",
      },

      // Relations vers Category (ActivityCategory)
      { table: "Activity", field: "categoryId", refTable: "ActivityCategory" },
    ];

    for (const relation of otherRelations) {
      try {
        const query = SAFE_MODE
          ? `SELECT COUNT(*) as count FROM "${relation.table}" WHERE "${relation.field}" IS NOT NULL AND "${relation.field}" NOT IN (SELECT id FROM "${relation.refTable}")`
          : `DELETE FROM "${relation.table}" WHERE "${relation.field}" IS NOT NULL AND "${relation.field}" NOT IN (SELECT id FROM "${relation.refTable}")`;

        const result = await prisma.$executeRawUnsafe(query);

        if (SAFE_MODE) {
          const count = result[0]?.count || 0;
          if (count > 0) {
            console.log(
              `🔍 DRY-RUN: ${count} ${relation.table}.${relation.field} orphelins (vs ${relation.refTable}) seraient supprimés`
            );
            deletedCounts[
              `${relation.table}.${relation.field}_${relation.refTable}`
            ] = count;
            totalDeleted += count;
          }
        } else {
          if (result > 0) {
            console.log(
              `✅ ${result} ${relation.table}.${relation.field} orphelins (vs ${relation.refTable}) supprimés`
            );
            deletedCounts[
              `${relation.table}.${relation.field}_${relation.refTable}`
            ] = result;
            totalDeleted += result;
            await logToAudit(
              "DELETE",
              relation.table,
              result,
              `Champ: ${relation.field}, Référence: ${relation.refTable}`
            );
          }
        }

        await delay(DELAY_BETWEEN_BATCHES);
      } catch (error) {
        if (error.message && !error.message.includes("does not exist")) {
          console.error(
            `⚠️  Erreur sur ${relation.table}.${relation.field}:`,
            error.message
          );
        }
      }
    }

    // 4. TABLES DE LIAISON (many-to-many) - NOUVELLES TABLES
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
      {
        table: "BlogArticleLike",
        fields: ["articleId", "userId"],
        refTables: ["BlogArticle", "User"],
      },
      {
        table: "BlogCommentLike",
        fields: ["commentId", "userId"],
        refTables: ["BlogComment", "User"],
      },
      {
        table: "PaiementLocation",
        fields: ["locationId"],
        refTables: ["LocationSaisonniere"],
      },
    ];

    for (const junction of junctionTables) {
      try {
        const query = SAFE_MODE
          ? `SELECT COUNT(*) as count FROM "${junction.table}" WHERE ("${junction.fields[0]}" NOT IN (SELECT id FROM "${junction.refTables[0]}") OR "${junction.fields[1]}" NOT IN (SELECT id FROM "${junction.refTables[1]}"))`
          : `DELETE FROM "${junction.table}" WHERE ("${junction.fields[0]}" NOT IN (SELECT id FROM "${junction.refTables[0]}") OR "${junction.fields[1]}" NOT IN (SELECT id FROM "${junction.refTables[1]}"))`;

        const result = await prisma.$executeRawUnsafe(query);

        if (SAFE_MODE) {
          const count = result[0]?.count || 0;
          if (count > 0) {
            console.log(
              `🔍 DRY-RUN: ${count} ${junction.table} orphelins seraient supprimés`
            );
            deletedCounts[junction.table] = count;
            totalDeleted += count;
          }
        } else {
          if (result > 0) {
            console.log(`✅ ${result} ${junction.table} orphelins supprimés`);
            deletedCounts[junction.table] = result;
            totalDeleted += result;
            await logToAudit(
              "DELETE",
              junction.table,
              result,
              `Champs: ${junction.fields.join(", ")}, Références: ${junction.refTables.join(", ")}`
            );
          }
        }

        await delay(DELAY_BETWEEN_BATCHES);
      } catch (error) {
        if (error.message && !error.message.includes("does not exist")) {
          console.error(`⚠️  Erreur sur ${junction.table}:`, error.message);
        }
      }
    }

    // 5. NETTOYAGE DES DONNÉES CIRCULAIRES (parentId qui pointe vers des IDs inexistants)
    console.log("🧹 Nettoyage des références circulaires...");

    const circularReferences = [
      { table: "BlogComment", field: "parentId", refTable: "BlogComment" },
      {
        table: "PortraitComment",
        field: "parentId",
        refTable: "PortraitComment",
      },
    ];

    for (const circular of circularReferences) {
      try {
        const query = SAFE_MODE
          ? `SELECT COUNT(*) as count FROM "${circular.table}" WHERE "${circular.field}" IS NOT NULL AND "${circular.field}" NOT IN (SELECT id FROM "${circular.refTable}")`
          : `UPDATE "${circular.table}" SET "${circular.field}" = NULL WHERE "${circular.field}" IS NOT NULL AND "${circular.field}" NOT IN (SELECT id FROM "${circular.refTable}")`;

        const result = await prisma.$executeRawUnsafe(query);

        if (SAFE_MODE) {
          const count = result[0]?.count || 0;
          if (count > 0) {
            console.log(
              `🔍 DRY-RUN: ${count} ${circular.table}.${circular.field} références circulaires seraient nettoyées`
            );
          }
        } else {
          if (result > 0) {
            console.log(
              `✅ ${result} ${circular.table}.${circular.field} références circulaires nettoyées`
            );
            await logToAudit(
              "UPDATE",
              circular.table,
              result,
              `Champ: ${circular.field}, Nettoyage référence circulaire`
            );
          }
        }

        await delay(DELAY_BETWEEN_BATCHES);
      } catch (error) {
        if (error.message && !error.message.includes("does not exist")) {
          console.error(
            `⚠️  Erreur sur ${circular.table}.${circular.field}:`,
            error.message
          );
        }
      }
    }

    console.log("🎉 Nettoyage COMPLET terminé avec succès!");
    console.log(`📊 Total des enregistrements traités: ${totalDeleted}`);

    // Résumé détaillé
    console.log("\n📋 RÉSUMÉ DES SUPPRESSIONS:");
    Object.entries(deletedCounts).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error.message);
    await logToAudit("ERROR", "SYSTEM", 0, `Erreur: ${error.message}`);
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
        name: "ContratType sans user",
        query: `SELECT COUNT(*) as count FROM "ContratType" WHERE "userId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Message sans expediteur",
        query: `SELECT COUNT(*) as count FROM "Message" WHERE "expediteurId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Conversation sans createur",
        query: `SELECT COUNT(*) as count FROM "Conversation" WHERE "createurId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Property sans owner",
        query: `SELECT COUNT(*) as count FROM "Property" WHERE "ownerId" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "Demande sans createdBy",
        query: `SELECT COUNT(*) as count FROM "Demande" WHERE "createdById" NOT IN (SELECT id FROM "User")`,
      },
      {
        name: "BlogComment sans parent existant",
        query: `SELECT COUNT(*) as count FROM "BlogComment" WHERE "parentId" IS NOT NULL AND "parentId" NOT IN (SELECT id FROM "BlogComment")`,
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
      await delay(50);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error.message);
  }
}

// SAUVEGARDE AVANT NETTOYAGE (optionnelle)
async function createBackupNotification() {
  try {
    console.log("📝 Création d'une notification de sauvegarde...");
    await prisma.notification.create({
      data: {
        type: "SYSTEM",
        title: "Nettoyage des données orphelines",
        message:
          "Un nettoyage des données orphelines est sur le point d'être exécuté. Assurez-vous qu'une sauvegarde récente existe.",
        relatedEntity: "SYSTEM",
        read: false,
        userId: "00000000-0000-0000-0000-000000000000",
      },
    });
    console.log("✅ Notification créée");
  } catch (error) {
    console.error("⚠️  Impossible de créer la notification:", error.message);
  }
}

// EXÉCUTION PRINCIPALE
async function main() {
  console.log("🚀 Démarrage du nettoyage complet...");
  console.log("=".repeat(60));

  // Avertissement de sécurité
  if (!SAFE_MODE) {
    console.log("⚠️  ⚠️  ⚠️  MODE PRODUCTION ACTIF ⚠️  ⚠️  ⚠️");
    console.log("Les données seront réellement supprimées!");
    console.log("Assurez-vous d'avoir une sauvegarde récente.");
    console.log("=".repeat(60));

    // Demande de confirmation
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question(
        "Voulez-vous continuer? (oui/non): ",
        async (answer) => {
          if (answer.toLowerCase() !== "oui") {
            console.log("❌ Opération annulée.");
            readline.close();
            process.exit(0);
            return;
          }
          readline.close();

          // Créer une notification de sauvegarde
          await createBackupNotification();

          // Vérification avant
          console.log("\n📊 VÉRIFICATION AVANT NETTOYAGE:");
          await verifyCleanup();

          // Nettoyage
          console.log("\n🧹 EXÉCUTION DU NETTOYAGE:");
          await cleanAllOrphanedDataEnhanced();

          // Vérification après
          console.log("\n📊 VÉRIFICATION APRÈS NETTOYAGE:");
          await verifyCleanup();

          console.log("\n🎉 Processus terminé avec succès!");
          console.log("=".repeat(60));
          resolve();
        }
      );
    });
  }

  // Mode DRY-RUN
  // Créer une notification de sauvegarde
  await createBackupNotification();

  // Vérification avant
  console.log("\n📊 VÉRIFICATION AVANT NETTOYAGE:");
  await verifyCleanup();

  // Nettoyage
  console.log("\n🧹 EXÉCUTION DU NETTOYAGE:");
  await cleanAllOrphanedDataEnhanced();

  // Vérification après
  console.log("\n📊 VÉRIFICATION APRÈS NETTOYAGE:");
  await verifyCleanup();

  console.log("\n🎉 Processus terminé avec succès!");
  console.log("=".repeat(60));
}

// Gestion des erreurs non catchées
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Rejet non géré:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Exception non catchée:", error.message);
  process.exit(1);
});

// Exécuter le script
main()
  .then(() => {
    console.log("✅ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur critique:", error.message);
    process.exit(1);
  });
