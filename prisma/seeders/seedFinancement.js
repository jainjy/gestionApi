const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Début du seed des données financement...');

  // Nettoyer les tables existantes
  await prisma.financementDemande.deleteMany();
  await prisma.financementPartenaire.deleteMany();
  await prisma.assuranceService.deleteMany();

  // Partenaires de financement
  const partenaires = await prisma.financementPartenaire.createMany({
    data: [
      {
        nom: "Crédit Agricole",
        description: "Banque leader en financement immobilier et professionnel",
        rating: 4.7,
        type: "banque",
        avantages: ["Taux préférentiels", "Accompagnement personnalisé", "Réseau national"],
        icon: "Building2"
      },
      {
        nom: "Courtiers Partenaires",
        description: "Réseau de courtiers experts en financement",
        rating: 4.9,
        type: "courtier",
        avantages: ["Comparaison multi-banques", "Négociation des taux", "Service gratuit"],
        icon: "Users"
      },
      {
        nom: "Spécialistes Immobilier",
        description: "Experts en financement de projets immobiliers",
        rating: 4.8,
        type: "expert",
        avantages: ["Prêts sur mesure", "Expertise sectorielle", "Délais optimisés"],
        icon: "Home"
      }
    ]
  });

  // Services d'assurance (10 assurances au total)
  const assurances = await prisma.assuranceService.createMany({
    data: [
      {
        nom: "Assurance Décennale",
        description: "Protection obligatoire pour les professionnels du bâtiment",
        details: "Couverture des dommages affectant la solidité de l'ouvrage",
        icon: "Shield",
        obligatoire: true,
        public: "Professionnels construction"
      },
      {
        nom: "Assurance Dommage Ouvrage",
        description: "Garantie pour les maîtres d'ouvrage",
        details: "Protection dès la réception des travaux",
        icon: "FileText",
        obligatoire: true,
        public: "Maîtres d'ouvrage"
      },
      {
        nom: "Assurance Habitation",
        description: "Protection complète de votre logement",
        details: "Incendie, dégâts des eaux, vol, responsabilité civile",
        icon: "Home",
        obligatoire: false,
        public: "Particuliers"
      },
      {
        nom: "Assurance Prêt Immobilier",
        description: "Protection de votre crédit immobilier",
        details: "Décès, invalidité, perte d'emploi",
        icon: "BadgeDollarSign",
        obligatoire: false,
        public: "Emprunteurs"
      },
      {
        nom: "Assurance Responsabilité Civile Pro",
        description: "Protection de votre activité professionnelle",
        details: "Dommages causés aux tiers dans le cadre professionnel",
        icon: "Users",
        obligatoire: true,
        public: "Professionnels"
      },
      {
        nom: "Assurance Santé",
        description: "Complémentaire santé entreprise et particuliers",
        details: "Couverture santé optimale",
        icon: "Heart",
        obligatoire: false,
        public: "Entreprises & Particuliers"
      },
      // NOUVELLES ASSURANCES AJOUTÉES
      {
        nom: "Garantie Loyer Impayé",
        description: "Protection contre les impayés de loyers",
        details: "Couverture des loyers impayés et des frais de contentieux",
        icon: "Shield",
        obligatoire: false,
        public: "Propriétaires bailleurs"
      },
      {
        nom: "Assurance Voiture",
        description: "Protection complète pour votre véhicule",
        details: "Tous risques, au tiers, assistance routière",
        icon: "Car",
        obligatoire: true,
        public: "Propriétaires de véhicules"
      },
      {
        nom: "Assurance Voyage",
        description: "Protection lors de vos déplacements",
        details: "Annulation, rapatriement, frais médicaux à l'étranger",
        icon: "Plane",
        obligatoire: false,
        public: "Voyageurs"
      },
      {
        nom: "GFA",
        description: "Garantie des Fonctions d'Architecte",
        details: "Protection juridique pour les architectes",
        icon: "FileText",
        obligatoire: true,
        public: "Architectes"
      }
    ]
  });

  console.log('Seed financement terminé !');
  console.log(`${partenaires.count} partenaires créés`);
  console.log(`${assurances.count} assurances créées`);
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });