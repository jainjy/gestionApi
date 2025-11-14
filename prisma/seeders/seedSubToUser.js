const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Début du seeding simplifié des abonnements...");

  // Récupérer le plan "Prestataires de Services" (le plus commun)
  const immoPlan = await prisma.subscriptionPlan.findFirst({
    where: { planType: "real_estate" },
  });
  const bienetrePlan = await prisma.subscriptionPlan.findFirst({
    where: { planType: "wellness" },
  });
  const servicePlan = await prisma.subscriptionPlan.findFirst({
    where: { planType: "services" }
  });
  const furniturePlan = await prisma.subscriptionPlan.findFirst({
    where: { planType: "furniture" },
  });

  if (!servicePlan) {
    throw new Error("❌ Aucun plan de services trouvé");
  }
  if (!furniturePlan) {
    throw new Error("❌ Aucun plan de services trouvé");
  }
  if (!bienetrePlan) {
    throw new Error("❌ Aucun plan de services trouvé");
  }
  if (!immoPlan) {
    throw new Error("❌ Aucun plan de services trouvé");
  }

  // Récupérer tous les professionnels actifs
  const professionals = await prisma.user.findMany({
    where: {
      role: "professional",
      status: "active"
    }
  });

  console.log(`👥 ${professionals.length} professionnels à traiter`);

  // Créer un abonnement de 2 mois pour chaque professionnel
  for (const professional of professionals) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    let planId;
    if (professional.userType === "PRESTATAIRE") {
      planId = servicePlan.id;
    } else if (professional.userType === "VENDEUR") {
      planId = furniturePlan.id;
    } else if (professional.userType === "BIEN_ETRE") {
      planId = bienetrePlan.id;
    } else if (professional.userType === "AGENCE") {
      planId = immoPlan.id;
    }
    await prisma.subscription.create({
      data: {
        userId: professional.id,
        planId: planId,
        startDate: startDate,
        endDate: endDate,
        status: "active",
        autoRenew: false // Désactiver le renouvellement automatique pour les seeds
      }
    });

    console.log(`✅ ${professional.email} abonné jusqu'au ${endDate.toLocaleDateString()}`);
  }

  console.log(`🎉 ${professionals.length} abonnements créés avec succès!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });