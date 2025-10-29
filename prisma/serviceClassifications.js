import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try{
    console.log("🌱 Seeding database with provided data...");

    // =======================
    // Classification des services
    // =======================

    const serviceClassifications = [
      { id: 1, categoryId: "Constructions" }, // diagnostic sur les mérules
      { id: 4, categoryId: "Prestations intérieures" }, // Acheter des faiences
      { id: 5, categoryId: "Constructions" }, // Acheter des pierres
      { id: 7, categoryId: "Constructions" }, // Agencement d'un garage
      { id: 8, categoryId: "Prestations intérieures" }, // Agencement de votre salon
      { id: 9, categoryId: "Prestations extérieures" }, // Agencement Extérieur
      { id: 10, categoryId: "Prestations intérieures" }, // Agencement Intérieur d'un bien immobilier
      { id: 12, categoryId: "Prestations intérieures" }, // Assurance d'appartement
      { id: 20, categoryId: "Constructions" }, // Bardage en aluminium
      { id: 21, categoryId: "Constructions" }, // Bardage en bois
      { id: 22, categoryId: "Prestations extérieures" }, // Brise soleil coulissant
      { id: 23, categoryId: "Constructions" }, // Brossage de Terrasse
      { id: 24, categoryId: "Constructions" }, // Casser et refaire un îlot central
      { id: 25, categoryId: "Constructions" }, // Changement de Deck en bois
      { id: 26, categoryId: "Prestations intérieures" }, // Changement de décoration de chambre
      { id: 27, categoryId: "Constructions" }, // Changement de terrasse en bois
      { id: 29, categoryId: "Prestations intérieures" }, // Changer de lavabo
      { id: 30, categoryId: "Constructions" }, // Changer de piscine
      { id: 31, categoryId: "Constructions" }, // Changer des grilles de sécurité
      { id: 32, categoryId: "Constructions" }, // Changer le moteur de ma piscine
      { id: 33, categoryId: "Prestations intérieures" }, // Changer les faiences de la cuisine
      { id: 34, categoryId: "Prestations intérieures" }, // Changer les faiences de la douche
      { id: 35, categoryId: "Prestations intérieures" }, // Changer les faiences de la salle de bains
      { id: 36, categoryId: "Constructions" }, // Changer ma terrasse en composite
      { id: 37, categoryId: "Prestations extérieures" }, // Changer ma voile d'ombrage
      { id: 38, categoryId: "Prestations intérieures" }, // Changer mon compteur d'électricité
      { id: 39, categoryId: "Prestations intérieures" }, // Changer mon faux plafonds
      { id: 40, categoryId: "Prestations extérieures" }, // Changer mon film solaires
      { id: 41, categoryId: "Constructions" }, // Changer mon store extérieur
      { id: 42, categoryId: "Constructions" }, // Changer mon store intérieur
      { id: 43, categoryId: "Prestations intérieures" }, // Changer un joint robinet d'eau
      { id: 44, categoryId: "Prestations intérieures" }, // Changer un robinet
      { id: 45, categoryId: "Constructions" }, // Changer une bâche de pergola
      { id: 46, categoryId: "Constructions" }, // Changer une bâche de store déroulant
      { id: 48, categoryId: "Prestations extérieures" }, // Changer une gouttière
      { id: 50, categoryId: "Constructions" }, // Chercher une fuite dans une piscine
      { id: 51, categoryId: "Prestations extérieures" }, // Clôturer un Balcon
      { id: 54, categoryId: "Prestations intérieures" }, // Conception de cuisine
      { id: 55, categoryId: "Constructions" }, // Conception de plan 2D et 3D
      { id: 56, categoryId: "Constructions" }, // Construction d'un abri de jardin en bois
      { id: 57, categoryId: "Constructions" }, // Construction d'un cagibi
      { id: 58, categoryId: "Constructions" }, // Construction d'un kiosque en bois
      { id: 59, categoryId: "Constructions" }, // Construction d'un studio de jardin en bois
      { id: 60, categoryId: "Constructions" }, // Construction de pergola persienne
      { id: 61, categoryId: "Constructions" }, // Construction de terrasse en bois de pin
      { id: 62, categoryId: "Constructions" }, // Construction de terrasse en bois exotique
      { id: 63, categoryId: "Constructions" }, // Construire un garage
      { id: 64, categoryId: "Constructions" }, // Construire un meuble de salle de bains
      { id: 65, categoryId: "Constructions" }, // Construire une piscine
      { id: 66, categoryId: "Constructions" }, // Cré une cloison de plâtre
      { id: 67, categoryId: "Constructions" }, // Création / Réalisation de garde corps escalier d'intérieur
      { id: 68, categoryId: "Constructions" }, // Création d'un abri de jardin
      { id: 69, categoryId: "Constructions" }, // Création d'un banc
      { id: 70, categoryId: "Constructions" }, // Création d'une aire de jeux
      { id: 71, categoryId: "Constructions" }, // Création d'une allée bétonnée
      { id: 72, categoryId: "Constructions" }, // Création d'une allée d'accés
      { id: 73, categoryId: "Constructions" }, // Création/ Réalisation d'un garde corps en cable inox
      { id: 74, categoryId: "Constructions" }, // Création/ Réalisation d'un garde corps en tôle découpée
      { id: 75, categoryId: "Constructions" }, // Création/ Réalisation d'un garde corps en tôle perforée
      { id: 76, categoryId: "Constructions" }, // Création/ Réalisation d'une barrièr levante
      { id: 77, categoryId: "Constructions" }, // Création/ Réalisation d'une porte de garage basculante
      { id: 78, categoryId: "Constructions" }, // Création/ Réalisation d'une porte de garage coulissante
      { id: 79, categoryId: "Constructions" }, // Création/ Réalisation d'une porte de Hall d'entrée
      { id: 80, categoryId: "Constructions" }, // Création/ Réalisation de garde corps
      { id: 81, categoryId: "Constructions" }, // Création/ Réalisation de grilles de fenêtre
      { id: 82, categoryId: "Constructions" }, // Création/ Réalisation de Store Déroulants
      { id: 83, categoryId: "Constructions" }, // Création/ Réalisation de structure métallique
      { id: 84, categoryId: "Constructions" }, // Création/Réalisation d'un garde corps en acien
      { id: 86, categoryId: "Constructions" }, // Cuisine pré-fabriquée
      { id: 89, categoryId: "Constructions" }, // Décoration murale
      { id: 90, categoryId: "Prestations extérieures" }, // Défrichage
      { id: 91, categoryId: "Constructions" }, // Dégraissage de Terrasse en bois
      { id: 92, categoryId: "Constructions" }, // Dégrisage de Terrasse
      { id: 93, categoryId: "Constructions" }, // Demand de devis pour un plan de maison 2D
      { id: 94, categoryId: "Constructions" }, // Demande d'assurance maison
      { id: 95, categoryId: "Constructions" }, // Demande de devis pour un plan de maison 3D
      { id: 97, categoryId: "Constructions" }, // Demande de Permis de construire
      { id: 99, categoryId: "Prestations intérieures" }, // Déménager des affaires - meubles
      { id: 100, categoryId: "Constructions" }, // Démolition Charpente
      { id: 101, categoryId: "Constructions" }, // Démolition d'un abri de jardin
      { id: 102, categoryId: "Constructions" }, // Démolition d'un garage
      { id: 103, categoryId: "Constructions" }, // Démolition d'un mur de séparation
      { id: 104, categoryId: "Constructions" }, // Démolition d'un mur porteur
      { id: 105, categoryId: "Constructions" }, // Démolition d'une maison
      { id: 106, categoryId: "Constructions" }, // Démolition et construction d'une charpente
      { id: 107, categoryId: "Prestations intérieures" }, // Démontage de meuble
      { id: 110, categoryId: "Constructions" }, // Dépose et pose d'un carrelage
      { id: 111, categoryId: "Constructions" }, // Depose et repose d'appareils PMR
      { id: 112, categoryId: "Prestations intérieures" }, // Dépose et repose d'enduit
      { id: 113, categoryId: "Constructions" }, // Depose et repose d'équerre d'etanchéité
      { id: 114, categoryId: "Prestations intérieures" }, // Depose et repose d'un dressing
      { id: 115, categoryId: "Prestations extérieures" }, // Depose et repose d'un kit solaire avec stockage
      { id: 116, categoryId: "Prestations extérieures" }, // Depose et repose d'un kit solaire sans stockage
      { id: 117, categoryId: "Prestations extérieures" }, // Depose et repose de bande d'impermeabilisation de façade
      { id: 118, categoryId: "Prestations intérieures" }, // Dépose et repose de béton ciré
      { id: 119, categoryId: "Prestations extérieures" }, // Dépose et repose de canalisation
      { id: 120, categoryId: "Constructions" }, // Dépose et repose de carrelage
      { id: 121, categoryId: "Prestations intérieures" }, // Dépose et repose de carrelage imitation parquet
      { id: 122, categoryId: "Constructions" }, // Depose et repose de carrelage Mural
      { id: 123, categoryId: "Constructions" }, // Depose et repose de carrelage sol
      { id: 124, categoryId: "Prestations intérieures" }, // Dépose et repose de cuisine
      { id: 125, categoryId: "Constructions" }, // Dépose et repose de dalle béton au sol
      { id: 126, categoryId: "Constructions" }, // Depose et repose de faience
      { id: 127, categoryId: "Prestations intérieures" }, // Dépose et repose de faïence
      { id: 128, categoryId: "Constructions" }, // Dépose et repose de fibre végétale
      { id: 129, categoryId: "Constructions" }, // Dépose et repose de grille de fenêtre
      { id: 130, categoryId: "Constructions" }, // Dépose et repose de joints
      { id: 131, categoryId: "Prestations intérieures" }, // Dépose et repose de moquette
      { id: 132, categoryId: "Prestations intérieures" }, // Depose et repose de parquet
      { id: 133, categoryId: "Prestations intérieures" }, // Dépose et repose de parquet
      { id: 134, categoryId: "Prestations intérieures" }, // Dépose et repose de parquet massif
      { id: 135, categoryId: "Constructions" }, // Dépose et repose de porte d'entrée
      { id: 136, categoryId: "Prestations intérieures" }, // Dépose et repose de revêtement vinyle
      { id: 137, categoryId: "Prestations intérieures" }, // Dépose et repose de sol en liège
      { id: 138, categoryId: "Prestations intérieures" }, // Dépose et repose de stratifié
      { id: 139, categoryId: "Prestations intérieures" }, // Dépose et repose de toilettes
      { id: 140, categoryId: "Prestations intérieures" }, // Dépose et repose de tuyaux de plomberie
      { id: 141, categoryId: "Constructions" }, // Dépose et repose de Zellige
      { id: 142, categoryId: "Prestations intérieures" }, // Dépose et repose du réseau de plomberie
      { id: 143, categoryId: "Prestations intérieures" }, // Deposer et repose de plan de travail en boi
      { id: 145, categoryId: "Prestations intérieures" }, // Détection d'infiltration intérieur et extérieur
      { id: 146, categoryId: "Constructions" }, // Détruire une maison
      { id: 147, categoryId: "Prestations intérieures" }, // Détuires un faux plafonds
      { id: 148, categoryId: "Constructions" }, // diagnostic d'Etat des Servitudes Risques et d'Information sur les Sols
      { id: 150, categoryId: "Prestations intérieures" }, // Domotique
      { id: 154, categoryId: "Constructions" }, // Entretien annuel de bois
      { id: 155, categoryId: "Prestations intérieures" }, // Entretien ascenseur
      { id: 156, categoryId: "Prestations intérieures" }, // Entretien Climatisation
      { id: 157, categoryId: "Constructions" }, // Entretien d'un sol souple
      { id: 158, categoryId: "Prestations intérieures" }, // Entretien d'une VMC
      { id: 159, categoryId: "Prestations extérieures" }, // Entretien de jardin régulier ou occasionnel
      { id: 160, categoryId: "Constructions" }, // Entretien de Panel LED
      { id: 161, categoryId: "Prestations intérieures" }, // Entretien de parquet
      { id: 162, categoryId: "Constructions" }, // Entretien de store déroulant
      { id: 163, categoryId: "Prestations extérieures" }, // Entretien du kit solaire
      { id: 164, categoryId: "Constructions" }, // Entretien fosse septique
      { id: 165, categoryId: "Constructions" }, // Entretien jaccuzi
      { id: 166, categoryId: "Prestations extérieures" }, // Entretien toiture
      { id: 167, categoryId: "Prestations extérieures" }, // Etablir un bornage
      { id: 172, categoryId: "Constructions" }, // Fabrication d'escalier
      { id: 173, categoryId: "Constructions" }, // Fabrication de cuisine
      { id: 174, categoryId: "Constructions" }, // Fabrication de porte d'entrée
      { id: 175, categoryId: "Constructions" }, // Fabrication de volet aluminium et métallique
      { id: 177, categoryId: "Constructions" }, // faire un désamiantage
      { id: 178, categoryId: "Prestations intérieures" }, // Faire un dressing
      { id: 179, categoryId: "Constructions" }, // Faire un escalier en bois
      { id: 180, categoryId: "Constructions" }, // Faire un îlot central
      { id: 181, categoryId: "Constructions" }, // faire un traitement termites (contre les)
      { id: 182, categoryId: "Prestations intérieures" }, // Faire une chambre parentale
      { id: 183, categoryId: "Constructions" }, // Faire une cloisonnement
      { id: 186, categoryId: "Constructions" }, // faire une dératisation (mis en constructions car traitement)
      { id: 189, categoryId: "Constructions" }, // Fourniture et installation d'un visiophone
      { id: 190, categoryId: "Constructions" }, // Fourniture et installation d'une platine de rue
      { id: 192, categoryId: "Prestations intérieures" }, // Fuite d'eau douche - Salle de bains
      { id: 193, categoryId: "Constructions" }, // Garde corps vitre
      { id: 194, categoryId: "Constructions" }, // Garde corps vitrés et lumineux
      { id: 196, categoryId: "Prestations intérieures" }, // Installation Climatisation
      { id: 197, categoryId: "Constructions" }, // Installation d'appareils PMR
      { id: 198, categoryId: "Constructions" }, // Installation d'un chauffe eau electrique
      { id: 199, categoryId: "Constructions" }, // Installation d'un chauffe eau photovoltaique
      { id: 200, categoryId: "Constructions" }, // Installation d'un chauffe eau solaire
      { id: 201, categoryId: "Constructions" }, // Installation d'une borne de charge électrique
      { id: 202, categoryId: "Prestations extérieures" }, // Installation de canalisation
      { id: 203, categoryId: "Constructions" }, // Installation de nouvelles ouvertures
      { id: 204, categoryId: "Constructions" }, // Installation de panel LED
      { id: 205, categoryId: "Constructions" }, // Installation de portail electrique
      { id: 206, categoryId: "Constructions" }, // Installation de réseau d'alimentation
      { id: 207, categoryId: "Prestations intérieures" }, // Installation de réseau de plomberie
      { id: 208, categoryId: "Prestations intérieures" }, // Installation Robineterie complète
      { id: 209, categoryId: "Prestations intérieures" }, // Installation toilette sanitaire
      { id: 210, categoryId: "Constructions" }, // Installations sanitaires
      { id: 212, categoryId: "Constructions" }, // Installer des détecteurs de mouvements (sécurité, mis en constructions)
      { id: 213, categoryId: "Constructions" }, // Installer des gardes corps en verre
      { id: 214, categoryId: "Constructions" }, // Installer des grilles de sécurité
      { id: 215, categoryId: "Prestations intérieures" }, // Installer des lames vyniles
      { id: 216, categoryId: "Prestations extérieures" }, // Installer des pierres
      { id: 217, categoryId: "Prestations intérieures" }, // Installer des toilettes suspendues
      { id: 218, categoryId: "Prestations intérieures" }, // Installer des wc suspendus
      { id: 219, categoryId: "Prestations intérieures" }, // Installer un ascenseur
      { id: 220, categoryId: "Prestations intérieures" }, // Installer un dressing complet chambre parentale
      { id: 221, categoryId: "Prestations intérieures" }, // Installer un dressing pour enfant
      { id: 222, categoryId: "Prestations intérieures" }, // Installer un faux plafonds
      { id: 223, categoryId: "Prestations extérieures" }, // Installer un film solaire
      { id: 224, categoryId: "Prestations extérieures" }, // Installer un kit Solaire avec stockage
      { id: 225, categoryId: "Prestations extérieures" }, // Installer un kit Solaire sans stockage
      { id: 226, categoryId: "Prestations intérieures" }, // Installer un plan de travail en bois
      { id: 227, categoryId: "Prestations intérieures" }, // Installer un plan de travail en céramique
      { id: 228, categoryId: "Constructions" }, // Installer un store extérieur
      { id: 229, categoryId: "Constructions" }, // Installer un store intérieur
      { id: 230, categoryId: "Prestations intérieures" }, // Installer une alarme
      { id: 231, categoryId: "Prestations intérieures" }, // Installer une carméra de surveillance
      { id: 232, categoryId: "Prestations intérieures" }, // Installer une chambre parentale
      { id: 233, categoryId: "Constructions" }, // Installer une cloison en bambou
      { id: 234, categoryId: "Constructions" }, // Installer une cloison en plaquo
      { id: 235, categoryId: "Constructions" }, // Installer une cloison en plâtre
      { id: 236, categoryId: "Constructions" }, // Installer une cloison en verre
      { id: 237, categoryId: "Prestations extérieures" }, // Installer une gouttière
      { id: 238, categoryId: "Constructions" }, // Installer une pergola bioclimatique
      { id: 239, categoryId: "Constructions" }, // Installer une Pergola Retractable
      { id: 240, categoryId: "Prestations intérieures" }, // Installer une VMC
      { id: 241, categoryId: "Prestations extérieures" }, // Installer une voile d'ombrage
      { id: 242, categoryId: "Constructions" }, // Installtion d'un portail manuel
      { id: 244, categoryId: "Constructions" }, // Isoler la maison
      { id: 245, categoryId: "Prestations intérieures" }, // Isoler le plafond
      { id: 246, categoryId: "Constructions" }, // Isoler les murs et le plafond
      { id: 247, categoryId: "Constructions" }, // Isoler uniquement les murs de la maison
      { id: 248, categoryId: "Prestations extérieures" }, // Jardinage
      { id: 252, categoryId: "Prestations extérieures" }, // Localiser une infiltration sur la façade
      { id: 253, categoryId: "Constructions" }, // Localiser une infiltration sur une terrasse, balcon,varangue
      { id: 254, categoryId: "Prestations extérieures" }, // Localiser une infiltration sur une toiture
      { id: 255, categoryId: "Prestations extérieures" }, // Localiser une fuite dans une canalisation
      { id: 256, categoryId: "Prestations intérieures" }, // Location de toilettes
      { id: 258, categoryId: "Constructions" }, // Maison en osstature métallique
      { id: 260, categoryId: "Prestations intérieures" }, // Mettre une alarme
      { id: 261, categoryId: "Prestations intérieures" }, // Mettre une caméra
      { id: 262, categoryId: "Constructions" }, // mettre une nouvelle piscine
      { id: 263, categoryId: "Prestations intérieures" }, // Meubles en Bambou
      { id: 264, categoryId: "Prestations intérieures" }, // Meubles en bois
      { id: 265, categoryId: "Prestations intérieures" }, // Meubles salle de bains
      { id: 266, categoryId: "Constructions" }, // Mise en conformité électrique
      { id: 267, categoryId: "Prestations extérieures" }, // Mise en conformité sanitaires - assainissement
      { id: 268, categoryId: "Constructions" }, // Mises aux normes électriques
      { id: 269, categoryId: "Prestations intérieures" }, // Mobilier de douche
      { id: 270, categoryId: "Prestations extérieures" }, // Mobilier de jardin
      { id: 271, categoryId: "Prestations intérieures" }, // Mobilier de salle de bains
      { id: 272, categoryId: "Prestations intérieures" }, // Montage de meuble
      { id: 273, categoryId: "Constructions" }, // Motorisation de portail
      { id: 274, categoryId: "Constructions" }, // Motorisation de volet roulant
      { id: 275, categoryId: "Prestations extérieures" }, // Nettoyage de gouttière
      { id: 276, categoryId: "Constructions" }, // Nettoyage de terrasse en bois
      { id: 277, categoryId: "Prestations extérieures" }, // Nettoyage du jardin
      { id: 278, categoryId: "Prestations intérieures" }, // Nettoyage, brossage et application saturateur du parquet
      { id: 279, categoryId: "Prestations intérieures" }, // Nettoyer un Appartement
      { id: 280, categoryId: "Constructions" }, // Nettoyer un local
      { id: 281, categoryId: "Constructions" }, // Nettoyer une maison
      { id: 282, categoryId: "Constructions" }, // Nettoyer une résidence
      { id: 283, categoryId: "Prestations extérieures" }, // Nivellement de terrain
      { id: 284, categoryId: "Constructions" }, // Ouverture d'un mur
      { id: 285, categoryId: "Constructions" }, // Ouverture dans un mur porteur
      { id: 286, categoryId: "Constructions" }, // Pergola Adossée en bois
      { id: 287, categoryId: "Constructions" }, // Pergola Autoportée en bois
      { id: 288, categoryId: "Constructions" }, // Pergola plate en bois
      { id: 289, categoryId: "Prestations intérieures" }, // Poncage d'un parquet d'intérieur ou extérieur en bois
      { id: 290, categoryId: "Prestations intérieures" }, // Poncage de parquet
      { id: 291, categoryId: "Prestations intérieures" }, // Ponçage de parquet
      { id: 292, categoryId: "Constructions" }, // Ponçage de terrasse
      { id: 293, categoryId: "Constructions" }, // Portail en Panne
      { id: 294, categoryId: "Prestations intérieures" }, // Pose d'enduit
      { id: 295, categoryId: "Constructions" }, // Pose d'équerre etanche
      { id: 296, categoryId: "Constructions" }, // Pose d'isolation murale
      { id: 297, categoryId: "Prestations intérieures" }, // Pose d'isolation plafond
      { id: 298, categoryId: "Constructions" }, // Pose d'un automatisme coulissant pour portail
      { id: 299, categoryId: "Constructions" }, // Pose d'un portail automatique coulissant
      { id: 300, categoryId: "Prestations extérieures" }, // Pose de bande d'impermeabilisation de façade
      { id: 301, categoryId: "Prestations intérieures" }, // Pose de caméra de surveillance complète piloter par GSM
      { id: 302, categoryId: "Constructions" }, // pose de dalle béton sur le sol
      { id: 303, categoryId: "Constructions" }, // Pose de fenêtres en bois
      { id: 304, categoryId: "Prestations intérieures" }, // Pose de joints lavabo, évier, douche, carrelage..
      { id: 305, categoryId: "Constructions" }, // Pose de pierre en basalte volcanique sur facade de maison
      { id: 306, categoryId: "Constructions" }, // Pose de placo
      { id: 307, categoryId: "Prestations intérieures" }, // Pose de plâtres
      { id: 308, categoryId: "Prestations intérieures" }, // Pose de toilettes
      { id: 309, categoryId: "Constructions" }, // Pose de volet aluminium
      { id: 310, categoryId: "Constructions" }, // Pose de volet métallique
      { id: 311, categoryId: "Constructions" }, // Poser d'étagéres
      { id: 312, categoryId: "Prestations intérieures" }, // Poser de la moquette
      { id: 313, categoryId: "Prestations intérieures" }, // Poser de parquet
      { id: 314, categoryId: "Constructions" }, // Poser des baies vitrées
      { id: 315, categoryId: "Constructions" }, // Poser des cables
      { id: 316, categoryId: "Constructions" }, // Poser des faiences
      { id: 317, categoryId: "Constructions" }, // Poser des volets coulissant
      { id: 318, categoryId: "Constructions" }, // Poser des volets persiennes
      { id: 319, categoryId: "Prestations intérieures" }, // Poser un dressing
      { id: 320, categoryId: "Prestations intérieures" }, // Poser un enduit
      { id: 321, categoryId: "Prestations extérieures" }, // Poser un grillage
      { id: 322, categoryId: "Constructions" }, // Poser un paquet
      { id: 323, categoryId: "Constructions" }, // Poser un rideau métallique
      { id: 324, categoryId: "Constructions" }, // Poser un vollet roullant
      { id: 325, categoryId: "Constructions" }, // Poser une bâche
      { id: 326, categoryId: "Constructions" }, // Poser une barrière en bois
      { id: 327, categoryId: "Constructions" }, // Poser une barriere en verre
      { id: 328, categoryId: "Constructions" }, // Poser une barriere metallique
      { id: 329, categoryId: "Constructions" }, // Poser une borne electrique
      { id: 330, categoryId: "Constructions" }, // Poser une borne solaire
      { id: 331, categoryId: "Constructions" }, // Poser une chaudiere
      { id: 332, categoryId: "Constructions" }, // Poser une clotûre
      { id: 333, categoryId: "Prestations intérieures" }, // Poser une cuisine
      { id: 334, categoryId: "Constructions" }, // Poser une fenêtre en aluminium
      { id: 335, categoryId: "Constructions" }, // Poser une jalousie
      { id: 336, categoryId: "Prestations intérieures" }, // Poser une moquette
      { id: 337, categoryId: "Constructions" }, // Poser une pergola en bois
      { id: 338, categoryId: "Constructions" }, // Poser une porte coulissante
      { id: 339, categoryId: "Constructions" }, // Potéger la maison du froid
      { id: 341, categoryId: "Prestations intérieures" }, // Probleme de chauffage avec mon chauffe eau
      { id: 345, categoryId: "Constructions" }, // Proposition de garde corps
      { id: 346, categoryId: "Constructions" }, // Protéger la maison de l'humidité
      { id: 347, categoryId: "Constructions" }, // Protéger la maison de la chaleur
      { id: 348, categoryId: "Prestations extérieures" }, // Raccordement assainissement
      { id: 349, categoryId: "Prestations extérieures" }, // Raccordement des réseaux
      { id: 350, categoryId: "Prestations extérieures" }, // Raccordement electrique
      { id: 351, categoryId: "Prestations extérieures" }, // Raccordement internet
      { id: 352, categoryId: "Constructions" }, // Rattrapage de fissure
      { id: 353, categoryId: "Prestations intérieures" }, // Ravalement de facade d'immeuble
      { id: 354, categoryId: "Constructions" }, // Ravalement de facade de maison
      { id: 355, categoryId: "Constructions" }, // Réalier un Diagnostic Loi carrez
      { id: 356, categoryId: "Constructions" }, // Réalisation d'un bardage métallique
      { id: 357, categoryId: "Constructions" }, // Réalisation d'un escalier métallique
      { id: 358, categoryId: "Constructions" }, // Réalisation d'un garde corps métallique
      { id: 359, categoryId: "Constructions" }, // Réalisation d'un portail métallique
      { id: 360, categoryId: "Constructions" }, // Réalisation d'une grille de protection métallique
      { id: 361, categoryId: "Constructions" }, // Réalisation d'une nouvelle salle d'eau
      { id: 362, categoryId: "Constructions" }, // Réalisation de caillebotis - Deck
      { id: 363, categoryId: "Constructions" }, // Réalisation de plan 2D et 3D
      { id: 364, categoryId: "Constructions" }, // Réalisation de terrasse en bois
      { id: 365, categoryId: "Constructions" }, // Réalisation de terrasse en composite
      { id: 366, categoryId: "Constructions" }, // Réaliser l'étanchéité d'une douche
      { id: 367, categoryId: "Prestations intérieures" }, // Réaliser un devis pour l'installation de toilettes
      { id: 368, categoryId: "Constructions" }, // Réaliser un devis pour repreindre des murs
      { id: 370, categoryId: "Prestations extérieures" }, // Réaliser un devis pour un défrichage
      { id: 373, categoryId: "Constructions" }, // Réaliser un devis pour une décoration murale
      { id: 374, categoryId: "Constructions" }, // Réaliser un devis pour une démolition
      { id: 378, categoryId: "Constructions" }, // Réaliser un devis pour une isolation thermiques
      { id: 379, categoryId: "Constructions" }, // Réaliser un devis pour une pergola bioclimatique
      { id: 380, categoryId: "Constructions" }, // Réaliser un devis pour une pergola en aluminium
      { id: 381, categoryId: "Constructions" }, // Réaliser un devis pour une pergola en bois
      { id: 382, categoryId: "Constructions" }, // Réaliser un devis pour une pergola métallique
      { id: 383, categoryId: "Constructions" }, // Réaliser un devis pour une pergola retractable
      { id: 384, categoryId: "Constructions" }, // Réaliser un devis pour une salle d'eau
      { id: 385, categoryId: "Prestations intérieures" }, // Réaliser un devis pour une salle de bains
      { id: 386, categoryId: "Constructions" }, // Réaliser un devis pour une terrasse en bois
      { id: 387, categoryId: "Constructions" }, // Réaliser un devis pour une terrasse en composite
      { id: 388, categoryId: "Constructions" }, // Réaliser un diagnostic amiante
      { id: 389, categoryId: "Constructions" }, // Réaliser un diagnostic complet
      { id: 390, categoryId: "Constructions" }, // Réaliser un diagnostic d'assainissement
      { id: 391, categoryId: "Constructions" }, // Réaliser un diagnostic électrique
      { id: 392, categoryId: "Constructions" }, // Réaliser un diagnostic Performance Energétique
      { id: 393, categoryId: "Constructions" }, // Réaliser un diagnostic Plomb
      { id: 394, categoryId: "Constructions" }, // Réaliser un diagnostic termites
      { id: 395, categoryId: "Constructions" }, // Réaliser un escalier central
      { id: 396, categoryId: "Constructions" }, // Réaliser un îlot central de cuisine
      { id: 397, categoryId: "Constructions" }, // Réaliser un mur de moellon (à joint ou à sec)
      { id: 398, categoryId: "Constructions" }, // Réaliser un mur de soutennement
      { id: 399, categoryId: "Constructions" }, // Réaliser un mur en bloc
      { id: 400, categoryId: "Constructions" }, // Réaliser un portail coulissant Métal/ Bois avec ou sans portillon
      { id: 404, categoryId: "Constructions" }, // Réaliser une cloison en bois
      { id: 405, categoryId: "Constructions" }, // Réaliser une cloison en plâtre
      { id: 406, categoryId: "Constructions" }, // Réaliser une déclaration préalable
      { id: 408, categoryId: "Constructions" }, // Réaliser une extension
      { id: 409, categoryId: "Constructions" }, // Réaliser une isolation thermique
      { id: 410, categoryId: "Constructions" }, // Réaliser une pergola
      { id: 411, categoryId: "Constructions" }, // Réaliser une terrasse
      { id: 412, categoryId: "Constructions" }, // Rédiger un état des lieux d'entrée
      { id: 413, categoryId: "Constructions" }, // Rédiger un état des lieux de sortie
      { id: 417, categoryId: "Prestations intérieures" }, // Refaire l'étancheité d'une douche
      { id: 418, categoryId: "Constructions" }, // Refaire l'étanchéité d'une salle de bains
      { id: 419, categoryId: "Constructions" }, // Refaire l'étancheité d'une terrasse, varangue, balcon
      { id: 420, categoryId: "Constructions" }, // Refaire l'intérieur de la maison
      { id: 422, categoryId: "Constructions" }, // Refaire ma piscine
      { id: 423, categoryId: "Prestations intérieures" }, // Refaire ma véranda
      { id: 424, categoryId: "Prestations intérieures" }, // Refaire mon plan de travail en céramque
      { id: 425, categoryId: "Prestations intérieures" }, // Refaire un plafond en béton
      { id: 426, categoryId: "Prestations intérieures" }, // Refaire un plafond en plâtre
      { id: 427, categoryId: "Prestations intérieures" }, // Refaire une cuisine
      { id: 428, categoryId: "Prestations intérieures" }, // Refaire une salle de bains
      { id: 429, categoryId: "Constructions" }, // Réfection complète avec démolition de la cuisine
      { id: 430, categoryId: "Constructions" }, // Réhabiliation de la maison
      { id: 433, categoryId: "Prestations extérieures" }, // Remise en état du jardin
      { id: 434, categoryId: "Constructions" }, // Renforcer l'étanchéité du bien
      { id: 435, categoryId: "Constructions" }, // Rénovation de plomberie
      { id: 436, categoryId: "Constructions" }, // Rénovation de terrasse en composite
      { id: 437, categoryId: "Constructions" }, // Rénovation des parquets d'intérieur ou extérieur en bois massif
      { id: 439, categoryId: "Constructions" }, // Réparation chauffe eau photovoltaique
      { id: 440, categoryId: "Constructions" }, // Réparation chauffe-eau
      { id: 441, categoryId: "Constructions" }, // Réparation chauffe-eau solaire
      { id: 442, categoryId: "Prestations intérieures" }, // Réparation Climatisation
      { id: 443, categoryId: "Constructions" }, // Réparation d'un deck en bois
      { id: 444, categoryId: "Constructions" }, // Réparation d'une borne de charge électrique
      { id: 445, categoryId: "Constructions" }, // Réparation d'une porte de garage basculante
      { id: 446, categoryId: "Constructions" }, // Réparation d'une porte de garage coulissante
      { id: 447, categoryId: "Constructions" }, // Réparation d'une porte de Hall d'entrée
      { id: 448, categoryId: "Constructions" }, // Réparation de fenêtres en aluminium
      { id: 449, categoryId: "Constructions" }, // Réparation de fenêtres en bois
      { id: 450, categoryId: "Constructions" }, // Réparation de fissure
      { id: 451, categoryId: "Constructions" }, // Réparation de Panel LED
      { id: 452, categoryId: "Constructions" }, // Réparation de portail éléctrique
      { id: 453, categoryId: "Constructions" }, // Réparation de remontées capillaires
      { id: 454, categoryId: "Constructions" }, // Réparation de Store déroulant
      { id: 455, categoryId: "Constructions" }, // Réparation de velux
      { id: 456, categoryId: "Constructions" }, // Réparation de verrou
      { id: 457, categoryId: "Prestations intérieures" }, // Réparation douche
      { id: 458, categoryId: "Constructions" }, // Réparation escalier métallique
      { id: 459, categoryId: "Constructions" }, // Réparation garde corps métallique
      { id: 460, categoryId: "Constructions" }, // Réparation grille de protection métallique
      { id: 461, categoryId: "Constructions" }, // Réparation jaccuzi
      { id: 462, categoryId: "Constructions" }, // Réparation lave vaisselle
      { id: 463, categoryId: "Constructions" }, // Réparation machine à laver
      { id: 464, categoryId: "Constructions" }, // Réparation pergola bioclimatique
      { id: 465, categoryId: "Constructions" }, // Réparation portail métallique
      { id: 466, categoryId: "Constructions" }, // Réparation réfrigirateur
      { id: 467, categoryId: "Prestations intérieures" }, // Réparation salle de bains
      { id: 468, categoryId: "Constructions" }, // Réparation sanitaires
      { id: 469, categoryId: "Constructions" }, // Réparation téléviseur
      { id: 471, categoryId: "Constructions" }, // Réparer des grilles de sécurité
      { id: 474, categoryId: "Prestations intérieures" }, // Réparer et poncer mon parquet
      { id: 475, categoryId: "Prestations extérieures" }, // Réparer la toiture et sur-toiture
      { id: 476, categoryId: "Constructions" }, // Réparer le moteur de ma piscine
      { id: 479, categoryId: "Constructions" }, // Réparer ma coque de piscine
      { id: 480, categoryId: "Prestations intérieures" }, // Réparer ma VMC
      { id: 481, categoryId: "Prestations extérieures" }, // Réparer mon film solaires
      { id: 482, categoryId: "Prestations extérieures" }, // Réparer mon kit solaire
      { id: 483, categoryId: "Prestations intérieures" }, // Réparer un ascenseur
      { id: 485, categoryId: "Prestations intérieures" }, // Réparer un dressing existant
      { id: 486, categoryId: "Prestations extérieures" }, // Réparer un grillage
      { id: 487, categoryId: "Prestations intérieures" }, // Réparer un plan de travail en bois
      { id: 489, categoryId: "Constructions" }, // Réparer un store extérieur
      { id: 490, categoryId: "Constructions" }, // Réparer un store intérieur
      { id: 491, categoryId: "Prestations intérieures" }, // Réparer une alarme
      { id: 494, categoryId: "Prestations intérieures" }, // Réparer une caméra de surveillance
      { id: 496, categoryId: "Constructions" }, // Réparer une fuite d'eau
      { id: 497, categoryId: "Prestations extérieures" }, // Réparer une gouttière
      { id: 498, categoryId: "Prestations intérieures" }, // Réparer une lavabo
      { id: 499, categoryId: "Constructions" }, // Réparer une pergola
      { id: 500, categoryId: "Constructions" }, // Réparer une pergola retractable
      { id: 501, categoryId: "Constructions" }, // Réparer une porte coulissante
      { id: 502, categoryId: "Prestations extérieures" }, // Réparer une voile d'ombrage
      { id: 503, categoryId: "Prestations extérieures" }, // Repeindre la façade d'un bâtiment
      { id: 504, categoryId: "Constructions" }, // Repeindre un mur
      { id: 506, categoryId: "Constructions" }, // Repeindre une maison
      { id: 507, categoryId: "Prestations extérieures" }, // Repeindre une toiture
      { id: 508, categoryId: "Prestations extérieures" }, // Repeindre une toiture
      { id: 509, categoryId: "Constructions" }, // Reprendre enduit mur + peinture
      { id: 510, categoryId: "Prestations intérieures" }, // Reprise d'enduit
      { id: 512, categoryId: "Constructions" }, // Reprise de maconnerie et peinture
      { id: 515, categoryId: "Prestations intérieures" }, // robinetterie à changer
      { id: 518, categoryId: "Constructions" }, // Terrasse en bois ave charges réparties sur une surface étanche
      { id: 519, categoryId: "Constructions" }, // Terrasse en bois avec charges concentrées sur poteaux
      { id: 520, categoryId: "Constructions" }, // Terrasse en bois avec des charges réparties sur carrelage ou béton
      { id: 521, categoryId: "Constructions" }, // Terrasse en bois avec des charges réparties sur sol brut
      { id: 522, categoryId: "Constructions" }, // Traitement Capillaires
      { id: 523, categoryId: "Constructions" }, // Traitement de charpente en acier
      { id: 524, categoryId: "Constructions" }, // Traitement de charpente en bois
      { id: 525, categoryId: "Constructions" }, // Traitement de charpente métallique
      { id: 526, categoryId: "Constructions" }, // Traitement de l'air
      { id: 527, categoryId: "Constructions" }, // Traitement de l'eau
      { id: 529, categoryId: "Constructions" }, // Travaux de peinture extérieur
      { id: 530, categoryId: "Constructions" }, // Travaux de peinture intérieur
      { id: 532, categoryId: "Constructions" }, // Travaux de soudure
      { id: 535, categoryId: "Constructions" }, // Vitrification
      { id: 536, categoryId: "Prestations intérieures" }, // Vitrification d'un parquet d'intérieur ou extérieur en bois
      { id: 537, categoryId: "Prestations intérieures" }, // Réaliser un devis pour une isolation accoustique
      { id: 538, categoryId: "Constructions" }, // Isoler la maison avec ouate de cellulose
      { id: 540, categoryId: "Constructions" }, // Traitement anti-termites
      { id: 541, categoryId: "Constructions" }, // Enlever de la moisissure sur les murs
      { id: 542, categoryId: "Constructions" }, // Traitement de remontée capillaires
      { id: 543, categoryId: "Constructions" }, // Pose de vernis
      { id: 544, categoryId: "Constructions" }, // Depose et repose de vernis
      { id: 545, categoryId: "Constructions" }, // "Pose de laques\n"
      { id: 546, categoryId: "Constructions" }, // Depose et repose de vernis
      { id: 547, categoryId: "Prestations intérieures" }, // Installation douche extérieure en linox
      { id: 548, categoryId: "Prestations intérieures" }, // Répare une douche extérieure
      { id: 549, categoryId: "Prestations intérieures" }, // Installer une douche en linox
      { id: 550, categoryId: "Constructions" }, // Installer une cascade dans la piscine
      { id: 551, categoryId: "Constructions" }, // Réparer une cascade piscine
      { id: 552, categoryId: "Constructions" }, // Installer des lames de piscine
      { id: 553, categoryId: "Constructions" }, // Réparer des lames de piscine
      { id: 554, categoryId: "Prestations extérieures" }, // Installer un SPA
      { id: 556, categoryId: "Constructions" }, // Installer une piscine
      { id: 557, categoryId: "Prestations extérieures" }, // Réparer un SPA
      { id: 561, categoryId: "Prestations extérieures" }, // Entretien SPA
      { id: 562, categoryId: "Prestations extérieures" }, // Entretien Hammam
      { id: 563, categoryId: "Constructions" }, // Refaire l'enduit de la piscine
      { id: 564, categoryId: "Constructions" }, // Changer l'enduit de la piscine
      { id: 565, categoryId: "Constructions" }, // Installer un enduit pour la piscine
      { id: 567, categoryId: "Prestations extérieures" }, // Evacuation des canalisations
      { id: 569, categoryId: "Prestations extérieures" }, // Nettoyer un jardin
      { id: 570, categoryId: "Prestations extérieures" }, // Réparer une fuite d'eau de toiture
      { id: 571, categoryId: "Prestations extérieures" }, // Recherche une fuite sur la toiture
      { id: 572, categoryId: "Constructions" }, // Rénover des pierres murales extérieures
      { id: 573, categoryId: "Prestations intérieures" }, // Intervention rapide plomberie
      { id: 574, categoryId: "Prestations intérieures" }, // Intervention rapide électricité
      { id: 575, categoryId: "Constructions" }, // Rénovation de l'électricité de la maison
      { id: 577, categoryId: "Prestations intérieures" }, // Travaux de plomberie
      { id: 578, categoryId: "Prestations intérieures" }, // Travaux d'électricité
      { id: 582, categoryId: "Constructions" }, // Transformation de garage
      { id: 583, categoryId: "Prestations extérieures" }, // Installer un drain
      { id: 584, categoryId: "Prestations extérieures" }, // Réparer un drain
      { id: 585, categoryId: "Prestations extérieures" }, // Changer un drain
      { id: 587, categoryId: "Constructions" }, // Réisoler un mur
      { id: 588, categoryId: "Prestations intérieures" }, // Réisoler un plafond
      { id: 589, categoryId: "Prestations extérieures" }, // Réisoler une toiture
      { id: 590, categoryId: "Constructions" }, // Construire une cuisine extérieure
      { id: 591, categoryId: "Constructions" }, // Installer une cuisine extérieure
      { id: 592, categoryId: "Prestations extérieures" }, // Installer un bar extérieur
      { id: 593, categoryId: "Constructions" }, // Rénover une cuisine extérieure
      { id: 594, categoryId: "Prestations extérieures" }, // Installer un barbecue
      { id: 595, categoryId: "Prestations extérieures" }, // Travaux de jardinnage
      { id: 596, categoryId: "Prestations extérieures" }, // Installer des dalles dans le jardin
      { id: 597, categoryId: "Constructions" }, // Diagnostioc Installation Gaz
      { id: 598, categoryId: "Constructions" }, // Installation Radiateur
      { id: 599, categoryId: "Prestations extérieures" }, // Réparation Radiateur
      { id: 600, categoryId: "Prestations extérieures" }, // Entretien Radiateur
      { id: 601, categoryId: "Prestations extérieures" }, // Installer un radiateur
      { id: 602, categoryId: "Prestations intérieures" }, // Eclairage intérieur
      { id: 603, categoryId: "Prestations extérieures" }, // Eclairage extérieur
      { id: 604, categoryId: "Prestations intérieures" }, // Plafond Rayonnant
      { id: 605, categoryId: "Prestations intérieures" }, // Chauffage au sol (parquet chauffant)
      { id: 606, categoryId: "Constructions" }, // Petit travaux de maçonnerie
      { id: 607, categoryId: "Prestations extérieures" }, // Pose d'une margelle
      { id: 608, categoryId: "Prestations extérieures" }, // Depose et repose d'une margelle
      { id: 609, categoryId: "Constructions" }, // Chauffage piscine
      { id: 611, categoryId: "Prestations extérieures" }, // chape
      { id: 612, categoryId: "Constructions" }, // Fabrication de meubles
      { id: 614, categoryId: "Constructions" }, // Réparation fuite de gaz
      { id: 615, categoryId: "Constructions" }, // Etancheité toiture terrasse
      { id: 616, categoryId: "Prestations extérieures" }, // Etancheité toiture varangue
      { id: 617, categoryId: "Prestations extérieures" }, // Etancheité toiture balcon
      { id: 618, categoryId: "Prestations extérieures" }, // Canalisation (pose, rempoacement, réparation)
      { id: 619, categoryId: "Constructions" }, // Matériel d'entretien (filtration, local technique)
      { id: 620, categoryId: "Constructions" }, // Construction local technique
      { id: 621, categoryId: "Constructions" }, // Réparation filtre piscine
      { id: 622, categoryId: "Constructions" }, // Entretien filtre piscine
      { id: 623, categoryId: "Constructions" }, // Installation couverture toiture
      { id: 624, categoryId: "Prestations extérieures" }, // Réparation couverture toiture
      { id: 625, categoryId: "Prestations extérieures" }, // Entretien couverture toiture
      { id: 626, categoryId: "Constructions" }, // Rénovation couverture toiture
      { id: 627, categoryId: "Constructions" }, // Installation baignoire balnéo
      { id: 630, categoryId: "Prestations extérieures" }, // Installation d'une Antenne Satellite
      { id: 631, categoryId: "Constructions" }, // Sécurité Piscine (Alarme, Barrière)
      { id: 632, categoryId: "Constructions" }, // Installation d'un bidet
      { id: 634, categoryId: "Prestations extérieures" }, // Adoucisseur d'eau
      { id: 635, categoryId: "Constructions" }, // Viabilisation (raccordement égout, eau, electritié, )
      { id: 637, categoryId: "Constructions" }, // Terrassement
      { id: 638, categoryId: "Constructions" }, // Remblayage
      { id: 641, categoryId: "Constructions" }, // Projet de rénovation
      { id: 642, categoryId: "Constructions" }, // Projet de construction
      { id: 643, categoryId: "Constructions" }, // Projet d'achat de maison
      { id: 644, categoryId: "Prestations intérieures" }, // Projet d'achat d'appartement
      { id: 645, categoryId: "Constructions" }, // Traitement contre les rats
      { id: 647, categoryId: "Constructions" }, // Réaliser un devis pour un traitement contre les termites
      { id: 648, categoryId: "Prestations extérieures" }, // Pose de prises électriques
      { id: 649, categoryId: "Prestations extérieures" }, // Remplacement de prises électriques
      { id: 650, categoryId: "Prestations extérieures" }, // Pose de miroir
      { id: 651, categoryId: "Prestations extérieures" }, // Dépose et repose de miroir
      { id: 652, categoryId: "Constructions" }, // Pose d'un mur végétal
      { id: 653, categoryId: "Constructions" }, // Maison connectée
      { id: 654, categoryId: "Constructions" }, // Peinture décorative
      { id: 656, categoryId: "Constructions" }, // Entretien bac à graisse
      { id: 657, categoryId: "Constructions" }, // Réparation d'un réfrigérateur
      { id: 658, categoryId: "Constructions" }, // Entretien d'un frigo
      { id: 660, categoryId: "Prestations extérieures" }, // Installation d'un système frigorifique
      { id: 666, categoryId: "Constructions" }, // Réparation d'un téléviseur
      { id: 667, categoryId: "Constructions" }, // Pose de joints de fenêtre
      { id: 668, categoryId: "Constructions" }, // Depose et repose de joints de fenêtre
      { id: 670, categoryId: "Constructions" }, // Vendre une maison neuve
      { id: 671, categoryId: "Prestations intérieures" }, // Vendre un appartement
      { id: 672, categoryId: "Prestations intérieures" }, // Vendre un immeuble
      { id: 675, categoryId: "Constructions" }, // Vendre une villa
      { id: 679, categoryId: "Constructions" }, // Location d'une villa
      { id: 680, categoryId: "Prestations intérieures" }, // Location d'un appartement
      { id: 681, categoryId: "Constructions" }, // Location d'un local commercial
      { id: 682, categoryId: "Constructions" }, // Location d'un local professionnel
      { id: 685, categoryId: "Constructions" }, // Achat d'une maison
      { id: 686, categoryId: "Prestations intérieures" }, // Achat d'un appartement
      { id: 687, categoryId: "Constructions" }, // Achat d'un local commercial
      { id: 688, categoryId: "Prestations intérieures" }, // Achat d'un immeuble
      { id: 689, categoryId: "Constructions" }, // Achat d'un local professionnel
      { id: 690, categoryId: "Constructions" }, // Achat d'un terrain
      { id: 691, categoryId: "Constructions" }, // Achat d'un projet immobilier
      { id: 692, categoryId: "Constructions" }, // Demande d'expertise immobilière
      { id: 693, categoryId: "Constructions" }, // Estimation pour une succession
      { id: 694, categoryId: "Constructions" }, // Estimation pour une donation
      { id: 695, categoryId: "Constructions" }, // Rédiger un compromis de vente
      { id: 696, categoryId: "Constructions" }, // Crée une SCI
      { id: 697, categoryId: "Constructions" }, // Lancer une prodécure d'impayé
      { id: 698, categoryId: "Constructions" }, // Lancer un contentieux immobilier
      { id: 699, categoryId: "Constructions" }, // Lancer un contentieux travaux
      { id: 700, categoryId: "Constructions" }, // Demander une conseil immobilier
      { id: 701, categoryId: "Constructions" }, // Demander un conseil sur des travaux
      { id: 702, categoryId: "Constructions" }, // Construction de maison
      { id: 703, categoryId: "Constructions" }, // Accompagnement et suivit construction
      { id: 704, categoryId: "Constructions" }, // Construire clé en main
      { id: 705, categoryId: "Constructions" }, // Faire construire une villa individuel
      { id: 706, categoryId: "Constructions" }, // Demande de devis de construction
      { id: 707, categoryId: "Constructions" }, // Lancer une procédure d'explusion
      { id: 708, categoryId: "Constructions" }, // Lancer une procédue d'expropriation
      { id: 709, categoryId: "Constructions" }, // Home staging
      { id: 710, categoryId: "Prestations intérieures" }, // Refaire l'intérieur de sont appartement
      { id: 711, categoryId: "Constructions" }, // Rénover l'intérier d'un bien immobilier
      { id: 712, categoryId: "Prestations intérieures" }, // Rénover l'intérieur d'un appartement
      { id: 713, categoryId: "Constructions" }, // Rénover l'intérieur d'une maison
      { id: 714, categoryId: "Prestations intérieures" }, // Modernisé son intérieur
      { id: 715, categoryId: "Constructions" }, // Modernisé une maison
      { id: 716, categoryId: "Prestations intérieures" }, // Rénover une cuisine intérieure
      { id: 717, categoryId: "Prestations intérieures" }, // Modernisée une cuisine
      { id: 718, categoryId: "Prestations intérieures" }, // Réaliser une douche italienne
      { id: 719, categoryId: "Prestations intérieures" }, // Demande de devis pour une douche italienne
      { id: 720, categoryId: "Constructions" }, // Installer un extincteur
      { id: 721, categoryId: "Constructions" }, // Jetter un extincteur
      { id: 722, categoryId: "Constructions" }, // Donner un exctincteur vide
      { id: 723, categoryId: "Constructions" }, // Changer un extincteur
      { id: 724, categoryId: "Constructions" }, // Achat d'extincteur
      { id: 725, categoryId: "Constructions" }, // Acheter un extincteur
      { id: 726, categoryId: "Constructions" }, // Maintenance annuelle d'extincteurs
      { id: 727, categoryId: "Constructions" }, // Maintenance d'extincteur
      { id: 728, categoryId: "Constructions" }, // Entretien d'extincteur
      { id: 729, categoryId: "Constructions" }, // Mise en conformité des extincteurs
      { id: 730, categoryId: "Constructions" }, // Installation éclairage de sécurité
      { id: 731, categoryId: "Constructions" }, // Désenfumage
      { id: 732, categoryId: "Prestations intérieures" }, // Repeindre un appartement
      { id: 733, categoryId: "Constructions" }, // Repeindre une maison
      { id: 734, categoryId: "Constructions" }, // Ponçage et peinture
      { id: 735, categoryId: "Constructions" }, // Repeindre villa
      { id: 736, categoryId: "Constructions" }, // Repeindre des escaliers
      { id: 737, categoryId: "Constructions" }, // Repeindre un mur
      { id: 738, categoryId: "Prestations extérieures" }, // Repeindre une varangue
      { id: 739, categoryId: "Constructions" }, // Repeindre une terrasse
      { id: 740, categoryId: "Prestations intérieures" }, // Repeindre une cuisine
      { id: 741, categoryId: "Constructions" }, // Repeindre un garage
      { id: 742, categoryId: "Constructions" }, // Repeindre un studio
      { id: 743, categoryId: "Constructions" }, // Repeindre un local
      { id: 744, categoryId: "Prestations intérieures" }, // Repeindre une cave
      { id: 745, categoryId: "Prestations intérieures" }, // Repeindre un bureau
      { id: 746, categoryId: "Constructions" }, // Rénovation d'un ascenseur
      { id: 747, categoryId: "Constructions" }, // Moderniser un ascenseur
      { id: 748, categoryId: "Prestations extérieures" }, // Installation de prises électriques
      { id: 749, categoryId: "Constructions" }, // Faire un devis pour des diagnostics d'un bien immobilier
      { id: 750, categoryId: "Constructions" }, // DIagnostics pour la vente d'un bien immobilier
      { id: 751, categoryId: "Constructions" }, // Diagnostics pour la location d'un bien immobilier
      { id: 759, categoryId: "Constructions" }, // Assurance vie
      { id: 761, categoryId: "Prestations extérieures" }, // Faire un contre-bornage
      { id: 762, categoryId: "Prestations extérieures" }, // Faire un devis pour un bornage
      { id: 763, categoryId: "Constructions" }, // Faire un devis pour une division de terrain
      { id: 764, categoryId: "Constructions" }, // Faire une divison pour une déclaration préalable
      { id: 765, categoryId: "Prestations extérieures" }, // Faire un devis pour un contre-bornage
      { id: 766, categoryId: "Prestations extérieures" }, // Poser des bornes (bornages)
      { id: 767, categoryId: "Constructions" }, // Poser des bornes sur une parcelle
      { id: 768, categoryId: "Constructions" }, // Faire un état des lieux d'entrée
      { id: 770, categoryId: "Constructions" }, // Devis pour faire un état des lieux d'entrée et de sortie (suivit)
      { id: 771, categoryId: "Prestations extérieures" }, // Raccorder un terrain à l'eau potable
      { id: 772, categoryId: "Constructions" }, // Raccorder un terrain au tout à l'égoût
      { id: 774, categoryId: "Prestations intérieures" }, // Etancheité au plafond à refaire
      { id: 775, categoryId: "Constructions" }, // Déposer un permis de construire
      { id: 776, categoryId: "Constructions" }, // Réparer une cage d'escalier
      { id: 777, categoryId: "Prestations intérieures" }, // Réparer une cage d'ascenseur
      { id: 778, categoryId: "Constructions" }, // Réaliser de la soudure
      { id: 779, categoryId: "Constructions" }, // Devis pour soudure d'éléments
      { id: 780, categoryId: "Constructions" }, // Porte d'entrée bloquée
      { id: 781, categoryId: "Constructions" }, // Ouvrir une porte d'entrée
      { id: 782, categoryId: "Constructions" }, // Sérrure cassée
      { id: 783, categoryId: "Constructions" }, // Acheter et pose d'une sérrure
      { id: 784, categoryId: "Constructions" }, // Réaliser un désamiantage
      { id: 785, categoryId: "Prestations intérieures" }, // Donner des meubles
      { id: 788, categoryId: "Prestations intérieures" }, // Récuperer des meubles, mobilier, appareils électroménager
      { id: 789, categoryId: "Constructions" }, // Distribution électrique
      { id: 790, categoryId: "Constructions" }, // Travaux informatique
      { id: 791, categoryId: "Constructions" }, // matériaux de construction
      { id: 792, categoryId: "Constructions" }, // Bois traité
      { id: 793, categoryId: "Constructions" }, // Feraillage à béton
      { id: 794, categoryId: "Constructions" }, // Meubles sur mesure
      { id: 798, categoryId: "Constructions" }, // Demolition Cloison
      { id: 799, categoryId: "Constructions" }, // Demolition Cloison + plafond
      { id: 800, categoryId: "Constructions" }, // Demolition Cloison + plafond + wc et evacuation
      { id: 801, categoryId: "Constructions" }, // Depose WC + vasque
      { id: 802, categoryId: "Constructions" }, // Plafond placo
      { id: 803, categoryId: "Constructions" }, // Cloison Placo
      { id: 804, categoryId: "Constructions" }, // Depose WC
      { id: 805, categoryId: "Constructions" }, // Enduit Lissage sur mur Existant
      { id: 806, categoryId: "Constructions" }, // Enduit lissage + création de mur
      { id: 807, categoryId: "Constructions" }, // Pose WC + Vasque
      { id: 808, categoryId: "Constructions" }, // Pose WC
      { id: 809, categoryId: "Constructions" }, // Pose porte galandage
      { id: 810, categoryId: "Constructions" }, // Pose verriere
      { id: 811, categoryId: "Constructions" }, // Pose Carrelage
      { id: 812, categoryId: "Constructions" }, // Peinture
      { id: 813, categoryId: "Constructions" }, // Interrupteur à changer
      { id: 814, categoryId: "Constructions" }, // Renovation tableau
      { id: 815, categoryId: "Constructions" }, // Spots à changer
      { id: 816, categoryId: "Constructions" }, // RJ45
      { id: 817, categoryId: "Constructions" }, // PC 16A
      { id: 818, categoryId: "Constructions" }, // DCL
      { id: 820, categoryId: "Constructions" }, // Faire un constat d'huissier pour permis de construire
      { id: 822, categoryId: "Constructions" }, // Afficher un permis de construire
      { id: 823, categoryId: "Constructions" }, // Faire constater un depot de permis
      { id: 825, categoryId: "Constructions" }, // Constat d'huissier pour des dégats
      { id: 826, categoryId: "Constructions" }, // Constat d'huissier pour un etat des lieux
      { id: 827, categoryId: "Constructions" }, // Constat d'huissier pour un conflit de voisinage
      { id: 828, categoryId: "Constructions" }, // Faire appel à un huissier pour un recouvrement amiable
      { id: 829, categoryId: "Constructions" }, // Faire une signification par un huissier de justice
      { id: 830, categoryId: "Constructions" }, // Demander conseil à un huissier de justice
      { id: 831, categoryId: "Constructions" }, // Demander conseil à un architecte
      { id: 832, categoryId: "Constructions" }, // Demander conseil à un agent immobilier
      { id: 833, categoryId: "Constructions" }, // Pose brasseur d'air
      { id: 834, categoryId: "Constructions" }, // Pose de luminaire
      { id: 835, categoryId: "Constructions" }, // Conception electrique tertiaire
      { id: 836, categoryId: "Constructions" }, // Dépannage électrique
      { id: 837, categoryId: "Constructions" }, // Intégration Domotique habitat
      { id: 838, categoryId: "Constructions" }, // Système Domotique complet
      { id: 839, categoryId: "Constructions" }, // Maison connectée évolutive
      { id: 840, categoryId: "Prestations intérieures" }, // Technologie domotique sans fil
      { id: 841, categoryId: "Constructions" }, // Programmation de scénario
      { id: 842, categoryId: "Constructions" }, // Pilotage avec assitance vocal
      { id: 843, categoryId: "Constructions" }, // Gestion sur tablette
      { id: 844, categoryId: "Prestations intérieures" }, // Système d'alarme intrusion connectée
      { id: 845, categoryId: "Constructions" }, // Détection intrusion, incendie, innondation
      { id: 846, categoryId: "Prestations intérieures" }, // Technologie d'alarme intrusion sans fil
      { id: 847, categoryId: "Constructions" }, // Système vidéosurveillance analogique
      { id: 848, categoryId: "Prestations intérieures" }, // Detection caméra intelligent
      { id: 849, categoryId: "Constructions" }, // Notification d'alerte sur smartphone ou tablette
      { id: 850, categoryId: "Constructions" }, // système interphone résidentiel
      { id: 851, categoryId: "Constructions" }, // Transfert d'appel sur smartphone
      { id: 852, categoryId: "Constructions" }, // Lecteur de badge, clavier à code
      { id: 853, categoryId: "Constructions" }, // Système interphone Bâtiment Collectif
      { id: 854, categoryId: "Constructions" }, // Centrale interphone connectée en GPRS
      { id: 855, categoryId: "Constructions" }, // Gestion de site et contrôle à distance
      { id: 856, categoryId: "Prestations extérieures" }, // Installation Borne de Recharge particulier
      { id: 857, categoryId: "Prestations extérieures" }, // Borne de recharge réglable jusqu'a 22kw
      { id: 858, categoryId: "Constructions" }, // Eligible crédit d'impôt
      { id: 859, categoryId: "Constructions" }, // Pilotage energitique de la recharge
      { id: 860, categoryId: "Constructions" }, // Respect des normes électriques IRVE
      { id: 861, categoryId: "Constructions" }, // Service maintenace Electrique
      { id: 862, categoryId: "Constructions" }, // Terrassement pour Travaux électrique
      { id: 863, categoryId: "Prestations extérieures" }, // Demande de raccordement électrique à EDF
      { id: 864, categoryId: "Constructions" }, // Ouverture de compteur electrique
      { id: 865, categoryId: "Constructions" }, // Installatation d'un detecteur de fumée
      { id: 866, categoryId: "Prestations intérieures" }, // Installation d'une VMC (ventilation métaliique contrôlée)
      { id: 867, categoryId: "Constructions" }, // Remplacement de tableau electrique
      { id: 868, categoryId: "Prestations extérieures" }, // Installation de radiateur electrique
      { id: 869, categoryId: "Constructions" }, // Remplacement des circuits prises, interrupteurs, lumiéres, cables, coffret de communication et prises RJ45
      { id: 872, categoryId: "Prestations intérieures" }, // Nettoyage intérieur de la voiture
      { id: 873, categoryId: "Prestations extérieures" }, // Nettoyage extérieur de la voiture
      { id: 874, categoryId: "Constructions" }, // Demande de rdv à la Mairie
      { id: 875, categoryId: "Constructions" }, // Demande d'information à la Mairie
      { id: 876, categoryId: "Constructions" }, // Faire appel à un avocat
      { id: 877, categoryId: "Constructions" }, // Contentieux en droit immobilier
      { id: 878, categoryId: "Constructions" }, // Contentieux sur un permis de construire
      { id: 879, categoryId: "Constructions" }, // Couper des arbres
      { id: 880, categoryId: "Prestations extérieures" }, // Faire un devis pour élager des arbres
      { id: 881, categoryId: "Prestations extérieures" }, // Abattage d'arbres
      { id: 882, categoryId: "Prestations extérieures" }, // Arbres dangereeuix
      { id: 883, categoryId: "Prestations extérieures" }, // Refaire le bardeau
      { id: 884, categoryId: "Constructions" }, // Refaire un mur
      { id: 885, categoryId: "Prestations intérieures" }, // Renover des volets en bois
      { id: 886, categoryId: "Prestations intérieures" }, // Changer des volets en bois
      { id: 887, categoryId: "Prestations intérieures" }, // Installer des volets en bois
      { id: 888, categoryId: "Constructions" }, // Pose de marbre
      { id: 889, categoryId: "Constructions" }, // Depose et repose de marbre
      { id: 890, categoryId: "Constructions" }, // Fabriquer une table en marbre
      { id: 891, categoryId: "Constructions" }, // Renover du marbre
      { id: 892, categoryId: "Prestations intérieures" }, // Décoration en marbre
      { id: 893, categoryId: "Constructions" }, // Colonne en marbre
      { id: 894, categoryId: "Constructions" }, // Escalier en marbre
      { id: 895, categoryId: "Prestations intérieures" }, // Plan de travail en marbre
      { id: 896, categoryId: "Constructions" }, // Terrasse en marbre
      { id: 897, categoryId: "Constructions" }, // Carrelage en marbre
      { id: 898, categoryId: "Constructions" }, // Faience en marbre
      { id: 899, categoryId: "Prestations intérieures" }, // Lavabo en marbre
      { id: 900, categoryId: "Constructions" }, // Habillage en marbre
      { id: 901, categoryId: "Prestations intérieures" }, // Installer des lambrequins
      { id: 902, categoryId: "Prestations intérieures" }, // Rénover des lambrequins
      { id: 903, categoryId: "Prestations intérieures" }, // Pose et depose de lambrequins
      // ... (seulement les services avec categoryId non-null ; la liste complète est tronquée ici pour brevité, mais incluez tous les { id, categoryId } de l'analyse)
    ];

    // Mise à jour des services avec categoryId
    for (const classification of serviceClassifications) {
      const category = await prisma.category.findFirst({
        where: { name: classification.categoryId },
      });
      if (!category) {
        console.warn(
          `⚠️ Catégorie non trouvée pour le service ID ${classification.id} : ${classification.categoryId}`
        );
        continue;
      }

      await prisma.service.update({
        where: { id: classification.id },
        data: { categoryId: category.id },
      });
      console.log(
        `➕ Catégorie ajoutée au service ID ${classification.id} : ${classification.categoryId}`,
        `Catégorie: ${category}`
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
