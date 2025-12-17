const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding database with provided data...");
    
    // Suppression des données existantes
    //await prisma.category.deleteMany();
    await prisma.metierService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.metier.deleteMany();
    console.log("✓ Catégories existantes supprimées");

    // Création des nouvelles catégories
    const categories = await prisma.category.createMany({
      data: [
        { name: "Prestations intérieures" },
        { name: "Prestations extérieures" },
        { name: "Constructions" },
      ],
    });
    console.log("✓ Catégories créées");

    // =======================
    // MÉTIERS
    // =======================
    const metiersData = [
      { libelle: "ABF (Architecte Bâtiment de France)" },
      { libelle: "Agence D'urbanisme" },
      { libelle: "Agenceur (euse) - Désigner d'intérieur" },
      { libelle: "Agent de nettoyage - Propreté" },
      { libelle: "Agence Incendie - Sécurité" },
      { libelle: "Agent Immobilier - Administrateur de biens" },
      { libelle: "Aménageur - Lotisseur" },
      { libelle: "Aménageur Extérieur" },
      { libelle: "Aménageur Intérieur" },
      { libelle: "Architecte" },
      { libelle: "Architected Intérieur" },
      { libelle: "Arroseur" },
      { libelle: "Ascensoriste" },
      { libelle: "Assureur" },
      { libelle: "Auditeur" },
      { libelle: "Avocat" },
      { libelle: "Bailleur Social" },
      { libelle: "Banquier" },
      { libelle: "Bardeur" },
      { libelle: "Bricoleur" },
      { libelle: "Bureau d'étude" },
      { libelle: "Cableur" },
      { libelle: "Calculateur et raitement des vibrations et chocs" },
      { libelle: "Canalisateur" },
      { libelle: "Carreleur" },
      { libelle: "Certifcateur - Contrôleur" },
      { libelle: "Charpentier bois" },
      { libelle: "Charpentier Métallique" },
      { libelle: "Chef de Chantier" },
      { libelle: "Cimentier" },
      { libelle: "Clerc de Notaire" },
      { libelle: "Coffreur" },
      { libelle: "Compresseur" },
      { libelle: "Concasseur" },
      { libelle: "Concepteur" },
      { libelle: "Conducteur de travaux" },
      { libelle: "Consciergerie" },
      { libelle: "Conseiller Assurance" },
      { libelle: "Conseiller bancaire" },
      { libelle: "Conseiller en gestion de patrimoine" },
      { libelle: "Conseiller Immobilier" },
      { libelle: "Conseiller télécom" },
      { libelle: "Constructeur" },
      { libelle: "Constructeur de maison en Contenaire" },
      { libelle: "Contrôleur Bâtiment" },
      { libelle: "Contrôleur d'accés" },
      { libelle: "Contructeurs de maison en bois" },
      { libelle: "Courtier" },
      { libelle: "Couvreur" },
      { libelle: "Cuisiniste" },
      { libelle: "Dalleur" },
      { libelle: "Décorateur intérieur" },
      { libelle: "Découpeur" },
      { libelle: "Déménageur" },
      { libelle: "Démolisseur" },
      { libelle: "Dératiseur - Désinfecteur" },
      { libelle: "Désamianteur" },
      { libelle: "Désenfumeur" },
      { libelle: "Déssinateur" },
      { libelle: "Déssinateur en bâtiment" },
      { libelle: "Diagnostiqueur" },
      { libelle: "Domoticien" },
      { libelle: "Ébéniste" },
      { libelle: "Échafaudeur" },
      { libelle: "Eclairagiste" },
      { libelle: "Electricien" },
      { libelle: "Enduiseur" },
      { libelle: "Etancheur" },
      { libelle: "Étancheur - Étanchéiste" },
      { libelle: "Expert en assurance" },
      { libelle: "Expert Immobilier" },
      { libelle: "Facadier" },
      { libelle: "Fleuriste" },
      { libelle: "Fontainier" },
      { libelle: "Forreur" },
      { libelle: "Frigoriste" },
      { libelle: "Géomètre" },
      { libelle: "Gestionnaire de copropriété - Syndic" },
      { libelle: "Gestionnaire de Sinistre" },
      { libelle: "Ingénieur" },
      { libelle: "Ingénieur Civil" },
      { libelle: "Ingénieur en Batiment" },
      { libelle: "Ingénieur en Patrimoine - Conseiller Patrimonial" },
      { libelle: "Ingénieur environnement" },
      { libelle: "Ingénieur Infrastructure" },
      { libelle: "Installateur - Installatrice en Sanitaires" },
      { libelle: "Installateur(trice) d'alarme" },
      { libelle: "Isolateur" },
      { libelle: "Jardinier" },
      { libelle: "Juriste" },
      { libelle: "Maçon" },
      { libelle: "Entreprise de Viabilistation, VRD, Terrassement" },
      { libelle: "Marbriers" },
      { libelle: "Menuisier Aluminium et Alliage" },
      { libelle: "Menuisier Bois et Charpente" },
      { libelle: "Menuisier Metallique" },
      { libelle: "Menuisier Portes et Fenêtres" },
      { libelle: "Menuisier PVC" },
      { libelle: "Metreur" },
      { libelle: "Miroitier" },
      { libelle: "Monnteur en Installation de panneau Solaire" },
      { libelle: "Monteur de Chaudiere" },
      { libelle: "Monteur en Installation d'isolant" },
      { libelle: "Monteur en Installation de Climatisation" },
      { libelle: "Monteur en Installation de fosse septique" },
      { libelle: "Monteur en Installation de panneau photovoltaique" },
      { libelle: "Monteur en installation de Store - Volet Roullant" },
      { libelle: "Monteur en installation Sanitaire" },
      { libelle: "Monteur en Installation Thermiques" },
      { libelle: "Monteur en Installations de Barrière de Sécurité" },
      { libelle: "Monteur en Installations de Pergola" },
      { libelle: "Monteur en Installations de volet Persiennes et jalousies" },
      { libelle: "Monteur et Installateur de Caillebotis" },
      { libelle: "Monteur et Installateur de Cheminés" },
      { libelle: "Monteur et Installateur de Cloture" },
      { libelle: "Monteur et Installateur de Gazon" },
      { libelle: "Monteur et Installateur de Gouttiere" },
      { libelle: "Monteur et Installateur de Grilles et Rideaux métalliques" },
      { libelle: "Monteur et Installateur de Jaccuzi" },
      { libelle: "Monteur et Installateur de Moustiquaire" },
      { libelle: "Monteur et Installateur de Panneau d'affichage" },
      { libelle: "Monteur et Installateur de Parquet" },
      { libelle: "Monteur et Installateur de Pergolas Biocliamtiques" },
      { libelle: "Monteur et Installateur de Placards" },
      { libelle: "Monteur et Installateur de SPA" },
      { libelle: "Monteur et Installateur de Tôle - Tôlerie" },
      { libelle: "Monteur et Installateur en Domotique" },
      { libelle: "Moquettiste" },
      { libelle: "Muraillier" },
      { libelle: "Nettoyeur" },
      { libelle: "Notaire" },
      { libelle: "Onduleur" },
      { libelle: "Outilleur" },
      { libelle: "Parquetteur" },
      { libelle: "Paysagiste" },
      { libelle: "Peintre" },
      { libelle: "Pisciniste" },
      { libelle: "Plaquiste" },
      { libelle: "Platrier - Plaquiste" },
      { libelle: "Plombier" },
      { libelle: "Polisseur" },
      { libelle: "Poseur de Comopteur d'eau" },
      { libelle: "Poseur de Compteur Gaz" },
      { libelle: "Promoteur" },
      { libelle: "Quincaillier" },
      { libelle: "Ramoneur" },
      { libelle: "Ravaleur" },
      { libelle: "Récupérateur d'eau" },
      { libelle: "Récupérateur et traiteur d'aluminium" },
      { libelle: "Récupérateur et traiteur de boois" },
      { libelle: "Récupérateur et traiteur de déchets" },
      { libelle: "Récupérateur et traiteur de fer" },
      { libelle: "Récupérateur et traiteur plastiques" },
      { libelle: "Régleur de chaudiere, chauffage" },
      { libelle: "Réhabilitateur" },
      { libelle: "Réparateur d'appareil éléctroménager" },
      { libelle: "Réparateur de pompe à chaleur" },
      { libelle: "Réparateur et traiteur d'humidité" },
      { libelle: "Réparateur Toiture" },
      { libelle: "Sableur" },
      { libelle: "Scieur" },
      { libelle: "Sérrurier" },
      { libelle: "Solier" },
      { libelle: "Sollier Moquetiste" },
      { libelle: "Sondeur" },
      { libelle: "Soudeur" },
      { libelle: "Staffeur" },
      { libelle: "Stucateur" },
      { libelle: "Tailleur de Pierre" },
      { libelle: "Technicien d'équipements Piscine" },
      { libelle: "Technicien de Maintenance" },
      { libelle: "Technicien et Traitement de l'air" },
      { libelle: "Technicien et Traitement de l'eau" },
      { libelle: "Technicien et Traitement des Sols" },
      { libelle: "Technicien et Traitement des termites" },
      { libelle: "Technicien Planchers" },
      { libelle: "Technicien Réseau Internet" },
      { libelle: "Technicien Réseau téléphonique" },
      { libelle: "Terrasseur" },
      { libelle: "Topographe" },
      { libelle: "Treillageur" },
      { libelle: "Vendeur - Commercant" },
      { libelle: "Vendeur de Carrelage" },
      { libelle: "Vendeur de Ciment" },
      { libelle: "Vendeur de Matériaux" },
      { libelle: "Ventiliste" },
      { libelle: "Viabilisateur" },
      { libelle: "Vidangeur" },
      { libelle: "Vitrier" },
      { libelle: "Zingueur" },
      { libelle: "Conseiller en prêt immobilier" },
      { libelle: "Poseur" },
      { libelle: "Poseur de Borne" },
      { libelle: "Gestionnaire Locatif" },
      { libelle: "Gestionnaire d'actifs immobilier" },
      { libelle: "Chef de chantier" },
      { libelle: "Mairie" },
      { libelle: "Huissier de justice" },
      { libelle: "Agent d'état des lieux" },
      { libelle: "Commercial" },
      { libelle: "Entreprise Abatatage, elagage, defrichage" },
      { libelle: "Monteur et Installeur de Hammam" },
      { libelle: "Association" },
      { libelle: "Laveur Auto/voiture à domicile" },
      { libelle: "Masseur" },
      { libelle: "Formateur" },
      { libelle: "BoutiqueNaturels" },
      { libelle: "Podcasteur" },
      { libelle: "Thérapeute" },
    ];

    console.log(`🛠️  Création de ${metiersData.length} métiers...`);
    
    let createdCount = 0;
    for (const metier of metiersData) {
      await prisma.metier.create({
        data: { libelle: metier.libelle },
      });
      createdCount++;
      if (createdCount % 20 === 0) {
        console.log(`📝 ${createdCount}/${metiersData.length} métiers créés...`);
      }
    }

    console.log(`✅ ${createdCount} métiers créés avec succès !`);
    console.log("🌿 Seeding terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors de la création des données:", error);
    throw error;
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