const { prisma } = require("../../lib/db");

async function main() {
  console.log(
    "🌱 Début du seeding des plans d'abonnement selon les tarifs OLIPLUS..."
  );

  // Supprimer les anciens plans
  await prisma.subscriptionPlan.deleteMany();
  console.log("🗑️ Anciens plans supprimés");

  // Créer les plans d'abonnement selon les catégories tarifaires du document
  const subscriptionPlans = [
    {
      name: "Immobilier & Commerces",
      description:
        "Pour agences immobilières, mandataires, promoteurs, commerçants, banques et assimilés",
      price: 99.0, // Standard TTC
      enhancedVisibilityPrice: 149.0, // Visibilité renforcée TTC
      interval: "month",
      features: [
        "Annonces professionnelles illimitées",
        "Profil entreprise vérifié",
        "Gestion des biens et clients",
        "Tableau de bord analytique",
        "Sans commission sur les prestations",
        "Support professionnel",
        "Certification OLIPLUS",
      ],
      planType: "professional",
      professionalCategory: "real-estate",
      userTypes: ["AGENCE", "PRESTATAIRE", "VENDEUR"],
      popular: true,
      color: "#2563eb", // Bleu professionnel
      icon: "🏢",
      isVisibilityEnhanced: true,
      isActive: true,
    },
    {
      name: "Artisans & Professions",
      description:
        "Pour artisans, constructeurs, courtiers, assureurs, avocats et professions assimilées",
      price: 49.0, // Standard TTC
      enhancedVisibilityPrice: 89.0, // Visibilité renforcée TTC
      interval: "month",
      features: [
        "Profil professionnel complet",
        "Gestion des demandes de devis",
        "Portfolio de réalisations",
        "Disponibilité en temps réel",
        "Avis clients certifiés",
        "Zone d'intervention géolocalisée",
        "Outils de communication clients",
      ],
      planType: "professional",
      professionalCategory: "artisan",
      userTypes: ["PRESTATAIRE", "ARTISAN", "EXPERT"],
      popular: false,
      color: "#059669", // Vert émeraude
      icon: "🔨",
      isVisibilityEnhanced: true,
      isActive: true,
    },
    {
      name: "Tourisme & Loisirs",
      description:
        "Pour hébergements, activités touristiques, locations de véhicules, expériences touristiques",
      price: 49.0, // Standard TTC
      enhancedVisibilityPrice: 89.0, // Visibilité renforcée TTC
      interval: "month",
      features: [
        "Fiche établissement détaillée",
        "Gestion des réservations en ligne",
        "Calendrier de disponibilités",
        "Photos et vidéos HD illimitées",
        "Avis voyageurs",
        "Promotions saisonnières",
        "Intégration avec plateformes externes",
      ],
      planType: "professional",
      professionalCategory: "tourism",
      userTypes: ["TOURISME", "HEBERGEMENT", "ACTIVITE"],
      popular: false,
      color: "#7c3aed", // Violet
      icon: "🏖️",
      isVisibilityEnhanced: true,
      isActive: true,
    },
    {
      name: "Sport & Bien-être",
      description:
        "Pour professeurs de sport, coachs, professionnels du bien-être et activités assimilées",
      price: 29.0, // Standard TTC
      enhancedVisibilityPrice: 59.0, // Visibilité renforcée TTC
      interval: "month",
      features: [
        "Profil coach certifié",
        "Gestion des séances et créneaux",
        "Réservations en ligne",
        "Carnet de suivi clients",
        "Programmes personnalisés",
        "Avis et recommandations",
        "Outils de planification",
      ],
      planType: "professional",
      professionalCategory: "sports",
      userTypes: ["BIEN_ETRE", "COACH", "SPORT"],
      popular: false,
      color: "#db2777", // Rose
      icon: "💪",
      isVisibilityEnhanced: true,
      isActive: true,
    },
    // Plan pour prestations publicitaires complémentaires
    {
      name: "Prestations Publicitaires",
      description:
        "Services de communication complémentaires (mise en avant, contenus sponsorisés, campagnes ciblées)",
      price: 150.0, // Prix de base TTC
      enhancedVisibilityPrice: 1500.0, // Prix maximum TTC
      interval: "month",
      features: [
        "Mise en avant sur supports digitaux",
        "Publications sponsorisées",
        "Campagnes de communication ciblées",
        "Réseaux sociaux de la plateforme",
        "Reporting d'impact détaillé",
        "Personnalisation selon besoins",
        "Gestion par expert OLIPLUS",
      ],
      planType: "advertising",
      professionalCategory: "advertising",
      userTypes: ["AGENCE", "PRESTATAIRE", "VENDEUR", "TOURISME", "BIEN_ETRE"],
      popular: false,
      color: "#f59e0b", // Orange
      icon: "📢",
      isVisibilityEnhanced: false,
      isActive: true,
    },
  ];

  for (const planData of subscriptionPlans) {
    const plan = await prisma.subscriptionPlan.create({
      data: planData,
    });
    console.log(`✅ Plan créé: ${plan.name} (${plan.price}€ TTC)`);
  }

  console.log("🎉 Seeding des plans d'abonnement OLIPLUS terminé!");
  console.log("📊 Résumé des plans créés:");
  console.log(
    "1. Immobilier & Commerces: 99€ (Standard) / 149€ (Visibilité renforcée)"
  );
  console.log(
    "2. Artisans & Professions: 49€ (Standard) / 89€ (Visibilité renforcée)"
  );
  console.log(
    "3. Tourisme & Loisirs: 49€ (Standard) / 89€ (Visibilité renforcée)"
  );
  console.log(
    "4. Sport & Bien-être: 29€ (Standard) / 59€ (Visibilité renforcée)"
  );
  console.log("5. Prestations Publicitaires: À partir de 150€");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
