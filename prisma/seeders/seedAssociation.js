import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding database with provided data...");

    // =======================
    // ASSOCIATIONS MÉTIER-SERVICE
    // =======================
    const associationsData = [
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Agencement de votre salon",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Agencement Intérieur d'un bien immobilier",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Home staging",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Projet de rénovation",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Rénover l'intérier d'un bien immobilier",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Rénover l'intérieur d'une maison",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Rénover l'intérieur d'un appartement",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Rénover une cuisine intérieure",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Conception de plan 2D et 3D",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Demand de devis pour un plan de maison 2D",
      },
      {
        metierLibelle: "Agenceur (euse) - Désigner d'intérieur",
        serviceLibelle: "Demande de devis pour un plan de maison 3D",
      },
      {
        metierLibelle: "Concepteur",
        serviceLibelle: "Réalisation de plan 2D et 3D",
      },
      {
        metierLibelle: "Agent de nettoyage - Propreté",
        serviceLibelle: "Nettoyage du jardin",
      },
      {
        metierLibelle: "Agent de nettoyage - Propreté",
        serviceLibelle: "Nettoyer un Appartement",
      },
      {
        metierLibelle: "Agent de nettoyage - Propreté",
        serviceLibelle: "Nettoyer un local",
      },
      {
        metierLibelle: "Agent de nettoyage - Propreté",
        serviceLibelle: "Nettoyer une maison",
      },
      {
        metierLibelle: "Agent de nettoyage - Propreté",
        serviceLibelle: "Nettoyer une résidence",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Entretien d'extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Installer un extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Jetter un extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Changer un extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Achat d'extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Acheter un extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Maintenance annuelle d'extincteurs",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Maintenance d'extincteur",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Mise en conformité des extincteurs",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Désenfumage",
      },
      {
        metierLibelle: "Agence Incendie - Sécurité",
        serviceLibelle: "Installation éclairage de sécurité",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Demande d'estimation d'un bien immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Louer un bien immobilier ",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Demander une conseil immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre un bien immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Recherche d'un bien immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Achat d'un projet immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Achat d'un bien immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre une maison neuve",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre un appartement ",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre un immeuble",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre un local professionnel",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre un local commercial",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Vendre une villa",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Demande de location",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Location d'une villa",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Location d'un appartement",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Location d'un local commercial",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Demander conseil à un agent immobilier",
      },
      {
        metierLibelle: "Agent Immobilier - Administrateur de biens ",
        serviceLibelle: "Location d'un local professionnel",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installation de prises électriques",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installation de panel LED",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Remplacement de prises électriques",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Pose de prises électriques",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Travaux d'électricité",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Réparer le compteur électrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Rénovation de l'électricité de la maison",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Intervention rapide électricité",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Mise en conformité électrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Réaliser un diagnostic électrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Mises aux normes électriques",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Conception electrique tertiaire",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Pose brasseur d'air",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Pose de luminaire",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Dépannage électrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installation éclairage de sécurité",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Ouverture de compteur electrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Service maintenace Electrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Raccordement electrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Demande de raccordement électrique à EDF",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle:
          "Installation d'une VMC (ventilation métaliique contrôlée)",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installatation d'un detecteur de fumée",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Respect des normes électriques IRVE",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Pilotage energitique de la recharge",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installation Borne de Recharge particulier",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Borne de recharge réglable jusqu'a 22kw",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Remplacement de tableau electrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Installation de radiateur electrique",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle:
          "Remplacement des circuits prises, interrupteurs, lumiéres, cables, coffret de communication et prises RJ45",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Changer de carrelage",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Dépose et pose d'un carrelage",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Depose et repose de carrelage sol",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Depose et repose de carrelage Mural",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Dépose et repose de carrelage imitation parquet",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Pose de joints lavabo, évier, douche, carrelage..",
      },
      {
        metierLibelle: "Carreleur",
        serviceLibelle: "Pose Carrelage",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Travaux de peinture extérieur",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Travaux de peinture intérieur",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Ponçage et peinture",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un bureau",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une cave",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un local",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un studio",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un garage",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une cuisine",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une varangue",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un mur",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre la façade d'un bâtiment",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une toiture",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre un appartement",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une maison",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre une terrasse",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre villa",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Repeindre des escaliers",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Entretien ascenseur",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Installer un ascenseur",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Réparer un ascenseur",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Moderniser un ascenseur",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Rénovation d'un ascenseur",
      },
      {
        metierLibelle: "Ascensoriste",
        serviceLibelle: "Réparer une cage d'ascenseur",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Assurance d'appartement",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Assurance emprunteur",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Demande d'assurance maison",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Assurance Locataire",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Assurance Propriétaire",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Attestation d'assurance habitation",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Prendre une assurance habitation",
      },
      {
        metierLibelle: "Assureur",
        serviceLibelle: "Assurance vie",
      },
      {
        metierLibelle: "Conseiller Assurance",
        serviceLibelle: "Assurance Décés",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Fuite d'eau douche - Salle de bains",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Localiser une fuite d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Localiser une fuite invisible",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Localiser une fuite dans une canalisation",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparer une fuite d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réaliser un devis pour une fuite d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Intervention rapide plomberie",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Travaux de plomberie",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Rénovation de plomberie",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation de réseau de plomberie ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Dépose et repose du réseau de plomberie",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Dépose et repose de tuyaux de plomberie",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Canalisation (pose, rempoacement, réparation)",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Evacuation des canalisations",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Evacuation des réseaux sanitaires",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation de canalisation ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Dépose et repose de canalisation",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparation sanitaires",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Mise en conformité sanitaires - assainissement",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installations sanitaires",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation toilette sanitaire ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Changer un joint robinet d'eau ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Changer un robinet",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation Robineterie complète",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "robinetterie à changer",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Faire des Branchement d'eau ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Récupérateur d'eau de plui",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation d'un chauffe eau electrique",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation d'un chauffe eau photovoltaique",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Installation d'un chauffe eau solaire",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Probleme de chauffage avec mon chauffe eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Problème de pression avec mon chaufffe eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Probleme de purge avec mon chauffe eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réalisation d'une nouvelle salle d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réaliser un devis pour un dégâts des eaux",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réaliser un devis pour une salle d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparation chauffe eau photovoltaique",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Refaire des banchements d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparation chauffe-eau ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparation chauffe-eau solaire",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparaton chauffe eau electrique",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Traitement de l'eau ",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Problème d'évacuation d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Réparer une infiltration d'eau",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle:
          "Localiser une infiltration sur une terrasse, balcon,varangue",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Localiser une infiltration sur la façade",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Détection d'infiltration intérieur et extérieur",
      },
      {
        metierLibelle: "Architecte ",
        serviceLibelle: "Demander conseil à un architecte",
      },
      {
        metierLibelle: "Aménageur Extérieur",
        serviceLibelle: "Construction d'un abri de jardin en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Création d'un abri de jardin",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Démolition d'un abri de jardin",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction de pergola persienne",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction d'un kiosque en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction local technique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction de terrasse en bois exotique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction de terrasse en bois de pin",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction d'un abri de jardin en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Construction d'un studio de jardin en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Installer une pergola bioclimatique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Installer une Pergola Retractable",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Pergola Adossée en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Pergola Autoportée en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Poser une pergola en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Pergola plate en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser un devis pour une pergola bioclimatique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser un devis pour une pergola en aluminium",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser un devis pour une pergola en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser un devis pour une pergola métallique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser un devis pour une pergola retractable",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réaliser une pergola",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réparation pergola bioclimatique",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réparer une pergola",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réparer une pergola retractable",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Changer ma terrasse en composite",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Brossage de Terrasse",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Changement de terrasse en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Dégrisage de Terrasse",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Nettoyage de terrasse en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Ponçage de terrasse",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle:
          "Terrasse en bois avec des charges réparties sur carrelage ou béton",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Changement de Deck en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réalisation de caillebotis - Deck",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réparation d'un deck en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Dégraissage de Terrasse en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réalisation de terrasse en bois",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Réalisation de terrasse en composite",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle:
          "Terrasse en bois ave charges réparties sur une surface étanche",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle:
          "Terrasse en bois avec des charges réparties sur sol brut",
      },
      {
        metierLibelle: "Architecte Extérieur",
        serviceLibelle: "Terrasse en bois avec charges concentrées sur poteaux",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic termites",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réalier un Diagnostic Loi carrez ",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic amiante",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic complet",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: " diagnostic sur les mérules",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle:
          "diagnostic d'Etat des Servitudes Risques et d'Information sur les Sols",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic Plomb",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic Performance Energétique",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Réaliser un diagnostic électrique",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "Diagnostics pour la location d'un bien immobilier",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle: "DIagnostics pour la vente d'un bien immobilier",
      },
      {
        metierLibelle: "Diagnostiqueur",
        serviceLibelle:
          "Faire un devis pour des diagnostics d'un bien immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Etude de financement",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Faire une demande de financement",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Projet d'achat de maison",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Projet d'achat d'appartement ",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un projet immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un terrain",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un local professionnel",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un bien immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un appartement",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'une maison",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Achat d'un immeuble",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Assurance emprunteur",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Faire une demande de crédit immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Demande de crédit immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Rachat de crédit",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Faire racheter son crédit",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Faire un crédit conso",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Demande de prêt immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Obtenir un prêt immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Faire une demande de prêt immobilier",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Assurance vie",
      },
      {
        metierLibelle: "Courtier",
        serviceLibelle: "Assurance Décés",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Etablir un bornage ",
      },
      {
        metierLibelle: "Bureau d'étude",
        serviceLibelle: "Diviser une parcelle de terrain",
      },
      {
        metierLibelle: "Architecte ",
        serviceLibelle: "Faire une division de parcelle",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Poser des bornes sur une parcelle",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Poser des bornes (bornages)",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Faire un devis pour un contre-bornage",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Faire un contre-bornage",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Réaliser une déclaration préalable",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Faire une divison pour une déclaration préalable",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Diviser une parcelle de terrain",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Faire une division de parcelle",
      },
      {
        metierLibelle: "Géomètre",
        serviceLibelle: "Faire un devis pour une division de terrain",
      },
      {
        metierLibelle: "Agent d'état des lieux",
        serviceLibelle: "Rédiger un état des lieux de sortie",
      },
      {
        metierLibelle: "Agent d'état des lieux",
        serviceLibelle: "Rédiger un état des lieux d'entrée",
      },
      {
        metierLibelle: "Agent d'état des lieux",
        serviceLibelle: "Faire un état des lieux d'entrée ",
      },
      {
        metierLibelle: "Agent d'état des lieux",
        serviceLibelle:
          "Devis pour faire un état des lieux d'entrée et de sortie (suivit)",
      },
      {
        metierLibelle: "Viabilisateur",
        serviceLibelle: "Viabilisation (raccordement égout, eau, electritié, )",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccordement electrique",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccordement internet",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccordement des réseaux ",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccordement assainissement",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccorder un terrain ",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccorder un terrain au tout à l'égoût",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Raccorder un terrain à l'eau potable",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Fouille de terrain",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Mettre à niveau un terrain ",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Nivellement de terrain",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Réaliser un devis pour une fouille de terrain",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Réhaussement de terrain",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Démolition d'un mur de séparation",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Réaliser un mur de moellon (à joint ou à sec)",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Réaliser un mur de soutennement",
      },
      {
        metierLibelle: "Entreprise deViabilistation, VRD, Terrassement",
        serviceLibelle: "Réaliser un mur en bloc",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Abbatage",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Elagage",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Défrichage ",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Réaliser un devis pour un défrichage",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Réaliser un devis pour un abbatage",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Nettoyer un terrain",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Changer le moteur de ma piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Chercher une fuite dans une piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Réparer le moteur de ma piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Réparer ma coque de piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Installer une cascade dans la piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Réparer une cascade piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Réparer des lames de piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Refaire l'enduit de la piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Chauffage piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Réparation filtre piscine",
      },
      {
        metierLibelle: "Pisciniste",
        serviceLibelle: "Entretien filtre piscine",
      },
      {
        metierLibelle: "Technicien d'équipements Piscine",
        serviceLibelle: "Sécurité Piscine (Alarme, Barrière)",
      },
      {
        metierLibelle: "Technicien d'équipements Piscine",
        serviceLibelle: "Matériel d'entretien (filtration, local technique)",
      },
      {
        metierLibelle: "Domoticien",
        serviceLibelle: "Sécurité Piscine (Alarme, Barrière)",
      },
      {
        metierLibelle: "Monteur et Installateur en Domotique",
        serviceLibelle: "Mettre une alarme",
      },
      {
        metierLibelle: "Installateur(trice) d'alarme",
        serviceLibelle: "Installer une alarme ",
      },
      {
        metierLibelle: "Domoticien",
        serviceLibelle: "Réparer une alarme ",
      },
      {
        metierLibelle: "Domoticien",
        serviceLibelle: "Installer une carméra de surveillance",
      },
      {
        metierLibelle: "Monteur et Installateur en Domotique",
        serviceLibelle:
          "Pose de caméra de surveillance complète piloter par GSM",
      },
      {
        metierLibelle: "Monteur et Installateur en Domotique",
        serviceLibelle: "Réparer une caméra de surveillance",
      },
      {
        metierLibelle: "Monteur et Installateur en Domotique",
        serviceLibelle: "Domotique",
      },
      {
        metierLibelle: "Domoticien",
        serviceLibelle: "Installer des détecteurs de mouvements",
      },
      {
        metierLibelle: "Domoticien",
        serviceLibelle: "Réparer un détecteur de mouvements",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Pose de placo",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Installer une cloison en plaquo",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Pose de plâtres",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Cré une cloison de plâtre",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Refaire un plafond en plâtre ",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Depose et repose d'équerre d'etanchéité",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Etancheité liquide",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Pose d'équerre etanche",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Réaliser un devis pour une etancheité",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Etancheité toiture terrasse",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Etancheité toiture varangue",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Etancheité toiture balcon",
      },
      {
        metierLibelle: "Etancheur",
        serviceLibelle: "Etancheité au plafond à refaire",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Conception de cuisine",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Cuisine pré-fabriquée",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Dépose et repose de cuisine",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Fabrication de cuisine ",
      },
      {
        metierLibelle: "Concepteur",
        serviceLibelle: "Poser une cuisine",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Refaire une cuisine",
      },
      {
        metierLibelle: "Architected Intérieur",
        serviceLibelle: "Réaliser un îlot central de cuisine",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Réfection complète avec démolition de la cuisine ",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Construire une cuisine extérieure",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Installer une cuisine extérieure",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Rénover une cuisine extérieure",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Rénover une cuisine intérieure",
      },
      {
        metierLibelle: "Cuisiniste",
        serviceLibelle: "Modernisée une cuisine ",
      },
      {
        metierLibelle: "Déssinateur",
        serviceLibelle: "Demande de Permis de construire",
      },
      {
        metierLibelle: "Déssinateur en bâtiment",
        serviceLibelle: "Déposer un permis de construire",
      },
      {
        metierLibelle: "Bureau d'étude",
        serviceLibelle: "Conception de plan 2D et 3D",
      },
      {
        metierLibelle: "Architecte ",
        serviceLibelle: "Demand de devis pour un plan de maison 2D",
      },
      {
        metierLibelle: "Architected Intérieur",
        serviceLibelle: "Demande de devis pour un plan de maison 3D",
      },
      {
        metierLibelle: "Monteur et Installateur de Jaccuzi",
        serviceLibelle: "Entretien jaccuzi",
      },
      {
        metierLibelle: "Monteur et Installateur de Jaccuzi",
        serviceLibelle: "Réparation jaccuzi",
      },
      {
        metierLibelle: "Monteur et Installateur de Jaccuzi",
        serviceLibelle: "Installer un Jaccuzi",
      },
      {
        metierLibelle: "Monteur et Installateur de Jaccuzi",
        serviceLibelle: "Réparer un Jaccuzi",
      },
      {
        metierLibelle: "Monteur et Installateur de SPA",
        serviceLibelle: "Entretien SPA",
      },
      {
        metierLibelle: "Monteur et Installateur de SPA",
        serviceLibelle: "Réparer un SPA",
      },
      {
        metierLibelle: "Monteur et Installateur de SPA",
        serviceLibelle: "Installer un SPA",
      },
      {
        metierLibelle: "Monteur et Installeur de Hammam",
        serviceLibelle: "Installer un Hamman",
      },
      {
        metierLibelle: "Monteur et Installeur de Hammam",
        serviceLibelle: "Réparer un Hamman",
      },
      {
        metierLibelle: "Monteur et Installeur de Hammam",
        serviceLibelle: "Entretien Hammam",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Entretien de jardin régulier ou occasionnel",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Jardinage",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Nettoyage du jardin",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Travaux de jardinnage",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Installer des dalles dans le jardin",
      },
      {
        metierLibelle: "Jardinier",
        serviceLibelle: "Nettoyer un jardin",
      },
      {
        metierLibelle: "Monteur en Installation de fosse septique",
        serviceLibelle: "Entretien fosse septique",
      },
      {
        metierLibelle: "Monteur en Installation de fosse septique",
        serviceLibelle: "Vidanger une fosse septique",
      },
      {
        metierLibelle: "Monteur en Installation de fosse septique",
        serviceLibelle: "Fourniture et livraison de Micro-station",
      },
      {
        metierLibelle: "Monteur en Installation de fosse septique",
        serviceLibelle: "Mini Station d'épuration",
      },
      {
        metierLibelle: "Monteur en Installation de fosse septique",
        serviceLibelle: "Livraison station d'épuration",
      },
      {
        metierLibelle: "Soudeur",
        serviceLibelle: "Travaux de soudure",
      },
      {
        metierLibelle: "Soudeur",
        serviceLibelle: "Réaliser de la soudure",
      },
      {
        metierLibelle: "Soudeur",
        serviceLibelle: "Devis pour soudure d'éléments",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Lancer une procédure d'explusion",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Lancer une procédue d'expropriation",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Lancer une prodécure d'impayé",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Lancer un contentieux travaux",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Lancer un contentieux immobilier",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Rédiger un compromis de vente",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Crée une SCI",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Faire appel à un avocat",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Contentieux en droit immobilier",
      },
      {
        metierLibelle: "Avocat",
        serviceLibelle: "Contentieux sur un permis de construire",
      },
      {
        metierLibelle: "Frigoriste",
        serviceLibelle: "Installation d'un système frigorifique",
      },
      {
        metierLibelle: "Frigoriste",
        serviceLibelle: "Commander un frigo",
      },
      {
        metierLibelle: "Frigoriste",
        serviceLibelle: "Réparer un frigo",
      },
      {
        metierLibelle: "Frigoriste",
        serviceLibelle: "Entretien d'un frigo",
      },
      {
        metierLibelle: "Réparateur d'appareil éléctroménager",
        serviceLibelle: "Réparation machine à laver",
      },
      {
        metierLibelle: "Réparateur d'appareil éléctroménager",
        serviceLibelle: "Réparer une machine à laver",
      },
      {
        metierLibelle: "Vendeur - Commercant ",
        serviceLibelle: "Livraison d'une machine à laver",
      },
      {
        metierLibelle: "Réparateur d'appareil éléctroménager",
        serviceLibelle: "Réparer un lavevaisselle",
      },
      {
        metierLibelle: "Vendeur - Commercant ",
        serviceLibelle: "Livraison d'un lave-vaisselle",
      },
      {
        metierLibelle: "Vidangeur",
        serviceLibelle: "Vidanger une fosse septique",
      },
      {
        metierLibelle: "Vidangeur",
        serviceLibelle: "Vidange bac à graisse",
      },
      {
        metierLibelle: "Vidangeur",
        serviceLibelle: "Entretien bac à graisse",
      },
      {
        metierLibelle: "Vidangeur",
        serviceLibelle: "Entretien fosse septique",
      },
      {
        metierLibelle: "Miroitier",
        serviceLibelle: "Dépose et repose de miroir",
      },
      {
        metierLibelle: "Miroitier",
        serviceLibelle: "Pose de miroir",
      },
      {
        metierLibelle: "Dératiseur - Désinfecteur",
        serviceLibelle: "faire une dératisation",
      },
      {
        metierLibelle: "Dératiseur - Désinfecteur",
        serviceLibelle: "Traitement contre les rats",
      },
      {
        metierLibelle: "Dératiseur - Désinfecteur",
        serviceLibelle: "Réaliser un devis pour une dératisation",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Entretien toiture ",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Localiser une infiltration sur une toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Réparer la toiture et sur-toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Repeindre une toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Réparer une fuite d'eau de toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Recherche une fuite sur la toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Réisoler une toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Etancheité toiture terrasse",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Etancheité toiture varangue",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Rénovation couverture toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Entretien couverture toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Réparation couverture toiture",
      },
      {
        metierLibelle: "Réparateur Toiture ",
        serviceLibelle: "Installation couverture toiture",
      },
      {
        metierLibelle: "Vendeur de Carrelage",
        serviceLibelle: null,
      },
      {
        metierLibelle: "Quincaillier",
        serviceLibelle: "Acheter des faiences",
      },
      {
        metierLibelle: "Quincaillier",
        serviceLibelle: "Acheter des pierres",
      },
      {
        metierLibelle: "Sérrurier",
        serviceLibelle: "Changer une sérrure",
      },
      {
        metierLibelle: "Sérrurier",
        serviceLibelle: "Sérrure cassée",
      },
      {
        metierLibelle: "Sérrurier",
        serviceLibelle: "Porte d'entrée bloquée",
      },
      {
        metierLibelle: "Sérrurier",
        serviceLibelle: "Ouvrir une porte d'entrée ",
      },
      {
        metierLibelle: "Sérrurier",
        serviceLibelle: "Acheter et pose d'une sérrure",
      },
      {
        metierLibelle:
          "Monteur en Installations de volet Persiennes et jalousies",
        serviceLibelle: "Poser une jalousie",
      },
      {
        metierLibelle: "Monteur et Installateur de Parquet",
        serviceLibelle: "Chauffage au sol (parquet chauffant)",
      },
      {
        metierLibelle: "Parquetteur",
        serviceLibelle:
          "Vitrification d'un parquet d'intérieur ou extérieur en bois",
      },
      {
        metierLibelle: "Charpentier bois",
        serviceLibelle: "Réparer et poncer mon parquet",
      },
      {
        metierLibelle: "Menuisier Bois et Charpente",
        serviceLibelle:
          "Rénovation des parquets d'intérieur ou extérieur en bois massif",
      },
      {
        metierLibelle: "Désamianteur",
        serviceLibelle: "Réaliser un diagnostic amiante",
      },
      {
        metierLibelle: "Désamianteur",
        serviceLibelle: "Réaliser un désamiantage",
      },
      {
        metierLibelle: "Désamianteur",
        serviceLibelle: "Faire un désamiantage",
      },
      {
        metierLibelle: "Cableur",
        serviceLibelle: "Poser des cables",
      },
      {
        metierLibelle: "Association",
        serviceLibelle: "Donner des meubles",
      },
      {
        metierLibelle: "Association",
        serviceLibelle: "Donner du mobilier",
      },
      {
        metierLibelle: "Association",
        serviceLibelle: "Donner des appareils électroménager",
      },
      {
        metierLibelle: "Association",
        serviceLibelle:
          "Récuperer des meubles, mobilier, appareils électroménager",
      },
      {
        metierLibelle: "Architecte Intérieur",
        serviceLibelle: "Démolition d'un mur porteur",
      },
      {
        metierLibelle: "Bureau d'étude",
        serviceLibelle: "Ouverture dans un mur porteur",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Création d'une allée bétonnée",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Refaire un plafond en béton",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "pose de dalle béton sur le sol",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Dépose et repose de dalle béton au sol",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Dépose et repose de béton ciré",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Feraillage à béton",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Fabrication de cuisine ",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Cuisine pré-fabriquée",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Fabrication d'escalier",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Fabrication de porte d'entrée",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Fabrication de meubles",
      },
      {
        metierLibelle: "Ebéniste",
        serviceLibelle: "Meubles sur mesure",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Dépose et repose d'enduit",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Pose d'enduit",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Poser un enduit ",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Reprendre enduit mur + peinture",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Reprise d'enduit ",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Refaire l'enduit de la piscine",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Changer l'enduit de la piscine",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Installer un enduit pour la piscine",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Remise en état du jardin",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Jardinage",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Entretien de jardin régulier ou occasionnel",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Livraison d'arbustes",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Commander des fleurs",
      },
      {
        metierLibelle: "Fleuriste",
        serviceLibelle: "Livraison de Fleurs",
      },
      {
        metierLibelle:
          "Monteur et Installateur de Grilles et Rideaux métalliques",
        serviceLibelle: "Dépannage de volet aluminium",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Dépannage de volet métallique",
      },
      {
        metierLibelle: "Charpentier Métallique",
        serviceLibelle: "Fabrication de volet aluminium et métallique",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Motorisation de volet roulant ",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Pose de volet aluminium",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Pose de volet métallique",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Poser des volets coulissant",
      },
      {
        metierLibelle:
          "Monteur en Installations de volet Persiennes et jalousies",
        serviceLibelle: "Poser des volets persiennes",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Réparer le moteur du volet roulant",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Réparer des grilles de sécurité",
      },
      {
        metierLibelle: "Monteur en installation de Store - Volet Roullant",
        serviceLibelle: "Réparation grille de protection métallique",
      },
      {
        metierLibelle: "Facadier",
        serviceLibelle: "Réalisation d'une grille de protection métallique",
      },
      {
        metierLibelle: "Charpentier Métallique",
        serviceLibelle: "Installer des grilles de sécurité",
      },
      {
        metierLibelle: "Menuisier Aluminium et Alliage",
        serviceLibelle: "Dépose et repose de grille de fenêtre",
      },
      {
        metierLibelle: "Menuisier métalliques",
        serviceLibelle: "Création/ Réalisation de grilles de fenêtre",
      },
      {
        metierLibelle: "Menuisier Aluminium et Alliage",
        serviceLibelle: "Changer des grilles de sécurité",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Changer mon film solaires",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Depose et repose d'un kit solaire avec stockage",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Depose et repose d'un kit solaire sans stockage",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Entretien du kit solaire",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Installer un film solaire",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Réparer mon kit solaire ",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Réparer mon film solaires",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Installer un kit Solaire avec stockage",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Installer un kit Solaire sans stockage",
      },
      {
        metierLibelle: "Monnteur en Installation de panneau Solaire",
        serviceLibelle: "Poser une borne solaire",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "RJ45",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "DCL",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "PC 16A",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Spots à changer",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Renovation tableau",
      },
      {
        metierLibelle: "Electricien",
        serviceLibelle: "Interrupteur à changer ",
      },
      {
        metierLibelle: "Vitrier",
        serviceLibelle: "Installer des gardes corps en verre",
      },
      {
        metierLibelle: "Vitrier",
        serviceLibelle: "Installer une cloison en verre",
      },
      {
        metierLibelle: "Vitrier",
        serviceLibelle: "Pose verriere",
      },
      {
        metierLibelle: "Vitrier",
        serviceLibelle: "Poser une barriere en verre",
      },
      {
        metierLibelle: "Peintre",
        serviceLibelle: "Peinture ",
      },
      {
        metierLibelle: "Monteur en installation Sanitaire",
        serviceLibelle: "Pose porte galandage",
      },
      {
        metierLibelle: "Monteur en installation Sanitaire",
        serviceLibelle: "Pose WC + Vasque",
      },
      {
        metierLibelle: "Installateur - Installatrice en Sanitaires",
        serviceLibelle: "Pose WC",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Depose WC + vasque",
      },
      {
        metierLibelle: "Plombier",
        serviceLibelle: "Depose WC ",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Enduit Lissage sur mur Existant",
      },
      {
        metierLibelle: "Enduiseur",
        serviceLibelle: "Enduit lissage + création de mur ",
      },
      {
        metierLibelle: "Plaquiste",
        serviceLibelle: "Plafond placo",
      },
      {
        metierLibelle: "Platrier - Plaquiste",
        serviceLibelle: "Cloison Placo",
      },
      {
        metierLibelle: "Plaquiste",
        serviceLibelle: "Demolition Cloison + plafond ",
      },
      {
        metierLibelle: "Plaquiste",
        serviceLibelle: "Demolition Cloison",
      },
      {
        metierLibelle: "Plaquiste",
        serviceLibelle: "Installer une cloison en plaquo",
      },
      {
        metierLibelle: "Plaquiste",
        serviceLibelle: "Demolition Cloison + plafond + wc et evacuation",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Faire un constat d'huissier",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Faire un constat d'huissier pour permis de construire",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Etablir un constat d'affichage",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Afficher un permis de construire",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Faire constater un depot de permis",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Envoyer une assignation",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Demander conseil à un huissier de justice",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Faire une signification par un huissier de justice",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle:
          "Faire appel à un huissier pour un recouvrement amiable",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Constat d'huissier pour un conflit de voisinage",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Constat d'huissier pour un etat des lieux",
      },
      {
        metierLibelle: "Huissier de justice",
        serviceLibelle: "Constat d'huissier pour des dégats",
      },
      {
        metierLibelle: "Laveur Auto/voiture à domicile",
        serviceLibelle: "nettoyage de voiture à domlicile",
      },
      {
        metierLibelle: "Laveur Auto/voiture à domicile",
        serviceLibelle: "Faire nettoyer sa voiture chez soi",
      },
      {
        metierLibelle: "Laveur Auto/voiture à domicile",
        serviceLibelle: "Nettoyage intérieur de la voiture",
      },
      {
        metierLibelle: "Laveur Auto/voiture à domicile",
        serviceLibelle: "Nettoyage extérieur de la voiture",
      },
      {
        metierLibelle: "Mairie",
        serviceLibelle: "Demande de rdv à la Mairie",
      },
      {
        metierLibelle: "Mairie",
        serviceLibelle: "Demande d'information à la Mairie",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Couper des arbres",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Faire un devis pour élager des arbres",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Abattage d'arbres",
      },
      {
        metierLibelle: "Entreprise Abatatage, elagage, defrichage",
        serviceLibelle: "Arbres dangereeuix",
      },
      {
        metierLibelle: "Bardeur",
        serviceLibelle: "Refaire le bardeau",
      },
      {
        metierLibelle: "Maçon",
        serviceLibelle: "Refaire un mur",
      },
      {
        metierLibelle: "Menuisier Bois et Charpente",
        serviceLibelle: "Installer des volets en bois",
      },
      {
        metierLibelle: "Charpentier bois",
        serviceLibelle: "Changer des volets en bois",
      },
      {
        metierLibelle: "Menuisier Bois et Charpente",
        serviceLibelle: "Renover des volets en bois",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Renover du marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Fabriquer une table en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Depose et repose de marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Pose de marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Décoration en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Colonne en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Escalier en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Plan de travail en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Terrasse en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Carrelage en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Faience en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Lavabo en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Habillage en marbre",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Installer des lambrequins",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Rénover des lambrequins",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Pose et depose de lambrequins",
      },
      {
        metierLibelle: "Marbriers",
        serviceLibelle: "Réparation chauffe eau photovoltaique",
      },
    ];

    // Clean up existing associations
    await prisma.metierService.deleteMany({});

    // Récupérer tous les métiers et services existants
    const metiers = await prisma.metier.findMany();
    const services = await prisma.service.findMany();

    // Créer des maps pour faciliter la recherche
    const metiersMap = {};
    const servicesMap = {};

    metiers.forEach((metier) => {
      metiersMap[metier.libelle] = metier.id;
    });

    services.forEach((service) => {
      servicesMap[service.libelle] = service.id;
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const assoc of associationsData) {
      const metierId = metiersMap[assoc.metierLibelle];
      const serviceId = servicesMap[assoc.serviceLibelle];

      if (metierId && serviceId) {
        // Vérifier si l'association existe déjà pour éviter les doublons
        const existingAssociation = await prisma.metierService.findUnique({
          where: {
            metierId_serviceId: {
              metierId,
              serviceId,
            },
          },
        });

        if (!existingAssociation) {
          await prisma.metierService.create({
            data: {
              metierId,
              serviceId,
            },
          });
          console.log(
            `🔗 Association créée : ${assoc.metierLibelle} -> ${assoc.serviceLibelle}`
          );
          createdCount++;
        } else {
          console.log(
            `ℹ️ Association déjà existante : ${assoc.metierLibelle} -> ${assoc.serviceLibelle}`
          );
        }
      } else {
        console.warn(
          `⚠️ Association sautée (non trouvé) : ${assoc.metierLibelle} -> ${assoc.serviceLibelle}`
        );
        skippedCount++;
      }
    }

    console.log(`🌿 Seeding terminé avec succès !`);
    console.log(`📊 Statistiques :`);
    console.log(`   - Associations créées : ${createdCount}`);
    console.log(`   - Associations ignorées : ${skippedCount}`);
    console.log(`   - Total traité : ${associationsData.length}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création des données:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});