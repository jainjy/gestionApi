import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding des plans d'abonnement...");

  const subscriptionPlans = [
    {
      id: "real_estate",
      title: "Pro Immobilier Complet",
      description: "Pour les agences immobilières",
      price: 139,
      period: "par mois",
      color: "blue",
      popular: true,
      features: [
        "Annonces illimitées",
        "Tableaux de bord avancés",
        "Gestion des clients",
        "Statistiques détaillées",
        "Support prioritaire 24/7",
        "Certification vérifiée",
        "Mise en avant des annonces",
      ],
      userTypes: ["VENDEUR", "LOUEUR"],
    },
    {
      id: "services",
      title: "Prestataires de Services",
      description: "Pour les artisans et prestataires",
      price: 39,
      period: "par mois",
      color: "emerald",
      popular: false,
      features: [
        "Profil professionnel",
        "Demandes de devis",
        "Gestion des réservations",
        "Avis et notations",
        "Zone d'intervention",
        "Support dédié",
        "Outils de planning",
      ],
      userTypes: ["PRESTATAIRE"],
    },
    {
      id: "furniture",
      title: "Espace Ameublement",
      description: "Commerçants meubles et déco",
      price: 49,
      period: "par mois",
      color: "purple",
      popular: false,
      features: [
        "Boutique en ligne",
        "Catalogue produits",
        "Gestion des stocks",
        "Commandes en ligne",
        "Livraison géolocalisée",
        "Promotions et soldes",
        "Analytics des ventes",
      ],
      userTypes: ["VENDEUR"],
    },
    {
      id: "wellness",
      title: "Bien-être",
      description: "Professionnels du bien-être",
      price: 19,
      period: "par mois",
      color: "pink",
      popular: false,
      features: [
        "Profil bien-être",
        "Réservations en ligne",
        "Gestion des créneaux",
        "Carte de fidélité",
        "Avis clients",
        "Promotions ciblées",
        "Outils de communication",
      ],
      userTypes: ["PRESTATAIRE"],
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        price: plan.price,
        period: plan.period,
        color: plan.color,
        popular: plan.popular,
        features: plan.features,
        userTypes: plan.userTypes,
      },
    });
  }

  console.log("✅ Plans d'abonnement insérés avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
