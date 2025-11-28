const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  console.log("🌱 Début du seeding des données financières...");

  try {
    // 1. Création de Crédit Réunion comme partenaire financier
    console.log("📊 Création du partenaire Crédit Réunion...");

    const creditReunion = await prisma.financementPartenaire.create({

      data: {
        nom: "Crédit Réunion",
        description:
          "Partenaire financier de confiance pour tous vos projets à La Réunion. Prêts immobiliers, travaux, rachat de crédit et solutions sur mesure.",
        rating: 4.8,
        type: "banque_cooperative",
        avantages: [
          "Taux compétitifs",
          "Accompagnement personnalisé",
          "Expertise locale",
          "Solutions sur mesure",
          "Délais de traitement rapides",
        ],
        icon: "/icons/credit-reunion.png",
        website: "https://creditreunion.com/",
        phone: "0262 20 20 20",
        email: "contact@creditreunion.com",
        address: "Saint-Denis, La Réunion",
        conditions:
          "Sous réserve d'acceptation du dossier. Conditions variables selon le profil et le projet.",
        tauxMin: 1.5,
        tauxMax: 4.2,
        dureeMin: 12,
        dureeMax: 300,
        montantMin: 10000,
        montantMax: 500000,
        isActive: true,
      },
    });

    console.log("✅ Crédit Réunion créé avec ID:", creditReunion.id);

    // 2. Création des services financiers pour Crédit Réunion
    console.log("💰 Création des services financiers...");

    const servicesFinanciers = [
      {
        nom: "Prêt Immobilier",
        description:
          "Financez votre projet immobilier à La Réunion avec des conditions adaptées à votre situation.",
        type: "pret_immobilier",
        categorie: "particulier",
        conditions: "Apport personnel de 10% minimum requis",
        avantages: [
          "Taux fixe ou variable",
          "Frais de dossier réduits",
          "Différé de remboursement possible",
          "Assurance emprunteur compétitive",
        ],
        taux: 2.5,
        dureeMin: 60,
        dureeMax: 300,
        montantMin: 50000,
        montantMax: 400000,
        fraisDossier: 500,
        assuranceObligatoire: true,
        documentsRequises: [
          "Justificatifs de revenus",
          "Pièce d'identité",
          "Avis d'imposition",
          "Contrat de réservation",
        ],
        delaiTraitement: "2 à 3 semaines",
        ordreAffichage: 1,
      },
      {
        nom: "Prêt Travaux",
        description:
          "Financez vos travaux de rénovation, d'amélioration ou d'extension à La Réunion.",
        type: "pret_travaux",
        categorie: "particulier",
        conditions: "Propriétaire du bien concerné",
        avantages: [
          "Financement jusqu'à 100% des travaux",
          "Délégation d'assurance possible",
          "Taux préférentiels",
        ],
        taux: 3.2,
        dureeMin: 12,
        dureeMax: 120,
        montantMin: 5000,
        montantMax: 75000,
        fraisDossier: 300,
        assuranceObligatoire: false,
        documentsRequises: [
          "Devis des travaux",
          "Justificatifs de revenus",
          "Plan de financement",
        ],
        delaiTraitement: "1 à 2 semaines",
        ordreAffichage: 2,
      },
      {
        nom: "Rachat de Crédit",
        description:
          "Regroupez vos crédits pour simplifier votre budget et réduire vos mensualités.",
        type: "rachat_credit",
        categorie: "particulier",
        conditions: "Endettement maximum 33% après rachat",
        avantages: [
          "Baisse des mensualités",
          "Taux unique",
          "Gestion simplifiée",
          "Régularisation de situation",
        ],
        taux: 3.8,
        dureeMin: 24,
        dureeMax: 180,
        montantMin: 10000,
        montantMax: 200000,
        fraisDossier: 400,
        assuranceObligatoire: true,
        documentsRequises: [
          "Tableaux d'amortissement existants",
          "Justificatifs de revenus",
          "Relevés de comptes",
        ],
        delaiTraitement: "3 à 4 semaines",
        ordreAffichage: 3,
      },
      {
        nom: "Prêt Professionnel",
        description:
          "Financez le développement de votre entreprise à La Réunion.",
        type: "pret_professionnel",
        categorie: "professionnel",
        conditions: "Entreprise immatriculée depuis au moins 2 ans",
        avantages: [
          "Accompagnement dédié",
          "Grace period possible",
          "Garanties adaptées",
          "Expertise sectorielle",
        ],
        taux: 2.8,
        dureeMin: 24,
        dureeMax: 84,
        montantMin: 25000,
        montantMax: 200000,
        fraisDossier: 600,
        assuranceObligatoire: false,
        documentsRequises: [
          "Comptes annuels",
          "Business plan",
          "KBIS",
          "Projet d'investissement",
        ],
        delaiTraitement: "3 à 5 semaines",
        ordreAffichage: 4,
      },
    ];

    for (const serviceData of servicesFinanciers) {
      const service = await prisma.serviceFinancier.create({
        data: {
          ...serviceData,
          partenaireId: creditReunion.id,
          isActive: true,
        },
      });
      console.log(`✅ Service "${service.nom}" créé avec ID: ${service.id}`);
    }

    console.log("🎉 Seeding des données financières terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    throw error;
  }
}

main()
