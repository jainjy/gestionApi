const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Début du seeding des abonnements pour les professionnels...");

  try {
    // Récupérer tous les plans d'abonnement
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });

    console.log(`📊 ${plans.length} plans d'abonnement disponibles`);

    // Récupérer tous les utilisateurs professionnels
    const professionnels = await prisma.user.findMany({
      where: {
        role: "professional",
        status: "active",
      },
      include: {
        subscriptions: true, // Vérifier s'ils ont déjà des abonnements
      },
    });

    console.log(`👥 ${professionnels.length} professionnels actifs trouvés`);

    let abonnementsCrees = 0;
    let professionnelsTraites = 0;

    // Pour chaque professionnel
    for (const professionnel of professionnels) {
      // Skip si l'utilisateur a déjà un abonnement actif
      const aDejaAbonnement = professionnel.subscriptions.some(
        (sub) => sub.status === "active" || sub.status === "trialing",
      );

      if (aDejaAbonnement) {
        console.log(`   ⚠️  ${professionnel.email} a déjà un abonnement actif`);
        professionnelsTraites++;
        continue;
      }

      // Déterminer le plan approprié selon le userType et professionalCategory
      let planId = null;
      let visibilityOption = "standard";

      // Trouver le plan correspondant au userType de l'utilisateur
      const planCorrespondant = plans.find((plan) => {
        // Vérifier si l'utilisateur correspond à un des userTypes du plan
        const userTypesPlan = plan.userTypes || [];

        // Pour les AGENCES, on vérifie aussi la professionalCategory
        if (professionnel.userType === "AGENCE") {
          if (professionnel.professionalCategory === "real-estate") {
            // Pour les agences immobilières
            return (
              plan.professionalCategory === "real-estate" &&
              (userTypesPlan.includes("AGENCE") ||
                userTypesPlan.includes("VENDEUR"))
            );
          }
          // Pour autres types d'agences
          return userTypesPlan.includes("AGENCE");
        }

        // Pour les autres types
        return userTypesPlan.includes(professionnel.userType);
      });

      if (!planCorrespondant) {
        // Plan par défaut si aucun plan spécifique trouvé
        const planDefault = plans.find(
          (p) =>
            p.planType === "professional" &&
            p.professionalCategory === "artisan",
        );

        if (planDefault) {
          planId = planDefault.id;
          console.log(
            `   ℹ️  ${professionnel.email} - Plan par défaut: ${planDefault.name}`,
          );
        } else {
          console.log(`   ❌ ${professionnel.email} - Aucun plan disponible`);
          continue;
        }
      } else {
        planId = planCorrespondant.id;
        console.log(
          `   ✅ ${professionnel.email} - Plan trouvé: ${planCorrespondant.name}`,
        );
      }

      // Déterminer la visibilité (enhanced ou standard)
      // Par défaut, 30% des professionnels auront la visibilité renforcée
      const hasEnhancedVisibility = Math.random() < 0.3;
      visibilityOption = hasEnhancedVisibility ? "enhanced" : "standard";

      // Déterminer la date de fin (1 mois après aujourd'hui)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Déterminer le statut (actif pour 80%, trialing pour 20%)
      const status = Math.random() < 0.8 ? "active" : "trialing";

      try {
        // Créer l'abonnement
        await prisma.subscription.create({
          data: {
            userId: professionnel.id,
            planId: planId,
            startDate: new Date(),
            endDate: endDate,
            status: status,
            autoRenew: status === "active", // Renouvellement automatique pour les actifs
            visibilityOption: visibilityOption,
          },
        });

        abonnementsCrees++;
        professionnelsTraites++;

        console.log(
          `   📝 Abonnement créé: ${status} (${visibilityOption}) - Fin: ${endDate.toLocaleDateString("fr-FR")}`,
        );
      } catch (error) {
        console.error(
          `   ❌ Erreur création abonnement pour ${professionnel.email}:`,
          error.message,
        );
      }
    }

    // Résumé final
    console.log(`\n📊 RÉCAPITULATIF DU SEEDING:`);
    console.log(`✅ ${professionnelsTraites} professionnels traités`);
    console.log(`✅ ${abonnementsCrees} nouveaux abonnements créés`);
    console.log(
      `✅ ${professionnels.length - professionnelsTraites} avaient déjà des abonnements`,
    );

    // Statistiques par type d'utilisateur
    console.log(`\n📈 STATISTIQUES PAR TYPE:`);

    const statsParType = {};
    const professionnelsAvecAbonnement = professionnels.filter((p) =>
      p.subscriptions.some(
        (sub) => sub.status === "active" || sub.status === "trialing",
      ),
    );

    professionnelsAvecAbonnement.forEach((p) => {
      const type = p.userType || "non-défini";
      statsParType[type] = (statsParType[type] || 0) + 1;
    });

    Object.entries(statsParType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} abonnés`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur fatale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
