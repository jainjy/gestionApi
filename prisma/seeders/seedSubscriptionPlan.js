const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Début du seeding des plans d'abonnement...");

  // Nettoyer les données existantes
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  // Créer les plans d'abonnement
  const subscriptionPlans = [
    {
      name: "Pro Immobilier Complet",
      description: "Pour les agences immobilières",
      price: 139.0,
      interval: "month",
      features: [
        "Annonces illimitées",
        "Tableaux de bord avancés",
        "Gestion des clients",
        "Statistiques détaillées",
        "Support prioritaire 24/7",
        "Certification vérifiée",
        "Mise en avant des annonces",
      ],
      planType: "real_estate",
      userTypes: ["VENDEUR", "LOUEUR", "PRESTATAIRE"],
      popular: true,
      color: "blue",
      isActive: true,
    },
    {
      name: "Prestataires de Services",
      description: "Pour les artisans et prestataires",
      price: 39.0,
      interval: "month",
      features: [
        "Profil professionnel",
        "Demandes de devis",
        "Gestion des réservations",
        "Avis et notations",
        "Zone d'intervention",
        "Support dédié",
        "Outils de planning",
      ],
      planType: "services",
      userTypes: ["PRESTATAIRE"],
      popular: false,
      color: "emerald",
      isActive: true,
    },
    {
      name: "Espace Ameublement",
      description: "Commerçants meubles et déco",
      price: 49.0,
      interval: "month",
      features: [
        "Boutique en ligne",
        "Catalogue produits",
        "Gestion des stocks",
        "Commandes en ligne",
        "Livraison géolocalisée",
        "Promotions et soldes",
        "Analytics des ventes",
      ],
      planType: "furniture",
      userTypes: ["VENDEUR"],
      popular: false,
      color: "purple",
      isActive: true,
    },
    {
      name: "Bien-être",
      description: "Professionnels du bien-être",
      price: 19.0,
      interval: "month",
      features: [
        "Profil bien-être",
        "Réservations en ligne",
        "Gestion des créneaux",
        "Carte de fidélité",
        "Avis clients",
        "Promotions ciblées",
        "Outils de communication",
      ],
      planType: "wellness",
      userTypes: ["BIEN_ETRE"],
      popular: false,
      color: "pink",
      isActive: true,
    },
  ];

  for (const planData of subscriptionPlans) {
    const plan = await prisma.subscriptionPlan.create({
      data: planData,
    });
    console.log(`✅ Plan créé: ${plan.name}`);
  }

  console.log("🎉 Seeding des plans d'abonnement terminé!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
