import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding database with provided data...");

    // =======================
    // Classification des services
    // =======================

    const serviceClassifications = [
      {
        libelleService: "diagnostic sur les mérules",
        categoryName: "Constructions",
      },
      {
        libelleService: "Acheter des faiences",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Acheter des pierres",
        categoryName: "Constructions",
      },
      {
        libelleService: "Agencement d'un garage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Agencement de votre salon",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Agencement Extérieur ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Agencement Intérieur d'un bien immobilier",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Assurance d'appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Bardage en aluminium",
        categoryName: "Constructions",
      },
      {
        libelleService: "Bardage en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Brise soleil coulissant",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Brossage de Terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Casser et refaire un îlot central",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changement de Deck en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changement de décoration de chambre",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changement de terrasse en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer de lavabo",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer de piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer des grilles de sécurité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer le moteur de ma piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer les faiences de la cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer les faiences de la douche",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer les faiences de la salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer ma terrasse en composite",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer ma voile d'ombrage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Changer mon compteur d'électricité",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer mon faux plafonds",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer mon film solaires",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Changer mon store extérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer mon store intérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer un joint robinet d'eau ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer un robinet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer une bâche de pergola",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer une bâche de store déroulant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer une gouttière",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Chercher une fuite dans une piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Clôturer un Balcon",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Conception de cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Conception de plan 2D et 3D",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction d'un abri de jardin en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction d'un cagibi",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction d'un kiosque en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction d'un studio de jardin en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction de pergola persienne",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction de terrasse en bois de pin",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction de terrasse en bois exotique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construire un garage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construire un meuble de salle de bains",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construire une piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Cré une cloison de plâtre",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Création / Réalisation de garde corps escalier d'intérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création d'un abri de jardin",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création d'un banc ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création d'une aire de jeux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création d'une allée bétonnée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création d'une allée d'accés",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation d'un garde corps en cable inox",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Création/ Réalisation d'un garde corps en tôle découpée",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Création/ Réalisation d'un garde corps en tôle perforée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation d'une barrièr levante",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Création/ Réalisation d'une porte de garage basculante",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Création/ Réalisation d'une porte de garage coulissante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation d'une porte de Hall d'entrée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation de garde corps",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation de grilles de fenêtre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation de Store Déroulants",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/ Réalisation de structure métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Création/Réalisation d'un garde corps en acien",
        categoryName: "Constructions",
      },
      {
        libelleService: "Cuisine pré-fabriquée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Décoration murale",
        categoryName: "Constructions",
      },
      {
        libelleService: "Défrichage ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Dégraissage de Terrasse en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dégrisage de Terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demand de devis pour un plan de maison 2D",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande d'assurance maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande de devis pour un plan de maison 3D",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande de Permis de construire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Déménager des affaires - meubles",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Démolition Charpente",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition d'un abri de jardin",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition d'un garage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition d'un mur de séparation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition d'un mur porteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition d'une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démolition et construction d'une charpente",
        categoryName: "Constructions",
      },
      {
        libelleService: "Démontage de meuble",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et pose d'un carrelage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose d'appareils PMR",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose d'enduit",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Depose et repose d'équerre d'etanchéité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose d'un dressing ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Depose et repose d'un kit solaire avec stockage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Depose et repose d'un kit solaire sans stockage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Depose et repose de bande d'impermeabilisation de façade",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Dépose et repose de béton ciré",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de canalisation",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Dépose et repose de carrelage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de carrelage imitation parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Depose et repose de carrelage Mural",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de carrelage sol",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de dalle béton au sol",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de faience",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de faïence",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de fibre végétale",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de grille de fenêtre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de joints",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de moquette",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Depose et repose de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de parquet massif",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de porte d'entrée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose de revêtement vinyle",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de sol en liège",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de stratifié",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de toilettes",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de tuyaux de plomberie",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Dépose et repose de Zellige",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépose et repose du réseau de plomberie",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Deposer et repose de plan de travail en boi",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Détection d'infiltration intérieur et extérieur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Détruire une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Détuires un faux plafonds",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService:
          "diagnostic d'Etat des Servitudes Risques et d'Information sur les Sols",
        categoryName: "Constructions",
      },
      {
        libelleService: "Domotique",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Entretien annuel de bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien ascenseur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Entretien Climatisation",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Entretien d'un sol souple",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien d'une VMC",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Entretien de jardin régulier ou occasionnel",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien de Panel LED",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Entretien de store déroulant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien du kit solaire",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien fosse septique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien jaccuzi",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien toiture ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Etablir un bornage ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Fabrication d'escalier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fabrication de cuisine ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fabrication de porte d'entrée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fabrication de volet aluminium et métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "faire un désamiantage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un dressing",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Faire un escalier en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un îlot central",
        categoryName: "Constructions",
      },
      {
        libelleService: "faire un traitement termites (contre les)",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire une chambre parentale",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Faire une cloisonnement",
        categoryName: "Constructions",
      },
      {
        libelleService: "faire une dératisation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fourniture et installation d'un visiophone",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fourniture et installation d'une platine de rue",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fuite d'eau douche - Salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Garde corps vitre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Garde corps vitrés et lumineux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation Climatisation",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installation d'appareils PMR",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'un chauffe eau electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'un chauffe eau photovoltaique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'un chauffe eau solaire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'une borne de charge électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de canalisation ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installation de nouvelles ouvertures ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de panel LED",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de portail electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de réseau d'alimentation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de réseau de plomberie ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installation Robineterie complète",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installation toilette sanitaire ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installations sanitaires",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des détecteurs de mouvements",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des gardes corps en verre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des grilles de sécurité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des lames vyniles",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer des pierres",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer des toilettes suspendues",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer des wc suspendus",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un ascenseur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un dressing complet chambre parentale",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un dressing pour enfant",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un faux plafonds",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un film solaire",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer un kit Solaire avec stockage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer un kit Solaire sans stockage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer un plan de travail en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un plan de travail en céramique",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un store extérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un store intérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une alarme ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une carméra de surveillance",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une chambre parentale",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une cloison en bambou",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une cloison en plaquo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une cloison en plâtre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une cloison en verre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une gouttière",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer une pergola bioclimatique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une Pergola Retractable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une VMC",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une voile d'ombrage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installtion d'un portail manuel",
        categoryName: "Constructions",
      },
      {
        libelleService: "Isoler la maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Isoler le plafond",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Isoler les murs et le plafond",
        categoryName: "Constructions",
      },
      {
        libelleService: "Isoler uniquement les murs de la maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Jardinage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Localiser une infiltration sur la façade",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Localiser une infiltration sur une terrasse, balcon,varangue",
        categoryName: "Constructions",
      },
      {
        libelleService: "Localiser une infiltration sur une toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Localiser une fuite dans une canalisation",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Location de toilettes",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Maison en osstature métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Mettre une alarme",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Mettre une caméra",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "mettre une nouvelle piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Meubles en Bambou",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Meubles en bois ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Meubles salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Mise en conformité électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Mise en conformité sanitaires - assainissement",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Mises aux normes électriques",
        categoryName: "Constructions",
      },
      {
        libelleService: "Mobilier de douche",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Mobilier de jardin ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Mobilier de salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Montage de meuble ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Motorisation de portail",
        categoryName: "Constructions",
      },
      {
        libelleService: "Motorisation de volet roulant ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nettoyage de gouttière ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Nettoyage de terrasse en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nettoyage du jardin",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Nettoyage, brossage et application saturateur du parquet ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Nettoyer un Appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Nettoyer un local",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nettoyer une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nettoyer une résidence",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nivellement de terrain",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Ouverture d'un mur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Ouverture dans un mur porteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pergola Adossée en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pergola Autoportée en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pergola plate en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poncage d'un parquet d'intérieur ou extérieur en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poncage de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Ponçage de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Ponçage de terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Portail en Panne",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose d'enduit",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose d'équerre etanche",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose d'isolation murale",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose d'isolation plafond",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose d'un automatisme coulissant pour portail",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose d'un portail automatique coulissant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de bande d'impermeabilisation de façade",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Pose de caméra de surveillance complète piloter par GSM",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "pose de dalle béton sur le sol",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de fenêtres en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de joints lavabo, évier, douche, carrelage..",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService:
          "Pose de pierre en basalte volcanique sur facade de maison ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de placo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de plâtres",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose de toilettes",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose de volet aluminium",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de volet métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser d'étagéres",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser de la moquette",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser de parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser des baies vitrées",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser des cables",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser des faiences",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser des volets coulissant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser des volets persiennes",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser un dressing",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser un enduit ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser un grillage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Poser un paquet",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser un rideau métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser un vollet roullant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une bâche ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une barrière en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une barriere en verre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une barriere metallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une borne electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une borne solaire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une chaudiere",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une clotûre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser une fenêtre en aluminium",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une jalousie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une moquette ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Poser une pergola en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Poser une porte coulissante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Potéger la maison du froid",
        categoryName: "Constructions",
      },
      {
        libelleService: "Probleme de chauffage avec mon chauffe eau",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Proposition de garde corps",
        categoryName: "Constructions",
      },
      {
        libelleService: "Protéger la maison de l'humidité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Protéger la maison de la chaleur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Raccordement assainissement",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Raccordement des réseaux ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Raccordement electrique",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Raccordement internet",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Rattrapage de fissure ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Ravalement de facade d'immeuble",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Ravalement de facade de maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalier un Diagnostic Loi carrez ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'un bardage métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'un escalier métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'un garde corps métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'un portail métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'une grille de protection métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation d'une nouvelle salle d'eau",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation de caillebotis - Deck",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation de plan 2D et 3D",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation de terrasse en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réalisation de terrasse en composite",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser l'étanchéité d'une douche",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour l'installation de toilettes",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réaliser un devis pour repreindre des murs",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour un défrichage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réaliser un devis pour une décoration murale",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une démolition",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une isolation thermiques",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une pergola bioclimatique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une pergola en aluminium",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une pergola en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une pergola métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une pergola retractable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une salle d'eau",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réaliser un devis pour une terrasse en bois ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un devis pour une terrasse en composite",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic amiante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic complet",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic d'assainissement ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic Performance Energétique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic Plomb",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un diagnostic termites",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un escalier central",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un îlot central de cuisine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un mur de moellon (à joint ou à sec)",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un mur de soutennement",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un mur en bloc",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Réaliser un portail coulissant Métal/ Bois avec ou sans portillon",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une cloison en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une cloison en plâtre ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une déclaration préalable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une extension",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une isolation thermique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une pergola",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser une terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rédiger un état des lieux d'entrée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rédiger un état des lieux de sortie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire l'étancheité d'une douche",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire l'étanchéité d'une salle de bains",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire l'étancheité d'une terrasse, varangue, balcon",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire l'intérieur de la maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire ma piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire ma véranda ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire mon plan de travail en céramque",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire un plafond en béton",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire un plafond en plâtre ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire une cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Refaire une salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réfection complète avec démolition de la cuisine ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réhabiliation de la maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Remise en état du jardin",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Renforcer l'étanchéité du bien",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rénovation de plomberie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rénovation de terrasse en composite",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Rénovation des parquets d'intérieur ou extérieur en bois massif",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation chauffe eau photovoltaique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation chauffe-eau ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation chauffe-eau solaire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation Climatisation",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparation d'un deck en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation d'une borne de charge électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation d'une porte de garage basculante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation d'une porte de garage coulissante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation d'une porte de Hall d'entrée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de fenêtres en aluminium",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de fenêtres en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de fissure ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de Panel LED",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de portail éléctrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de remontées capillaires",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de Store déroulant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de velux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation de verrou",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation douche ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparation escalier métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation garde corps métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation grille de protection métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation jaccuzi",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation lave vaisselle",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation machine à laver",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation pergola bioclimatique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation portail métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation réfrigirateur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation salle de bains",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparation sanitaires",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation téléviseur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer des grilles de sécurité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer et poncer mon parquet",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer la toiture et sur-toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer le moteur de ma piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer ma coque de piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer ma VMC",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer mon film solaires",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer mon kit solaire ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer un ascenseur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer un dressing existant",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer un grillage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer un plan de travail en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer un store extérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer un store intérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une alarme ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer une caméra de surveillance",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer une fuite d'eau",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une gouttière",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer une lavabo",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réparer une pergola",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une pergola retractable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une porte coulissante",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une voile d'ombrage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Repeindre la façade d'un bâtiment",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Repeindre un mur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre une toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Repeindre une toiture ",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Reprendre enduit mur + peinture",
        categoryName: "Constructions",
      },
      {
        libelleService: "Reprise d'enduit ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Reprise de maconnerie et peinture ",
        categoryName: "Constructions",
      },
      {
        libelleService: "robinetterie à changer",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService:
          "Terrasse en bois ave charges réparties sur une surface étanche",
        categoryName: "Constructions",
      },
      {
        libelleService: "Terrasse en bois avec charges concentrées sur poteaux",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Terrasse en bois avec des charges réparties sur carrelage ou béton",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Terrasse en bois avec des charges réparties sur sol brut",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement Capillaires",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de charpente en acier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de charpente en bois",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de charpente métallique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de l'air",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de l'eau ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Travaux de peinture extérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Travaux de peinture intérieur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Travaux de soudure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Vitrification",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Vitrification d'un parquet d'intérieur ou extérieur en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réaliser un devis pour une isolation accoustique",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Isoler la maison avec ouate de cellulose",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement anti-termites",
        categoryName: "Constructions",
      },
      {
        libelleService: "Enlever de la moisissure sur les murs",
        categoryName: "Constructions",
      },
      {
        libelleService: "Traitement de remontée capillaires ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de vernis",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de vernis",
        categoryName: "Constructions",
      },
      {
        libelleService: '"Pose de laques`\n"',
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de vernis",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation douche extérieure en linox",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Répare une douche extérieure",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une douche en linox",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer une cascade dans la piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une cascade piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des lames de piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer des lames de piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un SPA",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer une piscine ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer un SPA",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien SPA",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien Hammam",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Refaire l'enduit de la piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer l'enduit de la piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un enduit pour la piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Evacuation des canalisations",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Nettoyer un jardin",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer une fuite d'eau de toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Recherche une fuite sur la toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Rénover des pierres murales extérieures",
        categoryName: "Constructions",
      },
      {
        libelleService: "Intervention rapide plomberie",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Intervention rapide électricité",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Rénovation de l'électricité de la maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Travaux de plomberie",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Travaux d'électricité",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Transformation de garage ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un drain",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparer un drain",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Changer un drain",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réisoler un mur ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réisoler un plafond",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réisoler une toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Construire une cuisine extérieure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer une cuisine extérieure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un bar extérieur",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Rénover une cuisine extérieure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer un barbecue",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Travaux de jardinnage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer des dalles dans le jardin",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Diagnostioc Installation Gaz",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation Radiateur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation Radiateur",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien Radiateur",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Installer un radiateur",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Eclairage intérieur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Eclairage extérieur",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Plafond Rayonnant",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Chauffage au sol (parquet chauffant)",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Petit travaux de maçonnerie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose d'une margelle",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Depose et repose d'une margelle",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Chauffage piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "chape",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Fabrication de meubles",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation fuite de gaz",
        categoryName: "Constructions",
      },
      {
        libelleService: "Etancheité toiture terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Etancheité toiture varangue",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Etancheité toiture balcon",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Canalisation (pose, rempoacement, réparation)",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Matériel d'entretien (filtration, local technique)",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction local technique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation filtre piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien filtre piscine",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation couverture toiture",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation couverture toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Entretien couverture toiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Rénovation couverture toiture",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation baignoire balnéo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'une Antenne Satellite",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Sécurité Piscine (Alarme, Barrière)",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'un bidet",
        categoryName: "Constructions",
      },
      {
        libelleService: "Adoucisseur d'eau",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Viabilisation (raccordement égout, eau, electritié, )",
        categoryName: "Constructions",
      },
      {
        libelleService: "Terrassement ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Remblayage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Projet de rénovation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Projet de construction",
        categoryName: "Constructions",
      },
      {
        libelleService: "Projet d'achat de maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Projet d'achat d'appartement ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Traitement contre les rats",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Réaliser un devis pour un traitement contre les termites",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de prises électriques",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Remplacement de prises électriques",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Pose de miroir",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Dépose et repose de miroir",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Pose d'un mur végétal",
        categoryName: "Constructions",
      },
      {
        libelleService: "Maison connectée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Peinture décorative",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien bac à graisse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparation d'un réfrigérateur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien d'un frigo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation d'un système frigorifique",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Réparation d'un téléviseur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de joints de fenêtre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de joints de fenêtre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Vendre une maison neuve",
        categoryName: "Constructions",
      },
      {
        libelleService: "Vendre un appartement ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Vendre un immeuble",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Vendre une villa",
        categoryName: "Constructions",
      },
      {
        libelleService: "Location d'une villa",
        categoryName: "Constructions",
      },
      {
        libelleService: "Location d'un appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Location d'un local commercial",
        categoryName: "Constructions",
      },
      {
        libelleService: "Location d'un local professionnel",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'un appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Achat d'un local commercial",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'un immeuble",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Achat d'un local professionnel",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'un terrain",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'un projet immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande d'expertise immobilière",
        categoryName: "Constructions",
      },
      {
        libelleService: "Estimation pour une succession",
        categoryName: "Constructions",
      },
      {
        libelleService: "Estimation pour une donation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rédiger un compromis de vente",
        categoryName: "Constructions",
      },
      {
        libelleService: "Crée une SCI",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lancer une prodécure d'impayé",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lancer un contentieux immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lancer un contentieux travaux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demander une conseil immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demander un conseil sur des travaux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construction de maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Accompagnement et suivit construction",
        categoryName: "Constructions",
      },
      {
        libelleService: "Construire clé en main",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire construire une villa individuel",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande de devis de construction",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lancer une procédure d'explusion",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lancer une procédue d'expropriation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Home staging",
        categoryName: "Constructions",
      },
      {
        libelleService: "Refaire l'intérieur de sont appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Rénover l'intérier d'un bien immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rénover l'intérieur d'un appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Rénover l'intérieur d'une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Modernisé son intérieur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Modernisé une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Rénover une cuisine intérieure",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Modernisée une cuisine ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réaliser une douche italienne",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Demande de devis pour une douche italienne",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer un extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Jetter un extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Donner un exctincteur vide",
        categoryName: "Constructions",
      },
      {
        libelleService: "Changer un extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Achat d'extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Acheter un extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Maintenance annuelle d'extincteurs",
        categoryName: "Constructions",
      },
      {
        libelleService: "Maintenance d'extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Entretien d'extincteur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Mise en conformité des extincteurs",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation éclairage de sécurité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Désenfumage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre un appartement",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Repeindre une maison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Ponçage et peinture",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre villa",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre des escaliers",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre un mur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre une varangue",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Repeindre une terrasse",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre une cuisine",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Repeindre un garage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre un studio",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre un local",
        categoryName: "Constructions",
      },
      {
        libelleService: "Repeindre une cave",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Repeindre un bureau",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Rénovation d'un ascenseur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Moderniser un ascenseur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de prises électriques",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Faire un devis pour des diagnostics d'un bien immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "DIagnostics pour la vente d'un bien immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Diagnostics pour la location d'un bien immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Assurance vie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un contre-bornage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Faire un devis pour un bornage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Faire un devis pour une division de terrain",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire une divison pour une déclaration préalable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un devis pour un contre-bornage",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Poser des bornes (bornages)",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Poser des bornes sur une parcelle",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un état des lieux d'entrée ",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Devis pour faire un état des lieux d'entrée et de sortie (suivit)",
        categoryName: "Constructions",
      },
      {
        libelleService: "Raccorder un terrain à l'eau potable",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Raccorder un terrain au tout à l'égoût",
        categoryName: "Constructions",
      },
      {
        libelleService: "Etancheité au plafond à refaire",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Déposer un permis de construire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une cage d'escalier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réparer une cage d'ascenseur",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Réaliser de la soudure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Devis pour soudure d'éléments",
        categoryName: "Constructions",
      },
      {
        libelleService: "Porte d'entrée bloquée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Ouvrir une porte d'entrée ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Sérrure cassée",
        categoryName: "Constructions",
      },
      {
        libelleService: "Acheter et pose d'une sérrure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Réaliser un désamiantage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Donner des meubles",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService:
          "Récuperer des meubles, mobilier, appareils électroménager",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Distribution électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Travaux informatique",
        categoryName: "Constructions",
      },
      {
        libelleService: "matériaux de construction",
        categoryName: "Constructions",
      },
      {
        libelleService: "Bois traité",
        categoryName: "Constructions",
      },
      {
        libelleService: "Feraillage à béton",
        categoryName: "Constructions",
      },
      {
        libelleService: "Meubles sur mesure",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demolition Cloison",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demolition Cloison + plafond ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demolition Cloison + plafond + wc et evacuation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose WC + vasque",
        categoryName: "Constructions",
      },
      {
        libelleService: "Plafond placo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Cloison Placo",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose WC ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Enduit Lissage sur mur Existant",
        categoryName: "Constructions",
      },
      {
        libelleService: "Enduit lissage + création de mur ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose WC + Vasque",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose WC",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose porte galandage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose verriere",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose Carrelage",
        categoryName: "Constructions",
      },
      {
        libelleService: "Peinture ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Interrupteur à changer ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Renovation tableau",
        categoryName: "Constructions",
      },
      {
        libelleService: "Spots à changer",
        categoryName: "Constructions",
      },
      {
        libelleService: "RJ45",
        categoryName: "Constructions",
      },
      {
        libelleService: "PC 16A",
        categoryName: "Constructions",
      },
      {
        libelleService: "DCL",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un constat d'huissier pour permis de construire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Afficher un permis de construire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire constater un depot de permis",
        categoryName: "Constructions",
      },
      {
        libelleService: "Constat d'huissier pour des dégats",
        categoryName: "Constructions",
      },
      {
        libelleService: "Constat d'huissier pour un etat des lieux",
        categoryName: "Constructions",
      },
      {
        libelleService: "Constat d'huissier pour un conflit de voisinage",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Faire appel à un huissier pour un recouvrement amiable",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire une signification par un huissier de justice",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demander conseil à un huissier de justice",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demander conseil à un architecte",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demander conseil à un agent immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose brasseur d'air",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pose de luminaire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Conception electrique tertiaire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Dépannage électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Intégration Domotique habitat",
        categoryName: "Constructions",
      },
      {
        libelleService: "Système Domotique complet ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Maison connectée évolutive",
        categoryName: "Constructions",
      },
      {
        libelleService: "Technologie domotique sans fil",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Programmation de scénario",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pilotage avec assitance vocal",
        categoryName: "Constructions",
      },
      {
        libelleService: "Gestion sur tablette",
        categoryName: "Constructions",
      },
      {
        libelleService: "Système d'alarme intrusion connectée",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Détection intrusion, incendie, innondation",
        categoryName: "Constructions",
      },
      {
        libelleService: "Technologie d'alarme intrusion sans fil",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Système vidéosurveillance analogique ",
        categoryName: "Constructions",
      },
      {
        libelleService: "Detection caméra intelligent ",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Notification d'alerte sur smartphone ou tablette",
        categoryName: "Constructions",
      },
      {
        libelleService: "système interphone résidentiel",
        categoryName: "Constructions",
      },
      {
        libelleService: "Transfert d'appel sur smartphone",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lecteur de badge, clavier à code",
        categoryName: "Constructions",
      },
      {
        libelleService: "Système interphone Bâtiment Collectif",
        categoryName: "Constructions",
      },
      {
        libelleService: "Centrale interphone connectée en GPRS",
        categoryName: "Constructions",
      },
      {
        libelleService: "Gestion de site et contrôle à distance",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation Borne de Recharge particulier",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Borne de recharge réglable jusqu'a 22kw",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Eligible crédit d'impôt",
        categoryName: "Constructions",
      },
      {
        libelleService: "Pilotage energitique de la recharge",
        categoryName: "Constructions",
      },
      {
        libelleService: "Respect des normes électriques IRVE",
        categoryName: "Constructions",
      },
      {
        libelleService: "Service maintenace Electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Terrassement pour Travaux électrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande de raccordement électrique à EDF",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Ouverture de compteur electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installatation d'un detecteur de fumée",
        categoryName: "Constructions",
      },
      {
        libelleService:
          "Installation d'une VMC (ventilation métaliique contrôlée)",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Remplacement de tableau electrique",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installation de radiateur electrique",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService:
          "Remplacement des circuits prises, interrupteurs, lumiéres, cables, coffret de communication et prises RJ45",
        categoryName: "Constructions",
      },
      {
        libelleService: "Nettoyage intérieur de la voiture",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Nettoyage extérieur de la voiture",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Demande de rdv à la Mairie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Demande d'information à la Mairie",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire appel à un avocat",
        categoryName: "Constructions",
      },
      {
        libelleService: "Contentieux en droit immobilier",
        categoryName: "Constructions",
      },
      {
        libelleService: "Contentieux sur un permis de construire",
        categoryName: "Constructions",
      },
      {
        libelleService: "Couper des arbres",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faire un devis pour élager des arbres",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Abattage d'arbres",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Arbres dangereeuix",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Refaire le bardeau",
        categoryName: "Prestations extérieures",
      },
      {
        libelleService: "Refaire un mur",
        categoryName: "Constructions",
      },
      {
        libelleService: "Renover des volets en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Changer des volets en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Installer des volets en bois",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose de marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Depose et repose de marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Fabriquer une table en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Renover du marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Décoration en marbre",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Colonne en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Escalier en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Plan de travail en marbre",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Terrasse en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Carrelage en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Faience en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Lavabo en marbre",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Habillage en marbre",
        categoryName: "Constructions",
      },
      {
        libelleService: "Installer des lambrequins",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Rénover des lambrequins",
        categoryName: "Prestations intérieures",
      },
      {
        libelleService: "Pose et depose de lambrequins",
        categoryName: "Prestations intérieures",
      },
    ];

    // Mise à jour des services avec categoryId
    for (const classification of serviceClassifications) {
      const category = await prisma.category.findFirst({
        where: { name: classification.categoryName },
      });

      if (!category) {
        console.warn(
          `⚠️ Catégorie non trouvée : ${classification.categoryName}`
        );
        continue;
      }

      // Trouver le service par son libellé d'abord
      const service = await prisma.service.findFirst({
        where: { libelle: classification.libelleService },
      });

      if (!service) {
        console.warn(
          `⚠️ Service non trouvé : ${classification.libelleService}`
        );
        continue;
      }

      // Mettre à jour en utilisant l'ID du service
      await prisma.service.update({
        where: { id: service.id },
        data: { categoryId: category.id },
      });

      console.log(
        `➕ Catégorie "${classification.categoryName}" ajoutée au service "${classification.libelleService}"`
      );
    }

    console.log("🌿 Seeding terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création des donnes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
