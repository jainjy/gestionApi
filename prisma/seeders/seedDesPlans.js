const { prisma } = require("../../lib/db");

async function main() {
  console.log("🌱 Mise à jour des plans d'abonnement vers OLIPLUS...");

  /* ============================
     1️⃣ PRO IMMOBILIER → IMMOBILIER & COMMERCES
  ============================ */
  await prisma.subscriptionPlan.updateMany({
    where: { name: "Pro Immobilier Complet" },
    data: {
      name: "Immobilier & Commerces",
      description:
        "Pour agences immobilières, mandataires, promoteurs, commerçants, banques et assimilés",
      price: 99.0,
      enhancedVisibilityPrice: 149.0,
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
      userTypes: ["AGENCE", "VENDEUR"],
      popular: true,
      color: "#2563eb",
      icon: "🏢",
      isVisibilityEnhanced: true,
      isActive: true,
    },
  });

  /* ============================
     2️⃣ PRESTATAIRES → ARTISANS & PROFESSIONS
  ============================ */
  await prisma.subscriptionPlan.updateMany({
    where: { name: "Prestataires de Services" },
    data: {
      name: "Artisans & Professions",
      description:
        "Pour artisans, constructeurs, courtiers, assureurs, avocats et professions assimilées",
      price: 49.0,
      enhancedVisibilityPrice: 89.0,
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
      userTypes: ["PRESTATAIRE", "ARTISAN"],
      popular: false,
      color: "#059669",
      icon: "🔨",
      isVisibilityEnhanced: true,
      isActive: true,
    },
  });

  /* ============================
     3️⃣ SUPPRESSION ESPACE AMEUBLEMENT
  ============================ */
  await prisma.subscriptionPlan.deleteMany({
    where: { name: "Espace Ameublement" },
  });

  console.log("🗑️ Plan 'Espace Ameublement' supprimé");

  /* ============================
     4️⃣ BIEN-ÊTRE → SPORT & BIEN-ÊTRE
  ============================ */
  await prisma.subscriptionPlan.updateMany({
    where: { name: "Bien-être" },
    data: {
      name: "Sport & Bien-être",
      description:
        "Pour professeurs de sport, coachs, professionnels du bien-être et activités assimilées",
      price: 29.0,
      enhancedVisibilityPrice: 59.0,
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
      userTypes: ["BIEN_ETRE"],
      popular: false,
      color: "#db2777",
      icon: "💪",
      isVisibilityEnhanced: true,
      isActive: true,
    },
  });

  /* ============================
     5️⃣ CRÉATION TOURISME & LOISIRS (SI ABSENT)
  ============================ */
  const tourismPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "Tourisme & Loisirs" },
  });

  if (!tourismPlan) {
    await prisma.subscriptionPlan.create({
      data: {
        name: "Tourisme & Loisirs",
        description:
          "Pour hébergements, activités touristiques, locations de véhicules, expériences touristiques",
        price: 49.0,
        enhancedVisibilityPrice: 89.0,
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
        userTypes: ["TOURISME"],
        popular: false,
        color: "#7c3aed",
        icon: "🏖️",
        isVisibilityEnhanced: true,
        isActive: true,
      },
    });

    console.log("✅ Plan 'Tourisme & Loisirs' créé");
  } else {
    console.log("ℹ️ Plan 'Tourisme & Loisirs' déjà existant");
  }

  console.log("🎉 Migration des plans terminée avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
